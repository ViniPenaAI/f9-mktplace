import { NextRequest, NextResponse } from "next/server";
import { calcRotulosPackage } from "@/lib/shipping-rotulos";
import { getCorreiosToken } from "@/lib/correios-token";

const CORREIOS_SOAP_URL_HTTPS = "https://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx";
const CORREIOS_SOAP_URL_HTTP = "http://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx";
const SPREAD_PERCENT = 15;
const PAC_CODIGO_SERVICO = process.env.CORREIOS_PRECO_CODIGO_SERVICO || "04162";

function onlyDigits(s: string): string {
    return (s || "").replace(/\D/g, "");
}

function parseCorreiosValor(str: string): number {
    if (!str || typeof str !== "string") return 0;
    const normalized = str.trim().replace(",", ".");
    return Math.max(0, parseFloat(normalized) || 0);
}

function getPrecoBaseUrl(): string {
    const tokenUrl = process.env.CORREIOS_TOKEN_URL?.replace(/\/$/, "") || "";
    if (tokenUrl.includes("apihom")) return "https://apihom.correios.com.br/preco/v1";
    if (tokenUrl.includes("api.correios")) return "https://api.correios.com.br/preco/v1";
    return process.env.CORREIOS_PRECO_URL || "https://apihom.correios.com.br/preco/v1";
}

/**
 * API Preço REST: disponível somente para clientes com contrato dos Correios na modalidade "a faturar".
 * Se retornar 403, o usuário não tem permissão (API 34); usar fallback SOAP.
 * Rate limit: 150 req/s por usuário e IP.
 */
async function fetchPrecoREST(
    cepOrigem: string,
    cepDestino: string,
    psObjetoGramas: number,
    comprimento: string,
    largura: string,
    altura: string
): Promise<{ valor: number; prazoDias?: number } | null> {
    const token = await getCorreiosToken();
    if (!token) return null;
    const base = getPrecoBaseUrl();
    const coProduto = PAC_CODIGO_SERVICO;
    const params = new URLSearchParams({
        cepOrigem,
        cepDestino,
        psObjeto: String(Math.round(psObjetoGramas)),
        tpObjeto: "2",
        comprimento,
        largura,
        altura,
    });
    const url = `${base}/nacional/${coProduto}?${params.toString()}`;
    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            signal: AbortSignal?.timeout?.(15000),
        });
        if (!res.ok) {
            const text = await res.text();
            if (res.status === 403) {
                console.warn("[Correios Preço REST] 403 - Acesso à API Preço (34) não autorizado. Solicite a permissão no portal Meu Correios / Desenvolvedores e tente novamente.");
            } else {
                console.warn("[Correios Preço REST] HTTP", res.status, text?.slice(0, 300));
            }
            return null;
        }
        const data = (await res.json()) as Record<string, unknown>;
        const valor =
            typeof data.vlPreco === "number"
                ? data.vlPreco
                : typeof data.vlPreco === "string"
                  ? parseCorreiosValor(data.vlPreco)
                  : typeof data.preco === "number"
                    ? data.preco
                    : typeof data.valor === "number"
                      ? data.valor
                      : Array.isArray(data.parametrosProduto) && data.parametrosProduto[0] != null
                        ? (() => {
                              const p = data.parametrosProduto[0] as Record<string, unknown>;
                              const v = p.vlPreco ?? p.preco ?? p.valor;
                              return typeof v === "number" ? v : parseCorreiosValor(String(v ?? "0"));
                          })()
                        : 0;
        const prazo =
            typeof data.prazoEntrega === "number"
                ? data.prazoEntrega
                : typeof data.prazoEntrega === "string"
                  ? parseInt(data.prazoEntrega, 10)
                  : undefined;
        if (valor <= 0) {
            console.warn("[Correios Preço REST] Valor não encontrado na resposta:", JSON.stringify(data).slice(0, 400));
            return null;
        }
        return { valor, prazoDias: prazo && !isNaN(prazo) ? prazo : undefined };
    } catch (e) {
        console.warn("[Correios Preço REST] Erro:", e instanceof Error ? e.message : e);
        return null;
    }
}

type ShippingBody = {
    cepDestino?: string;
    productType?: string;
    quantity?: number;
    format?: "cartela" | "unidades";
    widthMm?: number;
    heightMm?: number;
};

export async function POST(request: NextRequest) {
    let body: ShippingBody = {};
    try {
        body = (await request.json().catch(() => ({}))) as ShippingBody;
    } catch {
        return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
    }
    try {
        const cepDestino = onlyDigits(body.cepDestino || "").slice(0, 8);
        if (cepDestino.length !== 8) {
            return NextResponse.json(
                { error: "CEP de destino inválido (precisa de 8 dígitos)" },
                { status: 400 }
            );
        }

        const cepOrigem = onlyDigits(process.env.CEP_ORIGEM || "").slice(0, 8);
        if (cepOrigem.length !== 8) {
            return NextResponse.json(
                { error: "CEP_ORIGEM não configurado ou inválido no servidor. Configure no .env (8 dígitos)." },
                { status: 500 }
            );
        }

        let pesoKg: string;
        let comprimento: string;
        let largura: string;
        let altura: string;

        if (body.productType === "rotulo" && typeof body.quantity === "number" && body.format && body.widthMm != null && body.heightMm != null) {
            try {
                const dim = calcRotulosPackage({
                    quantity: body.quantity,
                    format: body.format,
                    widthMm: body.widthMm,
                    heightMm: body.heightMm,
                });
                pesoKg = (Math.min(30, Math.max(0.3, dim.pesoKg))).toFixed(2);
                comprimento = String(Math.min(105, dim.comprimentoCm));
                largura = String(Math.min(105, dim.larguraCm));
                altura = String(Math.min(105, dim.alturaCm));
            } catch (e) {
                console.warn("[Correios] Erro ao calcular embalagem rótulos, usando padrão:", e);
                pesoKg = process.env.SHIPPING_PESO_KG || "1";
                comprimento = process.env.SHIPPING_COMPRIMENTO_CM || "20";
                largura = process.env.SHIPPING_LARGURA_CM || "20";
                altura = process.env.SHIPPING_ALTURA_CM || "5";
            }
        } else {
            pesoKg = process.env.SHIPPING_PESO_KG || "1";
            comprimento = process.env.SHIPPING_COMPRIMENTO_CM || "20";
            largura = process.env.SHIPPING_LARGURA_CM || "20";
            altura = process.env.SHIPPING_ALTURA_CM || "5";
        }

        const psObjetoGramas = Math.round(parseFloat(pesoKg.replace(",", ".")) * 1000);

        const restResult = await fetchPrecoREST(cepOrigem, cepDestino, psObjetoGramas, comprimento, largura, altura);
        if (restResult != null) {
            const valorComSpread = Math.round(restResult.valor * (1 + SPREAD_PERCENT / 100) * 100) / 100;
            return NextResponse.json({
                valor: restResult.valor,
                valorComSpread,
                prazoDias: restResult.prazoDias ?? 0,
                spreadPercent: SPREAD_PERCENT,
                origem: "rest",
            });
        }

        const pesoKgSoap = pesoKg.replace(",", ".");
        const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soap:Body>
    <tem:CalcPrecoPrazo>
      <tem:nCdEmpresa></tem:nCdEmpresa>
      <tem:sDsSenha></tem:sDsSenha>
      <tem:nCdServico>04510</tem:nCdServico>
      <tem:sCepOrigem>${cepOrigem}</tem:sCepOrigem>
      <tem:sCepDestino>${cepDestino}</tem:sCepDestino>
      <tem:nVlPeso>${pesoKgSoap}</tem:nVlPeso>
      <tem:nCdFormato>1</tem:nCdFormato>
      <tem:nVlComprimento>${comprimento}</tem:nVlComprimento>
      <tem:nVlLargura>${largura}</tem:nVlLargura>
      <tem:nVlAltura>${altura}</tem:nVlAltura>
      <tem:nVlDiametro>0</tem:nVlDiametro>
      <tem:sCdMaoPropria>N</tem:sCdMaoPropria>
      <tem:nVlValorDeclarado>0</tem:nVlValorDeclarado>
      <tem:sCdAvisoRecebimento>N</tem:sCdAvisoRecebimento>
    </tem:CalcPrecoPrazo>
  </soap:Body>
</soap:Envelope>`;

        const soapOptions = {
            method: "POST" as const,
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                SOAPAction: "http://tempuri.org/CalcPrecoPrazo",
            },
            body: soapBody,
            signal: AbortSignal?.timeout?.(15000),
        };

        let res: Response;
        let xml: string;
        try {
            res = await fetch(CORREIOS_SOAP_URL_HTTP, soapOptions);
            xml = await res.text();
            if (!res.ok && res.status >= 500) {
                const resHttps = await fetch(CORREIOS_SOAP_URL_HTTPS, soapOptions);
                xml = await resHttps.text();
                res = resHttps;
            }
        } catch (fetchErr) {
            try {
                res = await fetch(CORREIOS_SOAP_URL_HTTPS, soapOptions);
                xml = await res.text();
            } catch (fallbackErr) {
                const msg = fetchErr instanceof Error ? fetchErr.message : "Erro de rede";
                console.error("[Correios] SOAP falhou (HTTP e HTTPS):", msg);
                return NextResponse.json({
                    valor: 0,
                    valorComSpread: 0,
                    prazoDias: 0,
                    spreadPercent: SPREAD_PERCENT,
                    origem: "indisponivel",
                    aviso: "Frete temporariamente indisponível. Em produção, use as credenciais da empresa e a API REST quando o contrato Correios estiver ativo.",
                });
            }
        }

        if (!res.ok) {
            console.warn("[Correios] Resposta HTTP:", res.status, xml?.slice(0, 200));
            return NextResponse.json(
                { error: "Correios temporariamente indisponível. Tente novamente." },
                { status: 502 }
            );
        }
        const valorMatch = xml.match(/<Valor>([^<]+)<\/Valor>/i);
        const prazoMatch = xml.match(/<PrazoEntrega>([^<]+)<\/PrazoEntrega>/i);
        const erroMatch = xml.match(/<MsgErro>([^<]*)<\/MsgErro>/i);

        if (erroMatch && erroMatch[1]?.trim()) {
            console.warn("[Correios] MsgErro:", erroMatch[1]);
            return NextResponse.json(
                { error: "Correios: " + (erroMatch[1].trim() || "erro ao calcular frete") },
                { status: 422 }
            );
        }

        const valorCorreios = parseCorreiosValor(valorMatch?.[1] || "0");
        const prazoDias = prazoMatch?.[1] ? parseInt(prazoMatch[1], 10) : 0;
        const valorComSpread = Math.round((valorCorreios * (1 + SPREAD_PERCENT / 100)) * 100) / 100;

        return NextResponse.json({
            valor: valorCorreios,
            valorComSpread,
            prazoDias: isNaN(prazoDias) ? 0 : prazoDias,
            spreadPercent: SPREAD_PERCENT,
            origem: "soap",
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        console.error("[Correios] Erro:", message, stack ?? "");
        return NextResponse.json(
            { error: "Erro ao calcular frete. Tente novamente." },
            { status: 500 }
        );
    }
}

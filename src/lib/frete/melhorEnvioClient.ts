import type { CotacaoFreteNormalizada, Transportadora } from "./types";

// Conforme docs oficiais, a API v2 usa melhorenvio.com.br e sandbox.melhorenvio.com.br
// ENOTFOUND em api.melhorenvio.com.br na Vercel → voltar para o host raiz.
const PRODUCTION_URL = "https://melhorenvio.com.br";
const SANDBOX_URL = "https://sandbox.melhorenvio.com.br";

function getBaseUrl(): string {
    const sandbox = process.env.MELHOR_ENVIO_SANDBOX;
    const isSandbox = sandbox === "true" || sandbox === "1";
    let base = process.env.MELHOR_ENVIO_BASE_URL ?? (isSandbox ? SANDBOX_URL : PRODUCTION_URL);
    // app.melhorenvio.com.br é o painel; a API de cotação/etiquetas é api.melhorenvio.com.br
    if (base.includes("app.melhorenvio.com.br") && !base.includes("app-sandbox")) {
        base = PRODUCTION_URL;
    }
    if (base.includes("app-sandbox.melhorenvio.com.br")) {
        base = SANDBOX_URL;
    }
    return base;
}

function isSandboxEnv(): boolean {
    const sandbox = process.env.MELHOR_ENVIO_SANDBOX;
    return sandbox === "true" || sandbox === "1";
}

function getAuthHeaders(): Record<string, string> {
    const token = isSandboxEnv()
        ? (process.env.MELHOR_ENVIO_SANDBOX_TOKEN ?? process.env.MELHOR_ENVIO_TOKEN)
        : process.env.MELHOR_ENVIO_TOKEN;
    if (!token?.trim()) {
        const msg = isSandboxEnv()
            ? "MELHOR_ENVIO_SANDBOX_TOKEN ou MELHOR_ENVIO_TOKEN não configurado (sandbox ativo)"
            : "MELHOR_ENVIO_TOKEN não configurado";
        throw new Error(msg);
    }
    return {
        Authorization: `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
        "User-Agent": process.env.MELHOR_ENVIO_USER_AGENT ?? "f9-marketplace (contato@f9.com.br)",
        Accept: "application/json",
    };
}

function mapCompanyToTransportadora(name: string): Transportadora {
    const n = (name ?? "").toLowerCase();
    if (n.includes("correios")) return "correios";
    if (n.includes("jadlog")) return "jadlog";
    if (n.includes("azul")) return "azul";
    if (n.includes("j&t") || n.includes("jt")) return "jt";
    if (n.includes("latam")) return "latam";
    return "outro";
}

// --- Cotação ---

export interface ItemParaCotacao {
    pesoKg: number;
    larguraCm: number;
    alturaCm: number;
    comprimentoCm: number;
    valorDeclarado: number;
}

export interface CotacaoInput {
    cepOrigem: string;
    cepDestino: string;
    itens: ItemParaCotacao[];
    /** Se definido, força uso ou não de seguro nesta cotação específica. */
    insurance?: boolean;
}

/** Payload do calculate: weight em kg, insurance_value em reais, name obrigatório (doc oficial). */
interface MelhorEnvioProductPayload {
    id: string;
    name: string;
    width: number;
    height: number;
    length: number;
    weight: number;
    quantity: number;
    insurance_value: number;
}

/** Resposta do calculate: packages[] (aceita service/service_id, company/carrier conforme doc). */
interface MelhorEnvioPackage {
    price: number;
    custom_price?: number;
    delivery_time?: number;
    custom_delivery_time?: number;
    service?: number;
    service_id?: number;
    service_name?: string;
    service_code?: string;
    company?: { id: number; name: string };
    carrier?: { id: number; name: string };
    error?: { short?: string; long?: string };
}

interface MelhorEnvioCalculateResponse {
    packages?: MelhorEnvioPackage[];
    delivery_range?: { min: number; max: number };
}

function parsePackagesFromCalculate(data: unknown): MelhorEnvioPackage[] {
    if (!data || typeof data !== "object") return [];
    const r = data as MelhorEnvioCalculateResponse & { data?: MelhorEnvioPackage[]; results?: MelhorEnvioPackage[] };
    if (Array.isArray(r.packages)) return r.packages;
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.results)) return r.results;
    return [];
}

/** Cotações fictícias quando API está inacessível (ENOTFOUND, rede bloqueada) ou MELHOR_ENVIO_MOCK=1. */
function getMockCotacoes(): CotacaoFreteNormalizada[] {
    return [
        { provider: "melhor-envio", providerServicoId: "1", transportadora: "correios", nomeServico: "PAC", preco: 1890, prazoMinDias: 8, prazoMaxDias: 12 },
        { provider: "melhor-envio", providerServicoId: "2", transportadora: "correios", nomeServico: "SEDEX", preco: 3290, prazoMinDias: 3, prazoMaxDias: 5 },
        { provider: "melhor-envio", providerServicoId: "17", transportadora: "correios", nomeServico: "PAC Contrato", preco: 2490, prazoMinDias: 6, prazoMaxDias: 9 },
    ];
}

export async function cotarFreteMelhorEnvio(input: CotacaoInput): Promise<CotacaoFreteNormalizada[]> {
    const useMock = process.env.MELHOR_ENVIO_MOCK === "1" || process.env.MELHOR_ENVIO_MOCK === "true";
    if (useMock) {
        console.warn("[Melhor Envio] Usando cotações MOCK (MELHOR_ENVIO_MOCK ativo).");
        return getMockCotacoes();
    }

    const base = getBaseUrl();
    const url = `${base}/api/v2/me/shipment/calculate`;

    const cepOrigem = input.cepOrigem.replace(/\D/g, "").slice(0, 8);
    const cepDestino = input.cepDestino.replace(/\D/g, "").slice(0, 8);
    const valorTotal = input.itens.reduce((acc, i) => acc + i.valorDeclarado, 0);

    // Seguro: desligar reduz o frete; sem seguro não há indenização em perda/avaria. Ver docs/frete-seguro-beneficios-contras.md
    const insuranceEnv = process.env.MELHOR_ENVIO_INSURANCE;
    const defaultInsurance = !(insuranceEnv === "false" || insuranceEnv === "0");
    // Se a rota de cotação informar insurance explicitamente, priorizamos a escolha do cliente.
    const insurance = typeof input.insurance === "boolean" ? input.insurance : defaultInsurance;

    // Doc: weight em kg, insurance_value em reais, name obrigatório.
    const products: MelhorEnvioProductPayload[] =
        input.itens.length > 0
            ? input.itens.map((item, idx) => ({
                  id: `produto_${idx + 1}`,
                  name: `Item ${idx + 1}`,
                  width: item.larguraCm,
                  height: item.alturaCm,
                  length: item.comprimentoCm,
                  weight: Math.max(0.01, item.pesoKg),
                  quantity: 1,
                  insurance_value: insurance ? Math.max(0, item.valorDeclarado) : 0,
              }))
            : [
                  {
                      id: "p1",
                      name: "Pedido",
                      width: 16,
                      height: 16,
                      length: 16,
                      weight: 0.3,
                      quantity: 1,
                      insurance_value: insurance ? Math.max(0.01, valorTotal) : 0,
                  },
              ];

    const body: Record<string, unknown> = {
        from: { postal_code: cepOrigem },
        to: { postal_code: cepDestino },
        products,
        options: {
            insurance,
            receipt: false,
            own_hand: false,
            non_commercial: false,
        },
    };
    const servicesEnv = process.env.MELHOR_ENVIO_SERVICES;
    if (servicesEnv) body.services = servicesEnv;

    let res: Response;
    try {
        res = await fetch(url, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
            signal: AbortSignal.timeout?.(20000),
        });
    } catch (err) {
        const cause = err instanceof Error ? err.cause ?? err.message : String(err);
        const isNetwork =
            String(cause).includes("ENOTFOUND") ||
            String(cause).includes("fetch failed") ||
            String(cause).includes("ECONNREFUSED");

        console.error("[Melhor Envio] Erro ao chamar /api/v2/me/shipment/calculate", {
            url,
            isNetwork,
            cause,
        });

        // Em erro de rede/DNS NÃO usamos mais MOCK: deixamos falhar para aparecer no /api/frete/test-token
        if (isNetwork) {
            throw new Error(
                `[Melhor Envio] API inacessível (rede/DNS). Verifique MELHOR_ENVIO_BASE_URL, DNS e saída de rede da Vercel.\nCausa: ${String(
                    cause,
                )}`,
            );
        }

        // Outros erros sobem normalmente
        throw err instanceof Error ? err : new Error(String(err));
    }

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao cotar frete Melhor Envio: ${res.status} - ${text}`);
    }

    const data: unknown = await res.json();
    const list = parsePackagesFromCalculate(data);

    // Ignora pacotes com erro (ex.: "Serviço indisponível para esta rota") ou sem preço
    const validos = list.filter((pkg) => !pkg.error && (pkg.custom_price != null || pkg.price != null));

    if (validos.length === 0 && list.length > 0) {
        console.warn("[Melhor Envio] Todos os pacotes vieram com erro ou sem preço. Amostra:", JSON.stringify(list.slice(0, 2)));
    }
    if (list.length === 0) {
        console.warn("[Melhor Envio] Resposta sem packages ou formato inesperado. Raw keys:", data && typeof data === "object" ? Object.keys(data as object) : [], "sample:", JSON.stringify(data).slice(0, 500));
    }

    const normalizado: CotacaoFreteNormalizada[] = validos.map((pkg) => {
        const serviceId = pkg.service ?? pkg.service_id ?? 0;
        const company = pkg.company ?? pkg.carrier;
        const precoReais = pkg.custom_price ?? pkg.price ?? 0;
        const prazoDias = pkg.custom_delivery_time ?? pkg.delivery_time ?? 0;
        return {
            provider: "melhor-envio",
            providerServicoId: String(serviceId),
            transportadora: mapCompanyToTransportadora(company?.name ?? ""),
            nomeServico: pkg.service_name ?? (company?.name ? String(serviceId) : "Frete"),
            preco: Math.round(Number(precoReais) * 100),
            prazoMinDias: Number(prazoDias) || 0,
            prazoMaxDias: Number(prazoDias) || 0,
        };
    });

    return normalizado;
}

// --- Etiqueta ---

export interface EtiquetaEndereco {
    nome: string;
    documento: string;
    telefone: string;
    email: string;
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
}

export interface EtiquetaInput {
    serviceId: string;
    from: EtiquetaEndereco;
    to: EtiquetaEndereco;
    package: {
        pesoKg: number;
        larguraCm: number;
        alturaCm: number;
        comprimentoCm: number;
        valorDeclarado: number;
    };
}

/** Resposta do create conforme guia: id, protocol, status (pending_payment), tracking (null inicial). */
export interface MelhorEnvioEtiquetaResponse {
    id: number;
    protocol?: string;
    service_id?: number;
    service_name?: string;
    status?: string;
    price?: number;
    tracking?: string | null;
    [key: string]: unknown;
}

/** Payload e resposta conforme guia: POST /api/v2/me/shipment/create */
export async function gerarEtiquetaMelhorEnvio(input: EtiquetaInput): Promise<MelhorEnvioEtiquetaResponse> {
    const base = getBaseUrl();
    const url = `${base}/api/v2/me/shipment/create`;

    const docFrom = (input.from.documento ?? "").replace(/\D/g, "");
    const docTo = (input.to.documento ?? "").replace(/\D/g, "");
    const cepFrom = (input.from.cep ?? "").replace(/\D/g, "").slice(0, 8);
    const cepTo = (input.to.cep ?? "").replace(/\D/g, "").slice(0, 8);
    const stateFrom = (input.from.estado ?? "").slice(0, 2).toUpperCase();
    const stateTo = (input.to.estado ?? "").slice(0, 2).toUpperCase();
    const pesoGramas = Math.round(input.package.pesoKg * 1000);
    const insuranceValue = String(Math.max(0, input.package.valorDeclarado).toFixed(2));
    const serviceIdNum = parseInt(input.serviceId, 10);
    if (Number.isNaN(serviceIdNum)) throw new Error("serviceId deve ser numérico para o Melhor Envio");

    const body = {
        service_id: serviceIdNum,
        agency_id: null,
        contract: null,
        from: {
            name: input.from.nome,
            phone: (input.from.telefone ?? "").replace(/\D/g, "").slice(0, 11),
            email: input.from.email,
            document: docFrom,
            state_document: null as string | null,
            address: input.from.rua,
            complement: input.from.complemento ?? null,
            number: String(input.from.numero),
            city: input.from.cidade,
            state: stateFrom,
            country: "Brasil",
            postal_code: cepFrom,
        },
        to: {
            name: input.to.nome,
            phone: (input.to.telefone ?? "").replace(/\D/g, "").slice(0, 11),
            email: input.to.email,
            document: docTo,
            address: input.to.rua,
            complement: input.to.complemento ?? null,
            number: String(input.to.numero),
            city: input.to.cidade,
            state: stateTo,
            country: "Brasil",
            postal_code: cepTo,
        },
        products: [
            {
                name: "Pedido",
                quantity: 1,
                unitary_value: Math.round(Math.max(0, input.package.valorDeclarado) * 100),
                weight: String(pesoGramas),
            },
        ],
        volumes: [
            {
                height: input.package.alturaCm,
                width: input.package.larguraCm,
                length: input.package.comprimentoCm,
                weight: String(input.package.pesoKg.toFixed(2)),
                insurance_value: insuranceValue,
            },
        ],
        recipient: {
            phone: (input.to.telefone ?? "").replace(/\D/g, "").slice(0, 11),
            email: input.to.email,
            name: input.to.nome,
            document: docTo,
            address: input.to.rua,
            complement: input.to.complemento ?? null,
            number: String(input.to.numero),
            city: input.to.cidade,
            state: stateTo,
            country: "Brasil",
            postal_code: cepTo,
        },
        options: {
            insurance_value: insuranceValue,
            own_hand: false,
            receipt: false,
            collect: false,
            reverse: false,
            non_commercial: false,
        },
    };

    const res = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout?.(30000),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao criar envio Melhor Envio: ${res.status} - ${text}`);
    }

    const data = (await res.json()) as MelhorEnvioEtiquetaResponse;
    return data;
}

/** URL de impressão da etiqueta (guia: GET /api/v2/me/shipments/{id}/print). Um ID por vez. */
export function obterUrlImpressaoMelhorEnvio(ids: string[]): string {
    const base = getBaseUrl();
    const id = ids.filter(Boolean)[0];
    if (!id) throw new Error("Nenhum ID de etiqueta informado");
    return `${base}/api/v2/me/shipments/${id}/print`;
}

/** Gera a etiqueta no Melhor Envio (guia: POST /api/v2/me/label/{id}). Chamar após create quando status for pending_payment. */
export async function gerarLabelMelhorEnvio(shipmentId: number): Promise<unknown> {
    const base = getBaseUrl();
    const url = `${base}/api/v2/me/label/${shipmentId}`;
    const res = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout?.(30000),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao gerar etiqueta/label Melhor Envio: ${res.status} - ${text}`);
    }
    return res.json();
}

/** Baixa o PDF da etiqueta do Melhor Envio (requer token). Retorna o Response para repassar ao cliente. */
export async function fetchPdfEtiquetaMelhorEnvio(providerEtiquetaIds: string[]): Promise<Response> {
    const url = obterUrlImpressaoMelhorEnvio(providerEtiquetaIds);
    const res = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout?.(30000),
    });
    return res;
}

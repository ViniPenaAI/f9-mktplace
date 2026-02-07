"use client";

import { useConfiguratorStore } from "@/store/configurator-store";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, QrCode, Loader2, CheckCircle, AlertCircle, MapPin, Phone, User } from "lucide-react";
import type { OrderConfirmBody } from "@/lib/order-types";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";

type PaymentMethod = "card" | "pix";

type PaymentResult = {
    order_id?: string;
    payment_id?: number;
    status: string;
    qr_code_base64?: string;
    qr_code?: string;
    point_of_interaction?: {
        transaction_data?: {
            ticket_url?: string;
            qr_code_base64?: string;
            qr_code?: string;
        };
    };
    transaction_details?: { external_resource_url?: string; barcode?: string; digitable_line?: string };
};

function formatCurrency(value: number): string {
    return value.toFixed(2).replace(".", ",");
}

function onlyDigits(s: string): string {
    return (s || "").replace(/\D/g, "");
}

/** Converte URL da arte (blob ou data) em base64 para enviar ao backend. */
async function getArtBase64(url: string | null | undefined): Promise<string | undefined> {
    if (!url?.startsWith("blob:") && !url?.startsWith("data:")) return undefined;
    try {
        if (url.startsWith("data:")) return url.split(",")[1];
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                resolve(dataUrl.includes(",") ? dataUrl.split(",")[1] ?? "" : "");
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return undefined;
    }
}

export function Step5Payment() {
    const { totalPrice, shippingCost, customer, shipping, specs, artwork, selectedProduct, updateCustomer, updateShipping, setShippingCost } = useConfiguratorStore();
    const [method, setMethod] = useState<PaymentMethod>("pix");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PaymentResult | null>(null);
    const [mpReady, setMpReady] = useState(false);
    const [cardTabMounted, setCardTabMounted] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const cardContainerRef = useRef<HTMLDivElement>(null);
    const brickLoaded = useRef(false);
    const confirmedOrderIds = useRef<Set<string>>(new Set());

    const fetchCep = async (cep: string) => {
        const digits = onlyDigits(cep);
        if (digits.length !== 8) return;
        setCepLoading(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
            const data = await res.json();
            if (!data.erro) {
                updateShipping({
                    street: data.logradouro || "",
                    neighborhood: data.bairro || "",
                    city: data.localidade || "",
                    state: data.uf || "",
                });
                setPayer((p) => ({
                    ...p,
                    address: p.address
                        ? {
                            ...p.address,
                            street_name: data.logradouro || p.address.street_name,
                            city: data.localidade || p.address.city,
                            federal_unit: data.uf || p.address.federal_unit,
                          }
                        : {
                            zip_code: onlyDigits(shipping.zipCode),
                            street_name: data.logradouro || "",
                            street_number: shipping.number,
                            city: data.localidade || "",
                            federal_unit: data.uf || "",
                          },
                }));
            }
        } catch {
            // ignore
        } finally {
            setCepLoading(false);
        }
    };

    const payerFromStore = {
        first_name: customer.name?.trim().split(/\s+/)[0] || "Cliente",
        last_name: customer.name?.indexOf(" ") >= 0 ? customer.name.slice(customer.name.indexOf(" ") + 1) : (customer.name || "Sobrenome"),
        email: customer.email || "",
        identification: { type: "CPF" as const, number: onlyDigits(customer.document || "") },
        address: shipping.zipCode || shipping.street || shipping.city
            ? {
                zip_code: onlyDigits(shipping.zipCode),
                street_name: shipping.street,
                street_number: shipping.number,
                city: shipping.city,
                federal_unit: shipping.state,
              }
            : undefined,
    };

    const [payer, setPayer] = useState(payerFromStore);

    useEffect(() => {
        setPayer((p) => ({
            ...p,
            first_name: payerFromStore.first_name || p.first_name,
            last_name: payerFromStore.last_name || p.last_name,
            email: payerFromStore.email || p.email,
            identification: { type: "CPF" as const, number: payerFromStore.identification.number || p.identification.number },
            address: payerFromStore.address || p.address,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from store; payerFromStore is derived from customer/shipping
    }, [customer.name, customer.email, customer.document, shipping.zipCode, shipping.street, shipping.number, shipping.city, shipping.state, shipping.neighborhood]);

    // Após sucesso do pagamento: envia dados do pedido para o backend (Supabase + compilação da pasta)
    useEffect(() => {
        const orderId = result?.order_id;
        if (!orderId || confirmedOrderIds.current.has(orderId)) return;
        confirmedOrderIds.current.add(orderId);
        const artUrl = artwork.enhancedDesignUrl || artwork.selectedDesignUrl;
        getArtBase64(artUrl ?? undefined).then((artBase64) => {
            const body: OrderConfirmBody = {
                order_id: orderId,
                status: result!.status,
                payment_method: method,
                installments: method === "card" ? undefined : undefined,
                payment_response: result ? { ...result } : undefined,
                customer: { name: customer.name ?? "", email: customer.email ?? "", phone: customer.phone ?? "", document: customer.document ?? "" },
                shipping: {
                    zipCode: shipping.zipCode ?? "",
                    street: shipping.street ?? "",
                    number: shipping.number ?? "",
                    complement: shipping.complement,
                    neighborhood: shipping.neighborhood,
                    city: shipping.city ?? "",
                    state: shipping.state ?? "",
                },
                specs: { ...specs },
                artwork: {
                    presentationType: artwork.presentationType,
                    selectedDesignUrl: artwork.selectedDesignUrl ?? null,
                    enhancedDesignUrl: artwork.enhancedDesignUrl ?? null,
                    approvalScale: artwork.approvalScale,
                    cutAreaScale: artwork.cutAreaScale,
                    artBase64,
                },
                selectedProduct,
                totalPrice,
                shippingCost,
            };
            fetch("/api/orders/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch((err) => {
                console.error("[Step5Payment] Erro ao confirmar pedido:", err);
            });
        });
    }, [result, method, customer, shipping, specs, artwork.presentationType, artwork.selectedDesignUrl, artwork.enhancedDesignUrl, artwork.approvalScale, artwork.cutAreaScale, selectedProduct, totalPrice, shippingCost]);

    const productAmount = typeof totalPrice === "number" && totalPrice > 0 ? totalPrice : 0;
    const freight = typeof shippingCost === "number" ? shippingCost : 0;
    const isPrecoTeste = process.env.NEXT_PUBLIC_PRECO_TESTE === "1" || process.env.NEXT_PUBLIC_PRECO_TESTE === "true";
    const amount = isPrecoTeste ? 1 : productAmount + freight;
    const cepOk = onlyDigits(shipping.zipCode).length === 8;
    const addressComplete = cepOk && shipping.street && shipping.number && shipping.city && shipping.state;
    const formValid =
        !!(customer.name?.trim() && customer.email?.trim() && customer.phone?.trim()) &&
        onlyDigits(customer.document || "").length === 11 &&
        addressComplete;

    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingError, setShippingError] = useState<string | null>(null);

    // Frete via API Correios (valor real + 15% de spread)
    useEffect(() => {
        if (!cepOk) {
            setShippingCost(0);
            setShippingError(null);
            return;
        }
        const cep = onlyDigits(shipping.zipCode).slice(0, 8);
        if (cep.length !== 8) {
            setShippingCost(0);
            setShippingError(null);
            return;
        }
        let cancelled = false;
        setShippingLoading(true);
        setShippingError(null);
        const isRotulo = selectedProduct === "rotulo";
        const body: { cepDestino: string; productType?: string; quantity?: number; format?: "cartela" | "unidades"; widthMm?: number; heightMm?: number } = {
            cepDestino: cep,
        };
        if (isRotulo && specs?.quantity != null && artwork?.presentationType && specs?.width != null && specs?.height != null) {
            body.productType = "rotulo";
            body.quantity = specs.quantity;
            body.format = artwork.presentationType;
            body.widthMm = specs.width;
            body.heightMm = specs.height;
        }
        fetch("/api/shipping/correios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                if (data.error) {
                    setShippingCost(0);
                    setShippingError(data.error || "Não foi possível calcular o frete.");
                    return;
                }
                const valor = typeof data.valorComSpread === "number" ? data.valorComSpread : 0;
                setShippingCost(Math.round(valor * 100) / 100);
                setShippingError(data.aviso ? String(data.aviso) : null);
            })
            .catch(() => {
                if (!cancelled) {
                    setShippingCost(0);
                    setShippingError("Erro ao buscar frete. Verifique o CEP ou tente mais tarde.");
                }
            })
            .finally(() => {
                if (!cancelled) setShippingLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [cepOk, shipping.zipCode, setShippingCost, selectedProduct, specs?.quantity, specs?.width, specs?.height, artwork?.presentationType]);

    // Carregar SDK do Mercado Pago ao entrar no step de pagamento (não esperar pela aba Cartão)
    useEffect(() => {
        if (!PUBLIC_KEY) return;
        if (document.querySelector('script[src^="https://sdk.mercadopago.com/js/v2"]')) {
            setMpReady(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://sdk.mercadopago.com/js/v2?locale=pt-BR";
        script.async = true;
        script.setAttribute("data-public-key", PUBLIC_KEY);
        script.onload = () => setMpReady(true);
        document.body.appendChild(script);
        return () => {
            script.remove();
        };
    }, []);

    useEffect(() => {
        if (method !== "card") {
            setCardTabMounted(false);
            brickLoaded.current = false;
            return;
        }
        setCardTabMounted(true);
    }, [method]);

    useEffect(() => {
        if (!mpReady || !PUBLIC_KEY || method !== "card" || !cardTabMounted || brickLoaded.current || amount <= 0) return;
        const container = cardContainerRef.current;
        if (!container) return;
        const win = window as unknown as {
            MercadoPago?: new (key: string) => {
                bricks: () => { create: (brickId: string, containerId: string | HTMLElement, opts: unknown) => void };
            };
        };
        const MercadoPago = win.MercadoPago;
        if (!MercadoPago) return;

        function createBrick() {
            if (brickLoaded.current || !container?.isConnected) return;
            const inner = document.getElementById("cardPaymentBrick_container");
            if (!inner) return;
            if (!MercadoPago) return;
            inner.innerHTML = "";
            brickLoaded.current = true;
            const mp = new MercadoPago(PUBLIC_KEY);
            const bricksBuilder = mp.bricks();
            try {
                bricksBuilder.create("cardPayment", "cardPaymentBrick_container", {
                    initialization: {
                        amount,
                        payer: {
                            email: payer.email || "test_user_123@testuser.com",
                        },
                    },
                    customization: {
                        visual: {
                            style: {
                                theme: "default" as const,
                            },
                        },
                    },
                    callbacks: {
                        onReady: () => {
                            // Brick pronto
                        },
                        onSubmit: (formData: { token?: string; payment_method_id?: string; issuer_id?: number; installments?: number }) => {
                            setError(null);
                            setLoading(true);
                            return fetch("/api/mercadopago/order", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    amount,
                                    payment_method_id: formData.payment_method_id || "visa",
                                    token: formData.token,
                                    installments: formData.installments || 1,
                                    payer,
                                    external_reference: `f9_${Date.now()}`,
                                }),
                            })
                                .then((res) => res.json())
                                .then((data) => {
                                    setLoading(false);
                                    if (data.error) {
                                        setError(data.error);
                                        throw new Error(data.error);
                                    }
                                    setResult({
                                        order_id: data.order_id,
                                        status: data.status,
                                        qr_code_base64: data.qr_code_base64,
                                        qr_code: data.qr_code,
                                        point_of_interaction: data.point_of_interaction,
                                    });
                                })
                                .catch((err) => {
                                    setLoading(false);
                                    setError(err?.message || "Erro ao processar pagamento.");
                                    throw err;
                                });
                        },
                        onError: (err: unknown) => {
                            setError(err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Erro no formulário.");
                        },
                    },
                });
            } catch (e) {
                brickLoaded.current = false;
                console.error("[Card Brick] Erro ao criar:", e);
            }
        }

        let attempts = 0;
        const maxAttempts = 80;
        const intervalId = setInterval(() => {
            if (brickLoaded.current || attempts >= maxAttempts) {
                clearInterval(intervalId);
                return;
            }
            attempts++;
            createBrick();
            if (brickLoaded.current) clearInterval(intervalId);
        }, 150);
        const timer = setTimeout(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    createBrick();
                    if (!brickLoaded.current) return;
                    clearInterval(intervalId);
                });
            });
        }, 350);

        return () => {
            clearTimeout(timer);
            clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- payer usado no callback do Brick; não incluir payer inteiro para evitar re-mounts
    }, [mpReady, method, cardTabMounted, amount, payer.email]);

    const handlePix = async () => {
        setError(null);
        setResult(null);
        const cpfLen = onlyDigits(payer.identification.number).length;
        if (!payer.email || !payer.first_name || !payer.last_name || cpfLen !== 11) {
            setError(cpfLen !== 11 && cpfLen > 0 ? "CPF deve ter 11 dígitos." : "Preencha todos os dados pessoais (nome, email e CPF com 11 dígitos).");
            return;
        }
        if (!customer.phone?.trim()) {
            setError("Preencha o telefone/WhatsApp.");
            return;
        }
        if (!cepOk || !shipping.street?.trim() || !shipping.number?.trim() || !shipping.city?.trim() || !shipping.state?.trim()) {
            setError("Preencha o CEP e todos os campos de endereço obrigatórios.");
            return;
        }
        if (amount <= 0) {
            setError("Valor do pedido inválido.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/mercadopago/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount,
                    payment_method_id: "pix",
                    payer,
                    external_reference: `f9_${Date.now()}`,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao gerar PIX");
            setResult({
                order_id: data.order_id,
                status: data.status,
                qr_code_base64: data.qr_code_base64,
                qr_code: data.qr_code,
                point_of_interaction: data.point_of_interaction,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erro ao gerar PIX.");
        } finally {
            setLoading(false);
        }
    };

    const success = result && (result.status === "approved" || result.status === "processed" || result.status === "pending" || result.status === "in_process");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
                <h3 className="text-xl font-bold text-f9-navy">Pagamento</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Preencha seus dados, o endereço de entrega e escolha a forma de pagamento.
                </p>
            </div>

            {/* Dados pessoais — no topo, todos obrigatórios */}
            <Card className="border-gray-200">
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-semibold text-f9-navy flex items-center gap-2">
                        <User className="w-4 h-4" /> Dados pessoais
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="first-name">Nome <span className="text-red-500">*</span></Label>
                            <Input
                                id="first-name"
                                value={customer.name?.trim().split(/\s+/)[0] ?? ""}
                                onChange={(e) => {
                                    const rest = customer.name?.indexOf(" ") >= 0 ? customer.name.slice(customer.name.indexOf(" ") + 1) : "";
                                    updateCustomer({ name: (e.target.value + (rest ? " " + rest : "")).trimStart() });
                                }}
                                placeholder="Nome"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="last-name">Sobrenome <span className="text-red-500">*</span></Label>
                            <Input
                                id="last-name"
                                value={customer.name?.indexOf(" ") >= 0 ? customer.name.slice(customer.name.indexOf(" ") + 1) : ""}
                                onChange={(e) => {
                                    const first = (customer.name || "").trim().split(/\s+/)[0] || "";
                                    const last = e.target.value;
                                    updateCustomer({ name: first ? `${first} ${last}` : last });
                                }}
                                placeholder="Sobrenome (pode usar espaço)"
                                required
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                            <Input
                                id="email"
                                type="email"
                                value={customer.email ?? ""}
                                onChange={(e) => updateCustomer({ email: e.target.value })}
                                placeholder="email@exemplo.com"
                                required
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Label htmlFor="cpf">CPF <span className="text-red-500">*</span></Label>
                            <Input
                                id="cpf"
                                value={customer.document ?? ""}
                                onChange={(e) => updateCustomer({ document: onlyDigits(e.target.value).slice(0, 11) })}
                                placeholder="000.000.000-00"
                                maxLength={14}
                                required
                            />
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <Label htmlFor="phone" className="text-sm font-medium">Telefone / WhatsApp <span className="text-red-500">*</span></Label>
                        </div>
                        <div className="sm:col-span-2">
                            <Input
                                id="phone"
                                type="tel"
                                value={customer.phone}
                                onChange={(e) => updateCustomer({ phone: e.target.value })}
                                placeholder="(11) 99999-9999"
                                required
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dados de entrega — CEP primeiro; demais campos liberados após preencher CEP */}
            <Card className="border-gray-200">
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-semibold text-f9-navy flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Dados de entrega
                    </h4>
                    <p className="text-sm text-gray-600">
                        Preencha o CEP primeiro para liberar os demais campos e calcular o frete.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="cep">CEP <span className="text-red-500">*</span></Label>
                            <Input
                                id="cep"
                                value={shipping.zipCode}
                                onChange={(e) => updateShipping({ zipCode: onlyDigits(e.target.value).slice(0, 8) })}
                                onBlur={(e) => fetchCep(e.target.value)}
                                placeholder="00000-000"
                                disabled={cepLoading}
                                required
                            />
                            {cepLoading && <span className="text-xs text-gray-500">Buscando...</span>}
                        </div>
                        <div>
                            <Label htmlFor="street">Rua <span className="text-red-500">*</span></Label>
                            <Input
                                id="street"
                                value={shipping.street}
                                onChange={(e) => updateShipping({ street: e.target.value })}
                                placeholder="Rua, avenida"
                                disabled={!cepOk}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="number">Número <span className="text-red-500">*</span></Label>
                            <Input
                                id="number"
                                value={shipping.number}
                                onChange={(e) => updateShipping({ number: e.target.value })}
                                placeholder="Nº"
                                disabled={!cepOk}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="complement">Complemento</Label>
                            <Input
                                id="complement"
                                value={shipping.complement ?? ""}
                                onChange={(e) => updateShipping({ complement: e.target.value })}
                                placeholder="Apto, bloco (opcional)"
                                disabled={!cepOk}
                            />
                        </div>
                        <div>
                            <Label htmlFor="neighborhood">Bairro <span className="text-red-500">*</span></Label>
                            <Input
                                id="neighborhood"
                                value={shipping.neighborhood ?? ""}
                                onChange={(e) => updateShipping({ neighborhood: e.target.value })}
                                placeholder="Bairro"
                                disabled={!cepOk}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="city">Cidade <span className="text-red-500">*</span></Label>
                            <Input
                                id="city"
                                value={shipping.city}
                                onChange={(e) => updateShipping({ city: e.target.value })}
                                placeholder="Cidade"
                                disabled={!cepOk}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="state">UF <span className="text-red-500">*</span></Label>
                            <Input
                                id="state"
                                value={shipping.state}
                                onChange={(e) => updateShipping({ state: e.target.value.toUpperCase().slice(0, 2) })}
                                placeholder="SP"
                                disabled={!cepOk}
                                required
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-blue-600/20 bg-blue-50/30">
                <CardContent className="pt-6 space-y-2">
                    {isPrecoTeste && (
                        <p className="text-xs text-amber-600 font-medium">Modo teste: valor fixo R$ 1,00 para demonstração.</p>
                    )}
                    <div className="flex justify-between items-center text-gray-700">
                        <span>Valor do produto</span>
                        <span>R$ {formatCurrency(isPrecoTeste ? 1 : productAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-700">
                        <span>Frete</span>
                        <span>{shippingLoading ? "Calculando..." : `R$ ${formatCurrency(isPrecoTeste ? 0 : freight)}`}</span>
                    </div>
                    {shippingError && (
                        <p className="text-xs text-amber-600">{shippingError}</p>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                        <span className="text-base font-semibold text-gray-800">Total</span>
                        <span className="text-2xl font-bold text-blue-600">R$ {formatCurrency(amount)}</span>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {success && result && (
                <Card className="border-green-200 bg-green-50/80">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-green-500 p-2 text-white">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-green-800">
                                    {(result.status === "approved" || result.status === "processed") && "Pagamento aprovado!"}
                                    {(result.status === "pending" || result.status === "in_process") && "PIX gerado. Conclua o pagamento no app do seu banco."}
                                </p>
                                {result.order_id && (
                                    <p className="text-sm text-green-700">
                                        Número do pedido: <span className="font-mono font-bold">{result.order_id}</span>
                                    </p>
                                )}
                                <p className="text-xs text-green-600">
                                    Seu pedido foi registrado. Guarde o número acima para acompanhamento.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs value={method} onValueChange={(v) => { setMethod(v as PaymentMethod); setResult(null); setError(null); }}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="card" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Cartão
                    </TabsTrigger>
                    <TabsTrigger value="pix" className="flex items-center gap-2">
                        <QrCode className="w-4 h-4" /> PIX
                    </TabsTrigger>
                </TabsList>

                {/* Brick do cartão fora da aba: sempre visível no fluxo quando Cartão está selecionado */}
                {method === "card" && (
                    <div className="mt-4 space-y-4">
                        <p className="text-sm text-gray-600">Os dados do pagador são os informados acima. Preencha os dados do cartão abaixo.</p>
                        {!PUBLIC_KEY && (
                            <p className="text-sm text-amber-600">Configure NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY no .env.local para habilitar pagamento com cartão.</p>
                        )}
                        {PUBLIC_KEY && amount > 0 && (
                            <div ref={cardContainerRef} className="w-full bg-white rounded-md border border-gray-200 p-4" style={{ minHeight: 380 }}>
                                <div id="cardPaymentBrick_container" className="w-full" style={{ minHeight: 360 }} />
                            </div>
                        )}
                        {loading && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                            </div>
                        )}
                    </div>
                )}

                <TabsContent value="pix" className="mt-4 space-y-4">
                    <p className="text-sm text-gray-600">Preencha todos os campos acima e clique em Gerar PIX. Você poderá pagar pelo app do banco ou copiando o código.</p>
                    <Button onClick={handlePix} disabled={loading || amount <= 0 || !formValid} className="w-full sm:w-auto">
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando PIX...
                            </>
                        ) : (
                            "Gerar PIX"
                        )}
                    </Button>
                    {(result?.qr_code_base64 ?? result?.point_of_interaction?.transaction_data?.qr_code_base64) && (
                        <Card className="border-gray-200">
                            <CardContent className="pt-6 flex flex-col items-center gap-2">
                                <p className="text-sm font-medium">Escaneie o QR Code ou copie o código PIX</p>
                                {/* eslint-disable-next-line @next/next/no-img-element -- QR PIX é base64 data URL; next/image não aplicável */}
                                <img
                                    src={`data:image/png;base64,${result.qr_code_base64 ?? result.point_of_interaction?.transaction_data?.qr_code_base64}`}
                                    alt="QR Code PIX"
                                    className="w-48 h-48"
                                />
                                {(result.qr_code ?? result.point_of_interaction?.transaction_data?.qr_code) && (
                                    <p className="text-xs text-gray-500 break-all max-w-full">{result.qr_code ?? result.point_of_interaction?.transaction_data?.qr_code}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

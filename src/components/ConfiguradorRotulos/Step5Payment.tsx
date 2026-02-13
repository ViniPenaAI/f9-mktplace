"use client";

import { useConfiguratorStore } from "@/store/configurator-store";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { CreditCard, QrCode, Loader2, CheckCircle, AlertCircle, MapPin, Phone, User, Truck, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { OrderConfirmBody } from "@/lib/order-types";
import { buildCartItemLabel } from "@/lib/cart-types";
import { calcRotulosPackage } from "@/lib/shipping-rotulos";
import type { CotacaoFreteNormalizada, OpcoesDestiladas } from "@/lib/frete/types";
import { cn } from "@/lib/utils";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";
const DEV_DOWNLOAD_ENABLED =
    process.env.NEXT_PUBLIC_DEV_DOWNLOAD_PEDIDO === "1" ||
    process.env.NEXT_PUBLIC_DEV_DOWNLOAD_PEDIDO === "true";

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

// Gramatura aproximada por material (g/m²). Principal: vinil adesivo ~150 g/m².
function getGramaturaForMaterial(material: string | undefined): number {
    switch (material) {
        case "paper_couche":
            return 155;
        case "vinyl_white":
        case "vinyl_transparent":
        case "bopp":
        default:
            return 150;
    }
}

import { getArteFinalImageBase64 } from "@/lib/arte-final-canvas";
import { useCartStore } from "@/store/cart-store";

export function Step5Payment() {
    const {
        totalPrice,
        shippingCost,
        customer,
        shipping,
        specs,
        artwork,
        selectedProduct,
        selectedShippingOption,
        shippingInsurance,
        checkoutFromCart,
        updateCustomer,
        updateShipping,
        setShippingCost,
        setSelectedShippingOption,
        setShippingInsurance,
    } = useConfiguratorStore();
    const cartItems = useCartStore((s) => s.items);
    const [method, setMethod] = useState<PaymentMethod>("pix");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PaymentResult | null>(null);
    const [mpReady, setMpReady] = useState(false);
    const [cardTabMounted, setCardTabMounted] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingError, setShippingError] = useState<string | null>(null);
    const [freteOpcoes, setFreteOpcoes] = useState<OpcoesDestiladas | null>(null);
    const [freteCotacoes, setFreteCotacoes] = useState<CotacaoFreteNormalizada[]>([]);
    const [showAllOpcoes, setShowAllOpcoes] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedPix, setCopiedPix] = useState(false);
    const cardContainerRef = useRef<HTMLDivElement>(null);
    const successRef = useRef<HTMLDivElement>(null);
    const brickLoaded = useRef(false);
    const confirmedOrderIds = useRef<Set<string>>(new Set());

    const { user: authUser, profile: authProfile, signIn, refresh } = useAuth();
    const [emailCheck, setEmailCheck] = useState<{ exists: boolean } | null>(null);
    const [emailCheckLoading, setEmailCheckLoading] = useState(false);
    const [wantCreateAccount, setWantCreateAccount] = useState(true);
    const [createAccountPassword, setCreateAccountPassword] = useState("");
    const [createAccountConfirmPassword, setCreateAccountConfirmPassword] = useState("");
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginModalError, setLoginModalError] = useState<string | null>(null);
    const loginFormRef = useRef<HTMLFormElement>(null);
    type PaymentModalState = { type: "processing" } | { type: "success"; method: "card" | "pix" } | { type: "error"; message: string } | null;
    const [paymentModal, setPaymentModal] = useState<PaymentModalState>(null);
    const [continueWithoutLogin, setContinueWithoutLogin] = useState(false);
    const [userAddresses, setUserAddresses] = useState<Array<{ id: string; label: string | null; zip_code: string; street: string; number: string; complement: string | null; neighborhood: string | null; city: string; state: string }>>([]);
    const [creatingAccount, setCreatingAccount] = useState(false);
    const [createAccountError, setCreateAccountError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
    const paymentFormRef = useRef<HTMLDivElement>(null);
    const createAccountRef = useRef({ want: false, password: "" });

    // Ao abrir o modal de login, evita que o e-mail apareça todo selecionado (cursor no fim, sem seleção)
    useEffect(() => {
        if (!showLoginModal) return;
        const t = setTimeout(() => {
            const el = loginFormRef.current?.querySelector<HTMLInputElement>('[name="login-email"]');
            if (el) {
                const len = (el.value ?? "").length;
                el.setSelectionRange(len, len);
            }
        }, 0);
        return () => clearTimeout(t);
    }, [showLoginModal]);

    const clearFieldError = (id: string) => {
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

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
        identification: {
                type: (customer.documentType === "cnpj" ? "CNPJ" : "CPF") as "CPF" | "CNPJ",
                number: onlyDigits(customer.document || ""),
            },
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
    }, [customer.name, customer.email, customer.document, customer.documentType, shipping.zipCode, shipping.street, shipping.number, shipping.city, shipping.state, shipping.neighborhood]);

    createAccountRef.current = { want: wantCreateAccount, password: createAccountPassword };

    const emailForCheck = (customer.email ?? "").trim().toLowerCase();
    const isValidEmail = emailForCheck.includes("@") && emailForCheck.length > 5;
    useEffect(() => {
        if (!isValidEmail) {
            setEmailCheck(null);
            return;
        }
        const t = setTimeout(async () => {
            setEmailCheckLoading(true);
            setEmailCheck(null);
            try {
                const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(emailForCheck)}`);
                const data = await res.json();
                setEmailCheck(typeof data.exists === "boolean" ? { exists: data.exists } : null);
            } catch {
                setEmailCheck(null);
            } finally {
                setEmailCheckLoading(false);
            }
        }, 500);
        return () => clearTimeout(t);
    }, [emailForCheck, isValidEmail]);

    useEffect(() => {
        if (!authProfile) return;
        updateCustomer({
            name: authProfile.name || customer.name,
            email: authProfile.email || customer.email,
            phone: authProfile.phone ?? customer.phone,
            document: authProfile.document ?? customer.document,
            documentType: authProfile.document_type ?? customer.documentType,
            razao_social: authProfile.razao_social ?? customer.razao_social,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill once when profile loads
    }, [authProfile?.id]);

    useEffect(() => {
        if (!authUser) {
            setUserAddresses([]);
            return;
        }
        fetch("/api/user/addresses")
            .then((r) => r.json())
            .then((data) => setUserAddresses(Array.isArray(data?.addresses) ? data.addresses : []))
            .catch(() => setUserAddresses([]));
    }, [authUser?.id]);

    // Após sucesso do pagamento: envia dados do pedido (carrinho = todos os itens; configurador = um único pedido)
    useEffect(() => {
        const orderId = result?.order_id;
        if (!orderId || confirmedOrderIds.current.has(orderId)) return;
        confirmedOrderIds.current.add(orderId);

        const commonPayload = {
            order_id: orderId,
            status: result!.status,
            payment_method: method,
            installments: method === "card" ? undefined : undefined,
            payment_response: result ? { ...result } : undefined,
            user_id: authUser?.id ?? undefined,
            customer: {
                name: customer.name ?? "",
                email: customer.email ?? "",
                phone: customer.phone ?? "",
                document: customer.document ?? "",
                documentType: customer.documentType ?? "cpf",
                razao_social: customer.razao_social ?? "",
                phone_business: customer.phone_business ?? "",
                email_business: customer.email_business ?? "",
            },
            shipping: {
                zipCode: shipping.zipCode ?? "",
                street: shipping.street ?? "",
                number: shipping.number ?? "",
                complement: shipping.complement,
                neighborhood: shipping.neighborhood,
                city: shipping.city ?? "",
                state: shipping.state ?? "",
            },
            shippingCost,
            shippingOption: selectedShippingOption ?? null,
        };

        const doConfirm = (confirmBody: OrderConfirmBody) => {
            (async () => {
                const ref = createAccountRef.current;
                if (ref.want && ref.password && customer.email?.trim()) {
                    try {
                        const r = await fetch("/api/auth/register", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                email: customer.email.trim().toLowerCase(),
                                password: ref.password,
                                name: customer.name || "",
                                phone: customer.phone || undefined,
                                document: customer.document || undefined,
                                document_type: customer.documentType || undefined,
                                razao_social: customer.razao_social || undefined,
                                addresses: addressComplete && shipping.zipCode && shipping.street && shipping.number && shipping.city && shipping.state
                                    ? [{
                                        zip_code: onlyDigits(shipping.zipCode).slice(0, 8),
                                        street: shipping.street.trim(),
                                        number: shipping.number.trim(),
                                        complement: shipping.complement || undefined,
                                        neighborhood: shipping.neighborhood || undefined,
                                        city: shipping.city.trim(),
                                        state: shipping.state.trim().toUpperCase().slice(0, 2),
                                    }]
                                    : undefined,
                            }),
                        });
                        const data = await r.json().catch(() => ({}));
                        if (!r.ok) {
                            console.error("[Step5Payment] Registro falhou", data);
                            return;
                        }
                        const err = await signIn(customer.email.trim().toLowerCase(), ref.password);
                        if (err.error) {
                            console.error("[Step5Payment] Login após registro", err.error);
                            return;
                        }
                        const bodyToSend = { ...confirmBody, user_id: data?.user_id ?? confirmBody.user_id };
                        fetch("/api/orders/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyToSend) }).catch((err) => {
                            console.error("[Step5Payment] Erro ao confirmar pedido:", err);
                        });
                        return;
                    } catch (e) {
                        console.error("[Step5Payment] Erro ao criar conta", e);
                        return;
                    }
                }
                fetch("/api/orders/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(confirmBody) }).catch((err) => {
                    console.error("[Step5Payment] Erro ao confirmar pedido (carrinho):", err);
                });
            })();
        };

        if (checkoutFromCart && cartItems.length > 0) {
            const body: OrderConfirmBody = {
                ...commonPayload,
                items: cartItems.map((item) => ({
                    specs: item.specs,
                    artwork: {
                        presentationType: item.artwork.presentationType,
                        selectedDesignUrl: item.artwork.selectedDesignUrl ?? null,
                        enhancedDesignUrl: item.artwork.enhancedDesignUrl ?? null,
                        approvalScale: item.artwork.approvalScale,
                        cutAreaScale: item.artwork.cutAreaScale,
                        artBase64: item.art_base64,
                    },
                    selectedProduct: item.product_type,
                    totalPrice: item.unit_price * (item.quantity || 1),
                })),
            };
            doConfirm(body);
            return;
        }

        // Pedido único pelo configurador: arte final do resumo
        const imageSource: File | string | null = artwork.uploadedFile ?? artwork.selectedDesignUrl ?? null;
        const promise = imageSource
            ? getArteFinalImageBase64({
                imageSource,
                widthMm: specs.width ?? 50,
                heightMm: specs.height ?? 50,
                format: specs.format,
                cutAreaScale: artwork.cutAreaScale ?? 1,
                approvalScale: artwork.approvalScale ?? 1,
                approvalOffsetX: artwork.approvalOffsetX ?? 0,
                approvalOffsetY: artwork.approvalOffsetY ?? 0,
            })
            : Promise.resolve(undefined);
        promise.then((artBase64) => {
            const body: OrderConfirmBody = {
                ...commonPayload,
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
            };
            doConfirm(body);
        }).catch((err) => {
            console.error("[Step5Payment] Erro ao gerar arte final para confirm:", err);
            const body: OrderConfirmBody = {
                ...commonPayload,
                specs: { ...specs },
                artwork: {
                    presentationType: artwork.presentationType,
                    selectedDesignUrl: artwork.selectedDesignUrl ?? null,
                    enhancedDesignUrl: artwork.enhancedDesignUrl ?? null,
                    approvalScale: artwork.approvalScale,
                    cutAreaScale: artwork.cutAreaScale,
                    artBase64: undefined,
                },
                selectedProduct,
                totalPrice,
            };
            doConfirm(body);
        });
    }, [result, method, authUser?.id, customer, shipping, specs, artwork.uploadedFile, artwork.presentationType, artwork.selectedDesignUrl, artwork.enhancedDesignUrl, artwork.approvalScale, artwork.approvalOffsetX, artwork.approvalOffsetY, artwork.cutAreaScale, selectedProduct, totalPrice, shippingCost, selectedShippingOption, checkoutFromCart, cartItems, signIn]);

    const cartTotal = cartItems.reduce((s, i) => s + i.unit_price * (i.quantity || 1), 0);
    const productAmount = checkoutFromCart && cartItems.length > 0
        ? cartTotal
        : (typeof totalPrice === "number" && totalPrice > 0 ? totalPrice : 0);
    const freight = typeof shippingCost === "number" ? shippingCost : 0;
    const isPrecoTeste = process.env.NEXT_PUBLIC_PRECO_TESTE === "1" || process.env.NEXT_PUBLIC_PRECO_TESTE === "true";
    const amount = isPrecoTeste ? 1 : productAmount + freight;
    const cepOk = onlyDigits(shipping.zipCode).length === 8;
    const addressComplete = cepOk && shipping.street && shipping.number && shipping.city && shipping.state;
    const hasFreteOptions = !!(freteOpcoes?.maisBarato ?? freteOpcoes?.maisRapido ?? freteOpcoes?.intermediario);
    const createAccountOk = !wantCreateAccount || (createAccountPassword.length >= 6 && createAccountPassword === createAccountConfirmPassword);
    const docLen = onlyDigits(customer.document || "").length;
    const documentValid =
        (customer.documentType === "cnpj" && docLen === 14) ||
        (customer.documentType !== "cnpj" && docLen === 11);
    const cnpjFieldsOk =
        customer.documentType !== "cnpj" ||
        !!(customer.razao_social?.trim() && customer.phone_business?.trim() && customer.email_business?.trim());
    const customerAndAddressOk =
        !!(customer.name?.trim() && customer.email?.trim() && customer.phone?.trim()) &&
        documentValid &&
        cnpjFieldsOk &&
        addressComplete &&
        createAccountOk;
    const canCreateAccountNow =
        wantCreateAccount &&
        !authUser &&
        customerAndAddressOk &&
        emailCheck?.exists === false;
    const formValid =
        !!(customer.name?.trim() && customer.email?.trim() && customer.phone?.trim()) &&
        documentValid &&
        cnpjFieldsOk &&
        addressComplete &&
        (!hasFreteOptions || !!selectedShippingOption) &&
        createAccountOk;

    /** Lista ids dos campos inválidos na ordem do formulário (para borda vermelha e scroll ao primeiro). */
    const getInvalidFieldIds = (forPayment: boolean): string[] => {
        const ids: string[] = [];
        if (!customer.name?.trim()) ids.push("first-name");
        if (!customer.email?.trim() || !(customer.email ?? "").includes("@")) ids.push("email");
        if (!documentValid) ids.push("document");
        if (customer.documentType === "cnpj") {
            if (!customer.razao_social?.trim()) ids.push("razao_social");
            if (!customer.phone_business?.trim()) ids.push("phone_business");
            if (!customer.email_business?.trim()) ids.push("email_business");
        }
        if (!customer.phone?.trim()) ids.push("phone");
        if (wantCreateAccount) {
            if (createAccountPassword.length < 6) ids.push("create-password");
            else if (createAccountPassword !== createAccountConfirmPassword) ids.push("create-password-confirm");
        }
        if (!cepOk) ids.push("cep");
        if (!shipping.street?.trim()) ids.push("street");
        if (!shipping.number?.trim()) ids.push("number");
        if (!shipping.city?.trim()) ids.push("city");
        if (!shipping.state?.trim()) ids.push("state");
        if (forPayment && hasFreteOptions && !selectedShippingOption) ids.push("shipping-option");
        return ids;
    };

    const validateAndScrollToError = (forPayment: boolean): boolean => {
        const invalidIds = getInvalidFieldIds(forPayment);
        if (invalidIds.length === 0) {
            setFieldErrors({});
            return true;
        }
        const errors: Record<string, boolean> = {};
        invalidIds.forEach((id) => { errors[id] = true; });
        setFieldErrors(errors);
        const firstId = invalidIds[0];
        const el = document.getElementById(firstId) ?? document.querySelector(`[data-field="${firstId}"]`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            (el as HTMLElement).focus({ preventScroll: true });
        } else {
            paymentFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return false;
    };

    const insuranceLabel =
        shippingInsurance === "with"
            ? "Com seguro de transporte (recomendado)"
            : "Sem seguro – aceito o risco de avaria no transporte";

    // Frete via Melhor Envio (cotar → 3 opções: mais barato, mais rápido, equilíbrio)
    useEffect(() => {
        if (!cepOk) {
            setShippingCost(0);
            setSelectedShippingOption(null);
            setShippingError(null);
            setFreteOpcoes(null);
            setFreteCotacoes([]);
            return;
        }
        const cep = onlyDigits(shipping.zipCode).slice(0, 8);
        if (cep.length !== 8) {
            setShippingCost(0);
            setSelectedShippingOption(null);
            setShippingError(null);
            setFreteOpcoes(null);
            setFreteCotacoes([]);
            return;
        }
        let cancelled = false;
        setShippingLoading(true);
        setShippingError(null);
        setFreteOpcoes(null);
        setFreteCotacoes([]);
        setSelectedShippingOption(null);

        const isRotulo = selectedProduct === "rotulo";
        let itens: Array<{ pesoKg: number; larguraCm: number; alturaCm: number; comprimentoCm: number; valorDeclarado: number }>;
        if (isRotulo && specs?.quantity != null && artwork?.presentationType && specs?.width != null && specs?.height != null) {
            const dim = calcRotulosPackage({
                quantity: specs.quantity,
                format: artwork.presentationType,
                widthMm: specs.width,
                heightMm: specs.height,
                gramatura: getGramaturaForMaterial(specs.material),
            });
            itens = [
                {
                    pesoKg: dim.pesoKg,
                    larguraCm: dim.larguraCm,
                    alturaCm: dim.alturaCm,
                    comprimentoCm: dim.comprimentoCm,
                    valorDeclarado: typeof totalPrice === "number" && totalPrice > 0 ? totalPrice : 0,
                },
            ];
        } else {
            itens = [
                {
                    pesoKg: 0.3,
                    larguraCm: 16,
                    alturaCm: 16,
                    comprimentoCm: 16,
                    valorDeclarado: typeof totalPrice === "number" && totalPrice > 0 ? totalPrice : 0,
                },
            ];
        }

        fetch("/api/frete/cotar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cepDestino: cep,
                itens,
                insurance: shippingInsurance === "with",
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                if (data.error) {
                    setShippingCost(0);
                    setShippingError(data.error || "Não foi possível calcular o frete.");
                    return;
                }
                setFreteCotacoes(Array.isArray(data.cotacoes) ? data.cotacoes : []);
                setFreteOpcoes(data.opcoes ?? { maisBarato: null, maisRapido: null, intermediario: null });
                setShippingError(data.detalhe ? String(data.detalhe) : null);
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
    }, [
        cepOk,
        shipping.zipCode,
        setShippingCost,
        setSelectedShippingOption,
        selectedProduct,
        specs?.quantity,
        specs?.width,
        specs?.height,
        artwork?.presentationType,
        totalPrice,
        shippingInsurance,
    ]);

    const selectFreteOption = (op: CotacaoFreteNormalizada) => {
        clearFieldError("shipping-option");
        setShippingCost(op.preco / 100);
        setSelectedShippingOption({
            provider: op.provider,
            providerServicoId: op.providerServicoId,
            transportadora: op.transportadora,
            nomeServico: op.nomeServico,
            preco: op.preco,
            prazoMinDias: op.prazoMinDias,
            prazoMaxDias: op.prazoMaxDias,
        });
    };

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
                            setPaymentModal({ type: "processing" });
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
                                        setPaymentModal({ type: "error", message: data.error });
                                        throw new Error(data.error);
                                    }
                                    setResult({
                                        order_id: data.order_id,
                                        status: data.status,
                                        qr_code_base64: data.qr_code_base64,
                                        qr_code: data.qr_code,
                                        point_of_interaction: data.point_of_interaction,
                                    });
                                    if (data.status === "approved" || data.status === "processed") {
                                        setPaymentModal({ type: "success", method: "card" });
                                    } else {
                                        setPaymentModal(null);
                                    }
                                })
                                .catch((err) => {
                                    setLoading(false);
                                    const msg = err?.message || "Erro ao processar pagamento.";
                                    setError(msg);
                                    setPaymentModal({ type: "error", message: msg });
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
        if (!validateAndScrollToError(true)) return;
        if (amount <= 0) {
            setError("Valor do pedido inválido.");
            return;
        }
        setLoading(true);
        setPaymentModal({ type: "processing" });
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
            if (data.status === "approved" || data.status === "processed") {
                setPaymentModal({ type: "success", method: "pix" });
            } else {
                setPaymentModal(null);
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Erro ao gerar PIX.";
            setError(msg);
            setPaymentModal({ type: "error", message: msg });
        } finally {
            setLoading(false);
        }
    };

    const success = result && (result.status === "approved" || result.status === "processed" || result.status === "pending" || result.status === "in_process");

    useEffect(() => {
        if (success && result?.order_id && successRef.current) {
            successRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [success, result?.order_id]);

    return (
        <div ref={paymentFormRef} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
                <h3 className="text-xl font-bold text-f9-navy">Pagamento</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Preencha seus dados, o endereço de entrega e escolha a forma de pagamento.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span className="font-bold">Pagamento seguro via:</span>
                    <img
                        src="/logo mercado pago.svg"
                        alt="Mercado Pago"
                        className="h-[4.5rem] w-auto object-contain"
                    />
                </div>
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
                                    clearFieldError("first-name");
                                    const rest = customer.name?.indexOf(" ") >= 0 ? customer.name.slice(customer.name.indexOf(" ") + 1) : "";
                                    updateCustomer({ name: (e.target.value + (rest ? " " + rest : "")).trimStart() });
                                }}
                                placeholder="Nome"
                                className={fieldErrors["first-name"] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="last-name">Sobrenome <span className="text-red-500">*</span></Label>
                            <Input
                                id="last-name"
                                value={customer.name?.indexOf(" ") >= 0 ? customer.name.slice(customer.name.indexOf(" ") + 1) : ""}
                                onChange={(e) => {
                                    clearFieldError("first-name");
                                    const first = (customer.name || "").trim().split(/\s+/)[0] || "";
                                    const last = e.target.value;
                                    updateCustomer({ name: first ? `${first} ${last}` : last });
                                }}
                                placeholder="Sobrenome (pode usar espaço)"
                                className={fieldErrors["first-name"] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                required
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                            <Input
                                id="email"
                                type="email"
                                value={customer.email ?? ""}
                                onChange={(e) => {
                                    clearFieldError("email");
                                    updateCustomer({ email: e.target.value });
                                    setContinueWithoutLogin(false);
                                    setEmailCheck(null);
                                }}
                                onBlur={() => isValidEmail && undefined}
                                placeholder="email@exemplo.com"
                                className={fieldErrors["email"] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                required
                            />
                            {emailCheckLoading && <span className="text-xs text-gray-500">Verificando e-mail...</span>}
                            {emailCheck && !authUser && (
                                <>
                                    {emailCheck.exists === false && (
                                        <div className="mt-2 space-y-2 rounded-md border border-gray-200 bg-gray-50/80 p-3 text-sm">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={wantCreateAccount}
                                                    onChange={(e) => setWantCreateAccount(e.target.checked)}
                                                    className="rounded border-gray-300"
                                                />
                                                <span>Aproveite para criar sua conta agora (defina sua senha)</span>
                                            </label>
                                            {wantCreateAccount && (
                                                <>
                                                    <div>
                                                        <Label htmlFor="create-password" className="text-xs">Senha (mín. 6 caracteres) <span className="text-red-500">*</span></Label>
                                                        <Input
                                                            id="create-password"
                                                            type="password"
                                                            value={createAccountPassword}
                                                            onChange={(e) => { clearFieldError("create-password"); clearFieldError("create-password-confirm"); setCreateAccountPassword(e.target.value); }}
                                                            placeholder="••••••••"
                                                            className={cn("mt-1", fieldErrors["create-password"] && "border-red-500 focus-visible:ring-red-500")}
                                                            minLength={6}
                                                            required={wantCreateAccount}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="create-password-confirm" className="text-xs">Confirmar senha <span className="text-red-500">*</span></Label>
                                                        <Input
                                                            id="create-password-confirm"
                                                            type="password"
                                                            value={createAccountConfirmPassword}
                                                            onChange={(e) => { clearFieldError("create-password-confirm"); setCreateAccountConfirmPassword(e.target.value); }}
                                                            placeholder="••••••••"
                                                            className={cn("mt-1", fieldErrors["create-password-confirm"] && "border-red-500 focus-visible:ring-red-500")}
                                                            required={wantCreateAccount}
                                                        />
                                                    </div>
                                                    <p className="text-gray-600 text-xs">Criando sua conta você consegue ver seus pedidos e pegar o ID de rastreamento.</p>
                                                    <p className="text-gray-500 text-xs">Para continuar sem cadastro desmarque essa caixa.</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {emailCheck.exists === true && !continueWithoutLogin && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50/80 p-3 text-sm">
                                            <span className="text-amber-800">Este e-mail já está cadastrado.</span>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setShowLoginModal(true)}>
                                                Fazer login
                                            </Button>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setContinueWithoutLogin(true)}>
                                                Continuar sem login
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="sm:col-span-2">
                            <Label>CPF / CNPJ <span className="text-red-500">*</span></Label>
                            <div className="flex gap-2 mt-1">
                                <button
                                    type="button"
                                    onClick={() => updateCustomer({ documentType: "cpf", document: onlyDigits(customer.document || "").slice(0, 11) })}
                                    className={cn(
                                        "px-3 py-2 rounded-md text-sm font-medium border transition-colors",
                                        customer.documentType === "cpf"
                                            ? "bg-slate-800 text-white border-slate-800"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                                    )}
                                >
                                    CPF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateCustomer({ documentType: "cnpj", document: onlyDigits(customer.document || "").slice(0, 14) })}
                                    className={cn(
                                        "px-3 py-2 rounded-md text-sm font-medium border transition-colors",
                                        customer.documentType === "cnpj"
                                            ? "bg-slate-800 text-white border-slate-800"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                                    )}
                                >
                                    CNPJ
                                </button>
                            </div>
                            <Input
                                id="document"
                                value={customer.document ?? ""}
                                onChange={(e) => {
                                    clearFieldError("document");
                                    updateCustomer({
                                        document: onlyDigits(e.target.value).slice(0, customer.documentType === "cnpj" ? 14 : 11),
                                    });
                                }}
                                placeholder={customer.documentType === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
                                maxLength={customer.documentType === "cnpj" ? 18 : 14}
                                className={cn("mt-2", fieldErrors["document"] && "border-red-500 focus-visible:ring-red-500")}
                                required
                            />
                        </div>
                        {customer.documentType === "cnpj" && (
                            <>
                                <div className="sm:col-span-2">
                                    <Label htmlFor="razao_social">Razão Social <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="razao_social"
                                        value={customer.razao_social ?? ""}
                                        onChange={(e) => { clearFieldError("razao_social"); updateCustomer({ razao_social: e.target.value }); }}
                                        placeholder="Razão social da empresa"
                                        className={fieldErrors["razao_social"] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Label htmlFor="phone_business">Telefone empresarial <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="phone_business"
                                        type="tel"
                                        value={customer.phone_business ?? ""}
                                        onChange={(e) => { clearFieldError("phone_business"); updateCustomer({ phone_business: e.target.value }); }}
                                        placeholder="(11) 3333-0000"
                                        className={fieldErrors["phone_business"] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Label htmlFor="email_business">E-mail empresarial (fiscal/financeiro) <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="email_business"
                                        type="email"
                                        value={customer.email_business ?? ""}
                                        onChange={(e) => { clearFieldError("email_business"); updateCustomer({ email_business: e.target.value }); }}
                                        placeholder="fiscal@empresa.com.br"
                                        className={fieldErrors["email_business"] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                </div>
                            </>
                        )}
                        <div className="sm:col-span-2 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <Label htmlFor="phone" className="text-sm font-medium">Telefone / WhatsApp <span className="text-red-500">*</span></Label>
                        </div>
                        <div className="sm:col-span-2">
                            <Input
                                id="phone"
                                type="tel"
                                value={customer.phone}
                                onChange={(e) => { clearFieldError("phone"); updateCustomer({ phone: e.target.value }); }}
                                placeholder="(11) 99999-9999"
                                className={fieldErrors["phone"] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                required
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showLoginModal} onOpenChange={(open) => { setShowLoginModal(open); if (!open) setLoginModalError(null); }}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Entrar na sua conta</DialogTitle>
                    </DialogHeader>
                    <form
                        className="space-y-3"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setLoginModalError(null);
                            const form = e.currentTarget;
                            const email = (form.querySelector('[name="login-email"]') as HTMLInputElement)?.value?.trim().toLowerCase();
                            const password = (form.querySelector('[name="login-password"]') as HTMLInputElement)?.value;
                            if (!email || !password) {
                                setLoginModalError("Preencha e-mail e senha.");
                                return;
                            }
                            const { error } = await signIn(email, password);
                            if (error) {
                                setLoginModalError(error);
                                return;
                            }
                            await refresh();
                            setShowLoginModal(false);
                            updateCustomer({ email });
                        }}
                    >
                        <div>
                            <Label htmlFor="login-email">E-mail</Label>
                            <Input
                                id="login-email"
                                name="login-email"
                                type="email"
                                defaultValue={customer.email ?? ""}
                                placeholder="email@exemplo.com"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="login-password">Senha</Label>
                                <Link
                                    href="/esqueci-senha"
                                    onClick={() => setShowLoginModal(false)}
                                    className="text-xs text-gray-500 hover:text-f9-magenta transition-colors"
                                >
                                    Esqueci a senha
                                </Link>
                            </div>
                            <Input
                                id="login-password"
                                name="login-password"
                                type="password"
                                placeholder="••••••••"
                                className="mt-1"
                            />
                        </div>
                        {loginModalError && <p className="text-sm text-red-600">{loginModalError}</p>}
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowLoginModal(false)}>Cancelar</Button>
                            <Button type="submit">Entrar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={paymentModal !== null} onOpenChange={(open) => { if (!open) setPaymentModal(null); }}>
                <DialogContent className="sm:max-w-[380px]" onPointerDownOutside={(e) => { if (paymentModal?.type === "processing") e.preventDefault(); }}>
                    <DialogHeader>
                        <DialogTitle>
                            {paymentModal?.type === "processing" && "Aguarde"}
                            {paymentModal?.type === "success" && "Sucesso"}
                            {paymentModal?.type === "error" && "Erro no pagamento"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        {paymentModal?.type === "processing" && (
                            <div className="flex items-center gap-3 text-gray-700">
                                <Loader2 className="w-8 h-8 animate-spin shrink-0 text-f9-blue" />
                                <span>Processando...</span>
                            </div>
                        )}
                        {paymentModal?.type === "success" && (
                            <p className="text-gray-700">
                                {paymentModal.method === "card" ? "Pagamento concluído com sucesso." : "Pagamento realizado com sucesso."}
                            </p>
                        )}
                        {paymentModal?.type === "error" && (
                            <p className="text-red-700">{paymentModal.message}</p>
                        )}
                    </div>
                    {(paymentModal?.type === "success" || paymentModal?.type === "error") && (
                        <DialogFooter>
                            <Button onClick={() => setPaymentModal(null)}>OK</Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dados de entrega — CEP primeiro; demais campos liberados após preencher CEP */}
            <Card className="border-gray-200">
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-semibold text-f9-navy flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Dados de entrega
                    </h4>
                    {authUser && userAddresses.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Seus endereços salvos:</p>
                            <div className="flex flex-wrap gap-2">
                                {userAddresses.map((addr) => (
                                    <Button
                                        key={addr.id}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            updateShipping({
                                                zipCode: addr.zip_code?.replace(/\D/g, "").slice(0, 8) ?? "",
                                                street: addr.street ?? "",
                                                number: addr.number ?? "",
                                                complement: addr.complement ?? undefined,
                                                neighborhood: addr.neighborhood ?? undefined,
                                                city: addr.city ?? "",
                                                state: addr.state ?? "",
                                            });
                                            fetchCep(addr.zip_code ?? "");
                                        }}
                                    >
                                        {addr.label || `${addr.street}, ${addr.number}`}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                    <p className="text-sm text-gray-600">
                        Preencha o CEP primeiro para liberar os demais campos e calcular o frete.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="cep">CEP <span className="text-red-500">*</span></Label>
                            <Input
                                id="cep"
                                value={shipping.zipCode}
                                onChange={(e) => { clearFieldError("cep"); updateShipping({ zipCode: onlyDigits(e.target.value).slice(0, 8) }); }}
                                onBlur={(e) => fetchCep(e.target.value)}
                                placeholder="00000-000"
                                disabled={cepLoading}
                                className={fieldErrors["cep"] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                required
                            />
                            {cepLoading && <span className="text-xs text-gray-500">Buscando...</span>}
                        </div>
                        <div>
                            <Label htmlFor="street">Rua <span className="text-red-500">*</span></Label>
                            <Input
                                id="street"
                                value={shipping.street}
                                onChange={(e) => { clearFieldError("street"); updateShipping({ street: e.target.value }); }}
                                placeholder="Rua, avenida"
                                disabled={!cepOk}
                                className={fieldErrors["street"] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="number">Número <span className="text-red-500">*</span></Label>
                            <Input
                                id="number"
                                value={shipping.number}
                                onChange={(e) => { clearFieldError("number"); updateShipping({ number: e.target.value }); }}
                                placeholder="Nº"
                                disabled={!cepOk}
                                className={fieldErrors["number"] ? "border-red-500 focus-visible:ring-red-500" : ""}
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
                                onChange={(e) => { clearFieldError("state"); updateShipping({ state: e.target.value.toUpperCase().slice(0, 2) }); }}
                                placeholder="SP"
                                disabled={!cepOk}
                                className={fieldErrors["state"] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                required
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Botão Criar conta — após preencher dados pessoais e endereço */}
            {wantCreateAccount && !authUser && emailCheck?.exists === false && (
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
                    <p className="text-sm text-gray-600 mb-3">
                        Com todos os dados preenchidos, você pode criar sua conta agora e já seguir para o pagamento logado.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="border-f9-magenta text-f9-magenta hover:bg-f9-magenta/10"
                        disabled={creatingAccount}
                        onClick={async () => {
                            setCreateAccountError(null);
                            if (!validateAndScrollToError(false)) return;
                            setCreatingAccount(true);
                            try {
                                const r = await fetch("/api/auth/register", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        email: customer.email!.trim().toLowerCase(),
                                        password: createAccountPassword,
                                        name: customer.name || "",
                                        phone: customer.phone || undefined,
                                        document: customer.document || undefined,
                                        document_type: customer.documentType || undefined,
                                        razao_social: customer.razao_social || undefined,
                                        addresses: addressComplete && shipping.zipCode && shipping.street && shipping.number && shipping.city && shipping.state
                                            ? [{
                                                zip_code: onlyDigits(shipping.zipCode).slice(0, 8),
                                                street: shipping.street.trim(),
                                                number: shipping.number.trim(),
                                                complement: shipping.complement || undefined,
                                                neighborhood: shipping.neighborhood || undefined,
                                                city: shipping.city.trim(),
                                                state: shipping.state.trim().toUpperCase().slice(0, 2),
                                            }]
                                            : undefined,
                                    }),
                                });
                                const d = await r.json().catch(() => ({}));
                                if (!r.ok) {
                                    setCreateAccountError(d.error || "Erro ao criar conta.");
                                    return;
                                }
                                const { error: signInErr } = await signIn(customer.email!.trim().toLowerCase(), createAccountPassword);
                                if (signInErr) {
                                    setCreateAccountError("Conta criada, mas falha ao entrar. Tente fazer log-in.");
                                    return;
                                }
                                await refresh();
                            } catch (e) {
                                setCreateAccountError(e instanceof Error ? e.message : "Erro ao criar conta.");
                            } finally {
                                setCreatingAccount(false);
                            }
                        }}
                    >
                        {creatingAccount ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando conta…
                            </>
                        ) : (
                            "Criar conta agora"
                        )}
                    </Button>
                    {createAccountError && <p className="mt-2 text-sm text-red-600">{createAccountError}</p>}
                </div>
            )}

            {/* Opções de frete: 3 cards (Mais barato, Mais rápido, Equilíbrio) + ver todas */}
            {cepOk && (freteOpcoes || shippingLoading) && (
                <Card id="shipping-option" className={cn("border-gray-200", fieldErrors["shipping-option"] && "border-red-500 ring-1 ring-red-500")}>
                    <CardContent className="pt-6 space-y-4">
                        <h4 className="font-semibold text-f9-navy flex items-center gap-2">
                            <Truck className="w-4 h-4" /> Escolha o frete
                        </h4>
                        {shippingLoading ? (
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Calculando opções...
                            </p>
                        ) : freteOpcoes && (freteOpcoes.maisBarato || freteOpcoes.maisRapido || freteOpcoes.intermediario) ? (
                            <>
                                <div className="space-y-2 text-sm">
                                    <p className="font-medium text-gray-700">Seguro de transporte</p>
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                        <label className="inline-flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                                            <input
                                                type="radio"
                                                name="shipping-insurance"
                                                className="h-4 w-4"
                                                checked={shippingInsurance === "with"}
                                                onChange={() => setShippingInsurance("with")}
                                            />
                                            <span>
                                                <span className="font-medium">Com seguro (recomendado)</span>{" "}
                                                <span className="text-gray-600">
                                                    – cobre o valor total do pedido em caso de perda ou extravio.
                                                </span>
                                            </span>
                                        </label>
                                        <label className="inline-flex items-start gap-2 text-xs sm:text-sm cursor-pointer text-gray-700">
                                            <input
                                                type="radio"
                                                name="shipping-insurance"
                                                className="h-4 w-4 mt-0.5"
                                                checked={shippingInsurance === "without"}
                                                onChange={() => setShippingInsurance("without")}
                                            />
                                            <span>
                                                <span className="font-medium text-amber-700">Sem seguro</span>{" "}
                                                <span className="text-amber-700">
                                                    – em caso de avarias ou perdas no transporte, o cliente assume o risco.
                                                    Nossos produtos são bem embalados, mas não nos responsabilizamos por danos causados pela transportadora.
                                                </span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {freteOpcoes.maisBarato && (
                                        <button
                                            type="button"
                                            onClick={() => selectFreteOption(freteOpcoes!.maisBarato!)}
                                            className={`text-left p-4 rounded-lg border-2 transition-all ${
                                                selectedShippingOption?.providerServicoId === freteOpcoes.maisBarato?.providerServicoId
                                                    ? "border-blue-600 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <span className="block text-xs font-medium text-gray-500 uppercase">Mais barato</span>
                                            <span className="block font-semibold text-gray-800">{freteOpcoes.maisBarato.nomeServico}</span>
                                            <span className="block text-sm text-gray-600">{freteOpcoes.maisBarato.transportadora}</span>
                                            <span className="block mt-1 font-bold text-blue-600">R$ {formatCurrency(freteOpcoes.maisBarato.preco / 100)}</span>
                                            <span className="block text-xs text-gray-500">{freteOpcoes.maisBarato.prazoMaxDias} dias úteis após a postagem</span>
                                        </button>
                                    )}
                                    {freteOpcoes.maisRapido && (
                                        <button
                                            type="button"
                                            onClick={() => selectFreteOption(freteOpcoes!.maisRapido!)}
                                            className={`text-left p-4 rounded-lg border-2 transition-all ${
                                                selectedShippingOption?.providerServicoId === freteOpcoes.maisRapido?.providerServicoId
                                                    ? "border-blue-600 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <span className="block text-xs font-medium text-gray-500 uppercase">Mais rápido</span>
                                            <span className="block font-semibold text-gray-800">{freteOpcoes.maisRapido.nomeServico}</span>
                                            <span className="block text-sm text-gray-600">{freteOpcoes.maisRapido.transportadora}</span>
                                            <span className="block mt-1 font-bold text-blue-600">R$ {formatCurrency(freteOpcoes.maisRapido.preco / 100)}</span>
                                            <span className="block text-xs text-gray-500">{freteOpcoes.maisRapido.prazoMaxDias} dias úteis</span>
                                        </button>
                                    )}
                                    {freteOpcoes.intermediario && (
                                        <button
                                            type="button"
                                            onClick={() => selectFreteOption(freteOpcoes!.intermediario!)}
                                            className={`text-left p-4 rounded-lg border-2 transition-all ${
                                                selectedShippingOption?.providerServicoId === freteOpcoes.intermediario?.providerServicoId
                                                    ? "border-blue-600 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <span className="block text-xs font-medium text-gray-500 uppercase">Equilíbrio</span>
                                            <span className="block font-semibold text-gray-800">{freteOpcoes.intermediario.nomeServico}</span>
                                            <span className="block text-sm text-gray-600">{freteOpcoes.intermediario.transportadora}</span>
                                            <span className="block mt-1 font-bold text-blue-600">R$ {formatCurrency(freteOpcoes.intermediario.preco / 100)}</span>
                                            <span className="block text-xs text-gray-500">{freteOpcoes.intermediario.prazoMaxDias} dias úteis após a postagem</span>
                                        </button>
                                    )}
                                </div>
                                {freteCotacoes.length > 3 && (
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAllOpcoes((v: boolean) => !v)}>
                                        {showAllOpcoes ? "Ocultar" : "Ver todas as opções"}
                                    </Button>
                                )}
                                {showAllOpcoes && freteCotacoes.length > 0 && (
                                    <div className="border-t pt-4 space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Todas as cotações</p>
                                        <ul className="space-y-1">
                                            {freteCotacoes.map((c: CotacaoFreteNormalizada) => (
                                                <li key={c.providerServicoId}>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectFreteOption(c)}
                                                        className={`w-full text-left flex justify-between items-center py-2 px-3 rounded border ${
                                                            selectedShippingOption?.providerServicoId === c.providerServicoId ? "border-blue-600 bg-blue-50" : "border-gray-200"
                                                        }`}
                                                    >
                                                        <span className="text-sm">{c.nomeServico} — {c.transportadora}</span>
                                                        <span className="font-medium">R$ {formatCurrency(c.preco / 100)} — {c.prazoMaxDias} dias úteis após a postagem</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        ) : freteOpcoes && !freteOpcoes.maisBarato && !freteOpcoes.maisRapido && !freteOpcoes.intermediario ? (
                            <p className="text-sm text-amber-600">Nenhuma opção de frete disponível para este CEP.</p>
                        ) : null}
                    </CardContent>
                </Card>
            )}

            {/* Itens do pedido: carrinho (vários) ou configurador (um único item) */}
            <Card className="border-gray-200">
                <CardContent className="pt-4">
                    <h4 className="font-semibold text-f9-navy mb-3">Itens do pedido</h4>
                    <ul className="space-y-2 text-sm">
                        {checkoutFromCart && cartItems.length > 0 ? (
                            cartItems.map((item) => (
                                <li key={item.id} className="flex justify-between gap-2">
                                    <span>
                                        {typeof item.specs?.quantity === "number" ? item.specs.quantity : item.quantity} un. – {item.product_label}
                                    </span>
                                    <span className="font-medium">R$ {formatCurrency(item.unit_price)}</span>
                                </li>
                            ))
                        ) : selectedProduct && typeof totalPrice === "number" ? (
                            <li className="flex justify-between gap-2">
                                <span>{specs?.quantity ?? 0} un. – {buildCartItemLabel(selectedProduct, specs)}</span>
                                <span className="font-medium">R$ {formatCurrency(totalPrice)}</span>
                            </li>
                        ) : null}
                    </ul>
                </CardContent>
            </Card>

            <Card className="border-blue-600/20 bg-blue-50/30">
                <CardContent className="pt-4 space-y-2">
                    {isPrecoTeste && (
                        <p className="text-xs text-amber-600 font-medium">Modo teste: valor fixo R$ 1,00 para demonstração.</p>
                    )}
                    <div className="flex justify-between items-center text-gray-700">
                        <span>Valor do produto{checkoutFromCart && cartItems.length > 0 ? " (carrinho)" : ""}</span>
                        <span>R$ {formatCurrency(isPrecoTeste ? 1 : productAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-700">
                        <span>Frete</span>
                        <span>
                            {shippingLoading ? "Calculando..." : selectedShippingOption ? `${selectedShippingOption.nomeServico} — R$ ${formatCurrency(isPrecoTeste ? 0 : freight)}` : `R$ ${formatCurrency(isPrecoTeste ? 0 : freight)}`}
                        </span>
                    </div>
                    {shippingError && (
                        <p className="text-xs text-amber-600">{shippingError}</p>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                        <span className="text-base font-semibold text-gray-800">Total</span>
                        <span className="text-2xl font-bold text-blue-600">R$ {formatCurrency(amount)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        Produção em até 48h úteis. O prazo de entrega começa após a postagem.
                    </p>
                </CardContent>
            </Card>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {success && result && (
                <div ref={successRef} className="scroll-mt-4">
                    <Card className="border-green-200 bg-green-50/80 shadow-md overflow-hidden">
                        <CardContent className="pt-6 pb-6">
                            <div className="flex items-start gap-4">
                                <div className="rounded-full bg-green-500 p-3 text-white shrink-0 shadow-sm">
                                    <CheckCircle className="h-7 w-7" />
                                </div>
                                <div className="space-y-3 min-w-0 flex-1">
                                    <p className="font-semibold text-green-800 text-lg">
                                        {(result.status === "approved" || result.status === "processed") && "Pagamento aprovado!"}
                                        {(result.status === "pending" || result.status === "in_process") && "PIX gerado"}
                                    </p>
                                    {(result.status === "pending" || result.status === "in_process") && (
                                        <p className="text-sm text-green-700">Conclua o pagamento no app do seu banco para confirmar o pedido.</p>
                                    )}
                                    {result.order_id && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm text-green-800 font-medium">Número do pedido:</span>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 border border-green-200 px-3 py-1.5 shadow-sm">
                                                <code className="text-sm font-semibold text-green-900 tracking-wide select-all">{result.order_id}</code>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(result!.order_id ?? "").then(() => {
                                                            setCopiedId(true);
                                                            setTimeout(() => setCopiedId(false), 2000);
                                                        });
                                                    }}
                                                    className="p-1 rounded hover:bg-green-100 text-green-700 transition-colors"
                                                    title="Copiar"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                            </div>
                                            {copiedId && <span className="text-xs text-green-600 font-medium">Copiado!</span>}
                                        </div>
                                    )}
                                    <p className="text-xs text-green-600">
                                        Seu pedido foi registrado. Guarde o número do pedido para acompanhamento.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span className="font-bold">Pagamento seguro via:</span>
                    <img
                        src="/logo mercado pago.svg"
                        alt="Mercado Pago"
                        className="h-[4.5rem] w-auto object-contain"
                    />
                </div>

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
                    <Button onClick={handlePix} disabled={loading || amount <= 0} className="w-full sm:w-auto">
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando PIX...
                            </>
                        ) : (
                            "Gerar PIX"
                        )}
                    </Button>
                    {(result?.qr_code_base64 ?? result?.point_of_interaction?.transaction_data?.qr_code_base64) && (
                        <Card className="border-gray-200 shadow-sm">
                            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-4">
                                <p className="text-sm font-medium text-gray-800">Escaneie o QR Code ou copie o código PIX</p>
                                {/* eslint-disable-next-line @next/next/no-img-element -- QR PIX é base64 data URL; next/image não aplicável */}
                                <img
                                    src={`data:image/png;base64,${result.qr_code_base64 ?? result.point_of_interaction?.transaction_data?.qr_code_base64}`}
                                    alt="QR Code PIX"
                                    className="w-48 h-48 rounded-lg border border-gray-200 bg-white"
                                />
                                {(result.qr_code ?? result.point_of_interaction?.transaction_data?.qr_code) && (
                                    <div className="w-full max-w-md space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500">Código PIX (copiar e colar)</label>
                                        <div className="flex gap-2">
                                            <Input
                                                readOnly
                                                value={result.qr_code ?? result.point_of_interaction?.transaction_data?.qr_code ?? ""}
                                                className="font-mono text-xs bg-gray-50 border-gray-200"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    const code = result.qr_code ?? result.point_of_interaction?.transaction_data?.qr_code ?? "";
                                                    navigator.clipboard.writeText(code).then(() => {
                                                        setCopiedPix(true);
                                                        setTimeout(() => setCopiedPix(false), 2000);
                                                    });
                                                }}
                                                title="Copiar código PIX"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {copiedPix && <p className="text-xs text-green-600 font-medium">Código copiado!</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {DEV_DOWNLOAD_ENABLED && (
                <Card className="border-dashed border-amber-300 mt-6">
                    <CardContent className="pt-4 space-y-2">
                        <p className="text-xs text-amber-700 font-medium">
                            Ferramenta interna (dev): baixar prévia da arte em PDF (mesma imagem da &quot;Arte final&quot; do resumo).
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                                try {
                                    // Mesma origem da "Arte final" do resumo: upload = arquivo; IA = selectedDesignUrl
                                    const imageSource: File | string | null = artwork.uploadedFile ?? artwork.selectedDesignUrl ?? null;
                                    if (!imageSource) {
                                        alert("Nenhuma arte selecionada nesta sessão.");
                                        return;
                                    }
                                    const base64 = await getArteFinalImageBase64({
                                        imageSource,
                                        widthMm: specs.width ?? 50,
                                        heightMm: specs.height ?? 50,
                                        format: specs.format,
                                        cutAreaScale: artwork.cutAreaScale ?? 1,
                                        approvalScale: artwork.approvalScale ?? 1,
                                        approvalOffsetX: artwork.approvalOffsetX ?? 0,
                                        approvalOffsetY: artwork.approvalOffsetY ?? 0,
                                    });
                                    const widthCm = Math.max((specs.width ?? 50) / 10, 1);
                                    const heightCm = Math.max((specs.height ?? 50) / 10, 1);
                                    const { jsPDF } = await import("jspdf");
                                    const isLandscape = (specs.width ?? 50) >= (specs.height ?? 50);
                                    const doc = new jsPDF({
                                        unit: "cm",
                                        orientation: isLandscape ? "landscape" : "portrait",
                                        format: isLandscape ? [widthCm, heightCm] : [heightCm, widthCm],
                                    });
                                    try {
                                        doc.addImage(`data:image/png;base64,${base64}`, "PNG", 0, 0, widthCm, heightCm);
                                    } catch {
                                        // fallback: PDF vazio do tamanho da peça
                                    }
                                    const fmtLabel =
                                        specs.format === "square"
                                            ? "Quadrado"
                                            : specs.format === "rectangular"
                                              ? "Retangular"
                                              : specs.format === "circle"
                                                ? "Redondo"
                                                : specs.format === "oval"
                                                  ? "Oval"
                                                  : "Especial";
                                    const finishLabel = (specs.finish || "gloss") === "matte" ? "fosco" : "brilho";
                                    const presLabel = (artwork.presentationType || "cartela") === "unidades" ? "Unidades" : "Cartela";
                                    const fileName = `ARTE_PREVIEW_${fmtLabel}_${specs.width ?? 0}x${specs.height ?? 0}_${specs.quantity ?? 0}un_${finishLabel}_${presLabel}.pdf`;
                                    doc.save(fileName);
                                } catch (err) {
                                    console.error("[Dev download arte] Erro ao gerar prévia da arte:", err);
                                    alert("Erro ao gerar prévia da arte em PDF.");
                                }
                            }}
                        >
                            Baixar prévia da arte (PDF)
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

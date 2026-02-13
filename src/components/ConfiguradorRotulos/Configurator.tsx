"use client";

import { useConfiguratorStore } from "@/store/configurator-store";
import { Step0ProductChoice } from "./Step0ProductChoice";
import { Step0CreationMethod } from "./Step0CreationMethod";
import { Step1Specifications } from "./Step1Specifications";
import { Step2Artwork } from "./Step2Artwork";
import { Step3Approval } from "./Step3Approval";
import { Step4Summary } from "./Step4Summary";
import { Step5Payment } from "./Step5Payment";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
    { id: 1, label: "Produto" },
    { id: 2, label: "Como criar" },
    { id: 3, label: "Especificações" },
    { id: 4, label: "Arte & IA" },
    { id: 5, label: "Aprovação" },
    { id: 6, label: "Resumo" },
    { id: 7, label: "Pagamento" },
];

const TOTAL_STEPS = 7;

const productLabels: Record<string, string> = {
    rotulo: "Rótulos",
    banner: "Banners",
    faixa: "Faixas",
    adesivo: "Adesivo de Recorte",
    outros: "Outros Produtos",
};

const creationMethodLabels: Record<string, string> = {
    upload: "Já tenho minha arte",
    ai: "Criar com IA",
    specialist: "Falar com especialista",
};

const STORAGE_KEY_STEP = "f9-configurator-step";

export function Configurator() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentStep, setStep, setCheckoutFromCart, reset, calculatePrice, specs, creationMethod, artwork, checkoutFromCart } = useConfiguratorStore();
    const stepsRef = useRef<HTMLDivElement>(null);
    const isFirstStepEffectRun = useRef(true);

    // Restaurar step ao atualizar a página (ficar onde estava)
    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = sessionStorage.getItem(STORAGE_KEY_STEP);
        if (saved) {
            const step = parseInt(saved, 10);
            if (step > 1 && step <= TOTAL_STEPS) setStep(step);
        }
    }, [setStep]);

    useEffect(() => {
        calculatePrice();
    }, [specs, calculatePrice]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (currentStep === 1) sessionStorage.removeItem(STORAGE_KEY_STEP);
            else sessionStorage.setItem(STORAGE_KEY_STEP, String(currentStep));
        }

        if (isFirstStepEffectRun.current) {
            isFirstStepEffectRun.current = false;
            // Só rola para a ferramenta na 1ª carga se a URL tiver #configurator (link direto) ou step restaurado (> 1)
            if (typeof window !== "undefined" && (window.location.hash === "#configurator" || currentStep > 1)) {
                stepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            return;
        }
        stepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [currentStep]);

    useEffect(() => {
        if (currentStep !== 7) setCheckoutFromCart(false);
    }, [currentStep, setCheckoutFromCart]);

    // Ir para o pagamento vindo do carrinho: ?checkout=1#configurator (reage à mudança da URL)
    useEffect(() => {
        if (searchParams.get("checkout") === "1") {
            setCheckoutFromCart(true);
            setStep(7);
            setTimeout(() => stepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        }
    }, [searchParams, setStep, setCheckoutFromCart]);

    const nextStep = () => {
        if (currentStep < TOTAL_STEPS) setStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep <= 1) return;
        // No checkout vindo do carrinho: Voltar leva ao início da ferramenta (step 1), mantendo o carrinho
        if (currentStep === 7 && checkoutFromCart) {
            setCheckoutFromCart(false);
            setStep(1);
            reset();
            router.replace("/#configurator");
            return;
        }
        // Quem veio do upload: da etapa 4 (Arte) volta para etapa 2 (Como criar), sem passar pela 3
        if (currentStep === 4 && creationMethod === "upload") {
            setStep(2);
            return;
        }
        setStep(currentStep - 1);
    };

    return (
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Progress Bar — scroll para cá ao mudar etapa para conteúdo carregar logo abaixo */}
            <div ref={stepsRef} className="bg-gray-50 border-b border-gray-100 p-4 md:p-6 scroll-mt-20">
                <div className="overflow-x-auto overflow-y-hidden -mx-2 px-2 md:mx-0 md:px-0">
                    <div className="flex items-center justify-between relative min-w-[28rem] w-full md:min-w-0">
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -z-10 pointer-events-none" />
                        {steps.map((step) => (
                            <div key={step.id} className={cn(
                                "flex flex-col items-center gap-1 md:gap-2 bg-gray-50 px-1 md:px-2 shrink-0 min-w-[3.25rem] md:min-w-0"
                            )}>
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2",
                                        step.id === currentStep
                                            ? "bg-white border-f9-blue text-f9-blue scale-110 shadow-lg"
                                            : step.id < currentStep
                                                ? "bg-green-600 border-green-600 text-white"
                                                : "bg-gray-100 border-gray-200 text-gray-600"
                                    )}
                                >
                                    {step.id < currentStep ? <Check className="w-5 h-5 stroke-[2.5]" /> : step.id}
                                </div>
                                <span className={cn(
                                    "text-xs font-semibold uppercase tracking-wider",
                                    step.id === currentStep ? "text-f9-blue" : "text-gray-500"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                {/* Main Content Area — sempre tela cheia (sem resumo por enquanto) */}
                <div className="flex-1 p-8 min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {currentStep === 1 && <Step0ProductChoice />}
                            {currentStep === 2 && <Step0CreationMethod />}
                            {currentStep === 3 && <Step1Specifications />}
                            {currentStep === 4 && <Step2Artwork />}
                            {currentStep === 5 && <Step3Approval />}
                            {currentStep === 6 && <Step4Summary />}
                            {currentStep === 7 && <Step5Payment />}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navegação: etapa 2 só Voltar; 3 e 4–6 Voltar + Continuar */}
                    {currentStep === 2 && (
                        <div className="flex justify-start mt-8 pt-6 border-t border-gray-100">
                            <Button variant="outline" onClick={prevStep} className="max-w-[180px]">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                            </Button>
                        </div>
                    )}
                    {currentStep === 3 && (
                        <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-gray-100">
                            <Button variant="outline" onClick={prevStep} className="flex-1 max-w-[180px]">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                            </Button>
                            <Button onClick={nextStep} className="flex-1 max-w-[180px] bg-blue-600 hover:bg-blue-700 text-white font-bold border border-blue-600">
                                Continuar
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                    {currentStep >= 4 && currentStep < 7 && (
                        <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-gray-100">
                            <Button variant="outline" onClick={prevStep} className="flex-1 max-w-[180px]">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                            </Button>
                            {currentStep !== 6 && (
                                <Button
                                    onClick={nextStep}
                                    disabled={currentStep === 4 && creationMethod === "upload" && !artwork.uploadedFile}
                                    className="flex-1 max-w-[180px] bg-blue-600 hover:bg-blue-700 text-white font-bold border border-blue-600"
                                >
                                    Continuar
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            )}
                        </div>
                    )}
                    {currentStep === 7 && (
                        <div className="flex justify-start mt-8 pt-6 border-t border-gray-100">
                            <Button variant="outline" onClick={prevStep} className="max-w-[180px]">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

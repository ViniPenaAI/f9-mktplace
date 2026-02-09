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
import { useEffect } from "react";
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
    rotulo: "Rótulos & Embalagens",
    banner: "Banners & Faixas",
    faixa: "Faixas Promocionais",
    adesivo: "Adesivos & Recorte",
    outros: "Outros Produtos",
};

const creationMethodLabels: Record<string, string> = {
    upload: "Já tenho minha arte",
    ai: "Criar com IA",
    specialist: "Falar com especialista",
};

export function Configurator() {
    const { currentStep, setStep, calculatePrice, specs, creationMethod } = useConfiguratorStore();

    useEffect(() => {
        calculatePrice();
    }, [specs, calculatePrice]);

    const nextStep = () => {
        if (currentStep < TOTAL_STEPS) setStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep <= 1) return;
        // Quem veio do upload: da etapa 4 (Arte) volta para etapa 2 (Como criar), sem passar pela 3
        if (currentStep === 4 && creationMethod === "upload") {
            setStep(2);
            return;
        }
        setStep(currentStep - 1);
    };

    return (
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Progress Bar */}
            <div className="bg-gray-50 border-b border-gray-100 p-6">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -z-10" />
                    {steps.map((step) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-gray-50 px-2">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2",
                                        isActive
                                            ? "bg-white border-f9-blue text-f9-blue scale-110 shadow-lg"
                                            : isCompleted
                                                ? "bg-green-600 border-green-600 text-white"
                                                : "bg-gray-100 border-gray-200 text-gray-600"
                                    )}
                                >
                                    {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : step.id}
                                </div>
                                <span className={cn(
                                    "text-xs font-semibold uppercase tracking-wider",
                                    isActive ? "text-f9-blue" : "text-gray-500"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
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
                            <Button onClick={nextStep} className="flex-1 max-w-[180px] bg-blue-600 hover:bg-blue-700 text-white font-bold border border-blue-600">
                                Continuar
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
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

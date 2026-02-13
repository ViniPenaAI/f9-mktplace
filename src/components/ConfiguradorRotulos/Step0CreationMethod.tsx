"use client";

import { useConfiguratorStore, CreationMethod } from "@/store/configurator-store";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Upload, Sparkles, MessageCircle } from "lucide-react";

const methods: {
    id: CreationMethod;
    label: string;
    description: string;
    actionLabel: string;
    icon: React.ReactNode;
    iconBg: string;
    linkColor: string;
    isNew?: boolean;
}[] = [
    {
        id: "upload",
        label: "Já tenho minha arte",
        description: "Perfeito! Faça o upload do seu arquivo pronto. Recomendamos arquivos em PDF, AI, ou CDR.",
        actionLabel: "Fazer Upload →",
        icon: <Upload className="w-6 h-6" />,
        iconBg: "bg-violet-100 text-violet-600",
        linkColor: "text-f9-blue hover:underline",
    },
    {
        id: "ai",
        label: "Criar com Inteligência Artificial",
        description: "Não tem uma arte? Descreva sua ideia e nossa IA criará opções exclusivas para você em segundos.",
        actionLabel: "Usar IA Grátis →",
        icon: <Sparkles className="w-6 h-6" />,
        iconBg: "bg-pink-100 text-pink-600",
        linkColor: "text-pink-600 hover:underline",
        isNew: true,
    },
    {
        id: "specialist",
        label: "Falar com um especialista",
        description: "Precisa de ajustes ou de uma criação mais elaborada? Nossa equipe de designers está pronta para ajudar.",
        actionLabel: "Chamar no WhatsApp ↗",
        icon: <MessageCircle className="w-6 h-6" />,
        iconBg: "bg-emerald-100 text-emerald-600",
        linkColor: "text-emerald-600 hover:underline",
    },
];

export function Step0CreationMethod() {
    const { creationMethod, setCreationMethod, setStep, updateArtwork } = useConfiguratorStore();

    const handleSelectMethod = (methodId: CreationMethod) => {
        setCreationMethod(methodId);
        updateArtwork({ method: methodId });
        // Quem escolhe "já tenho minha arte" vai direto para envio do arquivo (etapa 4); os demais vão para Especificações (3)
        setStep(methodId === "upload" ? 4 : 3);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-f9-navy">Como você quer a sua arte?</h3>
                <p className="text-gray-500 text-sm">
                    Escolha uma das opções abaixo para continuar.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {methods.map((m) => (
                    <Card
                        key={m.id}
                        className={cn(
                            "cursor-pointer flex flex-col p-6 gap-4 transition-all border-gray-200 hover:border-gray-300 hover:shadow-md relative",
                            creationMethod === m.id && "border-2 border-blue-600 bg-blue-50 text-blue-800 shadow-sm [&_.text-f9-navy]:!text-blue-800 [&_.text-gray-500]:!text-blue-700 [&_.text-f9-blue]:!text-blue-700 [&_svg]:stroke-blue-700"
                        )}
                        onClick={() => handleSelectMethod(m.id)}
                    >
                        {m.isNew && (
                            <span className="absolute top-3 right-3 bg-pink-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                Novo
                            </span>
                        )}
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", m.iconBg)}>
                            {m.icon}
                        </div>
                        <div className="space-y-2">
                            <span className="text-sm font-bold text-f9-navy block">{m.label}</span>
                            <span className="text-xs text-gray-500 block">{m.description}</span>
                        </div>
                        <span className={cn("text-sm font-semibold mt-auto", m.linkColor)}>
                            {m.actionLabel}
                        </span>
                    </Card>
                ))}
            </div>
        </div>
    );
}

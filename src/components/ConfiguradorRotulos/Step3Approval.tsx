"use client";

import { useState, useRef, useEffect } from "react";
import { useConfiguratorStore } from "@/store/configurator-store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Scissors, AlertCircle, Plus, Minus, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const CUT_AREA_SCALE_MIN = 0.5;
/** Máximo 1 = área de corte não ultrapassa o container (não abre além da imagem exibida) */
const CUT_AREA_SCALE_MAX = 1;
const DRAG_SENSITIVITY = 0.15;
const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_CUT_LINE_TEXT = "Olá! Preciso de ajuda para definir a linha de corte do meu pedido.";

const STEP_PAGAMENTO = 7;

export function Step3Approval() {
    const { artwork, updateArtwork, specs, updateSpecs, creationMethod, selectedProduct, setStep } = useConfiguratorStore();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const cutLineInputRef = useRef<HTMLInputElement>(null);
    const cutAreaRef = useRef<HTMLDivElement>(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    const scale = artwork.approvalScale ?? 1;
    const offsetX = artwork.approvalOffsetX ?? 0;
    const offsetY = artwork.approvalOffsetY ?? 0;
    const cutAreaScale = Math.min(CUT_AREA_SCALE_MAX, Math.max(CUT_AREA_SCALE_MIN, artwork.cutAreaScale ?? 1));

    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
    const [isResizingCut, setIsResizingCut] = useState(false);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, scale: 1 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    /** Borda: mesma forma que getCutClipPath para a máscara acompanhar a linha (quadrado, retangular, redondo, oval) */
    const getCutAreaClass = () => {
        switch (specs.format) {
            case "circle": return "rounded-[50%]"; // círculo (1:1) = elipse com 50%
            case "oval": return "rounded-[50%]";    // elipse (≠1:1), não pill
            case "square":
            case "rectangular": return "rounded-none";
            default: return "rounded-lg";
        }
    };

    /** clip-path por formato: quadrado/retangular = reto; redondo/oval = elipse (círculo se 1:1). Imagem usa object-contain. */
    const getCutClipPath = () => {
        const s = cutAreaScale;
        const half = (1 - s) * 50;
        switch (specs.format) {
            case "circle":
            case "oval":
                return `ellipse(${50 * s}% ${50 * s}% at 50% 50%)`;
            case "square":
            case "rectangular":
                return `inset(${half}% round 0)`;
            default:
                return `inset(${half}% round 8px)`;
        }
    };

    /** Path SVG para máscara fumê: área externa à linha de corte (retângulo/elipse central). fill-rule evenodd. */
    const getMaskFramePath = () => {
        const s = Math.max(0.01, Math.min(1, cutAreaScale));
        const x1 = 50 * (1 - s);
        const x2 = 50 * (1 + s);
        const y1 = 50 * (1 - s);
        const y2 = 50 * (1 + s);
        const rx = 50 * s;
        const ry = 50 * s;
        if (specs.format === "circle" || specs.format === "oval") {
            // Retângulo externo + elipse interna (buraco)
            return `M 0,0 L 100,0 L 100,100 L 0,100 Z M 50,${50 - ry} A ${rx} ${ry} 0 0 1 ${50 + rx} 50 A ${rx} ${ry} 0 0 1 50 ${50 + ry} A ${rx} ${ry} 0 0 1 ${50 - rx} 50 A ${rx} ${ry} 0 0 1 50 ${50 - ry} Z`;
        }
        // Retângulo externo + retângulo interno (buraco)
        return `M 0,0 L 100,0 L 100,100 L 0,100 Z M ${x1},${y1} L ${x2},${y1} L ${x2},${y2} L ${x1},${y2} Z`;
    };

    useEffect(() => {
        if (creationMethod === "upload" && artwork.uploadedFile) {
            const url = URL.createObjectURL(artwork.uploadedFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        if (creationMethod === "ai" && artwork.selectedDesignUrl) {
            setPreviewUrl(artwork.selectedDesignUrl);
            return () => {};
        }
        setPreviewUrl(null);
    }, [creationMethod, artwork.uploadedFile, artwork.selectedDesignUrl]);

    const wheelRef = useRef<HTMLDivElement>(null);
    const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

    useEffect(() => {
        const el = wheelRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (!previewUrl) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.08 : 0.08;
            updateArtwork({ approvalScale: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (artwork.approvalScale ?? 1) + delta)) });
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [previewUrl, updateArtwork, artwork.approvalScale]);

    useEffect(() => {
        const el = wheelRef.current;
        if (!el || !previewUrl) return;
        const getDist = (t: TouchList) =>
            Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                pinchRef.current = { dist: getDist(e.touches), scale: artwork.approvalScale ?? 1 };
            }
        };
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && pinchRef.current) {
                e.preventDefault();
                const dist = getDist(e.touches);
                const delta = (dist - pinchRef.current.dist) * 0.008;
                const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinchRef.current.scale + delta));
                updateArtwork({ approvalScale: newScale });
                pinchRef.current = { dist, scale: newScale };
            }
        };
        const onTouchEnd = (e: TouchEvent) => {
            if (e.touches.length < 2) pinchRef.current = null;
        };
        el.addEventListener("touchstart", onTouchStart, { passive: false });
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        el.addEventListener("touchend", onTouchEnd);
        el.addEventListener("touchcancel", onTouchEnd);
        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", onTouchEnd);
            el.removeEventListener("touchcancel", onTouchEnd);
        };
    }, [previewUrl, updateArtwork, artwork.approvalScale]);

    const handleZoomIn = () => {
        const newScale = Math.min(ZOOM_MAX, scale + 0.1);
        updateArtwork({ approvalScale: newScale });
    };
    const handleZoomOut = () => {
        const newScale = Math.max(ZOOM_MIN, scale - 0.1);
        updateArtwork({ approvalScale: newScale });
    };

    const getClientXY = (e: MouseEvent | TouchEvent) => {
        if ("touches" in e && e.touches.length > 0)
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        const m = e as MouseEvent;
        return { x: m.clientX, y: m.clientY };
    };

    const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!previewUrl) return;
        if ("touches" in e && e.touches.length >= 2) return;
        e.preventDefault();
        const pos = "touches" in e && e.touches.length ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
        setIsPanning(true);
        setPanStart({ x: pos.x, y: pos.y, offsetX, offsetY });
        setDragOffset({ x: 0, y: 0 });
    };

    const handleCutResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = "touches" in e && e.touches.length ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
        setIsResizingCut(true);
        setResizeStart({ x: pos.x, y: pos.y, scale: cutAreaScale });
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if ("touches" in e && (e as TouchEvent).touches.length >= 2) return;
            const { x, y } = getClientXY(e);
            if (isPanning) {
                const dx = (x - panStart.x) * DRAG_SENSITIVITY;
                const dy = (y - panStart.y) * DRAG_SENSITIVITY;
                dragOffsetRef.current = { x: dx, y: dy };
                setDragOffset({ x: dx, y: dy });
            }
            if (isResizingCut) {
                const dx = x - resizeStart.x;
                const dy = y - resizeStart.y;
                const delta = (dx + dy) * 0.008;
                const newScale = Math.min(CUT_AREA_SCALE_MAX, Math.max(CUT_AREA_SCALE_MIN, resizeStart.scale + delta));
                updateArtwork({ cutAreaScale: newScale });
            }
        };
        const handleUp = () => {
            if (isPanning) {
                const { x: dx, y: dy } = dragOffsetRef.current;
                updateArtwork({
                    approvalOffsetX: panStart.offsetX + dx,
                    approvalOffsetY: panStart.offsetY + dy,
                });
                setDragOffset({ x: 0, y: 0 });
                setIsPanning(false);
            }
            setIsResizingCut(false);
        };
        const preventTouch = (e: TouchEvent) => {
            if (isPanning || isResizingCut) e.preventDefault();
        };
        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        window.addEventListener("touchmove", handleMove, { passive: false });
        window.addEventListener("touchend", handleUp);
        window.addEventListener("touchcancel", handleUp);
        window.addEventListener("touchmove", preventTouch, { passive: false });
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("touchend", handleUp);
            window.removeEventListener("touchcancel", handleUp);
            window.removeEventListener("touchmove", preventTouch);
        };
    }, [isPanning, isResizingCut, panStart, resizeStart, updateArtwork]);

    const handleCutLineUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) updateArtwork({ cutLineFile: e.target.files[0] });
    };

    const needsCutLine = selectedProduct === "adesivo" && (artwork.isDieCut || specs.format === "special");

    const displayOffsetX = isPanning ? panStart.offsetX + dragOffset.x : offsetX;
    const displayOffsetY = isPanning ? panStart.offsetY + dragOffset.y : offsetY;

    const isSpecialFormat = specs.format === "special";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-f9-navy">
                    {isSpecialFormat ? "Confira sua arte" : "Aprovação – Área de corte"}
                </h3>
                <p className="text-sm text-gray-500">
                    {isSpecialFormat
                        ? "Confira se a imagem carregada está correta. No próximo passo você verá o resumo e o valor."
                        : `Arraste a imagem com o mouse, use o scroll para zoom e os botões +/−. Redimensione a área de corte arrastando o canto. Formato: ${specs.format}. Tamanho final: ${specs.width} × ${specs.height} mm.`}
                </p>
            </div>

            {/* Corte especial: só a imagem para confirmação. Outros formatos: área de corte completa */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <Label className="block">
                        {isSpecialFormat ? "Imagem carregada" : "Área de corte"}
                    </Label>

                    <div className="flex flex-col items-center gap-3">
                        <div
                            ref={cutAreaRef}
                            className="relative overflow-visible bg-gray-50 rounded-lg"
                            style={{
                                width: "min(100%, 420px)",
                                aspectRatio: isSpecialFormat ? "4/3" : `${specs.width} / ${specs.height}`,
                            }}
                        >
                            {isSpecialFormat ? (
                                /* Corte especial: apenas a imagem, sem área de corte */
                                <>
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Imagem enviada"
                                            className="absolute inset-0 w-full h-full object-contain select-none"
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                            Nenhuma imagem carregada.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div
                                        ref={wheelRef}
                                        className={cn(
                                            "absolute inset-0 overflow-hidden rounded-lg bg-transparent cursor-grab active:cursor-grabbing touch-none",
                                            isPanning && "cursor-grabbing"
                                        )}
                                        onMouseDown={handlePanStart}
                                        onTouchStart={handlePanStart}
                                    >
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Pré-visualização"
                                                className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                                                style={{
                                                    transform: `scale(${scale}) translate(${displayOffsetX}%, ${displayOffsetY}%)`,
                                                }}
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                                Nenhuma arte para pré-visualizar.
                                            </div>
                                        )}
                                    </div>

                                    {previewUrl && (
                                        <div
                                            className="absolute inset-0 pointer-events-none overflow-hidden"
                                            style={{ zIndex: 1 }}
                                            aria-hidden
                                        >
                                            <svg
                                                viewBox="0 0 100 100"
                                                preserveAspectRatio="none"
                                                className="absolute inset-0 w-full h-full"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    fill="rgba(0,0,0,0.5)"
                                                    d={getMaskFramePath()}
                                                />
                                            </svg>
                                        </div>
                                    )}

                                    <div
                                        className={cn(
                                            "absolute inset-0 border-2 border-dashed pointer-events-none",
                                            getCutAreaClass()
                                        )}
                                        style={{
                                            transform: `scale(${cutAreaScale})`,
                                            transformOrigin: "center center",
                                            boxSizing: "border-box",
                                            borderColor: "hsl(var(--f9-navy))",
                                            boxShadow: "0 0 0 1px rgba(255,255,255,0.9), 0 0 0 2px hsl(var(--f9-navy))",
                                            zIndex: 2,
                                        }}
                                        aria-hidden
                                    />

                                    <button
                                        type="button"
                                        className="absolute w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xl border-4 border-white ring-2 ring-blue-800 pointer-events-auto touch-none z-[20] hover:bg-blue-700 active:scale-95"
                                        style={{
                                            right: `calc(50% * (1 - ${cutAreaScale}))`,
                                            bottom: `calc(50% * (1 - ${cutAreaScale}))`,
                                            marginRight: "-22px",
                                            marginBottom: "-22px",
                                        }}
                                        onMouseDown={handleCutResizeStart}
                                        onTouchStart={handleCutResizeStart}
                                        title="Arraste para aumentar ou diminuir a área de corte"
                                        aria-label="Redimensionar área de corte"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="-rotate-90">
                                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>

                        {!isSpecialFormat && previewUrl && (
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="icon" onClick={handleZoomOut} aria-label="Diminuir zoom">
                                    <Minus className="w-4 h-4" />
                                </Button>
                                <span className="text-sm font-medium min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
                                <Button type="button" variant="outline" size="icon" onClick={handleZoomIn} aria-label="Aumentar zoom">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {!isSpecialFormat && (
                            <p className="text-xs text-gray-500">
                                Tamanho final: {specs.width} × {specs.height} mm · Área de corte: {Math.round(cutAreaScale * 100)}%
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Linha de corte / corte especial */}
            {(needsCutLine || specs.format === "special") && (
                <Card className="border-amber-200 bg-amber-50/30">
                    <CardContent className="pt-6 space-y-3">
                        <div className="flex items-start gap-2">
                            <Scissors className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-f9-navy">
                                    {specs.format === "special" ? "Corte especial" : "Linha de corte (recorte)"}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {specs.format === "special"
                                        ? "No corte especial, a produção usa o arquivo de linha de corte que você enviar. Envie o vetor (PDF, AI, EPS, DXF, CDR) com a borda exata do recorte."
                                        : "Envie o arquivo de linha de corte (vetor) para a produção cortar exatamente como você definiu."}
                                </p>
                            </div>
                        </div>
                        <div
                            className="border-2 border-dashed border-amber-200 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50/50"
                            onClick={() => cutLineInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={cutLineInputRef}
                                className="hidden"
                                accept=".pdf,.ai,.eps,.dxf,.cdr"
                                onChange={handleCutLineUpload}
                            />
                            {artwork.cutLineFile ? (
                                <span className="text-sm font-medium text-green-600">{artwork.cutLineFile.name}</span>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-amber-500 mb-2" />
                                    <span className="text-sm text-gray-600">Enviar arquivo de linha de corte</span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            O arquivo deve indicar borda e contorno exatos para evitar erros na produção.
                        </p>
                        <div className="pt-2 border-t border-amber-200">
                            {specs.format === "special" ? (
                                <>
                                    <Button
                                        type="button"
                                        onClick={() => setStep(STEP_PAGAMENTO)}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Chamar um Especialista
                                    </Button>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Na próxima tela: resumo do pedido e valor. Após o pagamento aprovado, um especialista entrará em contato.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Dúvidas agora?{" "}
                                        <a
                                            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_CUT_LINE_TEXT)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-f9-blue font-medium underline"
                                        >
                                            Fale no WhatsApp
                                        </a>
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-700 mb-2">Não tem o arquivo de corte?</p>
                                    <a
                                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_CUT_LINE_TEXT)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Fale com um especialista no WhatsApp
                                    </a>
                                    <p className="text-xs text-gray-500 mt-2">Nossa equipe ajuda a definir o recorte mesmo sem o vetor pronto – você não perde a venda.</p>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {creationMethod === "specialist" && (
                <p className="text-sm text-gray-500">Você escolheu falar com um especialista. Entre em contato pelo WhatsApp para aprovar a arte com nossa equipe.</p>
            )}
        </div>
    );
}

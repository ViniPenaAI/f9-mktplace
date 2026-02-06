import { create } from 'zustand';

export type ProductType = 'rotulo' | 'banner' | 'faixa' | 'adesivo' | 'outros';
export type CreationMethod = 'upload' | 'ai' | 'specialist';

export type ProductFormat = 'square' | 'rectangular' | 'circle' | 'oval' | 'special';
export type Material = 'vinyl_white' | 'vinyl_transparent' | 'bopp' | 'paper_couche';
export type Finish = 'gloss' | 'matte';

export interface ProductSpecs {
    format: ProductFormat;
    width: number; // mm
    height: number; // mm
    material: Material;
    finish: Finish;
    quantity: number;
}

export type PresentationType = 'cartela' | 'unidades';

export interface ArtworkData {
    method: 'upload' | 'ai' | 'specialist' | null;
    uploadedFile: File | null;
    /** Adesivo de recorte: arquivo de linhas de corte (vetor) */
    cutLineFile: File | null;
    /** Se é adesivo de recorte (usa linhas de corte) */
    isDieCut: boolean;
    /** Como sai o produto: em cartela ou em unidades */
    presentationType: PresentationType;
    /** Ajuste na aprovação: zoom da arte dentro da área de corte (1 = 100%) */
    approvalScale: number;
    /** Ajuste na aprovação: posição X da arte (% ou px) */
    approvalOffsetX: number;
    /** Ajuste na aprovação: posição Y da arte */
    approvalOffsetY: number;
    /** Escala da área de corte (1 = 100%), cliente pode redimensionar com o mouse */
    cutAreaScale: number;
    aiPrompt: string;
    aiLogoFile: File | null;
    aiIngredients: string;
    generatedDesigns: string[]; // URLs
    selectedDesignUrl: string | null;
    enhancedDesignUrl: string | null;
}

export interface CustomerData {
    name: string;
    email: string;
    phone: string;
    document: string; // CPF/CNPJ
}

export interface ShippingData {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
}

interface ConfiguratorState {
    currentStep: number;
    selectedProduct: ProductType | null;
    creationMethod: CreationMethod | null;
    specs: ProductSpecs;
    artwork: ArtworkData;
    customer: CustomerData;
    shipping: ShippingData;
    totalPrice: number;
    /** Valor do frete (calculado quando CEP/endereço estiver preenchido) */
    shippingCost: number;

    // Actions
    setStep: (step: number) => void;
    setSelectedProduct: (product: ProductType | null) => void;
    setCreationMethod: (method: CreationMethod | null) => void;
    updateSpecs: (specs: Partial<ProductSpecs>) => void;
    updateArtwork: (artwork: Partial<ArtworkData>) => void;
    updateCustomer: (customer: Partial<CustomerData>) => void;
    updateShipping: (shipping: Partial<ShippingData>) => void;
    setShippingCost: (value: number) => void;
    calculatePrice: () => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
    currentStep: 1,
    selectedProduct: null,
    creationMethod: null,
    specs: {
        format: 'square',
        width: 50,
        height: 50,
        material: 'vinyl_white',
        finish: 'gloss',
        quantity: 100,
    },
    artwork: {
        method: null,
        uploadedFile: null,
        cutLineFile: null,
        isDieCut: false,
        presentationType: 'cartela',
        approvalScale: 1,
        approvalOffsetX: 0,
        approvalOffsetY: 0,
        cutAreaScale: 1,
        aiPrompt: '',
        aiLogoFile: null,
        aiIngredients: '',
        generatedDesigns: [],
        selectedDesignUrl: null,
        enhancedDesignUrl: null,
    },
    customer: {
        name: '',
        email: '',
        phone: '',
        document: '',
    },
    shipping: {
        zipCode: '',
        street: '',
        number: '',
        city: '',
        state: '',
    },
    totalPrice: 0,
    shippingCost: 0,

    setStep: (step) => set({ currentStep: step }),
    setSelectedProduct: (product) => set({ selectedProduct: product }),
    setCreationMethod: (method) => set({ creationMethod: method }),

    updateSpecs: (newSpecs) => {
        set((state) => ({ specs: { ...state.specs, ...newSpecs } }));
        get().calculatePrice();
    },

    updateArtwork: (newArtwork) =>
        set((state) => ({ artwork: { ...state.artwork, ...newArtwork } })),

    updateCustomer: (newCustomer) =>
        set((state) => ({ customer: { ...state.customer, ...newCustomer } })),

    updateShipping: (newShipping) =>
        set((state) => ({ shipping: { ...state.shipping, ...newShipping } })),

    setShippingCost: (value) => set({ shippingCost: value }),

    calculatePrice: () => {
        // Simple mock pricing logic
        const { specs } = get();
        // Area in square meters
        const area = (specs.width * specs.height * specs.quantity) / 1000000;
        const baseRate = 150; // R$ per m2 (example)
        const minPrice = 50;

        let price = Math.max(area * baseRate, minPrice);

        // Adjustments
        if (specs.material === 'vinyl_transparent') price *= 1.2;
        if (specs.finish === 'matte') price *= 1.1;

        set({ totalPrice: Math.round(price * 100) / 100 });
    }
}));

export type FreteProvider = "melhor-envio" | "superfrete";

export type Transportadora =
    | "correios"
    | "jadlog"
    | "azul"
    | "jt"
    | "latam"
    | "outro";

export interface CotacaoFreteNormalizada {
    provider: FreteProvider;
    providerServicoId: string;
    transportadora: Transportadora;
    nomeServico: string;
    preco: number;
    prazoMinDias: number;
    prazoMaxDias: number;
}

export interface OpcoesDestiladas {
    maisBarato: CotacaoFreteNormalizada | null;
    maisRapido: CotacaoFreteNormalizada | null;
    intermediario: CotacaoFreteNormalizada | null;
}

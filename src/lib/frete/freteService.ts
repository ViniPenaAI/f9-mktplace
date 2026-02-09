import type {
    CotacaoFreteNormalizada,
    OpcoesDestiladas,
    FreteProvider,
} from "./types";
import { cotarFreteMelhorEnvio, type CotacaoInput } from "./melhorEnvioClient";
import { destilarOpcoes } from "./ranking";

export type { CotacaoInput, ItemParaCotacao } from "./melhorEnvioClient";

export interface CotarFreteParams extends CotacaoInput {
    providers?: FreteProvider[];
}

export interface CotarFreteResultado {
    cotacoes: CotacaoFreteNormalizada[];
    opcoes: OpcoesDestiladas;
}

export async function cotarFrete(params: CotarFreteParams): Promise<CotarFreteResultado> {
    const providers = params.providers ?? ["melhor-envio"];
    const todasCotacoes: CotacaoFreteNormalizada[] = [];

    if (providers.includes("melhor-envio")) {
        const c = await cotarFreteMelhorEnvio(params);
        todasCotacoes.push(...c);
    }

    const opcoes = destilarOpcoes(todasCotacoes);
    return { cotacoes: todasCotacoes, opcoes };
}

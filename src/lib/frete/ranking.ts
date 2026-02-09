import type { CotacaoFreteNormalizada, OpcoesDestiladas } from "./types";

export function destilarOpcoes(cotacoes: CotacaoFreteNormalizada[]): OpcoesDestiladas {
    if (!cotacoes.length) {
        return { maisBarato: null, maisRapido: null, intermediario: null };
    }

    const porPreco = [...cotacoes].sort((a, b) => a.preco - b.preco);
    const porPrazo = [...cotacoes].sort((a, b) => a.prazoMaxDias - b.prazoMaxDias);

    const maisBarato = porPreco[0];
    const maisRapido = porPrazo[0];

    const basePreco = porPreco[0].preco || 1;
    const basePrazo = porPrazo[0].prazoMaxDias || 1;

    const pontuado = cotacoes
        .map((c) => {
            const precoScore = c.preco / basePreco;
            const prazoScore = c.prazoMaxDias / basePrazo;
            const score = precoScore * 0.6 + prazoScore * 0.4;
            return { c, score };
        })
        .sort((a, b) => a.score - b.score);

    let intermediario = pontuado[0].c;
    if (intermediario === maisBarato || intermediario === maisRapido) {
        intermediario =
            pontuado.find((p) => p.c !== maisBarato && p.c !== maisRapido)?.c ?? intermediario;
    }

    return { maisBarato, maisRapido, intermediario };
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    opcoes: [
      { servico: "PAC", codigo: "04162", valor: 25.50, prazoDias: 10 },
      { servico: "Sedex", codigo: "04669", valor: 45.00, prazoDias: 2 }
    ],
    mensagem: "Frete mockado para testes"
  });
}

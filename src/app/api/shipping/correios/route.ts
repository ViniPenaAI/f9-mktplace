import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Valores MOCK para teste - sem dependência de Correios por enquanto
    // Quando tiver contrato, substitua por API real dos Correios
    const mockShippingOptions = [
      {
        servico: "PAC",
        codigo: "04162",
        valor: 25.50,
        prazoDias: 10,
        spreadPercent: 15,
      },
      {
        servico: "Sedex",
        codigo: "04669",
        valor: 45.00,
        prazoDias: 2,
        spreadPercent: 15,
      },
    ];

    return NextResponse.json({
      success: true,
      opcoes: mockShippingOptions,
      mensagem: "Simulação de frete (valores mockados para testes)",
    });
  } catch (error) {
    console.error("Erro na API de frete:", error);
    return NextResponse.json(
      {
        success: false,
        erro: "Erro ao calcular frete",
      },
      { status: 500 }
    );
  }

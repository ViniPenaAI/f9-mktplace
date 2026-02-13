"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redireciona para a mesma lista de pedidos. */
export default function MinhasComprasPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/meus-pedidos");
    }, [router]);
    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-gray-500">Redirecionando…</p>
        </main>
    );
}

import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Configurator } from "@/components/ConfiguradorRotulos/Configurator";
import { ProductShowcase } from "@/components/ProductShowcase";
import { SocialProof } from "@/components/SocialProof";

import { Preloader } from "@/components/Preloader";

export default function Home() {
  return (
    <main className="min-h-screen bg-background selection:bg-f9-cyan selection:text-f9-navy">
      <Preloader />
      <Header />

      <Hero />

      <section id="products" className="py-20 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-4 text-f9-navy">Nossos Produtos</h2>
          <p className="text-gray-500">Qualidade profissional para destacar sua marca.</p>
        </div>
        <ProductShowcase />
      </section>

      <section id="configurator" className="scroll-mt-24 pt-24 pb-20 md:pt-28 md:pb-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-f9-navy">Configure seu Produto</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Escolha o produto, como quer criar sua arte e personalize em poucos passos.
              Rótulos, banners, adesivos e mais — com IA ou sua arte pronta.
            </p>
          </div>

          <Suspense fallback={<div className="min-h-[200px] flex items-center justify-center text-gray-500">Carregando...</div>}>
            <Configurator />
          </Suspense>
        </div>
      </section>

      <SocialProof />

      <Footer />
    </main>
  );
}

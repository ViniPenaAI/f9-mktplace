import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { CartSync } from "@/components/CartSync";
import { CartDrawer } from "@/components/CartDrawer";
import { AuthProvider } from "@/contexts/AuthContext";
import { TrackingScripts } from "@/components/TrackingScripts";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "F9 Rótulos | Configure e Imprima Online",
  description: "Plataforma de e-commerce automizada para impressão de rótulos personalizados com IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${poppins.variable} antialiased font-sans`}
      >
        <TrackingScripts />
        <AuthProvider>
          <CartSync />
          <CartDrawer />
          {children}
          <WhatsAppFloat />
        </AuthProvider>
      </body>
    </html>
  );
}

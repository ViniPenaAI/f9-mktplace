"use client";

import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const WHATSAPP_URL = "https://wa.me/5512991169431?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20outros%20servi%C3%A7os.";

export function WhatsAppFloat() {
    return (
        <motion.a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 transition-transform hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Fale conosco no WhatsApp"
        >
            <MessageCircle className="h-7 w-7" strokeWidth={2.5} />
        </motion.a>
    );
}

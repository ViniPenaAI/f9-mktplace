import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jspdf", "@supabase/ssr", "@supabase/supabase-js"],
  transpilePackages: ["@supabase/ssr"],
};

export default nextConfig;

import React from "react";
import type { Metadata } from "next";
import { ConsentBanner } from "../(marketing)/components/ui/consent-banner";
import { LayoutComposer } from "@/lib/composition/layout-composer";

export const metadata: Metadata = {
  title: "Luminaris - Complete seu Cadastro",
  description:
    "Complete seu cadastro e tenha acesso completo à plataforma de business intelligence.",
  keywords: ["cadastro", "conta", "signup", "registro"],
  robots: "noindex, nofollow", // Páginas de conversão não devem ser indexadas
};

export default function ConversionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutComposer layoutId="conversion">
      {children}
      <ConsentBanner />
    </LayoutComposer>
  );
}

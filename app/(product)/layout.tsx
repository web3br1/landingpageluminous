import type { Metadata } from "next";
import { GlobalNav } from "./components/global-nav";
import { ConsentBanner } from "../(marketing)/components/ui/consent-banner";
import { LayoutComposer } from "@/lib/composition/layout-composer";

export const metadata: Metadata = {
  title: "Luminaris - Plataforma de Business Intelligence",
  description:
    "Explore todas as funcionalidades da plataforma de business intelligence. Demo interativa, funcionalidades avançadas e preços transparentes.",
  keywords: [
    "business intelligence",
    "demo",
    "funcionalidades",
    "preços",
    "plataforma",
  ],
  robots: "index, follow",
};

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutComposer layoutId="product">
      <GlobalNav />
      <main>{children}</main>
      <ConsentBanner />
    </LayoutComposer>
  );
}

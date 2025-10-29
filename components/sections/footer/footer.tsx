// Simplified Footer Component
// Removed complex error handling and advanced features to fix build issues

import React from "react";
import { cn } from "@/lib/utils";

interface FooterProps {
  content?: {
    companyName?: string;
    copyright?: string;
    links?: Array<{ label: string; href: string }>;
  };
  variant?: "default" | "minimal" | "comprehensive";
  className?: string;
  id?: string;
}

export function Footer({
  content = {},
  variant = "default",
  className,
  id,
}: FooterProps) {
  const {
    companyName = "DataFlow Brasil",
    copyright = `© ${new Date().getFullYear()} ${companyName}. Todos os direitos reservados.`,
    links = [
      { label: "Política de Privacidade", href: "/privacidade" },
      { label: "Termos de Uso", href: "/termos" },
      { label: "Contato", href: "/contato" },
    ],
  } = content;

  return (
    <footer
      id={id ?? "footer"}
      data-section="footer"
      data-testid="section-footer"
      className={cn("bg-gray-900 text-white py-12", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{companyName}</h3>
            <p className="text-gray-400 text-sm">
              Transformando dados em decisões inteligentes para empresas
              brasileiras.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide">
              Links
            </h4>
            <ul className="space-y-2">
              {links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide">
              Contato
            </h4>
            <p className="text-gray-400 text-sm">
              Entre em contato conosco para saber mais sobre nossas soluções.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}

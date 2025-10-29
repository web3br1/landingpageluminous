"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Database,
  BarChart3,
  MessageSquare,
  Zap,
  Shield,
  Users,
  TrendingUp,
  FileText,
  Settings,
  Play,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { CTA } from "@/components/ui/cta-button-unified";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeUp } from "@/components/ui/fade-up";

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  benefits: string[];
  demo?: string;
  video?: string;
}

const features: Feature[] = [
  {
    id: "ai-interview",
    name: "Entrevista Inteligente",
    description:
      "Nossa IA faz perguntas estratégicas para entender completamente seu negócio e processos.",
    icon: <Brain className="w-6 h-6" />,
    category: "IA & Automação",
    benefits: [
      "Mapeamento automático de processos",
      "Perguntas contextualizadas por segmento",
      "Adaptação em tempo real às respostas",
      "Validação de dados automática",
    ],
    demo: "Veja como a IA entende seu negócio",
  },
  {
    id: "auto-dashboards",
    name: "Dashboards Automáticos",
    description:
      "Crie dashboards personalizados automaticamente baseados nos dados e necessidades identificadas.",
    icon: <BarChart3 className="w-6 h-6" />,
    category: "Visualização",
    benefits: [
      "Dashboards personalizados por usuário",
      "KPIs automáticos por segmento",
      "Visualizações adaptáveis",
      "Drag & drop para personalização",
    ],
    demo: "Crie dashboards em segundos",
  },
  {
    id: "natural-language",
    name: "Consultas em Linguagem Natural",
    description:
      "Pergunte qualquer coisa sobre seus dados em português e receba respostas instantâneas.",
    icon: <MessageSquare className="w-6 h-6" />,
    category: "IA & Automação",
    benefits: [
      "Processamento de linguagem natural",
      "Respostas contextuais e explicáveis",
      "Múltiplas formas de perguntar",
      "Histórico de conversas inteligente",
    ],
    demo: "Converse com seus dados",
  },
  {
    id: "smart-alerts",
    name: "Alertas Inteligentes",
    description:
      "Receba notificações automáticas sobre mudanças importantes nos seus dados.",
    icon: <Zap className="w-6 h-6" />,
    category: "Automação",
    benefits: [
      "Alertas baseados em padrões",
      "Notificações personalizadas",
      "Integração com WhatsApp/Email/Slack",
      "Regras customizáveis por usuário",
    ],
  },
  {
    id: "data-integration",
    name: "Integrações Automáticas",
    description: "Conecte automaticamente com suas fontes de dados existentes.",
    icon: <Database className="w-6 h-6" />,
    category: "Integrações",
    benefits: [
      "Conectores prontos para ERPs brasileiros",
      "APIs de marketplaces (Mercado Livre, Amazon)",
      "Integração com gateways de pagamento",
      "Importação automática de planilhas",
    ],
  },
  {
    id: "ocr-processing",
    name: "OCR Inteligente",
    description:
      "Extraia dados automaticamente de notas fiscais, recibos e documentos.",
    icon: <FileText className="w-6 h-6" />,
    category: "Processamento",
    benefits: [
      "Reconhecimento de texto em português",
      "Extração automática de valores",
      "Categorização inteligente",
      "Validação de dados fiscais",
    ],
  },
  {
    id: "real-time-reports",
    name: "Relatórios em Tempo Real",
    description:
      "Acesse dados atualizados constantemente sem precisar aguardar processos manuais.",
    icon: <TrendingUp className="w-6 h-6" />,
    category: "Relatórios",
    benefits: [
      "Atualização automática de dados",
      "Relatórios programados",
      "Exportação em múltiplos formatos",
      "Compartilhamento seguro",
    ],
  },
  {
    id: "user-management",
    name: "Gestão de Usuários",
    description:
      "Controle granular de acessos e permissões por função e departamento.",
    icon: <Users className="w-6 h-6" />,
    category: "Segurança",
    benefits: [
      "Perfis de acesso personalizados",
      "Controle por departamento",
      "Auditoria completa de ações",
      "LGPD compliance automático",
    ],
  },
  {
    id: "data-security",
    name: "Segurança de Dados",
    description:
      "Proteção avançada dos seus dados com criptografia e compliance total.",
    icon: <Shield className="w-6 h-6" />,
    category: "Segurança",
    benefits: [
      "Criptografia end-to-end",
      "Servidores AWS Brasil",
      "Backups automáticos",
      "Conformidade LGPD",
    ],
  },
  {
    id: "custom-workflows",
    name: "Workflows Personalizados",
    description:
      "Crie fluxos de trabalho automatizados específicos para seu negócio.",
    icon: <Settings className="w-6 h-6" />,
    category: "Automação",
    benefits: [
      "Fluxos visuais drag & drop",
      "Integração com ferramentas externas",
      "Aprovações automatizadas",
      "Relatórios de execução",
    ],
  },
];

const categories = [
  "Todas",
  "IA & Automação",
  "Visualização",
  "Integrações",
  "Processamento",
  "Relatórios",
  "Segurança",
  "Automação",
];

export function FeaturesPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const filteredFeatures =
    selectedCategory === "Todas"
      ? features
      : features.filter((feature) => feature.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <a
              href="/"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Home
            </a>
            <span className="text-gray-400">/</span>
            <span className="text-blue-600 font-medium">Funcionalidades</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <Section className="text-center mb-16">
          <FadeUp>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4">Recursos Completos</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Tudo que você precisa para
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block">
                  transformar dados em decisões
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Explore todas as funcionalidades que fazem do Luminaris a
                solução completa para business intelligence das empresas
                brasileiras.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CTA variant="primary" size="lg">
                  Começar Trial Grátis
                </CTA>
                <CTA variant="secondary" size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Ver Demo
                </CTA>
              </div>
            </motion.div>
          </FadeUp>
        </Section>

        {/* Category Filter */}
        <Section className="mb-12">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => (
              <CTA
                key={category}
                variant={
                  selectedCategory === category ? "primary" : "secondary"
                }
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </CTA>
            ))}
          </div>

          <div className="text-center">
            <p className="text-muted-foreground">
              {filteredFeatures.length} funcionalidades encontradas
            </p>
          </div>
        </Section>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredFeatures.map((feature, index) => (
            <FadeUp key={feature.id}>
              <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                <Card
                  className="p-6 h-full cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedFeature(feature)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {feature.category}
                      </Badge>
                      <h3 className="text-lg font-semibold mb-2">
                        {feature.name}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {feature.benefits
                      .slice(0, 2)
                      .map((benefit, benefitIndex) => (
                        <li
                          key={benefitIndex}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    {feature.benefits.length > 2 && (
                      <li className="text-sm text-blue-600 font-medium">
                        +{feature.benefits.length - 2} benefícios
                      </li>
                    )}
                  </ul>

                  {feature.demo && (
                    <CTA variant="ghost" size="sm" className="w-full">
                      {feature.demo}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </CTA>
                  )}
                </Card>
              </motion.div>
            </FadeUp>
          ))}
        </div>

        {/* Feature Detail Modal */}
        <AnimatePresence>
          {selectedFeature && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedFeature(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white">
                      {selectedFeature.icon}
                    </div>
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-2">
                        {selectedFeature.category}
                      </Badge>
                      <h2 className="text-2xl font-bold mb-2">
                        {selectedFeature.name}
                      </h2>
                      <p className="text-muted-foreground">
                        {selectedFeature.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Benefícios</h3>
                    <ul className="space-y-3">
                      {selectedFeature.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedFeature.demo && (
                    <div className="flex gap-3">
                      <CTA variant="primary" className="flex-1">
                        {selectedFeature.demo}
                      </CTA>
                      <CTA
                        variant="secondary"
                        onClick={() => setSelectedFeature(null)}
                      >
                        Fechar
                      </CTA>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Use Cases Section */}
        <Section className="mb-16">
          <FadeUp>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Feito para seu segmento
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Cada funcionalidade foi desenvolvida pensando nos desafios
                específicos de diferentes tipos de negócio.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  segment: "Varejo",
                  features: [
                    "OCR de NFes",
                    "Controle de estoque",
                    "Análise de vendas",
                  ],
                  icon: "🛍️",
                },
                {
                  segment: "Serviços",
                  features: [
                    "Agendamento",
                    "Controle financeiro",
                    "Gestão de clientes",
                  ],
                  icon: "💼",
                },
                {
                  segment: "Indústria",
                  features: ["Controle produção", "Qualidade", "Logística"],
                  icon: "🏭",
                },
                {
                  segment: "Tecnologia",
                  features: [
                    "Integrações API",
                    "Analytics avançado",
                    "Automação",
                  ],
                  icon: "💻",
                },
              ].map((segment, index) => (
                <Card key={index} className="p-6 text-center">
                  <div className="text-4xl mb-4">{segment.icon}</div>
                  <h3 className="text-lg font-semibold mb-3">
                    {segment.segment}
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {segment.features.map((feature, featureIndex) => (
                      <li key={featureIndex}>• {feature}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </FadeUp>
        </Section>

        {/* CTA Section */}
        <Section className="text-center">
          <FadeUp>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold mb-4">
                Pronto para conhecer todas as funcionalidades?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Comece seu teste gratuito e explore tudo que o Luminaris pode
                fazer pelo seu negócio.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CTA variant="primary" size="lg">
                  Experimentar Gratuitamente
                </CTA>
                <CTA variant="secondary" size="lg">
                  Agendar Demonstração
                </CTA>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Sem cartão de crédito • Cancele quando quiser • Suporte completo
              </p>
            </motion.div>
          </FadeUp>
        </Section>
      </div>
    </div>
  );
}

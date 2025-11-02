// Composition System - Section Renderer
// Dynamic section rendering component with error boundaries and performance optimization

"use client";

import React, { Suspense, lazy, ComponentType } from "react";
import { SectionConfig } from "./page-composer";
import { getSectionDefinition } from "./section-registry";
import { validateEnvelopeStrict } from "./composer-validation";
import { SectionConditions } from "./ports";
import { SectionErrorBoundary } from "../section-error-boundary";
import type { ComposedPricingData } from "@/domains/marketing/types/pricing.types";

// Rich placeholder components for sections with example content
const PillarsPlaceholder = () => (
  <section
    id="pillars"
    className="py-16 md:py-20 bg-linear-to-br from-primary/5 to-accent/5"
  >
    <div className="container mx-auto px-4 md:px-6 max-w-7xl">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
          Os 3 Pilares da Nossa Plataforma
        </h2>
        <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
          Nossa solução é construída sobre três fundamentos que garantem
          resultados consistentes
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-neutral-100">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="text-xl font-semibold mb-4 text-neutral-900">
            IA Conversacional
          </h3>
          <p className="text-neutral-600 leading-relaxed">
            Entenda seu negócio através de conversas naturais. Nossa IA aprende
            seus processos e gera sistemas personalizados automaticamente.
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-neutral-100">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
            <span className="text-2xl">⚡</span>
          </div>
          <h3 className="text-xl font-semibold mb-4 text-neutral-900">
            Automação Inteligente
          </h3>
          <p className="text-neutral-600 leading-relaxed">
            Conecte sistemas, processe dados e gere insights automaticamente.
            Elimine tarefas manuais e foque no crescimento.
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-neutral-100">
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold mb-4 text-neutral-900">
            Dashboards Dinâmicos
          </h3>
          <p className="text-neutral-600 leading-relaxed">
            Visualize dados em tempo real com dashboards personalizáveis. Tome
            decisões baseadas em informações atualizadas.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const HowItWorksPlaceholder = () => (
  <section id="how-it-works" className="py-16 md:py-20">
    <div className="container mx-auto px-4 md:px-6 max-w-7xl">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
          De 3 Passos Simples ao Sistema Completo
        </h2>
        <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
          Transforme sua ideia em um sistema operacional em minutos
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
            1
          </div>
          <h3 className="text-xl font-semibold mb-4 text-neutral-900">
            Entrevista do Negócio
          </h3>
          <p className="text-neutral-600 leading-relaxed">
            Nossa IA conversa com você sobre seus processos, identifica
            oportunidades e entende seus objetivos específicos.
          </p>
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500">
              Exemplo: &ldquo;Como funciona seu processo de vendas?&rdquo;
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
            2
          </div>
          <h3 className="text-xl font-semibold mb-4 text-neutral-900">
            Geração Automática
          </h3>
          <p className="text-neutral-600 leading-relaxed">
            Com base na conversa, geramos automaticamente tabelas,
            relacionamentos, dashboards e integrações necessárias.
          </p>
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500">
              Tabelas, APIs, Dashboards prontos
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
            3
          </div>
          <h3 className="text-xl font-semibold mb-4 text-neutral-900">
            Operação Inteligente
          </h3>
          <p className="text-neutral-600 leading-relaxed">
            Use linguagem natural para consultar dados, gerar relatórios ou
            tomar decisões baseadas em insights.
          </p>
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500">
              &ldquo;Mostre vendas por região este mês&rdquo;
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mt-12">
        <div className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
          Experimente Agora - Demo Interativo
        </div>
      </div>
    </div>
  </section>
);

const VerticalsPlaceholder = () => (
  <section id="verticals" className="py-16 md:py-20 bg-neutral-50">
    <div className="container mx-auto px-4 md:px-6 max-w-7xl">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
          Para Todos os Segmentos de Negócio
        </h2>
        <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
          Nossa plataforma se adapta às necessidades específicas de cada
          vertical
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-neutral-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-blue-600">🏪</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Varejo & E-commerce
            </h3>
          </div>
          <p className="text-neutral-600 mb-4">
            Gestão de estoque, análise de vendas, CRM integrado e dashboards de
            performance.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              Controle de Estoque
            </span>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              Análise de Vendas
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-neutral-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-green-600">🏥</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Saúde & Bem-estar
            </h3>
          </div>
          <p className="text-neutral-600 mb-4">
            Gestão de pacientes, agendamentos, faturamento médico e relatórios
            regulatórios.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
              Gestão de Pacientes
            </span>
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
              Faturamento
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-neutral-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-purple-600">🏭</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Manufatura & Indústria
            </h3>
          </div>
          <p className="text-neutral-600 mb-4">
            Controle de produção, gestão de cadeia de suprimentos e análise de
            eficiência.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
              Controle de Produção
            </span>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
              SCM
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-neutral-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-orange-600">🍽️</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Alimentação & Restaurantes
            </h3>
          </div>
          <p className="text-neutral-600 mb-4">
            Gestão de cardápios, controle de estoque, análise de vendas por
            período.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
              Gestão de Cardápios
            </span>
            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
              Vendas
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-neutral-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-red-600">🚚</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Logística & Transporte
            </h3>
          </div>
          <p className="text-neutral-600 mb-4">
            Rastreamento de cargas, otimização de rotas, gestão de frota.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
              Rastreamento
            </span>
            <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
              Gestão de Frota
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-neutral-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-teal-600">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Educação & Treinamento
            </h3>
          </div>
          <p className="text-neutral-600 mb-4">
            Gestão acadêmica, acompanhamento de alunos, relatórios de
            performance.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs">
              Gestão Acadêmica
            </span>
            <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs">
              Relatórios
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ProofTractionPlaceholder = () => (
  <section id="proof-traction" className="py-16 md:py-20">
    <div className="container mx-auto px-4 md:px-6 max-w-7xl">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
          Resultados que Você Pode Medir
        </h2>
        <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
          Veja como empresas reais transformaram seus negócios com nossa
          plataforma
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
              <span className="text-green-600 text-xl">📈</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">+127%</div>
              <div className="text-sm text-green-600">Aumento em Receita</div>
            </div>
          </div>
          <p className="text-green-800 mb-4">
            &ldquo;Implementamos em 2 semanas e vimos resultados imediatos nas
            vendas.&rdquo;
          </p>
          <div className="text-sm text-green-600">
            — João Silva, CEO - TechStart Brasil
          </div>
        </div>

        <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
              <span className="text-blue-600 text-xl">⚡</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700">75%</div>
              <div className="text-sm text-blue-600">Redução no Tempo</div>
            </div>
          </div>
          <p className="text-blue-800 mb-4">
            &ldquo;Eliminamos 20 horas semanais de trabalho manual com
            relatórios.&rdquo;
          </p>
          <div className="text-sm text-blue-600">
            — Maria Santos, COO - DataCorp
          </div>
        </div>

        <div className="bg-linear-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-100">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
              <span className="text-purple-600 text-xl">🎯</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-700">89%</div>
              <div className="text-sm text-purple-600">
                Precisão nas Decisões
              </div>
            </div>
          </div>
          <p className="text-purple-800 mb-4">
            &ldquo;Agora tomamos decisões baseadas em dados reais, não
            intuição.&rdquo;
          </p>
          <div className="text-sm text-purple-600">
            — Carlos Oliveira, CFO - GrowthTech
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-neutral-100">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              Estudo de Caso: Empresa de E-commerce
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600">✓</span>
                </div>
                <span className="text-neutral-700">ROI de 340% em 6 meses</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600">✓</span>
                </div>
                <span className="text-neutral-700">
                  Redução de 60% em custos operacionais
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600">✓</span>
                </div>
                <span className="text-neutral-700">
                  Aumento de 45% na satisfação do cliente
                </span>
              </div>
            </div>
          </div>
          <div className="bg-neutral-100 rounded-xl p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-neutral-600 text-sm">
                Gráfico de crescimento mostrando antes/depois da implementação
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const PricingPresalePlaceholder = () => (
  <section
    id="pricing-presale"
    className="py-16 md:py-20 bg-linear-to-br from-primary/5 to-accent/5"
  >
    <div className="container mx-auto px-4 md:px-6 max-w-7xl">
      <div className="text-center mb-12 md:mb-16">
        <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
          🚀 Programa Early Adopters
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
          Seja um dos Primeiros 100 Clientes
        </h2>
        <p className="text-lg text-neutral-600 max-w-3xl mx-auto mb-8">
          Garanta benefícios exclusivos que nunca mais serão oferecidos
        </p>

        <div className="bg-card rounded-2xl p-6 md:p-8 shadow-lg border border-neutral-100 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              R$ 147/mês
            </div>
            <div className="text-neutral-600 mb-4">
              Plano Profissional Completo
            </div>
            <div className="flex justify-center mb-6">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                50% OFF vitalício
              </span>
            </div>
            <div className="space-y-2 text-sm text-neutral-600 mb-6">
              <div>✅ Implementação gratuita (24h)</div>
              <div>✅ Suporte VIP por 6 meses</div>
              <div>✅ Garantia de 30 dias</div>
              <div>✅ Acesso antecipado a features</div>
            </div>
            <button className="w-full bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Garantir Minha Vaga
            </button>
            <p className="text-xs text-neutral-500 mt-3">
              Apenas 23 vagas restantes
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-2xl">💰</span>
          </div>
          <h3 className="font-semibold mb-2">Preço Especial</h3>
          <p className="text-sm text-neutral-600">
            50% de desconto vitalício para os primeiros 100
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-2xl">🚀</span>
          </div>
          <h3 className="font-semibold mb-2">Implementação Rápida</h3>
          <p className="text-sm text-neutral-600">
            Setup completo em até 24 horas
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-purple-600 text-2xl">👨‍💼</span>
          </div>
          <h3 className="font-semibold mb-2">Suporte Exclusivo</h3>
          <p className="text-sm text-neutral-600">
            Acesso direto ao time de desenvolvimento
          </p>
        </div>
      </div>
    </div>
  </section>
);

const LeadFormPlaceholder = () => (
  <section id="lead-form" className="py-16 md:py-20 bg-neutral-900 text-white">
    <div className="container mx-auto px-4 md:px-6 max-w-4xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Pronto para Transformar seu Negócio?
        </h2>
        <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
          Agende uma demonstração personalizada e veja como podemos ajudar sua
          empresa
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              placeholder="Seu nome completo"
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              E-mail Corporativo *
            </label>
            <input
              type="email"
              placeholder="seu@email.com.br"
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Empresa *</label>
            <input
              type="text"
              placeholder="Nome da empresa"
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cargo</label>
            <select className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary focus:outline-none">
              <option value="">Selecione seu cargo</option>
              <option value="ceo">CEO / Diretor</option>
              <option value="coo">COO / Operações</option>
              <option value="cfo">CFO / Financeiro</option>
              <option value="cto">CTO / Tecnologia</option>
              <option value="gerente">Gerente</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Setor da Empresa
            </label>
            <select className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary focus:outline-none">
              <option value="">Selecione o setor</option>
              <option value="varejo">Varejo & E-commerce</option>
              <option value="saude">Saúde & Bem-estar</option>
              <option value="manufatura">Manufatura & Indústria</option>
              <option value="servicos">Serviços</option>
              <option value="tecnologia">Tecnologia</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Porte da Empresa
            </label>
            <select className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-primary focus:outline-none">
              <option value="">Selecione o porte</option>
              <option value="startup">Startup (até 10 funcionários)</option>
              <option value="pequena">Pequena (11-50 funcionários)</option>
              <option value="media">Média (51-200 funcionários)</option>
              <option value="grande">Grande (200+ funcionários)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mensagem</label>
            <textarea
              rows={4}
              placeholder="Conte-nos sobre seus desafios atuais..."
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-start">
            <input type="checkbox" id="consent" className="mt-1 mr-3" />
            <label htmlFor="consent" className="text-sm text-neutral-300">
              Concordo em receber comunicações sobre produtos e ofertas. *
            </label>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <button className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
          Agendar Demonstração Gratuita
        </button>
        <p className="text-neutral-400 text-sm mt-3">
          Sem compromisso • Resposta em até 2 horas • Demo personalizada
        </p>
      </div>
    </div>
  </section>
);

// Lazy-loaded section components for code splitting
// Using index.ts imports for consistency and proper tree-shaking
const sectionComponents = {
  // Canonical composition-first components
  Hero: lazy(() =>
    import("../../components/sections/hero")
      .then((module) => ({ default: module.Hero }))
      .catch((error) => {
        console.error("Failed to lazy load Hero component:", error);
        return {
          default: () => (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Erro ao carregar Hero</p>
            </div>
          ),
        };
      }),
  ),
  Benefits: lazy(() =>
    import("../../components/sections/benefits")
      .then((module) => ({ default: module.Benefits }))
      .catch((error) => {
        console.error("Failed to lazy load Benefits component:", error);
        return {
          default: () => (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Erro ao carregar Benefits</p>
            </div>
          ),
        };
      }),
  ),
  Features: lazy(() =>
    import("../../components/sections/features")
      .then((module) => ({ default: module.Features }))
      .catch((error) => {
        console.error("Failed to lazy load Features component:", error);
        return {
          default: () => (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Erro ao carregar Features</p>
            </div>
          ),
        };
      }),
  ),
  Pricing: lazy(() =>
    import("../../components/sections/pricing")
      .then((module) => ({ default: module.Pricing }))
      .catch((error) => {
        console.error("Failed to lazy load Pricing component:", error);
        return {
          default: () => (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Erro ao carregar Pricing</p>
            </div>
          ),
        };
      }),
  ),
  SocialProof: lazy(() =>
    import("../../components/sections/social-proof")
      .then((module) => ({ default: module.SocialProof }))
      .catch((error) => {
        console.error("Failed to lazy load SocialProof component:", error);
        return {
          default: () => (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Erro ao carregar SocialProof</p>
            </div>
          ),
        };
      }),
  ),
  Demo: lazy(() =>
    import("../../components/sections/demo")
      .then((module) => ({ default: module.Demo }))
      .catch((error) => {
        console.error("Failed to lazy load Demo component:", error);
        return {
          default: () => (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Erro ao carregar Demo</p>
            </div>
          ),
        };
      }),
  ),
  Faq: lazy(() =>
    import("../../components/sections/faq")
      .then((module) => ({ default: module.Faq }))
      .catch((error) => {
        console.error("Failed to lazy load Faq component:", error);
        return {
          default: () => (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Erro ao carregar Faq</p>
            </div>
          ),
        };
      }),
  ),
  FinalCta: lazy(() =>
    import("../../components/sections/final-cta")
      .then((module) => ({ default: module.FinalCta }))
      .catch((error) => {
        console.error("Failed to lazy load FinalCta component:", error);
        return {
          default: () => (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Erro ao carregar FinalCta</p>
            </div>
          ),
        };
      }),
  ),
  Footer: lazy(() =>
    import("../../components/sections/footer")
      .then((module) => ({ default: module.Footer }))
      .catch((error) => {
        console.error("Failed to lazy load Footer component:", error);
        return {
          default: () => (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Erro ao carregar Footer</p>
            </div>
          ),
        };
      }),
  ),
} as const;

// ===== CONDITION CHECKING =====

// Condition types for section rendering
// Using SectionConditions from ports

// Check if section conditions are met
async function checkSectionConditions(
  conditions: SectionConditions,
): Promise<boolean> {
  // Check breakpoint condition
  if (conditions.breakpoint) {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const isTablet =
      typeof window !== "undefined" &&
      window.innerWidth >= 768 &&
      window.innerWidth < 1024;
    const isDesktop =
      typeof window !== "undefined" && window.innerWidth >= 1024;

    switch (conditions.breakpoint) {
      case "mobile":
        if (!isMobile) return false;
        break;
      case "tablet":
        if (!isTablet) return false;
        break;
      case "desktop":
        if (!isDesktop) return false;
        break;
    }
  }

  // Check experiment condition
  if (conditions.experiment) {
    try {
      // Import experiment manager dynamically to avoid circular dependencies
      const { experimentManager } = await import(
        "../ab-testing/ab-testing-framework"
      );

      // Check if experiment is active
      const experimentStatus = experimentManager.getExperimentStatus(
        conditions.experiment.experimentId,
      );
      if (
        !experimentStatus ||
        experimentStatus.experiment.status !== "running"
      ) {
        return false;
      }

      // Check if user is eligible for experiment
      if (conditions.experiment.userContext) {
        const isEligible = experimentManager
          .getActiveExperiments(conditions.experiment.userContext)
          .some((exp) => exp.id === conditions.experiment!.experimentId);
        if (!isEligible) {
          return false;
        }
      }

      // Check specific variant condition if specified
      if (conditions.experiment.variant) {
        const assignedVariant = experimentManager.assignVariant(
          conditions.experiment.experimentId,
        );
        if (
          !assignedVariant ||
          assignedVariant.id !== conditions.experiment.variant
        ) {
          return false;
        }
      }
    } catch (error) {
      console.warn("Failed to check experiment condition:", error);
      // Fallback to not showing experiment content
      return false;
    }
  }

  // Check user type condition
  if (conditions.userType) {
    try {
      // Import analytics for user type detection
      const { advancedAnalytics } = await import(
        "../analytics/advanced-analytics"
      );

      // Get current user context from analytics
      const currentJourney = advancedAnalytics.getCurrentJourney();
      let userType = "new"; // default

      if (currentJourney) {
        // Determine user type based on journey data
        const sessionCount = currentJourney.pages?.length || 0;
        const totalTime =
          currentJourney.pages?.reduce(
            (sum, pv) => sum + (pv.timeSpent || 0),
            0,
          ) || 0;
        const hasConversions =
          currentJourney.conversions && currentJourney.conversions.length > 0;

        if (hasConversions) {
          userType = "converted";
        } else if (sessionCount > 3 || totalTime > 300000) {
          // 3+ sessions or 5+ minutes
          userType = "engaged";
        } else if (sessionCount > 1) {
          userType = "returning";
        }
        // else remains 'new'
      }

      // Check if user type matches condition
      if (conditions.userType !== userType) {
        return false;
      }
    } catch (error) {
      console.warn("Failed to detect user type:", error);
      // Fallback to 'new' user assumption
      if (conditions.userType !== "new") {
        return false;
      }
    }
  }

  return true;
}

// Section renderer props
interface SectionRendererProps {
  section?: SectionConfig;
  index?: number;
  onSectionError?: (sectionId: string, error: Error) => void;
  onSectionLoad?: (sectionId: string, loadTime: number) => void;
}

// Using the robust SectionErrorBoundary from lib/section-error-boundary.tsx

// Loading fallback for sections
const SectionLoadingFallback = ({ sectionId }: { sectionId: string }) => (
  <div className="section-loading" data-section={sectionId}>
    <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
  </div>
);

// Main section renderer component
function SectionRendererInner({
  section,
  index = 0,
  onSectionError,
  onSectionLoad,
}: SectionRendererProps) {
  const startTime = performance.now();
  const [conditionsMet, setConditionsMet] = React.useState<boolean | null>(
    null,
  );
  const [hasCheckedConditions, setHasCheckedConditions] = React.useState(false);

  // Check conditions asynchronously
  React.useEffect(() => {
    if (!section || hasCheckedConditions) return;

    const checkConditions = async () => {
      if (section.conditions) {
        const met = await checkSectionConditions(section.conditions);
        setConditionsMet(met);
      } else {
        setConditionsMet(true);
      }
      setHasCheckedConditions(true);
    };

    checkConditions();
  }, [section, hasCheckedConditions]);

  // Track load performance
  React.useEffect(() => {
    if (!section) return;
    const loadTime = performance.now() - startTime;
    onSectionLoad?.(section.id, loadTime);
  }, [section?.id, onSectionLoad]); // Remove startTime and section from deps to prevent infinite loop

  // Handle undefined section gracefully
  if (!section) {
    console.warn("SectionRenderer called with undefined section");
    return React.createElement(
      "div",
      {
        "data-testid": "section-error",
        className: "p-4 bg-red-50 border border-red-200 rounded",
      },
      "Section configuration missing",
    );
  }

  // Wait for condition check
  if (!hasCheckedConditions) {
    return React.createElement("div", {
      "data-testid": "section-loading",
      className: "animate-pulse bg-gray-200 h-32 rounded-lg",
    });
  }

  // Check conditions result
  if (conditionsMet === false) {
    return null;
  }

  // Get section definition for validation
  const sectionDef = getSectionDefinition(section.id);

  // Validate section configuration
  if (!sectionDef) {
    console.warn(
      `[SectionRenderer] Section definition not found for: ${section.id}`,
    );
    return null;
  }

  // Get component dynamically
  const Component = sectionComponents[
    section.component as keyof typeof sectionComponents
  ] as ComponentType<unknown>;

  if (!Component) {
    console.error(
      `[SectionRenderer] Component not found for section: ${section.component}. Available:`,
      Object.keys(sectionComponents),
    );
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded">
        <h3 className="text-red-800 font-bold">
          Erro: Componente não encontrado
        </h3>
        <p className="text-red-600">Component: {section.component}</p>
        <p className="text-red-600">Section: {section.id}</p>
      </div>
    );
  }

  // Check if section is enabled (default true)
  if (section.enabled === false) {
    return null;
  }

  // Render section with robust error boundary and suspense
  return (
    <Suspense fallback={<SectionLoadingFallback sectionId={section.id} />}>
      <SectionErrorBoundary sectionId={section.id} onError={onSectionError}>
        {(() => {
          // Validate envelope at runtime (defensive against personalization/cache mutations)
          const isValid = validateEnvelopeStrict(section.content);
          if (!isValid.success) {
            console.error(
              `[SectionRenderer] Invalid envelope for ${section.id}:`,
              isValid.error,
            );
            throw new Error(
              `Invalid content envelope for section ${section.id}: ${isValid.error}`,
            );
          }

          return (
            <section
              id={section.id}
              role="region"
              aria-labelledby={`${section.id}-heading`}
              data-section={section.id}
              key={section.id}
            >
              <Component
                {...mapSectionData(section.id, section.content?.content || {})}
                headingId={`${section.id}-heading`}
              />
            </section>
          );
        })()}
      </SectionErrorBoundary>
    </Suspense>
  );
}

// Async wrapper component for SectionRenderer
export async function SectionRenderer(props: SectionRendererProps) {
  return <SectionRendererInner {...props} />;
}

// Mappers for domain data to component props
function mapPricingData(domainData: unknown): ComposedPricingData {
  const data = domainData as ComposedPricingData;

  if (!data?.content?.plans) return data;

  return {
    ...data,
    content: {
      ...data.content,
      plans: data.content.plans.map((plan) => ({
        ...plan,
        features:
          plan.features
            ?.map((feature) =>
              typeof feature === "string"
                ? { name: feature, included: true }
                : {
                    name: feature.name,
                    included: feature.included ?? true,
                    highlight: feature.highlight,
                  },
            )
            .filter(Boolean) || [],
      })),
    },
  };
}

function mapSectionData(sectionId: string, data: Record<string, unknown>) {
  switch (sectionId) {
    case "hero":
      // data comes from composer as { content: HeroContent, variant: HeroVariant }
      // component expects { content: HeroContent }
      return { content: data.content };
    case "benefits":
      // data comes from composer as { content: BenefitsContent, variant: BenefitsVariant }
      // component expects { content: BenefitsContent }
      return { content: data.content };
    case "features":
      // data comes from composer as { content: FeaturesContent, variant: FeaturesVariant }
      // component expects { content: FeaturesContent }
      return { content: data.content };
    case "pricing":
      // data comes from composer as { content: PricingContent, variant: PricingVariant }
      // component expects { content: PricingContent } but may need transformation
      return { content: mapPricingData(data.content) };
    case "social-proof":
      // data comes from composer as { content: SocialProofContent, variant: SocialProofVariant }
      // component expects { content: SocialProofContent }
      return { content: data.content };
    case "faq":
      // data comes from composer as { content: FaqContent, variant: FaqVariant }
      // component expects { content: FaqContent }
      return { content: data.content };
    case "demo":
      // data comes from composer as { content: DemoContent, variant: DemoVariant }
      // component expects { content: DemoContent }
      return { content: data.content };
    case "final-cta":
      // data comes from composer as { content: FinalCtaContent, variant: FinalCtaVariant }
      // component expects { content: FinalCtaContent }
      return { content: data.content };
    case "footer":
      // data comes from composer as { content: FooterContent, variant: FooterVariant }
      // component expects { content: FooterContent }
      return { content: data.content };
    case "pricing-presale":
      return mapPricingData(data);
    default:
      return data;
  }
}

// Utility to render multiple sections
export function renderSections(
  sections: SectionConfig[],
  onSectionError?: SectionRendererProps["onSectionError"],
) {
  return sections
    .filter((section) => section.enabled !== false)
    .map((section, index) => (
      <SectionRenderer
        key={section.id}
        section={section}
        index={index}
        onSectionError={onSectionError}
      />
    ));
}

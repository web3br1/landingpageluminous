"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Building,
  Target,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Users,
  DollarSign,
  Zap,
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { CTA } from "@/components/ui/cta-button-unified";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeUp } from "@/components/ui/fade-up";

interface SignupData {
  // Step 1: Profile
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  discoveryChannel: string;

  // Step 2: Company
  companyName: string;
  companySize: string;
  industry: string;
  location: string;

  // Step 3: Goals
  primaryGoal: string;
  challenges: string[];
  useCase: string;
  budget: string;

  // Step 4: Confirmation
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptMarketing: boolean;
  acceptPrivacy: boolean;
}

const initialData: SignupData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  discoveryChannel: "",
  companyName: "",
  companySize: "",
  industry: "",
  location: "",
  primaryGoal: "",
  challenges: [],
  useCase: "",
  budget: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  acceptMarketing: false,
  acceptPrivacy: false,
};

const steps = [
  { id: 1, title: "Perfil", icon: User, description: "Seus dados pessoais" },
  { id: 2, title: "Empresa", icon: Building, description: "Sobre sua empresa" },
  {
    id: 3,
    title: "Objetivos",
    icon: Target,
    description: "O que você quer alcançar",
  },
  {
    id: 4,
    title: "Confirmação",
    icon: CheckCircle,
    description: "Finalizar cadastro",
  },
];

const challenges = [
  "Análise manual de dados leva muito tempo",
  "Relatórios desatualizados ou incorretos",
  "Dificuldade em tomar decisões rápidas",
  "Falta de previsibilidade nos resultados",
  "Dados espalhados em várias ferramentas",
  "Sem insights acionáveis dos dados",
  "Relatórios complexos demais para stakeholders",
  "Custos altos com ferramentas de BI",
];

const industries = [
  "Varejo e E-commerce",
  "Serviços (salão, clínica, consultoria)",
  "Indústria e Manufatura",
  "Tecnologia e Software",
  "Financeiro e Contábil",
  "Saúde e Bem-estar",
  "Educação",
  "Outros",
];

const roles = [
  "CEO / Fundador",
  "Diretor / COO",
  "Gerente de Vendas",
  "Gerente Financeiro",
  "Analista de Dados",
  "Gerente de Operações",
  "Consultor",
  "Outro",
];

const discoveryChannels = [
  "Google / Busca",
  "Redes Sociais",
  "Indicação",
  "LinkedIn",
  "Blog / Artigo",
  "Evento / Webinar",
  "Parceiro",
  "Outro",
];

export function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SignupData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>(
    {},
  );
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("signup-progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        // Invalid data, ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("signup-progress", JSON.stringify(formData));
  }, [formData]);

  const validateStep = (step: number): boolean => {
    const newErrors = {} as { [key: string]: string | undefined };

    switch (step) {
      case 1:
        if (!formData.firstName.trim())
          newErrors.firstName = "Nome é obrigatório";
        if (!formData.lastName.trim())
          newErrors.lastName = "Sobrenome é obrigatório";
        if (!formData.email.trim()) newErrors.email = "E-mail é obrigatório";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
          newErrors.email = "E-mail inválido";
        if (!formData.phone.trim()) newErrors.phone = "Telefone é obrigatório";
        if (!formData.role) newErrors.role = "Cargo é obrigatório";
        break;

      case 2:
        if (!formData.companyName.trim())
          newErrors.companyName = "Nome da empresa é obrigatório";
        if (!formData.companySize)
          newErrors.companySize = "Porte da empresa é obrigatório";
        if (!formData.industry) newErrors.industry = "Setor é obrigatório";
        break;

      case 3:
        if (!formData.primaryGoal)
          newErrors.primaryGoal = "Objetivo principal é obrigatório";
        if (formData.challenges.length === 0)
          newErrors.challenges = "Selecione pelo menos um desafio";
        break;

      case 4:
        if (!formData.password) newErrors.password = "Senha é obrigatória";
        else if (formData.password.length < 8)
          newErrors.password = "Senha deve ter pelo menos 8 caracteres";
        if (!formData.confirmPassword)
          newErrors.confirmPassword = "Confirmação de senha é obrigatória";
        else if (formData.password !== formData.confirmPassword)
          newErrors.confirmPassword = "Senhas não coincidem";
        if (!formData.acceptTerms)
          newErrors.acceptTerms = "Aceitação dos termos é obrigatória";
        if (!formData.acceptPrivacy)
          newErrors.acceptPrivacy =
            "Aceitação da política de privacidade é obrigatória";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: keyof SignupData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleChallengeToggle = (challenge: string) => {
    setFormData((prev) => ({
      ...prev,
      challenges: prev.challenges.includes(challenge)
        ? prev.challenges.filter((c) => c !== challenge)
        : [...prev.challenges, challenge],
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Clear auto-save data
    localStorage.removeItem("signup-progress");

    setIsSubmitting(false);
    setIsSuccess(true);

    // Here you would integrate with your CRM/API
    console.log("Signup completed:", formData);
  };

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Conte-nos sobre você</h2>
              <p className="text-muted-foreground">
                Essas informações nos ajudam a personalizar sua experiência
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.firstName ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Seu primeiro nome"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Sobrenome *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lastName ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Seu sobrenome"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                E-mail corporativo *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="seu@email.com.br"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Telefone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="(11) 99999-9999"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Seu cargo *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.role ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Selecione seu cargo</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Como nos conheceu?
                </label>
                <select
                  value={formData.discoveryChannel}
                  onChange={(e) =>
                    handleInputChange("discoveryChannel", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Como nos conheceu?</option>
                  {discoveryChannels.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Sobre sua empresa</h2>
              <p className="text-muted-foreground">
                Essas informações nos ajudam a configurar dashboards específicos
                para seu negócio
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Nome da empresa *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                  className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.companyName ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Nome da sua empresa"
                />
              </div>
              {errors.companyName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.companyName}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Porte da empresa *
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) =>
                    handleInputChange("companySize", e.target.value)
                  }
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.companySize ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Selecione o porte</option>
                  <option value="1-10">1-10 funcionários</option>
                  <option value="11-50">11-50 funcionários</option>
                  <option value="51-200">51-200 funcionários</option>
                  <option value="201-500">201-500 funcionários</option>
                  <option value="500+">500+ funcionários</option>
                </select>
                {errors.companySize && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.companySize}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Setor de atuação *
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) =>
                    handleInputChange("industry", e.target.value)
                  }
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.industry ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Selecione o setor</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Localização
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cidade, Estado"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Seus objetivos</h2>
              <p className="text-muted-foreground">
                Conte-nos o que você quer alcançar para personalizarmos sua
                experiência
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Objetivo principal *
              </label>
              <select
                value={formData.primaryGoal}
                onChange={(e) =>
                  handleInputChange("primaryGoal", e.target.value)
                }
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.primaryGoal ? "border-red-300" : "border-gray-300"
                }`}
              >
                <option value="">Qual seu objetivo principal?</option>
                <option value="reduce-time">
                  Reduzir tempo em relatórios manuais
                </option>
                <option value="improve-decisions">
                  Tomar decisões mais assertivas
                </option>
                <option value="increase-revenue">
                  Aumentar receita e margem
                </option>
                <option value="optimize-operations">
                  Otimizar operações e processos
                </option>
                <option value="customer-insights">
                  Melhorar entendimento dos clientes
                </option>
                <option value="forecasting">
                  Implementar previsões e cenários
                </option>
              </select>
              {errors.primaryGoal && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.primaryGoal}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Principais desafios que enfrenta *
                <span className="text-muted-foreground text-xs ml-2">
                  (selecione todos que se aplicam)
                </span>
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                {challenges.map((challenge) => (
                  <label
                    key={challenge}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.challenges.includes(challenge)}
                      onChange={() => handleChallengeToggle(challenge)}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{challenge}</span>
                  </label>
                ))}
              </div>
              {errors.challenges && (
                <p className="text-red-500 text-sm mt-2">{errors.challenges}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Onde quer usar IA primeiro?
                </label>
                <select
                  value={formData.useCase}
                  onChange={(e) => handleInputChange("useCase", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma área</option>
                  <option value="crm">CRM e Gestão de Clientes</option>
                  <option value="erp">ERP e Controle Interno</option>
                  <option value="pricing">Precificação e Vendas</option>
                  <option value="inventory">Estoque e Compras</option>
                  <option value="financial">Análise Financeira</option>
                  <option value="marketing">Marketing e Campanhas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Orçamento mensal estimado
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => handleInputChange("budget", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma faixa</option>
                  <option value="0-500">Até R$ 500</option>
                  <option value="500-1000">R$ 500 - R$ 1.000</option>
                  <option value="1000-2000">R$ 1.000 - R$ 2.000</option>
                  <option value="2000+">Mais de R$ 2.000</option>
                  <option value="not-sure">Não tenho certeza</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">
                Quase lá! Crie sua senha
              </h2>
              <p className="text-muted-foreground">
                Configure sua conta e comece a usar o Luminaris
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Senha *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`w-full pr-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Crie uma senha forte"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                Mínimo 8 caracteres, incluindo letras e números
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirme sua senha *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={`w-full pr-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="Digite a senha novamente"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={(e) =>
                    handleInputChange("acceptTerms", e.target.checked)
                  }
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="acceptTerms"
                  className="text-sm leading-relaxed"
                >
                  Aceito os{" "}
                  <a href="/terms" className="text-blue-600 hover:underline">
                    Termos de Uso
                  </a>{" "}
                  do Luminaris *
                  {errors.acceptTerms && (
                    <span className="text-red-500 block">
                      {errors.acceptTerms}
                    </span>
                  )}
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptPrivacy"
                  checked={formData.acceptPrivacy}
                  onChange={(e) =>
                    handleInputChange("acceptPrivacy", e.target.checked)
                  }
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="acceptPrivacy"
                  className="text-sm leading-relaxed"
                >
                  Aceito a{" "}
                  <a href="/privacy" className="text-blue-600 hover:underline">
                    Política de Privacidade
                  </a>{" "}
                  e o tratamento de dados conforme LGPD *
                  {errors.acceptPrivacy && (
                    <span className="text-red-500 block">
                      {errors.acceptPrivacy}
                    </span>
                  )}
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptMarketing"
                  checked={formData.acceptMarketing}
                  onChange={(e) =>
                    handleInputChange("acceptMarketing", e.target.checked)
                  }
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="acceptMarketing"
                  className="text-sm leading-relaxed"
                >
                  Aceito receber comunicações de marketing sobre produtos,
                  atualizações e dicas do Luminaris
                </label>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">
                    Seus dados estão seguros
                  </p>
                  <p className="text-blue-800">
                    Utilizamos criptografia de ponta e estamos 100% em
                    conformidade com a LGPD. Você pode cancelar a qualquer
                    momento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Luminaris</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="hidden sm:flex">
              Criar Conta
            </Badge>
            <CTA variant="secondary" size="sm">
              Já tem conta? Login
            </CTA>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="signup-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-4xl mx-auto">
                {/* Progress Header */}
                <Section className="mb-8">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                      Complete seu cadastro
                    </h1>
                    <p className="text-xl text-muted-foreground">
                      Em poucos minutos você terá acesso completo ao Luminaris
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                              step.id <= currentStep
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-gray-300 text-gray-400"
                            }`}
                          >
                            <step.icon className="w-5 h-5" />
                          </div>
                          <div className="ml-3 hidden md:block">
                            <div
                              className={`text-sm font-medium ${
                                step.id <= currentStep
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {step.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {step.description}
                            </div>
                          </div>
                          {index < steps.length - 1 && (
                            <div
                              className={`w-12 h-0.5 mx-4 ${
                                step.id < currentStep
                                  ? "bg-blue-600"
                                  : "bg-gray-300"
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </Section>

                {/* Form Content */}
                <Card className="p-8 mb-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <CTA
                    variant="secondary"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </CTA>

                  <div className="text-sm text-muted-foreground">
                    Passo {currentStep} de {steps.length}
                  </div>

                  {currentStep < steps.length ? (
                    <CTA
                      variant="primary"
                      onClick={handleNext}
                      className="flex items-center gap-2"
                    >
                      Próximo
                      <ArrowRight className="w-4 h-4" />
                    </CTA>
                  ) : (
                    <CTA
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        <>
                          Criar Conta
                          <CheckCircle className="w-4 h-4" />
                        </>
                      )}
                    </CTA>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto text-center"
            >
              <Card className="p-12">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h1 className="text-3xl font-bold mb-4">
                    Conta criada com sucesso! 🎉
                  </h1>
                  <p className="text-xl text-muted-foreground mb-6">
                    Bem-vindo ao Luminaris! Sua conta foi criada e você já pode
                    começar a usar a plataforma.
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Confira seu e-mail</div>
                      <div className="text-sm text-muted-foreground">
                        Enviamos as instruções de confirmação
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">
                        Configure seu primeiro dashboard
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Use nosso assistente guiado
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">
                        Conecte suas fontes de dados
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Integre planilhas, APIs e sistemas
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <CTA variant="primary" size="lg">
                    Acessar Minha Conta
                  </CTA>
                  <CTA variant="secondary" size="lg">
                    Agendar Orientação
                  </CTA>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Precisa de ajuda?</strong> Nossa equipe está
                    disponível por chat e WhatsApp. Você tem 14 dias para testar
                    tudo gratuitamente.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

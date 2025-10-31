"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isEventTargetWithValue } from "@/lib/utils/dom-type-guards";
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
  Zap,
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { CTA } from "@/components/ui/cta-button-unified";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("signup-progress", JSON.stringify(formData));
  }, [formData]);

  // Função auxiliar para validar step 1
  const validateStep1 = (): { [key: string]: string | undefined } => {
    const errors = {} as { [key: string]: string | undefined };
    if (!formData.firstName.trim()) errors.firstName = "Nome é obrigatório";
    if (!formData.lastName.trim()) errors.lastName = "Sobrenome é obrigatório";
    if (!formData.email.trim()) errors.email = "E-mail é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "E-mail inválido";
    if (!formData.phone.trim()) errors.phone = "Telefone é obrigatório";
    if (!formData.role) errors.role = "Cargo é obrigatório";
    return errors;
  };

  // Função auxiliar para validar step 2
  const validateStep2 = (): { [key: string]: string | undefined } => {
    const errors = {} as { [key: string]: string | undefined };
    if (!formData.companyName.trim())
      errors.companyName = "Nome da empresa é obrigatório";
    if (!formData.companySize)
      errors.companySize = "Porte da empresa é obrigatório";
    if (!formData.industry) errors.industry = "Setor é obrigatório";
    return errors;
  };

  // Função auxiliar para validar step 3
  const validateStep3 = (): { [key: string]: string | undefined } => {
    const errors = {} as { [key: string]: string | undefined };
    if (!formData.primaryGoal)
      errors.primaryGoal = "Objetivo principal é obrigatório";
    if (formData.challenges.length === 0)
      errors.challenges = "Selecione pelo menos um desafio";
    return errors;
  };

  // Função auxiliar para validar step 4
  const validateStep4 = (): { [key: string]: string | undefined } => {
    const errors = {} as { [key: string]: string | undefined };
    if (!formData.password) errors.password = "Senha é obrigatória";
    else if (formData.password.length < 8)
      errors.password = "Senha deve ter pelo menos 8 caracteres";
    if (!formData.confirmPassword)
      errors.confirmPassword = "Confirmação de senha é obrigatória";
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Senhas não coincidem";
    if (!formData.acceptTerms)
      errors.acceptTerms = "Aceitação dos termos é obrigatória";
    if (!formData.acceptPrivacy)
      errors.acceptPrivacy =
        "Aceitação da política de privacidade é obrigatória";
    return errors;
  };

  const validateStep = (step: number): boolean => {
    let newErrors = {} as { [key: string]: string | undefined };

    switch (step) {
      case 1:
        newErrors = validateStep1();
        break;
      case 2:
        newErrors = validateStep2();
        break;
      case 3:
        newErrors = validateStep3();
        break;
      case 4:
        newErrors = validateStep4();
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

  const handleInputChange = (
    field: keyof SignupData,
    value: string | number | boolean,
  ) => {
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

  // Função auxiliar para renderizar step 1
  const renderStep1 = () => (
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
            onChange={(e) => {
              if (isEventTargetWithValue(e.target)) {
                handleInputChange("firstName", e.target.value);
              }
            }}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.firstName ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Seu primeiro nome"
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sobrenome *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => {
              if (isEventTargetWithValue(e.target)) {
                handleInputChange("lastName", e.target.value);
              }
            }}
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
        <label className="block text-sm font-medium mb-2">E-mail *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => {
              if (isEventTargetWithValue(e.target)) {
                handleInputChange("email", e.target.value);
              }
            }}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.email ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="seu@email.com"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Telefone *</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => {
              if (isEventTargetWithValue(e.target)) {
                handleInputChange("phone", e.target.value);
              }
            }}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.phone ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="(11) 99999-9999"
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Cargo *</label>
        <select
          value={formData.role || ""}
          onChange={(e) => {
              if (isEventTargetWithValue(e.target)) {
                handleInputChange("role", e.target.value);
              }
            }}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.role ? "border-red-300" : "border-gray-300"
          }`}
        >
          <option value="">Selecione seu cargo</option>
          <option value="founder">Fundador/CEO</option>
          <option value="cto">CTO/Técnico</option>
          <option value="manager">Gerente</option>
          <option value="analyst">Analista</option>
          <option value="other">Outro</option>
        </select>
        {errors.role && (
          <p className="text-red-500 text-sm mt-1">{errors.role}</p>
        )}
      </div>
    </div>
  );

  // Função auxiliar para renderizar step 2
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Sobre sua empresa</h2>
        <p className="text-muted-foreground">
          Precisamos de algumas informações sobre sua empresa
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Nome da empresa *
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => handleInputChange("companyName", e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.companyName ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="Nome da empresa"
        />
        {errors.companyName && (
          <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Porte da empresa *
        </label>
        <select
          value={formData.companySize || ""}
          onChange={(e) => handleInputChange("companySize", e.target.value)}
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
          <p className="text-red-500 text-sm mt-1">{errors.companySize}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Setor *</label>
        <select
          value={formData.industry || ""}
          onChange={(e) => handleInputChange("industry", e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.industry ? "border-red-300" : "border-gray-300"
          }`}
        >
          <option value="">Selecione o setor</option>
          <option value="technology">Tecnologia</option>
          <option value="finance">Finanças</option>
          <option value="healthcare">Saúde</option>
          <option value="education">Educação</option>
          <option value="retail">Varejo</option>
          <option value="other">Outro</option>
        </select>
        {errors.industry && (
          <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
        )}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      default:
        return <div>Step não encontrado</div>;
    }
  };
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Cadastro Conclu�do!
          </h1>
          <p className="text-gray-600 mb-6">
            Bem-vindo ao Luminaris! Sua conta foi criada com sucesso.
          </p>
          <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700">
            Acessar Minha Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Criar Conta Gratuita
            </h1>
            <p className="text-gray-600">
              Junte-se a milhares de empresas que confiam no Luminaris
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {steps.map((step, index) => (
                <div key={index} className="flex-1 h-2 rounded" />
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              {steps.map((step, index) => (
                <span
                  key={index}
                  className={
                    index + 1 === currentStep ? "text-blue-600 font-medium" : ""
                  }
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            {renderStepContent()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="px-6 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              {currentStep < steps.length ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Pr�ximo
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Criando Conta..." : "Criar Conta"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

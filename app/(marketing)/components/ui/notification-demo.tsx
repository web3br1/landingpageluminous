"use client";

import { useState } from "react";
import { CtaButton } from "./cta-button-unified";
import { notify } from "@/lib/notifications";
import { useErrorHandler } from "@/lib/error-handling";

export function NotificationDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const { handleError, withErrorHandling } = useErrorHandler();

  // Exemplo de ação que pode falhar
  const simulateApiCall = async (shouldFail: boolean = false) => {
    setIsLoading(true);

    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (shouldFail) {
      throw new Error("Falha na comunicação com o servidor");
    }

    return { success: true, message: "Dados carregados com sucesso!" };
  };

  // Exemplo usando withErrorHandling
  const handleSafeApiCall = withErrorHandling(async () => {
    const result = await simulateApiCall(false);
    notify.success("Sucesso!", result.message);
  });

  const handleApiCallWithError = async () => {
    try {
      await simulateApiCall(true);
      notify.success("Tudo certo!", "Operação realizada com sucesso.");
    } catch (error) {
      handleError(error, "notify");
    }
  };

  // Exemplos de diferentes tipos de notificações
  const showSuccess = () => {
    notify.success(
      "Cadastro realizado!",
      "Seus dados foram salvos com sucesso. Você receberá um email de confirmação.",
      {
        action: {
          label: "Ver perfil",
          onClick: () => console.log("Navegando para perfil..."),
        },
      },
    );
  };

  const showError = () => {
    notify.error(
      "Erro ao salvar dados",
      "Ocorreu um problema ao processar suas informações. Tente novamente.",
      {
        action: {
          label: "Tentar novamente",
          onClick: () => showSuccess(),
        },
      },
    );
  };

  const showWarning = () => {
    notify.warning(
      "Atenção necessária",
      "Seus dados expiram em 7 dias. Renove sua assinatura para continuar usando o serviço.",
    );
  };

  const showInfo = () => {
    notify.info(
      "Nova funcionalidade disponível",
      "Agora você pode exportar relatórios em PDF diretamente da dashboard.",
      {
        action: {
          label: "Saiba mais",
          onClick: () => console.log("Abrindo modal de ajuda..."),
        },
      },
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        Sistema de Notificações - Demonstração
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Tipos de Notificação */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Tipos de Notificação</h3>
          <div className="space-y-2">
            <CtaButton
              onClick={showSuccess}
              className="w-full justify-start bg-green-500 hover:bg-green-600"
            >
              ✅ Sucesso
            </CtaButton>
            <CtaButton
              onClick={showError}
              className="w-full justify-start bg-red-500 hover:bg-red-600"
            >
              ❌ Erro
            </CtaButton>
            <CtaButton
              onClick={showWarning}
              className="w-full justify-start bg-yellow-500 hover:bg-yellow-600"
            >
              ⚠️ Aviso
            </CtaButton>
            <CtaButton
              onClick={showInfo}
              className="w-full justify-start bg-blue-500 hover:bg-blue-600"
            >
              ℹ️ Informação
            </CtaButton>
          </div>
        </div>

        {/* Tratamento de Erros */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Tratamento de Erros</h3>
          <div className="space-y-2">
            <CtaButton
              onClick={handleSafeApiCall}
              disabled={isLoading}
              className="w-full justify-start"
            >
              {isLoading ? "Carregando..." : "API Call Seguro"}
            </CtaButton>
            <CtaButton
              onClick={handleApiCallWithError}
              className="w-full justify-start bg-orange-500 hover:bg-orange-600"
            >
              Simular Erro
            </CtaButton>
          </div>
        </div>
      </div>

      {/* Exemplos de Uso */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Como usar:</h3>
        <div className="space-y-2 text-sm font-mono bg-white p-3 rounded border">
          <div className="text-green-600">{/* Notificações simples */}</div>
          <div>notify.success(&apos;Título&apos;, &apos;Mensagem&apos;)</div>
          <div>notify.error(&apos;Erro&apos;, &apos;Descrição&apos;)</div>
          <div>notify.warning(&apos;Aviso&apos;, &apos;Informação&apos;)</div>
          <div>notify.info(&apos;Info&apos;, &apos;Detalhes&apos;)</div>

          <div className="text-green-600 mt-4">{/* Com ações */}</div>
          <div>
            notify.success(&apos;Sucesso!&apos;, &apos;Dados salvos&apos;, {`{`}
            )
          </div>
          <div className="ml-4">
            action: {`{label: 'Ver resultado', onClick: callback}`}
          </div>
          <div>{`}`})</div>

          <div className="text-green-600 mt-4">{/* Tratamento de erros */}</div>
          <div>
            const {`{`} handleError {`}`} = useErrorHandler()
          </div>
          <div>
            catch (error) {`{`} handleError(error) {`}`}
          </div>
        </div>
      </div>
    </div>
  );
}

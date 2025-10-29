export default function TestStylesPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Teste de Estilos
        </h1>

        <div className="space-y-6">
          {/* Teste básico de Tailwind */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
              Classes Básicas
            </h2>
            <p className="text-base text-neutral-700 dark:text-neutral-300">
              Este texto deve ter cores do design system.
            </p>
            <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Botão Primário
            </button>
          </div>

          {/* Teste de cores específicas */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">
              Cores do Design System
            </h2>
            <div className="flex space-x-4 mb-4">
              <div className="w-16 h-16 bg-primary rounded"></div>
              <div className="w-16 h-16 bg-secondary rounded"></div>
              <div className="w-16 h-16 bg-accent rounded"></div>
              <div className="w-16 h-16 bg-neutral-500 rounded"></div>
            </div>
            <p className="text-muted-foreground">
              Quadrados devem ter cores específicas
            </p>
          </div>

          {/* Teste de componentes UI */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Componentes UI</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-success">Sucesso</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-warning rounded-full"></div>
                <span className="text-warning">Aviso</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                <span className="text-destructive">Erro</span>
              </div>
            </div>
          </div>

          {/* Teste de responsividade */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Responsividade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-primary/10 p-4 rounded">Coluna 1</div>
              <div className="bg-secondary/10 p-4 rounded">Coluna 2</div>
              <div className="bg-accent/10 p-4 rounded">Coluna 3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

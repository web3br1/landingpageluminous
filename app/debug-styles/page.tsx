export default function DebugStylesPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <h1 className="text-4xl font-bold text-primary mb-8">Debug Styles</h1>

      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-4">Tailwind Classes</h2>
          <p className="text-muted-foreground">
            This text should be styled with design system colors.
          </p>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md mt-4">
            Primary Button
          </button>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md mt-4 ml-4">
            Secondary Button
          </button>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-4">Design System Colors</h2>
          <div className="flex space-x-4">
            <div className="w-16 h-16 bg-primary rounded"></div>
            <div className="w-16 h-16 bg-secondary rounded"></div>
            <div className="w-16 h-16 bg-accent rounded"></div>
            <div className="w-16 h-16 bg-neutral-500 rounded"></div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-4">Typography</h2>
          <p className="text-base">Base text (Inter font)</p>
          <p className="text-lg font-semibold">Large semibold text</p>
          <p className="text-xl">Extra large text</p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-4">CSS Variables</h2>
          <div
            className="p-4"
            style={{ backgroundColor: "var(--color-primary-500)" }}
          >
            <p className="text-white">
              This should be purple from CSS variables
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";


interface ThemeDebugProps {
  className?: string;
}

export function ThemeDebug({ className = "" }: ThemeDebugProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "colors" | "contrast" | "accessibility"
  >("colors");
  const [selectedColors, setSelectedColors] = useState({
    background: "bg-background",
    foreground: "text-foreground",
    primary: "bg-primary",
    secondary: "bg-secondary",
  });

  // Theme color combinations to test
  const colorCombinations = [
    {
      name: "Primary on Background",
      bg: "bg-background",
      text: "text-primary",
      description: "Primary color on background",
    },
    {
      name: "Foreground on Background",
      bg: "bg-background",
      text: "text-foreground",
      description: "Normal text on background",
    },
    {
      name: "White on Primary",
      bg: "bg-primary",
      text: "text-white",
      description: "White text on primary",
    },
    {
      name: "Foreground on Card",
      bg: "bg-card",
      text: "text-card-foreground",
      description: "Text on card background",
    },
    {
      name: "Primary on Card",
      bg: "bg-card",
      text: "text-primary",
      description: "Primary text on card",
    },
    {
      name: "Accent on Background",
      bg: "bg-background",
      text: "text-accent",
      description: "Accent color on background",
    },
  ];

  // Contrast calculation (simplified)
  const getContrastRatio = (bgColor: string, textColor: string): number => {
    // This is a simplified contrast calculation
    // In a real implementation, you'd use proper color math
    const bgBrightness = bgColor.includes("background")
      ? 0.95
      : bgColor.includes("card")
        ? 0.98
        : bgColor.includes("primary")
          ? 0.4
          : 0.9;

    const textBrightness = textColor.includes("white")
      ? 1
      : textColor.includes("foreground")
        ? 0.2
        : textColor.includes("primary")
          ? 0.4
          : 0.8;

    return Math.abs(bgBrightness - textBrightness) > 0.5 ? 4.5 : 2.1;
  };

  // Accessibility checks
  const accessibilityChecks = [
    {
      name: "WCAG AA (Normal Text)",
      requirement: "4.5:1",
      check: (ratio: number) => ratio >= 4.5,
      description: "Minimum contrast for normal text",
    },
    {
      name: "WCAG AA (Large Text)",
      requirement: "3:1",
      check: (ratio: number) => ratio >= 3,
      description: "Minimum contrast for large text (18pt+ or 14pt bold)",
    },
    {
      name: "WCAG AAA (Normal Text)",
      requirement: "7:1",
      check: (ratio: number) => ratio >= 7,
      description: "Enhanced contrast for normal text",
    },
  ];

  if (process.env.NODE_ENV === "production") return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-4 right-4 z-50 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-mono hover:bg-neutral-800 transition"
        title="Toggle Theme Debug"
      >
        🎨 Theme
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed top-16 right-4 z-50 bg-white border border-neutral-300 rounded-lg shadow-lg p-0 max-w-lg max-h-[80vh] overflow-hidden">
          {/* Header with tabs */}
          <div className="border-b border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">
              🎨 Theme & Color Debug
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("colors")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activeTab === "colors"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Colors
              </button>
              <button
                onClick={() => setActiveTab("contrast")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activeTab === "contrast"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Contrast
              </button>
              <button
                onClick={() => setActiveTab("accessibility")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activeTab === "accessibility"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                A11y
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {activeTab === "colors" && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  Test different color combinations from your theme
                </p>

                {/* Color palette */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Backgrounds</h4>
                    <div className="space-y-1">
                      {[
                        "bg-background",
                        "bg-card",
                        "bg-primary",
                        "bg-secondary",
                        "bg-accent",
                        "bg-neutral-100",
                        "bg-neutral-900",
                      ].map((color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setSelectedColors((prev) => ({
                              ...prev,
                              background: color,
                            }))
                          }
                          className={`w-full text-left px-3 py-2 rounded text-sm border transition ${
                            selectedColors.background === color
                              ? "border-primary bg-primary/5"
                              : "border-neutral-200 hover:border-neutral-300"
                          } ${color} ${color === "bg-neutral-900" ? "text-white" : "text-black"}`}
                        >
                          {color.replace("bg-", "")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Text Colors</h4>
                    <div className="space-y-1">
                      {[
                        "text-foreground",
                        "text-primary",
                        "text-secondary",
                        "text-accent",
                        "text-white",
                        "text-neutral-900",
                        "text-neutral-600",
                      ].map((color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setSelectedColors((prev) => ({
                              ...prev,
                              foreground: color,
                            }))
                          }
                          className={`w-full text-left px-3 py-2 rounded text-sm border transition ${
                            selectedColors.foreground === color
                              ? "border-primary bg-primary/5"
                              : "border-neutral-200 hover:border-neutral-300"
                          } ${color}`}
                        >
                          {color.replace("text-", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Test combination */}
                <div className="border border-neutral-200 rounded p-4">
                  <h4 className="font-medium text-sm mb-3">Test Combination</h4>
                  <div
                    className={`w-full h-20 rounded-lg flex items-center justify-center text-lg font-medium ${selectedColors.background} ${selectedColors.foreground}`}
                  >
                    Sample Text
                  </div>
                  <div className="mt-2 text-xs text-neutral-500 font-mono">
                    {selectedColors.background} + {selectedColors.foreground}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "contrast" && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  Test contrast ratios between different color combinations
                </p>

                {colorCombinations.map((combo) => {
                  const contrastRatio = getContrastRatio(combo.bg, combo.text);
                  const isGood = contrastRatio >= 4.5;

                  return (
                    <div
                      key={combo.name}
                      className="border border-neutral-200 rounded p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{combo.name}</h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-mono ${
                            isGood
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {contrastRatio.toFixed(1)}:1
                        </span>
                      </div>
                      <div
                        className={`${combo.bg} ${combo.text} px-3 py-2 rounded text-sm`}
                      >
                        {combo.description}
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">
                        {combo.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "accessibility" && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  WCAG compliance checks for your color combinations
                </p>

                {colorCombinations.map((combo) => {
                  const contrastRatio = getContrastRatio(combo.bg, combo.text);

                  return (
                    <div
                      key={combo.name}
                      className="border border-neutral-200 rounded p-3"
                    >
                      <h4 className="font-medium text-sm mb-2">{combo.name}</h4>

                      <div className="space-y-2">
                        {accessibilityChecks.map((check) => (
                          <div
                            key={check.name}
                            className="flex items-center justify-between text-xs"
                          >
                            <span>{check.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-neutral-500">
                                {check.requirement}
                              </span>
                              <span
                                className={`px-2 py-1 rounded font-mono ${
                                  check.check(contrastRatio)
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {check.check(contrastRatio) ? "✓" : "✗"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 text-xs text-neutral-500">
                        Current ratio:{" "}
                        <strong>{contrastRatio.toFixed(1)}:1</strong>
                      </div>
                    </div>
                  );
                })}

                {/* Accessibility guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <h4 className="font-medium text-sm text-blue-900 mb-2">
                    📋 WCAG Guidelines
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>
                      • <strong>AA Level:</strong> 4.5:1 for normal text, 3:1
                      for large text
                    </li>
                    <li>
                      • <strong>AAA Level:</strong> 7:1 for normal text, 4.5:1
                      for large text
                    </li>
                    <li>
                      • Focus indicators should have 3:1 contrast against
                      adjacent colors
                    </li>
                    <li>• Test on different devices and lighting conditions</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

"use client";

// ===== VISUAL EXPERIMENT BUILDER =====
// Componente principal que orquestra todo o experiment builder

import React from "react";
import { useExperimentBuilder } from "./use-experiment-builder";
import { ExperimentCanvas } from "./experiment-canvas";
import { Toolbar, useKeyboardShortcuts } from "./toolbar";
import { VariantPanel } from "./variant-panel";
import { PropertyPanel } from "./property-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface VisualExperimentBuilderProps {
  experimentId?: string;
  onSave?: () => void;
  onPublish?: () => void;
}

export function VisualExperimentBuilder({
  experimentId,
  onSave,
  onPublish,
}: VisualExperimentBuilderProps) {
  const { state, actions, computed } = useExperimentBuilder(experimentId);

  // Keyboard shortcuts
  useKeyboardShortcuts(
    actions.undo,
    actions.redo,
    computed.canUndo,
    computed.canRedo,
  );

  // Handle save
  const handleSave = async () => {
    const success = await actions.saveExperiment();
    if (success && onSave) {
      onSave();
    }
  };

  // Handle publish
  const handlePublish = async () => {
    const success = await actions.publishExperiment();
    if (success && onPublish) {
      onPublish();
    }
  };

  // Loading state
  if (!state.experiment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando experiment builder...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <Toolbar
        mode={state.mode}
        viewMode={state.viewMode}
        onModeChange={actions.setMode}
        onViewModeChange={actions.setViewMode}
        onUndo={actions.undo}
        onRedo={actions.redo}
        canUndo={computed.canUndo}
        canRedo={computed.canRedo}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area - takes most space */}
        <div className="flex-1 flex flex-col">
          {computed.selectedVariant ? (
            <ExperimentCanvas
              variant={computed.selectedVariant}
              mode={state.mode}
              viewMode={state.viewMode}
              selectedElementId={state.selectedElementId}
              onElementSelect={actions.selectElement}
              onElementUpdate={actions.updateElement}
              onElementAdd={actions.addElement}
              onElementDelete={actions.deleteElement}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="p-8 text-center max-w-md">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma variante selecionada
                </h3>
                <p className="text-gray-600 mb-4">
                  Selecione uma variante no painel lateral para começar a
                  editar.
                </p>
                <Button onClick={actions.addVariant}>
                  Criar primeira variante
                </Button>
              </Card>
            </div>
          )}
        </div>

        {/* Variant panel */}
        <VariantPanel
          variants={state.variants}
          selectedVariantId={state.selectedVariantId}
          onVariantSelect={actions.selectVariant}
          onVariantAdd={actions.addVariant}
          onVariantDelete={actions.deleteVariant}
          onVariantUpdate={actions.updateVariant}
        />

        {/* Property panel - only show when element is selected */}
        {computed.selectedElement && (computed.selectedElement as any).id && (
          <PropertyPanel
            element={computed.selectedElement as any}
            onUpdate={(updates) => {
              if (state.selectedElementId) {
                actions.updateElement(state.selectedElementId, updates);
              }
            }}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="h-10 bg-white border-t border-gray-200 px-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {/* Experiment status */}
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Experimento válido</span>
          </div>

          {/* Dirty state indicator */}
          {state.isDirty && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Alterações não salvas</span>
            </div>
          )}

          {/* Element count */}
          <span className="text-gray-600">
            {computed.selectedVariant?.elements.length || 0} elementos
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Save status */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={!computed.isValid}
          >
            Salvar Rascunho
          </Button>

          <Button
            size="sm"
            onClick={handlePublish}
            disabled={!computed.isValid}
          >
            Publicar Experimento
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook para usar o builder em outros componentes
export { useExperimentBuilder } from "./use-experiment-builder";

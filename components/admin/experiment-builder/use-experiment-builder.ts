// ===== VISUAL EXPERIMENT BUILDER HOOK =====
// Hook personalizado para gerenciar estado do Visual Experiment Builder

import { useReducer, useCallback, useEffect } from "react";
import {
  builderReducer,
  initialBuilderState,
  selectors,
  actions,
} from "./builder-reducer";
import { BuilderState, VisualVariant } from "./types";
import {
  experimentEngine,
  type Experiment,
} from "@/lib/ab-testing/experiment-engine";

export function useExperimentBuilder(experimentId?: string) {
  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);

  // Carregar experimento existente se ID fornecido
  useEffect(() => {
    if (experimentId) {
      loadExperiment(experimentId);
    } else {
      initializeNewExperiment();
    }
  }, [experimentId]);

  // Auto-save do estado
  useEffect(() => {
    if (state.isDirty) {
      const timer = setTimeout(() => {
        saveDraft();
      }, 2000); // Auto-save após 2 segundos de inatividade

      return () => clearTimeout(timer);
    }
  }, [state.isDirty, state]);

  const loadExperiment = useCallback(async (id: string) => {
    try {
      // Simular carregamento de experimento existente
      const experiment = experimentEngine
        .getAllExperiments()
        .find((exp) => exp.id === id);

      if (experiment) {
        // Converter experimento existente para formato visual
        const visualVariants: VisualVariant[] = experiment.variants.map(
          (variant) => ({
            ...variant,
            elements: [], // TODO: Carregar elementos salvos
            canvasSize: { width: 1200, height: 800 }, // TODO: Carregar tamanho salvo
          }),
        );

        dispatch(actions.setExperiment(experiment));
        // Adicionar variantes uma por uma
        visualVariants.forEach((variant) => {
          dispatch(actions.addVariant(variant));
        });

        // Selecionar primeira variante
        if (visualVariants.length > 0) {
          dispatch(actions.selectVariant(visualVariants[0].id));
        }
      } else {
        initializeNewExperiment();
      }
    } catch (error) {
      console.error("Failed to load experiment:", error);
      initializeNewExperiment();
    }
  }, []);

  const initializeNewExperiment = useCallback(() => {
    // Criar experimento básico
    const defaultExperiment = {
      name: "Novo Experimento",
      description: "Descrição do experimento",
      status: "draft" as const,
      trafficAllocation: 100,
      variants: [],
      goals: {
        primary: "cta_click",
        secondary: ["hero_scroll", "time_on_page"],
      },
      minSampleSize: 1000,
      statisticalSignificance: 95,
    };

    dispatch(actions.setExperiment(defaultExperiment));

    // Criar variante de controle automaticamente
    const controlVariant: VisualVariant = {
      id: "control",
      name: "Controle",
      weight: 50,
      elements: [],
      canvasSize: { width: 1200, height: 800 },
    };

    dispatch(actions.addVariant(controlVariant));
  }, []);

  const saveDraft = useCallback(() => {
    if (!selectors.isValidExperiment(state)) {
      console.warn("Experiment is not valid for saving");
      return;
    }

    try {
      // Salvar no localStorage por enquanto
      const draftKey = `experiment_draft_${state.experiment?.id || "new"}`;
      localStorage.setItem(draftKey, JSON.stringify(state));
      console.log("Draft saved successfully");

      // Reset dirty flag
      // Note: This would normally be handled by a proper state update
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }, [state]);

  const saveExperiment = useCallback(async (): Promise<boolean> => {
    if (!selectors.isValidExperiment(state)) {
      console.error("Experiment is not valid");
      return false;
    }

    try {
      // Converter estado visual para formato do experiment engine
      const experimentData: Omit<Experiment, "id"> = {
        name: state.experiment!.name!,
        description: state.experiment!.description,
        status: state.experiment!.status || "draft",
        trafficAllocation: state.experiment!.trafficAllocation || 100,
        variants: state.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          weight: variant.weight,
          content: {
            // TODO: Converter elementos visuais para content estruturado
            elements: variant.elements,
          },
        })),
        goals: state.experiment!.goals!,
        startDate: state.experiment!.startDate,
        endDate: state.experiment!.endDate,
        minSampleSize: state.experiment!.minSampleSize,
        statisticalSignificance: state.experiment!.statisticalSignificance,
      };

      // Salvar via experiment engine
      const experimentId = experimentEngine.createExperiment(experimentData);

      // Limpar draft
      const draftKey = `experiment_draft_${state.experiment?.id || "new"}`;
      localStorage.removeItem(draftKey);

      console.log("Experiment saved successfully:", experimentId);
      return true;
    } catch (error) {
      console.error("Failed to save experiment:", error);
      return false;
    }
  }, [state]);

  const publishExperiment = useCallback(async (): Promise<boolean> => {
    if (!selectors.isValidExperiment(state)) {
      console.error("Experiment is not valid for publishing");
      return false;
    }

    try {
      // Salvar primeiro
      const saved = await saveExperiment();
      if (!saved) return false;

      // Publicar (mudar status para active)
      const experimentId = state.experiment?.id;
      if (experimentId) {
        experimentEngine.updateExperiment(experimentId, {
          status: "active",
          startDate: new Date(),
        });

        console.log("Experiment published successfully");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to publish experiment:", error);
      return false;
    }
  }, [state, saveExperiment]);

  // Actions expostas
  const builderActions = {
    // Experiment actions
    setExperiment: (experiment: Partial<Experiment>) =>
      dispatch(actions.setExperiment(experiment)),
    saveExperiment,
    publishExperiment,

    // Variant actions
    addVariant: () => {
      const variantNumber = state.variants.length + 1;
      const newVariant: VisualVariant = {
        id: `variant_${variantNumber}`,
        name: `Variante ${variantNumber}`,
        weight: Math.max(10, Math.floor(100 / (state.variants.length + 1))),
        elements: [],
        canvasSize: { width: 1200, height: 800 },
      };
      dispatch(actions.addVariant(newVariant));
    },

    updateVariant: (id: string, updates: Partial<VisualVariant>) =>
      dispatch(actions.updateVariant(id, updates)),

    deleteVariant: (id: string) => dispatch(actions.deleteVariant(id)),

    selectVariant: (id: string) => dispatch(actions.selectVariant(id)),

    // Element actions
    selectElement: (elementId: string | null) =>
      dispatch(actions.selectElement(elementId)),

    updateElement: (elementId: string, updates: any) => {
      const variantId = state.selectedVariantId;
      if (variantId) {
        dispatch(actions.updateElement(variantId, elementId, updates));
      }
    },

    addElement: (element: any) => {
      const variantId = state.selectedVariantId;
      if (variantId) {
        dispatch(actions.addElement(variantId, element));
      }
    },

    deleteElement: (elementId: string) => {
      const variantId = state.selectedVariantId;
      if (variantId) {
        dispatch(actions.deleteElement(variantId, elementId));
      }
    },

    // UI actions
    setMode: (mode: any) => dispatch(actions.setMode(mode)),

    setViewMode: (viewMode: any) => dispatch(actions.setViewMode(viewMode)),

    undo: () => dispatch(actions.undo()),

    redo: () => dispatch(actions.redo()),
  };

  // Computed values
  const computed = {
    selectedVariant: selectors.getSelectedVariant(state),
    selectedElement: selectors.getSelectedElement(state),
    canUndo: selectors.canUndo(state),
    canRedo: selectors.canRedo(state),
    isValid: selectors.isValidExperiment(state),
  };

  return {
    state,
    actions: builderActions,
    computed,
  };
}

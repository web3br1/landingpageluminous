// ===== VISUAL EXPERIMENT BUILDER REDUCER =====
// State management para o Visual Experiment Builder

import { BuilderState, BuilderAction, VisualVariant } from "./types";

// Estado inicial
export const initialBuilderState: BuilderState = {
  experiment: null,
  variants: [],
  selectedVariantId: null,
  selectedElementId: null,
  mode: "design",
  viewMode: "desktop",
  isDirty: false,
  undoStack: [],
  redoStack: [],
};

// Reducer principal
export function builderReducer(
  state: BuilderState,
  action: BuilderAction,
): BuilderState {
  switch (action.type) {
    case "SET_EXPERIMENT": {
      const newState = {
        ...state,
        experiment: action.payload,
        isDirty: true,
      };
      return saveToUndoStack(newState);
    }

    case "ADD_VARIANT": {
      const newVariants = [...state.variants, action.payload];
      const newState = {
        ...state,
        variants: newVariants,
        selectedVariantId: action.payload.id,
        isDirty: true,
      };
      return saveToUndoStack(newState);
    }

    case "UPDATE_VARIANT": {
      const newVariants = state.variants.map((variant) =>
        variant.id === action.payload.id
          ? { ...variant, ...action.payload.updates }
          : variant,
      );
      const newState = {
        ...state,
        variants: newVariants,
        isDirty: true,
      };
      return saveToUndoStack(newState);
    }

    case "DELETE_VARIANT": {
      const newVariants = state.variants.filter(
        (variant) => variant.id !== action.payload,
      );
      const newSelectedVariantId =
        state.selectedVariantId === action.payload
          ? newVariants[0]?.id || null
          : state.selectedVariantId;

      const newState = {
        ...state,
        variants: newVariants,
        selectedVariantId: newSelectedVariantId,
        selectedElementId: null, // Clear element selection when variant is deleted
        isDirty: true,
      };
      return saveToUndoStack(newState);
    }

    case "SELECT_VARIANT": {
      return {
        ...state,
        selectedVariantId: action.payload,
        selectedElementId: null, // Clear element selection when switching variants
      };
    }

    case "SELECT_ELEMENT": {
      return {
        ...state,
        selectedElementId: action.payload,
      };
    }

    case "UPDATE_ELEMENT": {
      const newVariants = state.variants.map((variant) => {
        if (variant.id === action.payload.variantId) {
          const newElements = variant.elements.map((element) =>
            element.id === action.payload.elementId
              ? { ...element, ...action.payload.updates }
              : element,
          );
          return { ...variant, elements: newElements };
        }
        return variant;
      });

      const newState = {
        ...state,
        variants: newVariants,
        isDirty: true,
      };
      return saveToUndoStack(newState);
    }

    case "ADD_ELEMENT": {
      const newVariants = state.variants.map((variant) => {
        if (variant.id === action.payload.variantId) {
          return {
            ...variant,
            elements: [...variant.elements, action.payload.element],
          };
        }
        return variant;
      });

      const newState = {
        ...state,
        variants: newVariants,
        selectedElementId: action.payload.element.id,
        isDirty: true,
      };
      return saveToUndoStack(newState);
    }

    case "DELETE_ELEMENT": {
      const newVariants = state.variants.map((variant) => {
        if (variant.id === action.payload.variantId) {
          return {
            ...variant,
            elements: variant.elements.filter(
              (element) => element.id !== action.payload.elementId,
            ),
          };
        }
        return variant;
      });

      const newSelectedElementId =
        state.selectedElementId === action.payload.elementId
          ? null
          : state.selectedElementId;

      const newState = {
        ...state,
        variants: newVariants,
        selectedElementId: newSelectedElementId,
        isDirty: true,
      };
      return saveToUndoStack(newState);
    }

    case "SET_MODE": {
      return {
        ...state,
        mode: action.payload,
        selectedElementId:
          action.payload === "preview" ? null : state.selectedElementId,
      };
    }

    case "SET_VIEW_MODE": {
      return {
        ...state,
        viewMode: action.payload,
      };
    }

    case "UNDO": {
      if (state.undoStack.length === 0) return state;

      const previousState = state.undoStack[state.undoStack.length - 1];
      const newUndoStack = state.undoStack.slice(0, -1);

      return {
        ...previousState,
        undoStack: newUndoStack,
        redoStack: [state, ...state.redoStack],
        isDirty: true,
      };
    }

    case "REDO": {
      if (state.redoStack.length === 0) return state;

      const nextState = state.redoStack[0];
      const newRedoStack = state.redoStack.slice(1);

      return {
        ...nextState,
        undoStack: [...state.undoStack, state],
        redoStack: newRedoStack,
        isDirty: true,
      };
    }

    case "SAVE_STATE": {
      return saveToUndoStack(state);
    }

    default:
      return state;
  }
}

// Função auxiliar para salvar estado no undo stack
function saveToUndoStack(state: BuilderState): BuilderState {
  const cleanState = {
    ...state,
    undoStack: [],
    redoStack: [],
  };

  return {
    ...state,
    undoStack: [...state.undoStack, cleanState].slice(-50), // Keep last 50 states
    redoStack: [],
  };
}

// Selectors para acessar partes do estado
export const selectors = {
  getSelectedVariant: (state: BuilderState): VisualVariant | null => {
    return state.variants.find((v) => v.id === state.selectedVariantId) || null;
  },

  getSelectedElement: (state: BuilderState): any => {
    const variant = selectors.getSelectedVariant(state);
    if (!variant || !state.selectedElementId) return null;

    return (
      variant.elements.find((e) => e.id === state.selectedElementId) || null
    );
  },

  canUndo: (state: BuilderState): boolean => {
    return state.undoStack.length > 0;
  },

  canRedo: (state: BuilderState): boolean => {
    return state.redoStack.length > 0;
  },

  getVariantById: (
    state: BuilderState,
    variantId: string,
  ): VisualVariant | null => {
    return state.variants.find((v) => v.id === variantId) || null;
  },

  isValidExperiment: (state: BuilderState): boolean => {
    return !!(
      state.experiment?.name &&
      state.experiment?.goals?.primary &&
      state.variants.length >= 2 &&
      state.variants.every((v) => v.elements.length > 0)
    );
  },
};

// Action creators para facilitar uso
export const actions = {
  setExperiment: (experiment: Partial<any>) => ({
    type: "SET_EXPERIMENT" as const,
    payload: experiment,
  }),

  addVariant: (variant: VisualVariant) => ({
    type: "ADD_VARIANT" as const,
    payload: variant,
  }),

  updateVariant: (id: string, updates: Partial<VisualVariant>) => ({
    type: "UPDATE_VARIANT" as const,
    payload: { id, updates },
  }),

  deleteVariant: (id: string) => ({
    type: "DELETE_VARIANT" as const,
    payload: id,
  }),

  selectVariant: (id: string) => ({
    type: "SELECT_VARIANT" as const,
    payload: id,
  }),

  selectElement: (elementId: string | null) => ({
    type: "SELECT_ELEMENT" as const,
    payload: elementId,
  }),

  updateElement: (variantId: string, elementId: string, updates: any) => ({
    type: "UPDATE_ELEMENT" as const,
    payload: { variantId, elementId, updates },
  }),

  addElement: (variantId: string, element: any) => ({
    type: "ADD_ELEMENT" as const,
    payload: { variantId, element },
  }),

  deleteElement: (variantId: string, elementId: string) => ({
    type: "DELETE_ELEMENT" as const,
    payload: { variantId, elementId },
  }),

  setMode: (mode: any) => ({
    type: "SET_MODE" as const,
    payload: mode,
  }),

  setViewMode: (viewMode: any) => ({
    type: "SET_VIEW_MODE" as const,
    payload: viewMode,
  }),

  undo: () => ({ type: "UNDO" as const }),

  redo: () => ({ type: "REDO" as const }),

  saveState: () => ({ type: "SAVE_STATE" as const }),
};

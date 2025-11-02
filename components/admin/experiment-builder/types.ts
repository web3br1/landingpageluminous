// ===== VISUAL EXPERIMENT BUILDER TYPES =====
// Tipos e interfaces para o Visual Experiment Builder

import {
  Experiment,
  ExperimentVariant,
} from "@/lib/ab-testing/experiment-engine";

// Estados do builder
export type BuilderMode = "design" | "preview" | "compare";

// Modos de visualização
export type ViewMode = "desktop" | "tablet" | "mobile";

// Tipos de elementos editáveis
export type EditableElementType =
  | "text"
  | "heading"
  | "button"
  | "image"
  | "link"
  | "container"
  | "hero"
  | "section";

// Elemento editável na tela
export interface EditableElement {
  id: string;
  type: EditableElementType;
  content: unknown;
  styles: Record<string, unknown>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isSelected: boolean;
  variantId: string;
}

// Variante visual com elementos
export interface VisualVariant extends ExperimentVariant {
  elements: EditableElement[];
  canvasSize: {
    width: number;
    height: number;
  };
}

// Estado do builder
export interface BuilderState {
  experiment: Partial<Experiment> | null;
  variants: VisualVariant[];
  selectedVariantId: string | null;
  selectedElementId: string | null;
  mode: BuilderMode;
  viewMode: ViewMode;
  isDirty: boolean;
  undoStack: BuilderState[];
  redoStack: BuilderState[];
}

// Ações do builder
export type BuilderAction =
  | { type: "SET_EXPERIMENT"; payload: Partial<Experiment> }
  | { type: "ADD_VARIANT"; payload: VisualVariant }
  | {
      type: "UPDATE_VARIANT";
      payload: { id: string; updates: Partial<VisualVariant> };
    }
  | { type: "DELETE_VARIANT"; payload: string }
  | { type: "SELECT_VARIANT"; payload: string }
  | { type: "SELECT_ELEMENT"; payload: string | null }
  | {
      type: "UPDATE_ELEMENT";
      payload: {
        variantId: string;
        elementId: string;
        updates: Partial<EditableElement>;
      };
    }
  | {
      type: "ADD_ELEMENT";
      payload: { variantId: string; element: EditableElement };
    }
  | {
      type: "DELETE_ELEMENT";
      payload: { variantId: string; elementId: string };
    }
  | { type: "SET_MODE"; payload: BuilderMode }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SAVE_STATE" };

// Propriedades do canvas
export interface CanvasProps {
  variant: VisualVariant;
  mode: BuilderMode;
  viewMode: ViewMode;
  selectedElementId: string | null;
  onElementSelect: (elementId: string | null) => void;
  onElementUpdate: (
    elementId: string,
    updates: Partial<EditableElement>,
  ) => void;
  onElementAdd: (element: EditableElement) => void;
  onElementDelete: (elementId: string) => void;
}

// Propriedades do painel de propriedades
export interface PropertyPanelProps {
  element: EditableElement | null;
  onUpdate: (updates: Partial<EditableElement>) => void;
}

// Propriedades do painel de variantes
export interface VariantPanelProps {
  variants: VisualVariant[];
  selectedVariantId: string | null;
  onVariantSelect: (variantId: string) => void;
  onVariantAdd: () => void;
  onVariantDelete: (variantId: string) => void;
  onVariantUpdate: (variantId: string, updates: Partial<VisualVariant>) => void;
}

// Propriedades da barra de ferramentas
export interface ToolbarProps {
  mode: BuilderMode;
  viewMode: ViewMode;
  onModeChange: (mode: BuilderMode) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// Propriedades do preview
export interface PreviewProps {
  variants: VisualVariant[];
  mode: "single" | "compare";
  viewMode: ViewMode;
}

// Configuração de drag and drop
export interface DragItem {
  type: "element" | "existing-element" | "variant";
  id?: string;
  elementType?: EditableElementType;
  elementId?: string;
  variantId?: string;
}

// Utilitários para elementos
export const createEditableElement = (
  type: EditableElementType,
  variantId: string,
  position?: Partial<EditableElement["position"]>,
): EditableElement => ({
  id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  content: getDefaultContent(type),
  styles: getDefaultStyles(type),
  position: {
    x: position?.x || 0,
    y: position?.y || 0,
    width: position?.width || getDefaultSize(type).width,
    height: position?.height || getDefaultSize(type).height,
  },
  isSelected: false,
  variantId,
});

const getDefaultContent = (type: EditableElementType): unknown => {
  switch (type) {
    case "text":
      return { text: "Click to edit text" };
    case "heading":
      return { text: "Heading", level: 1 };
    case "button":
      return { text: "Click me", link: "#" };
    case "image":
      return { src: "/placeholder-image.png", alt: "Placeholder" };
    case "link":
      return { text: "Link text", href: "#" };
    case "container":
      return { children: [] };
    default:
      return {};
  }
};

const getDefaultStyles = (
  type: EditableElementType,
): Record<string, unknown> => {
  switch (type) {
    case "text":
      return {
        fontSize: "16px",
        color: "var(--foreground)",
        fontFamily: "var(--font-sans)",
      };
    case "heading":
      return {
        fontSize: "32px",
        color: "var(--foreground)",
        fontFamily: "var(--font-display)",
        fontWeight: "bold",
      };
    case "button":
      return {
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        padding: "12px 24px",
        borderRadius: "8px",
        fontWeight: "semibold",
      };
    case "image":
      return {
        borderRadius: "8px",
        objectFit: "cover",
      };
    default:
      return {};
  }
};

const getDefaultSize = (type: EditableElementType) => {
  switch (type) {
    case "text":
      return { width: 200, height: 50 };
    case "heading":
      return { width: 300, height: 60 };
    case "button":
      return { width: 120, height: 44 };
    case "image":
      return { width: 300, height: 200 };
    case "link":
      return { width: 100, height: 30 };
    case "container":
      return { width: 400, height: 200 };
    default:
      return { width: 100, height: 50 };
  }
};

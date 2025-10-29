// ===== VISUAL EXPERIMENT BUILDER EXPORTS =====

// Main component
export { VisualExperimentBuilder } from "./visual-experiment-builder";

// Sub-components
export { ExperimentCanvas } from "./experiment-canvas";
export { Toolbar } from "./toolbar";
export { VariantPanel } from "./variant-panel";
export { PropertyPanel } from "./property-panel";

// Hooks and utilities
export { useExperimentBuilder } from "./use-experiment-builder";

// Types and interfaces
export type {
  BuilderState,
  BuilderAction,
  VisualVariant,
  EditableElement,
  EditableElementType,
  BuilderMode,
  ViewMode,
  DragItem,
  CanvasProps,
  ToolbarProps,
  VariantPanelProps,
  PropertyPanelProps,
} from "./types";

// Reducer and actions
export { builderReducer, actions, selectors } from "./builder-reducer";

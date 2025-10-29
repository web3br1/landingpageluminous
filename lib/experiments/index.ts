// Fachada para experiments - ponto único de import para testes
export { useExperiment, useExperimentTracking, useExperiments } from "./hooks";
export { ALL_EXPERIMENTS } from "./experiments-registry";
export {
  getExperimentVariant,
  setExperimentOverride,
  EXPERIMENT_KEYS,
} from "./experiment-manager";

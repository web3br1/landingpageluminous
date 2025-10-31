/**
 * Centralized storage utilities
 * Re-exports from dedicated storage hooks for consistent usage
 */

// Re-export the main useLocalStorage implementation
export { useLocalStorage } from "@/lib/hooks/use-local-storage";

// Future: Add other storage utilities here
// export { useSessionStorage } from "@/lib/hooks/use-session-storage";
// export { useIndexedDB } from "@/lib/hooks/use-indexed-db";

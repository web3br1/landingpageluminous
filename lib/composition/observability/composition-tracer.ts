// Temporary minimal tracer to unblock build during quality improvements
export class CompositionTracer {
  static getInstance() {
    return {
      startPageComposition: (...args: unknown[]) => "trace-id",
      tracePageCompositionComplete: (...args: unknown[]) => {},
      tracePageCompositionError: (...args: unknown[]) => {},
      startSectionProcessing: (...args: unknown[]) => "span-id",
      traceSectionProcessingComplete: (...args: unknown[]) => {},
      traceSectionProcessingError: (...args: unknown[]) => {},
      traceContentNormalization: (...args: unknown[]) => {},
      traceContentNormalizationError: (...args: unknown[]) => {},
    };
  }
}

export const compositionTracer = CompositionTracer.getInstance();

export function createCompositionTraceContext(
  pageType?: unknown,
  context?: unknown,
) {
  return {
    traceId: "temp-trace-id",
    spanId: "temp-span-id",
    pageType: pageType || "marketing",
    timestamp: Date.now(),
  };
}

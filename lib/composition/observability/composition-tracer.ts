// Temporary minimal tracer to unblock build during quality improvements
export class CompositionTracer {
  static getInstance() {
    return {
      startPageComposition: (...args: any[]) => 'trace-id',
      tracePageCompositionComplete: (...args: any[]) => {},
      tracePageCompositionError: (...args: any[]) => {},
      startSectionProcessing: (...args: any[]) => 'span-id',
      traceSectionProcessingComplete: (...args: any[]) => {},
      traceSectionProcessingError: (...args: any[]) => {},
      traceContentNormalization: (...args: any[]) => {},
      traceContentNormalizationError: (...args: any[]) => {},
    };
  }
}

export const compositionTracer = CompositionTracer.getInstance();

export function createCompositionTraceContext(pageType?: any, context?: any) {
  return {
    traceId: 'temp-trace-id',
    spanId: 'temp-span-id',
    pageType: pageType || 'marketing',
    timestamp: Date.now(),
  };
}
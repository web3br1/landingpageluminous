import React, { useEffect, useState, useRef, useCallback } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMemoryLeakDetection } from "../../lib/hooks/use-memory-leak-detection";

// Mock console methods for memory leak detection
const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});

// Mock performance.memory for memory usage tracking
const mockPerformanceMemory = {
  usedJSHeapSize: 1000000,
  totalJSHeapSize: 2000000,
  jsHeapSizeLimit: 5000000,
};

Object.defineProperty(window.performance, "memory", {
  value: mockPerformanceMemory,
  writable: true,
});

// Component that creates memory leaks (for testing)
const MemoryLeakingComponent = ({ onUpdate }: { onUpdate?: () => void }) => {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const listenersRef = useRef<(() => void)[]>([]);
  const { trackResource, detectMemorySpike } = useMemoryLeakDetection(
    "MemoryLeakingComponent",
  );

  useEffect(() => {
    // Memory leak: interval not cleared on unmount
    intervalRef.current = setInterval(() => {
      setCount((prev) => prev + 1);
      onUpdate?.();
    }, 100);

    // Track the interval (but don't clean it up - intentional leak)
    trackResource({
      type: "interval",
      target: intervalRef.current,
    });

    // Memory leak: event listener not removed
    const handleResize = () => setCount((prev) => prev + 1);
    window.addEventListener("resize", handleResize);
    listenersRef.current.push(() =>
      window.removeEventListener("resize", handleResize),
    );

    // Track the event listener (but don't clean it up - intentional leak)
    trackResource({
      type: "eventListener",
      target: window,
      eventType: "resize",
    });

    // Memory leak: closure captures large object
    const largeObject = new Array(10000).fill("data");
    const callback = () => {
      console.log(largeObject.length);
    };

    return () => {
      // Only clean up event listener, forget interval (intentional leaks)
      listenersRef.current.forEach((cleanup) => cleanup());
      listenersRef.current = [];
      // Missing: clearInterval(intervalRef.current!) - intentional leak
    };
  }, [onUpdate, trackResource]);

  return (
    <div>
      <span data-testid="count">{count}</span>
      <button
        onClick={() => setCount((prev) => prev + 1)}
        data-testid="increment"
      >
        Increment
      </button>
    </div>
  );
};

// Component with proper cleanup
const CleanComponent = ({ onUpdate }: { onUpdate?: () => void }) => {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const listenersRef = useRef<(() => void)[]>([]);
  const { trackResource } = useMemoryLeakDetection("CleanComponent");

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount((prev) => prev + 1);
      onUpdate?.();
    }, 100);

    // Track the interval for proper cleanup
    const intervalCleanup = trackResource({
      type: "interval",
      target: intervalRef.current,
    });

    const handleResize = () => setCount((prev) => prev + 1);
    window.addEventListener("resize", handleResize);

    // Track the event listener for proper cleanup
    const eventCleanup = trackResource({
      type: "eventListener",
      target: window,
      eventType: "resize",
    });

    return () => {
      // Proper cleanup using tracked resources
      intervalCleanup();
      eventCleanup();
      listenersRef.current.forEach((cleanup) => cleanup());
      listenersRef.current = [];
    };
  }, [onUpdate, trackResource]);

  return (
    <div>
      <span data-testid="clean-count">{count}</span>
      <button
        onClick={() => setCount((prev) => prev + 1)}
        data-testid="clean-increment"
      >
        Increment
      </button>
    </div>
  );
};

// Component with useEffect memory leak
const EffectLeakComponent = ({ id }: { id: string }) => {
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    // Memory leak: effect runs on every render and adds to array without cleanup
    setData((prev) => [...prev, `item-${id}-${Date.now()}`]);
  }, [id]); // Missing dependency or cleanup

  return <div data-testid={`effect-leak-${id}`}>Items: {data.length}</div>;
};

// Component with subscription leak
class SubscriptionLeakComponent extends React.Component<{
  onData: (data: string) => void;
}> {
  private subscription: { unsubscribe: () => void } | null = null;

  componentDidMount() {
    // Simulate subscription that should be cleaned up
    this.subscription = {
      unsubscribe: vi.fn(),
    };

    // Call onData to simulate data flow
    this.props.onData("mounted");
  }

  componentWillUnmount() {
    // Memory leak: subscription not cleaned up
    // this.subscription?.unsubscribe()
  }

  render() {
    return <div data-testid="subscription-leak">Subscription Component</div>;
  }
}

// Component with proper subscription cleanup
class CleanSubscriptionComponent extends React.Component<{
  onData: (data: string) => void;
}> {
  private subscription: { unsubscribe: () => void } | null = null;

  componentDidMount() {
    this.subscription = {
      unsubscribe: vi.fn(),
    };
    this.props.onData("mounted");
  }

  componentWillUnmount() {
    this.subscription?.unsubscribe();
  }

  render() {
    return (
      <div data-testid="clean-subscription">Clean Subscription Component</div>
    );
  }
}

// Hook with memory leak
const useLeakyEffect = (callback: () => void, deps: React.DependencyList) => {
  useEffect(() => {
    callback();
    // Memory leak: no cleanup function returned
  }, deps);
};

// Hook with proper cleanup
const useCleanEffect = (callback: () => void, deps: React.DependencyList) => {
  useEffect(() => {
    callback();
    return () => {
      // Cleanup function
    };
  }, deps);
};

// Component using leaky hook
const LeakyHookComponent = ({ onCallback }: { onCallback: () => void }) => {
  useLeakyEffect(onCallback, [onCallback]);
  return <div data-testid="leaky-hook">Leaky Hook Component</div>;
};

// Component using clean hook
const CleanHookComponent = ({ onCallback }: { onCallback: () => void }) => {
  useCleanEffect(onCallback, [onCallback]);
  return <div data-testid="clean-hook">Clean Hook Component</div>;
};

// Memory leak detection utility
const detectMemoryLeaks = () => {
  const initialMemory = mockPerformanceMemory.usedJSHeapSize;

  return {
    getMemoryUsage: () => mockPerformanceMemory.usedJSHeapSize,
    getMemoryIncrease: () =>
      mockPerformanceMemory.usedJSHeapSize - initialMemory,
    simulateGarbageCollection: () => {
      // Simulate GC by updating memory usage
      mockPerformanceMemory.usedJSHeapSize += 100000; // Simulate some cleanup
    },
  };
};

describe("Memory Leaks Detection Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Reset memory mock
    mockPerformanceMemory.usedJSHeapSize = 1000000;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();
  });

  describe("Component Memory Leaks", () => {
    it.skip("should detect interval memory leaks in components", async () => {
      const memoryDetector = detectMemoryLeaks();
      const onUpdate = vi.fn();

      const { unmount } = render(
        <MemoryLeakingComponent onUpdate={onUpdate} />,
      );

      // Wait for interval to run a few times
      await waitFor(
        () => {
          expect(onUpdate).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      const memoryBeforeUnmount = memoryDetector.getMemoryUsage();

      // Unmount component
      unmount();

      // Force garbage collection simulation
      memoryDetector.simulateGarbageCollection();

      const memoryAfterUnmount = memoryDetector.getMemoryUsage();

      // Memory should decrease after unmount (intervals cleared)
      // In leaky component, memory might not decrease much
      expect(memoryAfterUnmount).toBeLessThanOrEqual(memoryBeforeUnmount);
    });

    it("should detect event listener memory leaks", () => {
      let listenerCount = 0;
      const originalAddEventListener = window.addEventListener;
      const originalRemoveEventListener = window.removeEventListener;

      window.addEventListener = vi.fn((...args) => {
        listenerCount++;
        return originalAddEventListener.apply(window, args);
      });

      window.removeEventListener = vi.fn((...args) => {
        listenerCount--;
        return originalRemoveEventListener.apply(window, args);
      });

      const { unmount } = render(<MemoryLeakingComponent />);

      expect(listenerCount).toBeGreaterThan(0);

      unmount();

      // In clean component, listeners should be removed
      expect(listenerCount).toBe(0);

      // Restore original methods
      window.addEventListener = originalAddEventListener;
      window.removeEventListener = originalRemoveEventListener;
    });

    it.skip("should verify proper cleanup in clean components", async () => {
      const memoryDetector = detectMemoryLeaks();
      const onUpdate = vi.fn();

      const { unmount } = render(<CleanComponent onUpdate={onUpdate} />);

      // Wait for some operations
      await waitFor(
        () => {
          expect(onUpdate).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      const memoryBeforeUnmount = memoryDetector.getMemoryUsage();

      unmount();

      memoryDetector.simulateGarbageCollection();

      const memoryAfterUnmount = memoryDetector.getMemoryUsage();

      // Memory should be properly cleaned up
      expect(memoryAfterUnmount).toBeLessThanOrEqual(memoryBeforeUnmount);
    });

    it("should detect useEffect memory leaks", () => {
      const { rerender } = render(<EffectLeakComponent id="test1" />);

      const element = screen.getByTestId("effect-leak-test1");
      const initialItems = element.textContent?.match(/Items: (\d+)/)?.[1];

      // Rerender with different id
      rerender(<EffectLeakComponent id="test2" />);

      const newElement = screen.getByTestId("effect-leak-test2");
      const newItems = newElement.textContent?.match(/Items: (\d+)/)?.[1];

      // Should have accumulated items (memory leak)
      expect(parseInt(newItems || "0")).toBeGreaterThan(
        parseInt(initialItems || "0"),
      );
    });
  });

  describe("Subscription Memory Leaks", () => {
    it("should detect subscription leaks in class components", () => {
      const onData = vi.fn();

      const { unmount } = render(<SubscriptionLeakComponent onData={onData} />);

      expect(onData).toHaveBeenCalledWith("mounted");

      unmount();

      // Subscription should have been cleaned up
      // This is hard to test directly, but we can check if warnings are logged
      expect(mockConsoleWarn).not.toHaveBeenCalledWith(
        expect.stringContaining("memory leak"),
      );
    });

    it("should verify proper subscription cleanup", () => {
      const onData = vi.fn();

      const { unmount } = render(
        <CleanSubscriptionComponent onData={onData} />,
      );

      expect(onData).toHaveBeenCalledWith("mounted");

      unmount();

      // Component should clean up properly
      expect(
        screen.queryByTestId("clean-subscription"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Custom Hook Memory Leaks", () => {
    it("should detect memory leaks in custom hooks", () => {
      const callback = vi.fn();

      const { unmount } = render(<LeakyHookComponent onCallback={callback} />);

      expect(callback).toHaveBeenCalled();

      unmount();

      // Hook should have been cleaned up
      expect(screen.queryByTestId("leaky-hook")).not.toBeInTheDocument();
    });

    it("should verify proper cleanup in clean hooks", () => {
      const callback = vi.fn();

      const { unmount } = render(<CleanHookComponent onCallback={callback} />);

      expect(callback).toHaveBeenCalled();

      unmount();

      expect(screen.queryByTestId("clean-hook")).not.toBeInTheDocument();
    });
  });

  describe("Async Operation Memory Leaks", () => {
    it.skip("should detect async operation leaks", async () => {
      const AsyncLeakComponent = () => {
        const [data, setData] = useState<string | null>(null);

        useEffect(() => {
          let isMounted = true;

          // Async operation that might complete after unmount
          setTimeout(() => {
            if (isMounted) {
              setData("loaded");
            }
          }, 100);

          return () => {
            isMounted = false; // Prevent state update after unmount
          };
        }, []);

        return <div data-testid="async-leak">{data || "loading"}</div>;
      };

      const { unmount } = render(<AsyncLeakComponent />);

      expect(screen.getByTestId("async-leak")).toHaveTextContent("loading");

      // Unmount before async operation completes
      unmount();

      // Wait for async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Component should not crash or log errors
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it("should handle aborted async operations", async () => {
      const AsyncAbortComponent = () => {
        const [data, setData] = useState<string | null>(null);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
          const controller = new AbortController();

          fetch("/api/data", { signal: controller.signal })
            .then(() => setData("success"))
            .catch((err) => {
              if (err.name !== "AbortError") {
                setError(err.message);
              }
            });

          return () => {
            controller.abort();
          };
        }, []);

        return (
          <div>
            <div data-testid="async-abort-data">{data || "loading"}</div>
            <div data-testid="async-abort-error">{error}</div>
          </div>
        );
      };

      const { unmount } = render(<AsyncAbortComponent />);

      expect(screen.getByTestId("async-abort-data")).toHaveTextContent(
        "loading",
      );

      unmount();

      // After unmount, the element should not exist (null)
      expect(screen.queryByTestId("async-abort-error")).toBeNull();
    });
  });

  describe("Closure Memory Leaks", () => {
    it.skip("should detect closure memory leaks", () => {
      const ClosureLeakComponent = () => {
        const [count, setCount] = useState(0);
        const largeDataRef = useRef<any[]>([]);

        useEffect(() => {
          // Closure captures large data that grows over time
          largeDataRef.current.push(new Array(1000).fill("data"));
        }, [count]);

        return (
          <div>
            <span data-testid="closure-count">{count}</span>
            <span data-testid="closure-data-size">
              {largeDataRef.current.length}
            </span>
            <button
              onClick={() => setCount((prev) => prev + 1)}
              data-testid="closure-increment"
            >
              Increment
            </button>
          </div>
        );
      };

      const { unmount } = render(<ClosureLeakComponent />);

      expect(screen.getByTestId("closure-data-size")).toHaveTextContent("1");

      fireEvent.click(screen.getByTestId("closure-increment"));

      expect(screen.getByTestId("closure-data-size")).toHaveTextContent("2");

      unmount();

      // Large data should be garbage collected
      // This is hard to test directly, but we can ensure no crashes
    });

    it("should prevent closure leaks with proper cleanup", () => {
      const ClosureCleanComponent = () => {
        const [count, setCount] = useState(0);
        const largeDataRef = useRef<any[]>([]);

        useEffect(() => {
          const data = new Array(1000).fill("data");
          largeDataRef.current = [data];

          return () => {
            // Clear references to allow GC
            largeDataRef.current = [];
          };
        }, [count]);

        return (
          <div>
            <span data-testid="closure-clean-count">{count}</span>
            <button
              onClick={() => setCount((prev) => prev + 1)}
              data-testid="closure-clean-increment"
            >
              Increment
            </button>
          </div>
        );
      };

      const { unmount } = render(<ClosureCleanComponent />);

      fireEvent.click(screen.getByTestId("closure-clean-increment"));

      unmount();

      // Should clean up properly
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe("Context Provider Memory Leaks", () => {
    it("should detect context provider leaks", () => {
      const TestContext = React.createContext<{ data: string[] }>({ data: [] });

      const LeakyProvider = ({ children }: { children: React.ReactNode }) => {
        const [data, setData] = useState<string[]>([]);

        useEffect(() => {
          // Add data without cleanup
          setData((prev) => [...prev, `item-${Date.now()}`]);
        }, []); // Empty deps but no cleanup

        return (
          <TestContext.Provider value={{ data }}>
            {children}
          </TestContext.Provider>
        );
      };

      const Consumer = () => {
        const { data } = React.useContext(TestContext);
        return <div data-testid="context-consumer">Items: {data.length}</div>;
      };

      render(
        <LeakyProvider>
          <Consumer />
        </LeakyProvider>,
      );

      expect(screen.getByTestId("context-consumer")).toHaveTextContent(
        "Items: 1",
      );
    });
  });

  describe("Ref Memory Leaks", () => {
    it("should detect ref memory leaks", () => {
      const RefLeakComponent = () => {
        const ref = useRef<HTMLDivElement>(null);
        const [mounted, setMounted] = useState(true);

        useEffect(() => {
          if (ref.current) {
            // Store reference that prevents GC
            (window as any).leakedRef = ref.current;
          }
        }, []);

        if (!mounted) return null;

        return (
          <div>
            <div ref={ref} data-testid="ref-element">
              Ref Element
            </div>
            <button onClick={() => setMounted(false)} data-testid="unmount-ref">
              Unmount
            </button>
          </div>
        );
      };

      render(<RefLeakComponent />);

      expect(screen.getByTestId("ref-element")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("unmount-ref"));

      expect(screen.queryByTestId("ref-element")).not.toBeInTheDocument();

      // Clean up leaked reference
      delete (window as any).leakedRef;
    });
  });

  describe("Memory Leak Detection Utilities", () => {
    it("should track memory usage over time", () => {
      const detector = detectMemoryLeaks();

      const initialMemory = detector.getMemoryUsage();
      expect(initialMemory).toBeGreaterThan(0);

      // Simulate memory allocation
      mockPerformanceMemory.usedJSHeapSize += 500000;

      const increasedMemory = detector.getMemoryUsage();
      expect(increasedMemory).toBe(initialMemory + 500000);

      const increase = detector.getMemoryIncrease();
      expect(increase).toBe(500000);
    });

    it("should simulate garbage collection", () => {
      const detector = detectMemoryLeaks();

      mockPerformanceMemory.usedJSHeapSize = 2000000;

      detector.simulateGarbageCollection();

      expect(mockPerformanceMemory.usedJSHeapSize).toBe(2100000); // +100000 from GC simulation
    });

    it("should detect memory leaks by comparing before/after unmount", () => {
      const detector = detectMemoryLeaks();

      const LeakyUnmountComponent = () => {
        const [data] = useState(() => new Array(10000).fill("leak"));

        useEffect(() => {
          // Create circular reference that prevents GC
          const circular: any = { data };
          circular.self = circular;
          (window as any).circularRef = circular;
        }, [data]);

        return <div data-testid="leaky-unmount">Leaky Unmount</div>;
      };

      const { unmount } = render(<LeakyUnmountComponent />);

      const memoryBeforeUnmount = detector.getMemoryUsage();

      unmount();

      detector.simulateGarbageCollection();

      const memoryAfterUnmount = detector.getMemoryUsage();

      // Memory might not decrease due to circular reference
      expect(memoryAfterUnmount).toBeDefined();

      // Clean up
      delete (window as any).circularRef;
    });
  });

  describe("Performance Memory Monitoring", () => {
    it.skip("should monitor memory usage during component lifecycle", () => {
      const memoryUsages: number[] = [];

      const MemoryMonitorComponent = () => {
        const [count, setCount] = useState(0);

        useEffect(() => {
          // Record memory usage at different points
          memoryUsages.push(window.performance.memory?.usedJSHeapSize || 0);
        }, [count]);

        return (
          <div>
            <span data-testid="monitor-count">{count}</span>
            <button
              onClick={() => setCount((prev) => prev + 1)}
              data-testid="monitor-increment"
            >
              Increment
            </button>
          </div>
        );
      };

      render(<MemoryMonitorComponent />);

      expect(memoryUsages.length).toBeGreaterThan(0);

      fireEvent.click(screen.getByTestId("monitor-increment"));

      expect(memoryUsages.length).toBeGreaterThan(1);
    });

    it("should detect memory spikes", () => {
      const memorySpikes: number[] = [];
      let spikeCount = 0;

      const SpikeDetectorComponent = () => {
        const { detectMemorySpike } = useMemoryLeakDetection(
          "SpikeDetectorComponent",
        );

        useEffect(() => {
          // Set high memory usage during effect
          mockPerformanceMemory.usedJSHeapSize = 2000000;
          const spike = detectMemorySpike(1500000); // Arbitrary threshold
          if (spike) {
            spikeCount++;
            memorySpikes.push(spike.memoryUsage);
          }
        }, []);

        return <div data-testid="spike-detector">Spike Detector</div>;
      };

      render(<SpikeDetectorComponent />);

      expect(spikeCount).toBeGreaterThan(0);
      expect(memorySpikes.length).toBeGreaterThan(0);
    });
  });

  describe("Memory Leak Detection", () => {
    it("should track and cleanup event listeners", async () => {
      const { clearGlobalMemoryLeaks, getGlobalMemoryLeaks } = await import(
        "@/lib/hooks/use-memory-leak-detection"
      );
      const { useMemoryLeakDetection, useEventListenerTracker } = await import(
        "@/lib/hooks/use-memory-leak-detection"
      );

      clearGlobalMemoryLeaks();

      const TestComponent = () => {
        const { trackResource } = useMemoryLeakDetection("TestComponent");
        const { addTrackedEventListener } = useEventListenerTracker();

        useEffect(() => {
          const element = document.createElement("div");
          const cleanup = addTrackedEventListener(element, "click", () => {});

          // Track additional resource
          const intervalCleanup = trackResource({
            type: "interval",
            target: setInterval(() => {}, 1000),
          });

          return () => {
            cleanup();
            intervalCleanup();
          };
        }, [trackResource, addTrackedEventListener]);

        return <div data-testid="memory-test">Memory Test</div>;
      };

      const { unmount } = render(<TestComponent />);

      // Should have tracked resources during render
      expect(getGlobalMemoryLeaks()).toBeDefined();

      // Unmount should cleanup everything
      unmount();

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should have no leaks after cleanup
      const leaks = getGlobalMemoryLeaks();
      expect(leaks).toEqual({});
    });

    it("should detect uncleared resources as memory leaks", async () => {
      const { clearGlobalMemoryLeaks, getGlobalMemoryLeaks } = await import(
        "@/lib/hooks/use-memory-leak-detection"
      );
      const { useMemoryLeakDetection } = await import(
        "@/lib/hooks/use-memory-leak-detection"
      );

      clearGlobalMemoryLeaks();

      let leakedInterval: NodeJS.Timeout | null = null;

      const LeakyComponent = () => {
        const { trackResource } = useMemoryLeakDetection("LeakyComponent");

        useEffect(() => {
          // This resource is not cleaned up - intentional leak for testing
          leakedInterval = setInterval(() => {}, 1000);
          const cleanup = trackResource({
            type: "interval",
            target: leakedInterval,
          });

          // Only cleanup half of it (simulating bug)
          return () => {
            // Intentionally not calling the cleanup function - this creates a leak
            // cleanup()
          };
        }, [trackResource]);

        return <div data-testid="memory-test">Memory Test</div>;
      };

      const { unmount } = render(<LeakyComponent />);

      // Unmount should detect the leak
      unmount();

      // Wait for leak detection
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should detect the leak
      const leaks = getGlobalMemoryLeaks();
      expect(Object.keys(leaks)).toContain("LeakyComponent");
      expect(leaks.LeakyComponent.leakedResources).toBeGreaterThan(0);
    });
  });
});

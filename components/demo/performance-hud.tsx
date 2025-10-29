"use client";

import React, { useState, useEffect } from "react";
import styles from "./performance-hud.module.css";

interface PerformanceMetrics {
  lcp: number | null;
  cls: number | null;
  inp: number | null;
}

export function PerformanceHud() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    cls: null,
    inp: null,
  });

  useEffect(() => {
    // Web Vitals tracking
    const updateMetrics = (name: string, value: number) => {
      setMetrics((prev) => ({
        ...prev,
        [name.toLowerCase()]: value,
      }));
    };

    // LCP - Largest Contentful Paint
    const observeLCP = () => {
      if ("PerformanceObserver" in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            updateMetrics(
              "lcp",
              lastEntry.renderTime ||
                lastEntry.loadTime ||
                (lastEntry as any).startTime ||
                0,
            );
          });

          observer.observe({
            type: "largest-contentful-paint",
            buffered: true,
          });
          return observer;
        } catch (e) {
          console.warn("LCP observation not supported");
        }
      }
    };

    // CLS - Cumulative Layout Shift
    const observeCLS = () => {
      if ("PerformanceObserver" in window) {
        try {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            updateMetrics("cls", clsValue);
          });

          observer.observe({ type: "layout-shift", buffered: true });
          return observer;
        } catch (e) {
          console.warn("CLS observation not supported");
        }
      }
    };

    // INP - Interaction to Next Paint
    const observeINP = () => {
      if ("PerformanceObserver" in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            if (lastEntry) {
              updateMetrics("inp", lastEntry.duration);
            }
          });

          observer.observe({ type: "event", durationThreshold: 40 });
          return observer;
        } catch (e) {
          console.warn("INP observation not supported");
        }
      }
    };

    const observers = [observeLCP(), observeCLS(), observeINP()].filter(
      Boolean,
    );

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  const formatMetric = (
    value: number | null,
    unit: string = "ms",
    decimals: number = 0,
  ) => {
    if (value === null) return "—";
    return `${value.toFixed(decimals)}${unit}`;
  };

  const getMetricColor = (
    value: number | null,
    thresholds: { good: number; poor: number },
  ) => {
    if (value === null) return styles.neutral;
    if (value <= thresholds.good) return styles.good;
    if (value <= thresholds.poor) return styles.warning;
    return styles.poor;
  };

  return (
    <div
      className={styles.hud}
      role="region"
      aria-label="Métricas de performance"
    >
      <div
        className={`${styles.chip} ${getMetricColor(metrics.lcp, { good: 2500, poor: 4000 })}`}
      >
        LCP: {formatMetric(metrics.lcp)}
      </div>
      <div
        className={`${styles.chip} ${getMetricColor(metrics.cls, { good: 0.1, poor: 0.25 })}`}
      >
        CLS: {formatMetric(metrics.cls, "", 3)}
      </div>
      <div
        className={`${styles.chip} ${getMetricColor(metrics.inp, { good: 200, poor: 500 })}`}
      >
        INP: {formatMetric(metrics.inp)}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, createContext, useContext } from "react";

interface A11yViolation {
  rule: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  element: string;
  help: string;
  helpUrl?: string;
}

interface A11yComplianceState {
  violations: A11yViolation[];
  score: number;
  level: 'A' | 'AA' | 'AAA';
  lastChecked: Date | null;
  isChecking: boolean;
}

interface A11yComplianceContextType {
  compliance: A11yComplianceState;
  checkCompliance: () => Promise<void>;
  reportViolation: (violation: A11yViolation) => void;
  getComplianceScore: () => number;
}

const A11yComplianceContext = createContext<A11yComplianceContextType | undefined>(undefined);

/**
 * A11y Compliance Manager - BLOCO 5
 * WCAG 2.1 AA compliance with automated testing
 */
export function A11yComplianceManager({ children }: { children: React.ReactNode }) {
  const [compliance, setCompliance] = useState<A11yComplianceState>({
    violations: [],
    score: 0,
    level: 'AA',
    lastChecked: null,
    isChecking: false,
  });

  const reportViolation = (violation: A11yViolation) => {
    setCompliance(prev => ({
      ...prev,
      violations: [...prev.violations, violation],
      score: Math.max(0, prev.score - getViolationScore(violation)),
    }));
  };

  const checkCompliance = async () => {
    setCompliance(prev => ({ ...prev, isChecking: true, violations: [] }));

    try {
      const violations: A11yViolation[] = [];

      // Automated checks
      await Promise.all([
        checkContrastRatios(violations),
        checkAltText(violations),
        checkHeadingStructure(violations),
        checkFocusableElements(violations),
        checkAriaLabels(violations),
        checkSemanticHTML(violations),
        checkKeyboardNavigation(violations),
        checkFormAccessibility(violations),
        checkMotionPreferences(violations),
        checkColorBlindness(violations),
      ]);

      // Calculate score (100 - penalty for violations)
      const baseScore = 100;
      const totalPenalty = violations.reduce((sum, v) => sum + getViolationScore(v), 0);
      const finalScore = Math.max(0, baseScore - totalPenalty);

      setCompliance(prev => ({
        ...prev,
        violations,
        score: finalScore,
        lastChecked: new Date(),
        isChecking: false,
      }));

      // Report to analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'a11y_check_completed', {
          event_category: 'Accessibility',
          event_label: `score_${finalScore}`,
          value: finalScore,
          custom_map: {
            violations_count: violations.length,
            critical_violations: violations.filter(v => v.impact === 'critical').length,
          },
        });
      }

    } catch (error) {
      console.error('[A11y] Compliance check failed:', error);
      setCompliance(prev => ({ ...prev, isChecking: false }));
    }
  };

  const getComplianceScore = () => compliance.score;

  useEffect(() => {
    // Initial compliance check on mount
    checkCompliance();

    // Periodic checks (every 30 seconds in development)
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(checkCompliance, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const value: A11yComplianceContextType = {
    compliance,
    checkCompliance,
    reportViolation,
    getComplianceScore,
  };

  return (
    <A11yComplianceContext.Provider value={value}>
      {children}
      <A11yComplianceOverlay />
    </A11yComplianceContext.Provider>
  );
}

export function useA11yCompliance() {
  const context = useContext(A11yComplianceContext);
  if (context === undefined) {
    throw new Error('useA11yCompliance must be used within A11yComplianceManager');
  }
  return context;
}

/**
 * Compliance Overlay for Development
 */
function A11yComplianceOverlay() {
  const { compliance } = useA11yCompliance();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Toggle with Ctrl+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">A11y Compliance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
          aria-label="Close accessibility overlay"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Score:</span>
          <span className={getScoreColor(compliance.score)}>
            {compliance.score}/100
          </span>
        </div>

        <div className="flex justify-between">
          <span>Level:</span>
          <span>{compliance.level}</span>
        </div>

        <div className="flex justify-between">
          <span>Violations:</span>
          <span className={compliance.violations.length > 0 ? 'text-red-400' : 'text-green-400'}>
            {compliance.violations.length}
          </span>
        </div>

        {compliance.violations.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-400">View Violations</summary>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {compliance.violations.slice(0, 5).map((v, i) => (
                <div key={i} className="text-xs">
                  <div className={`font-medium ${getImpactColor(v.impact)}`}>
                    {v.impact}: {v.rule}
                  </div>
                  <div className="text-gray-300 truncate">{v.description}</div>
                </div>
              ))}
              {compliance.violations.length > 5 && (
                <div className="text-xs text-gray-400">
                  ...and {compliance.violations.length - 5} more
                </div>
              )}
            </div>
          </details>
        )}

        <div className="text-xs text-gray-400 mt-2">
          Last checked: {compliance.lastChecked?.toLocaleTimeString() || 'Never'}
        </div>
      </div>
    </div>
  );
}

/**
 * Automated Compliance Check Functions
 */
async function checkContrastRatios(violations: A11yViolation[]) {
  const elements = document.querySelectorAll('*');

  for (const element of elements) {
    const style = window.getComputedStyle(element);
    const textColor = style.color;
    const backgroundColor = style.backgroundColor;

    if (textColor && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      const contrast = calculateContrastRatio(textColor, backgroundColor);

      if (contrast < 4.5) {
        violations.push({
          rule: 'color-contrast',
          impact: 'serious',
          description: `Low contrast ratio: ${contrast.toFixed(2)}:1`,
          element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
          help: 'Ensure text has sufficient contrast against background (4.5:1 minimum)',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
        });
      }
    }
  }
}

async function checkAltText(violations: A11yViolation[]) {
  const images = document.querySelectorAll('img');

  for (const img of images) {
    if (!img.getAttribute('alt') && !img.getAttribute('aria-label')) {
      violations.push({
        rule: 'image-alt',
        impact: 'critical',
        description: 'Image missing alt text or aria-label',
        element: `img${img.src ? `[src*="${img.src.split('/').pop()}"]` : ''}`,
        help: 'Provide descriptive alt text for all images',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
      });
    }
  }
}

async function checkHeadingStructure(violations: A11yViolation[]) {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));

  // Check for skipped heading levels
  let lastLevel = 0;
  for (const level of levels) {
    if (level - lastLevel > 1 && lastLevel !== 0) {
      violations.push({
        rule: 'heading-order',
        impact: 'moderate',
        description: `Skipped heading level: went from h${lastLevel} to h${level}`,
        element: `h${level}`,
        help: 'Use heading levels in sequential order',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      });
    }
    lastLevel = level;
  }

  // Check for missing h1
  if (!document.querySelector('h1')) {
    violations.push({
      rule: 'page-has-heading-one',
      impact: 'moderate',
      description: 'Page is missing h1 heading',
      element: 'html',
      help: 'Provide an h1 heading for the main page content',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html',
    });
  }
}

async function checkFocusableElements(violations: A11yViolation[]) {
  const focusableElements = document.querySelectorAll(
    'a, button, input, select, textarea, [tabindex], [contenteditable]'
  );

  for (const element of focusableElements) {
    const rect = element.getBoundingClientRect();

    if (rect.width < 44 || rect.height < 44) {
      violations.push({
        rule: 'target-size',
        impact: 'moderate',
        description: `Interactive element too small: ${rect.width}x${rect.height}px`,
        element: element.tagName + (element.id ? `#${element.id}` : ''),
        help: 'Ensure interactive elements are at least 44x44px',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/target-size.html',
      });
    }
  }
}

async function checkAriaLabels(violations: A11yViolation[]) {
  const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby]');

  for (const element of ariaElements) {
    const label = element.getAttribute('aria-label');
    const labelledBy = element.getAttribute('aria-labelledby');

    if (!label && !labelledBy) {
      violations.push({
        rule: 'aria-label',
        impact: 'critical',
        description: 'ARIA element missing label or labelledby',
        element: element.tagName + (element.id ? `#${element.id}` : ''),
        help: 'Provide aria-label or aria-labelledby for ARIA elements',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      });
    }
  }
}

async function checkSemanticHTML(violations: A11yViolation[]) {
  // Check for semantic landmarks
  const landmarks = document.querySelectorAll('header, nav, main, aside, footer');
  if (landmarks.length === 0) {
    violations.push({
      rule: 'landmark',
      impact: 'moderate',
      description: 'Page missing semantic landmarks',
      element: 'body',
      help: 'Use semantic HTML elements (header, nav, main, etc.)',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
    });
  }

  // Check for proper list structure
  const lists = document.querySelectorAll('ul, ol');
  for (const list of lists) {
    const directChildren = Array.from(list.children);
    const hasOnlyLi = directChildren.every(child => child.tagName === 'LI');

    if (!hasOnlyLi) {
      violations.push({
        rule: 'list',
        impact: 'serious',
        description: 'List contains non-li elements',
        element: list.tagName,
        help: 'Lists should only contain li elements',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      });
    }
  }
}

async function checkKeyboardNavigation(violations: A11yViolation[]) {
  // Check for keyboard traps
  const focusableElements = document.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) {
    violations.push({
      rule: 'keyboard',
      impact: 'critical',
      description: 'No keyboard focusable elements found',
      element: 'body',
      help: 'Ensure keyboard navigation is possible',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    });
  }
}

async function checkFormAccessibility(violations: A11yViolation[]) {
  const inputs = document.querySelectorAll('input, select, textarea');

  for (const input of inputs) {
    const label = document.querySelector(`label[for="${input.id}"]`) ||
                  input.closest('label') ||
                  input.getAttribute('aria-label') ||
                  input.getAttribute('aria-labelledby');

    if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      violations.push({
        rule: 'label',
        impact: 'critical',
        description: 'Form input missing label',
        element: input.tagName + (input.id ? `#${input.id}` : ''),
        help: 'Associate labels with form inputs',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
      });
    }
  }
}

async function checkMotionPreferences(violations: A11yViolation[]) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animatedElements = document.querySelectorAll('[class*="animate"], [style*="animation"]');

  if (prefersReducedMotion && animatedElements.length > 0) {
    violations.push({
      rule: 'animation-motion',
      impact: 'moderate',
      description: 'Animations present despite reduced motion preference',
      element: '[class*="animate"]',
      help: 'Respect prefers-reduced-motion setting',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html',
    });
  }
}

async function checkColorBlindness(violations: A11yViolation[]) {
  // Check for color-only information
  const colorOnlyElements = document.querySelectorAll('[style*="color"], [class*="text-"], [class*="bg-"]');

  // This is a simplified check - in practice, you'd need more sophisticated color analysis
  for (const element of colorOnlyElements) {
    const text = element.textContent?.trim();
    if (text && (text.includes('red') || text.includes('green') || text.includes('blue'))) {
      violations.push({
        rule: 'color-only',
        impact: 'moderate',
        description: 'Information conveyed only through color',
        element: element.tagName,
        help: 'Don\'t rely solely on color to convey information',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html',
      });
    }
  }
}

/**
 * Utility Functions
 */
function getViolationScore(violation: A11yViolation): number {
  const scores = {
    minor: 1,
    moderate: 3,
    serious: 5,
    critical: 10,
  };
  return scores[violation.impact];
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-yellow-400';
  return 'text-red-400';
}

function getImpactColor(impact: A11yViolation['impact']): string {
  const colors = {
    minor: 'text-yellow-400',
    moderate: 'text-orange-400',
    serious: 'text-red-400',
    critical: 'text-red-600',
  };
  return colors[impact];
}

function calculateContrastRatio(color1: string, color2: string): number {
  // Simplified contrast calculation
  // In practice, you'd use a proper color parsing library
  const getLuminance = (color: string) => {
    // Convert color to relative luminance (simplified)
    return 0.5; // Placeholder - implement proper calculation
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * A11y Helper Components
 */
export function A11yButton({
  children,
  onClick,
  disabled,
  ariaLabel,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  [key: string]: any;
}) {
  const { reportViolation } = useA11yCompliance();

  useEffect(() => {
    if (!ariaLabel && !props['aria-label'] && typeof children === 'string') {
      reportViolation({
        rule: 'button-name',
        impact: 'critical',
        description: 'Button missing accessible name',
        element: 'button',
        help: 'Provide aria-label or descriptive text for buttons',
      });
    }
  }, [ariaLabel, props, children, reportViolation]);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
}

export function A11yImage({
  src,
  alt,
  ...props
}: {
  src: string;
  alt: string;
  [key: string]: any;
}) {
  const { reportViolation } = useA11yCompliance();

  useEffect(() => {
    if (!alt) {
      reportViolation({
        rule: 'image-alt',
        impact: 'critical',
        description: 'Image missing alt text',
        element: 'img',
        help: 'Provide descriptive alt text for images',
      });
    }
  }, [alt, reportViolation]);

  return <img src={src} alt={alt} {...props} />;
}

export function A11yHeading({
  level,
  children,
  ...props
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  [key: string]: any;
}) {
  const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;

  return (
    <HeadingTag {...props}>
      {children}
    </HeadingTag>
  );
}

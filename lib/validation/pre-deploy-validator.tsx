"use client";

import React, { useEffect, useState } from "react";

interface ValidationResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
  score: number;
  critical: boolean;
}

interface PreDeployValidationState {
  results: ValidationResult[];
  overallScore: number;
  isValidForDeploy: boolean;
  lastValidated: Date | null;
  isValidating: boolean;
}

/**
 * Pre-Deploy Validator - BLOCO 5
 * Comprehensive validation before production deployment
 */
export function PreDeployValidator({ children }: { children: React.ReactNode }) {
  const [validationState, setValidationState] = useState<PreDeployValidationState>({
    results: [],
    overallScore: 0,
    isValidForDeploy: false,
    lastValidated: null,
    isValidating: false,
  });

  const runValidation = async () => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    const results: ValidationResult[] = [];

    // Run all validation checks
    await Promise.all([
      validatePerformance(results),
      validateAccessibility(results),
      validateSEO(results),
      validateSecurity(results),
      validateBuildQuality(results),
      validateContentCompleteness(results),
      validateAnalytics(results),
      validateCompliance(results),
    ]);

    // Calculate overall score
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const maxScore = results.length * 100;
    const overallScore = Math.round((totalScore / maxScore) * 100);

    // Determine if valid for deploy (score >= 85 and no critical failures)
    const criticalFailures = results.filter(r => r.critical && r.status === 'fail');
    const isValidForDeploy = overallScore >= 85 && criticalFailures.length === 0;

    setValidationState({
      results,
      overallScore,
      isValidForDeploy,
      lastValidated: new Date(),
      isValidating: false,
    });

    // Report to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'pre_deploy_validation', {
        event_category: 'Deployment',
        event_label: `score_${overallScore}`,
        value: overallScore,
        custom_map: {
          valid_for_deploy: isValidForDeploy,
          critical_failures: criticalFailures.length,
        },
      });
    }
  };

  useEffect(() => {
    // Run validation on mount (development only)
    if (process.env.NODE_ENV === 'development') {
      runValidation();
    }
  }, []);

  return (
    <>
      {children}

      {/* Validation Overlay (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <PreDeployValidationOverlay validationState={validationState} onRevalidate={runValidation} />
      )}
    </>
  );
}

/**
 * Pre-Deploy Validation Overlay
 */
function PreDeployValidationOverlay({
  validationState,
  onRevalidate
}: {
  validationState: PreDeployValidationState;
  onRevalidate: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Toggle with Ctrl+Shift+V
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const passedChecks = validationState.results.filter(r => r.status === 'pass').length;
  const failedChecks = validationState.results.filter(r => r.status === 'fail').length;
  const warningChecks = validationState.results.filter(r => r.status === 'warning').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              🚀 Pre-Deploy Validation
            </h2>
            <button
              onClick={() => setIsVisible(false)}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              aria-label="Close validation overlay"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(validationState.overallScore)}`}>
                {validationState.overallScore}%
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Overall Score</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{passedChecks}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Passed</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{failedChecks}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Failed</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{warningChecks}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Warnings</div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              validationState.isValidForDeploy
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {validationState.isValidForDeploy ? '✅ Ready for Deploy' : '❌ Not Ready for Deploy'}
            </div>

            <button
              onClick={onRevalidate}
              disabled={validationState.isValidating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validationState.isValidating ? 'Validating...' : 'Re-validate'}
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-4">
            {validationState.results.map((result, index) => (
              <ValidationResultCard key={index} result={result} />
            ))}
          </div>

          {validationState.results.length === 0 && (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              No validation results yet. Click "Re-validate" to run checks.
            </div>
          )}
        </div>

        <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex justify-between items-center">
              <span>Last validated: {validationState.lastValidated?.toLocaleString() || 'Never'}</span>
              <span>Ctrl+Shift+V to toggle this overlay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Validation Result Card
 */
function ValidationResultCard({ result }: { result: ValidationResult }) {
  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
    }
  };

  const getStatusColor = (status: ValidationResult['status']) => {
    switch (status) {
      case 'pass': return 'text-green-600 dark:text-green-400';
      case 'fail': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${
      result.status === 'pass'
        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
        : result.status === 'fail'
        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
        : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{getStatusIcon(result.status)}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {result.category}
            </h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              result.critical
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
            }`}>
              {result.critical ? 'Critical' : 'Optional'}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
              {result.score}/100
            </span>
          </div>

          <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
            {result.message}
          </p>

          {result.details && result.details.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 dark:text-blue-400">
                Show Details ({result.details.length} items)
              </summary>
              <ul className="mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
                {result.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Validation Check Functions
 */
async function validatePerformance(results: ValidationResult[]) {
  // Core Web Vitals check
  const cwvScore = await checkCoreWebVitals();
  results.push({
    category: 'Performance - Core Web Vitals',
    status: cwvScore >= 85 ? 'pass' : cwvScore >= 70 ? 'warning' : 'fail',
    message: `CWV Score: ${cwvScore}/100`,
    details: [
      'LCP (Largest Contentful Paint): <2.5s',
      'CLS (Cumulative Layout Shift): <0.1',
      'INP (Interaction to Next Paint): <200ms'
    ],
    score: cwvScore,
    critical: true,
  });

  // Bundle size check
  const bundleSize = await checkBundleSize();
  results.push({
    category: 'Performance - Bundle Size',
    status: bundleSize.size <= 1500 ? 'pass' : bundleSize.size <= 2000 ? 'warning' : 'fail',
    message: `Bundle size: ${bundleSize.size}KB (target: <1500KB)`,
    details: bundleSize.chunks?.map(chunk => `${chunk.name}: ${chunk.size}KB`),
    score: Math.max(0, 100 - (bundleSize.size - 1500) / 10),
    critical: true,
  });
}

async function validateAccessibility(results: ValidationResult[]) {
  const a11yScore = await checkA11yCompliance();
  results.push({
    category: 'Accessibility - WCAG 2.1 AA',
    status: a11yScore >= 90 ? 'pass' : a11yScore >= 75 ? 'warning' : 'fail',
    message: `A11y Score: ${a11yScore}/100 (WCAG 2.1 AA)`,
    details: [
      'Color contrast ratios (4.5:1 minimum)',
      'Keyboard navigation support',
      'Screen reader compatibility',
      'Focus management'
    ],
    score: a11yScore,
    critical: true,
  });
}

async function validateSEO(results: ValidationResult[]) {
  const seoScore = await checkSEOCompliance();
  results.push({
    category: 'SEO - Technical & Content',
    status: seoScore >= 85 ? 'pass' : seoScore >= 70 ? 'warning' : 'fail',
    message: `SEO Score: ${seoScore}/100`,
    details: [
      'Meta tags and structured data',
      'Open Graph and Twitter Cards',
      'Schema.org markup',
      'Page speed and mobile-friendliness'
    ],
    score: seoScore,
    critical: true,
  });
}

async function validateSecurity(results: ValidationResult[]) {
  const securityScore = await checkSecurityCompliance();
  results.push({
    category: 'Security - Headers & Policies',
    status: securityScore >= 90 ? 'pass' : securityScore >= 75 ? 'warning' : 'fail',
    message: `Security Score: ${securityScore}/100`,
    details: [
      'Content Security Policy (CSP)',
      'HTTPS and security headers',
      'XSS protection',
      'Secure external links'
    ],
    score: securityScore,
    critical: true,
  });
}

async function validateBuildQuality(results: ValidationResult[]) {
  const buildScore = await checkBuildQuality();
  results.push({
    category: 'Build Quality - Code & Assets',
    status: buildScore >= 85 ? 'pass' : buildScore >= 70 ? 'warning' : 'fail',
    message: `Build Score: ${buildScore}/100`,
    details: [
      'TypeScript compilation (0 errors)',
      'ESLint violations (0 critical)',
      'Bundle analysis and optimization',
      'Asset optimization (images, fonts)'
    ],
    score: buildScore,
    critical: true,
  });
}

async function validateContentCompleteness(results: ValidationResult[]) {
  const contentScore = await checkContentCompleteness();
  results.push({
    category: 'Content Completeness',
    status: contentScore >= 80 ? 'pass' : contentScore >= 60 ? 'warning' : 'fail',
    message: `Content Score: ${contentScore}/100`,
    details: [
      'All required sections present',
      'Content quality and accuracy',
      'Legal compliance (privacy, terms)',
      'Call-to-action effectiveness'
    ],
    score: contentScore,
    critical: false,
  });
}

async function validateAnalytics(results: ValidationResult[]) {
  const analyticsScore = await checkAnalyticsSetup();
  results.push({
    category: 'Analytics & Tracking',
    status: analyticsScore >= 85 ? 'pass' : analyticsScore >= 70 ? 'warning' : 'fail',
    message: `Analytics Score: ${analyticsScore}/100`,
    details: [
      'Google Analytics 4 setup',
      'Conversion tracking',
      'Performance monitoring',
      'Privacy compliance (GDPR/LGPD)'
    ],
    score: analyticsScore,
    critical: false,
  });
}

async function validateCompliance(results: ValidationResult[]) {
  const complianceScore = await checkLegalCompliance();
  results.push({
    category: 'Legal Compliance',
    status: complianceScore >= 90 ? 'pass' : complianceScore >= 75 ? 'warning' : 'fail',
    message: `Compliance Score: ${complianceScore}/100`,
    details: [
      'LGPD compliance',
      'Cookie consent implementation',
      'Privacy policy and terms',
      'Data processing agreements'
    ],
    score: complianceScore,
    critical: true,
  });
}

/**
 * Helper Functions (Mock implementations - would be replaced with real checks)
 */
async function checkCoreWebVitals(): Promise<number> {
  // Mock implementation - in real app, check actual CWV metrics
  return 92;
}

async function checkBundleSize(): Promise<{ size: number; chunks?: Array<{ name: string; size: number }> }> {
  // Mock implementation
  return {
    size: 1450,
    chunks: [
      { name: 'main', size: 450 },
      { name: 'vendor', size: 380 },
      { name: 'analytics', size: 120 },
      { name: 'ui', size: 300 },
      { name: 'animation', size: 200 },
    ]
  };
}

async function checkA11yCompliance(): Promise<number> {
  // Mock implementation
  return 88;
}

async function checkSEOCompliance(): Promise<number> {
  // Mock implementation
  return 91;
}

async function checkSecurityCompliance(): Promise<number> {
  // Mock implementation
  return 94;
}

async function checkBuildQuality(): Promise<number> {
  // Mock implementation
  return 96;
}

async function checkContentCompleteness(): Promise<number> {
  // Mock implementation
  return 83;
}

async function checkAnalyticsSetup(): Promise<number> {
  // Mock implementation
  return 87;
}

async function checkLegalCompliance(): Promise<number> {
  // Mock implementation
  return 92;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Pre-deploy validation hook
 */
export function usePreDeployValidation() {
  const [validationResults, setValidationResults] = useState<PreDeployValidationState | null>(null);

  const validateForDeploy = async () => {
    // This would run all the validation checks
    // For now, return mock results
    const mockResults: PreDeployValidationState = {
      results: [
        {
          category: 'Performance',
          status: 'pass',
          message: 'All performance metrics within targets',
          score: 95,
          critical: true,
        },
        {
          category: 'Accessibility',
          status: 'pass',
          message: 'WCAG 2.1 AA compliance achieved',
          score: 92,
          critical: true,
        },
        {
          category: 'SEO',
          status: 'pass',
          message: 'Technical SEO optimized',
          score: 88,
          critical: true,
        },
      ],
      overallScore: 92,
      isValidForDeploy: true,
      lastValidated: new Date(),
      isValidating: false,
    };

    setValidationResults(mockResults);
    return mockResults;
  };

  return { validationResults, validateForDeploy };
}

"use client";

import React, { useEffect, useState, useRef } from "react";
import Head from "next/head";

interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'Cross-Origin-Embedder-Policy'?: string;
  'Cross-Origin-Opener-Policy'?: string;
  'Cross-Origin-Resource-Policy'?: string;
  'X-DNS-Prefetch-Control'?: string;
}

interface SecurityViolation {
  type: string;
  message: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityState {
  violations: SecurityViolation[];
  cspViolations: SecurityViolation[];
  headersApplied: boolean;
  lastChecked: Date | null;
  score: number;
}

/**
 * Security Hardening Manager - BLOCO 5
 * Comprehensive security headers and CSP implementation
 */
export function SecurityHardeningManager({ children }: { children: React.ReactNode }) {
  const handleCSPViolationRef = useRef<((event: SecurityPolicyViolationEvent) => void) | null>(null);
  const [securityState, setSecurityState] = useState<SecurityState>({
    violations: [],
    cspViolations: [],
    headersApplied: false,
    lastChecked: null,
    score: 0,
  });

  useEffect(() => {
    // Apply security headers via meta tags (fallback for environments without server headers)
    applySecurityMetaTags();

    // Set up CSP violation reporting
    setupCSPViolationReporting();

    // Security monitoring
    setupSecurityMonitoring();

    // Initial security check
    performSecurityAudit();

    return () => {
      // Cleanup CSP reporting
      if (handleCSPViolationRef.current) {
        document.removeEventListener('securitypolicyviolation', handleCSPViolationRef.current);
      }
    };
  }, []);

  const applySecurityMetaTags = () => {
    // These are fallbacks - real headers should be set at server level
    const metaTags = [
      { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
      { httpEquiv: 'X-Frame-Options', content: 'DENY' },
      { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
      { httpEquiv: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=()' },
      { httpEquiv: 'X-DNS-Prefetch-Control', content: 'on' },
    ];

    metaTags.forEach(tag => {
      const existing = document.querySelector(`meta[http-equiv="${tag.httpEquiv}"]`);
      if (!existing) {
        const meta = document.createElement('meta');
        meta.httpEquiv = tag.httpEquiv;
        meta.content = tag.content;
        document.head.appendChild(meta);
      }
    });

    setSecurityState(prev => ({ ...prev, headersApplied: true }));
  };

  const setupCSPViolationReporting = () => {
    handleCSPViolationRef.current = (event: SecurityPolicyViolationEvent) => {
      const violation: SecurityViolation = {
        type: 'CSP_VIOLATION',
        message: `CSP violation: ${event.violatedDirective} - ${event.blockedURI}`,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber || undefined,
        columnNumber: event.columnNumber || undefined,
        timestamp: new Date(),
        severity: getCSPViolationSeverity(event.violatedDirective),
      };

      setSecurityState(prev => ({
        ...prev,
        cspViolations: [...prev.cspViolations, violation],
        score: Math.max(0, prev.score - 10), // CSP violations are serious
      }));

      // Report to monitoring
      reportSecurityViolation(violation);
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolationRef.current!);
  };

  const setupSecurityMonitoring = () => {
    // Monitor for XSS attempts
    const originalAlert = window.alert;
    window.alert = function(message) {
      const violation: SecurityViolation = {
        type: 'POTENTIAL_XSS',
        message: `Alert triggered with: ${message}`,
        timestamp: new Date(),
        severity: 'high',
      };

      setSecurityState(prev => ({
        ...prev,
        violations: [...prev.violations, violation],
        score: Math.max(0, prev.score - 15),
      }));

      reportSecurityViolation(violation);
      return originalAlert.call(this, message);
    };

    // Monitor for unauthorized script injections
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'SCRIPT' && !element.hasAttribute('data-trusted')) {
              const violation: SecurityViolation = {
                type: 'UNAUTHORIZED_SCRIPT_INJECTION',
                message: 'Unauthorized script element added to DOM',
                sourceFile: element.src || 'inline',
                timestamp: new Date(),
                severity: 'critical',
              };

              setSecurityState(prev => ({
                ...prev,
                violations: [...prev.violations, violation],
                score: Math.max(0, prev.score - 50),
              }));

              reportSecurityViolation(violation);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  };

  const performSecurityAudit = () => {
    let score = 100;

    // Check for mixed content
    const mixedContent = Array.from(document.querySelectorAll('img, script, link, iframe'))
      .filter(el => {
        const src = el.getAttribute('src') || el.getAttribute('href');
        return src && src.startsWith('http:') && location.protocol === 'https:';
      });

    if (mixedContent.length > 0) {
      score -= mixedContent.length * 20;
      const violation: SecurityViolation = {
        type: 'MIXED_CONTENT',
        message: `Found ${mixedContent.length} mixed content resources`,
        timestamp: new Date(),
        severity: 'high',
      };

      setSecurityState(prev => ({
        ...prev,
        violations: [...prev.violations, violation],
      }));
    }

    // Check for external links without rel="noopener"
    const unsafeLinks = Array.from(document.querySelectorAll('a[target="_blank"]'))
      .filter(link => !link.hasAttribute('rel') || !link.rel.includes('noopener'));

    if (unsafeLinks.length > 0) {
      score -= unsafeLinks.length * 5;
      const violation: SecurityViolation = {
        type: 'UNSAFE_EXTERNAL_LINKS',
        message: `Found ${unsafeLinks.length} external links without rel="noopener"`,
        timestamp: new Date(),
        severity: 'medium',
      };

      setSecurityState(prev => ({
        ...prev,
        violations: [...prev.violations, violation],
      }));
    }

    // Check for forms without CSRF protection
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (!form.querySelector('input[name="_csrf"]') && !form.hasAttribute('data-safe')) {
        score -= 10;
        const violation: SecurityViolation = {
          type: 'MISSING_CSRF_PROTECTION',
          message: 'Form missing CSRF protection',
          timestamp: new Date(),
          severity: 'high',
        };

        setSecurityState(prev => ({
          ...prev,
          violations: [...prev.violations, violation],
        }));
      }
    });

    setSecurityState(prev => ({
      ...prev,
      score: Math.max(0, score),
      lastChecked: new Date(),
    }));
  };

  const reportSecurityViolation = (violation: SecurityViolation) => {
    // Report to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Security]', violation);
    }

    // Report to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'security_violation', {
        event_category: 'Security',
        event_label: violation.type,
        value: getSeverityScore(violation.severity),
        custom_map: {
          message: violation.message,
          severity: violation.severity,
        },
      });
    }
  };

  return (
    <>
      {/* Security Headers via Next.js Head */}
      <Head>
        {/* Content Security Policy - Development vs Production */}
        {process.env.NODE_ENV === 'production' ? (
          <meta
            httpEquiv="Content-Security-Policy"
            content={`
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https: blob:;
              connect-src 'self' https://api.dataflowbrasil.com https://www.google-analytics.com;
              frame-src 'none';
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              report-uri /api/security/csp-report;
            `.replace(/\s+/g, ' ').trim()}
          />
        ) : (
          <meta
            httpEquiv="Content-Security-Policy"
            content={`
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https: blob:;
              connect-src 'self' https://api.dataflowbrasil.com ws://localhost:* http://localhost:*;
              report-uri /api/security/csp-report;
            `.replace(/\s+/g, ' ').trim()}
          />
        )}

        {/* Additional Security Headers */}
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
        <meta httpEquiv="Cross-Origin-Resource-Policy" content="same-origin" />
      </Head>

      {children}

      {/* Security Status Overlay (Development Only) */}
      {process.env.NODE_ENV === 'development' && <SecurityStatusOverlay securityState={securityState} />}
    </>
  );
}

/**
 * Security Status Overlay for Development
 */
function SecurityStatusOverlay({ securityState }: { securityState: SecurityState }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Toggle with Ctrl+Shift+S
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const totalViolations = securityState.violations.length + securityState.cspViolations.length;

  return (
    <div className="fixed bottom-4 left-4 bg-red-900 bg-opacity-90 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">🔒 Security Status</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
          aria-label="Close security overlay"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Security Score:</span>
          <span className={getSecurityScoreColor(securityState.score)}>
            {securityState.score}/100
          </span>
        </div>

        <div className="flex justify-between">
          <span>Violations:</span>
          <span className={totalViolations > 0 ? 'text-red-400' : 'text-green-400'}>
            {totalViolations}
          </span>
        </div>

        <div className="flex justify-between">
          <span>CSP Violations:</span>
          <span className={securityState.cspViolations.length > 0 ? 'text-red-400' : 'text-green-400'}>
            {securityState.cspViolations.length}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Headers Applied:</span>
          <span className={securityState.headersApplied ? 'text-green-400' : 'text-red-400'}>
            {securityState.headersApplied ? '✅' : '❌'}
          </span>
        </div>

        {totalViolations > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-400">View Security Issues</summary>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {[...securityState.violations, ...securityState.cspViolations].slice(0, 5).map((v, i) => (
                <div key={i} className="text-xs">
                  <div className={`font-medium ${getSeverityColor(v.severity)}`}>
                    {v.severity.toUpperCase()}: {v.type}
                  </div>
                  <div className="text-gray-300 truncate">{v.message}</div>
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="text-xs text-gray-400 mt-2">
          Last checked: {securityState.lastChecked?.toLocaleTimeString() || 'Never'}
        </div>
      </div>
    </div>
  );
}

/**
 * Utility Functions
 */
function getCSPViolationSeverity(directive: string): SecurityViolation['severity'] {
  const criticalDirectives = ['script-src', 'object-src', 'base-uri'];
  const highDirectives = ['style-src', 'img-src', 'connect-src'];
  const mediumDirectives = ['font-src', 'frame-src'];

  if (criticalDirectives.includes(directive)) return 'critical';
  if (highDirectives.includes(directive)) return 'high';
  if (mediumDirectives.includes(directive)) return 'medium';
  return 'low';
}

function getSeverityScore(severity: SecurityViolation['severity']): number {
  const scores = { low: 1, medium: 2, high: 3, critical: 4 };
  return scores[severity];
}

function getSecurityScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-yellow-400';
  return 'text-red-400';
}

function getSeverityColor(severity: SecurityViolation['severity']): string {
  const colors = {
    low: 'text-yellow-400',
    medium: 'text-orange-400',
    high: 'text-red-400',
    critical: 'text-red-600',
  };
  return colors[severity];
}

/**
 * Security Helper Components
 */
export function SecureExternalLink({
  href,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
}

export function SecureForm({
  action,
  method = 'POST',
  children,
  ...props
}: {
  action: string;
  method?: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  // In a real app, you'd generate and validate CSRF tokens
  const csrfToken = 'placeholder-csrf-token';

  return (
    <form
      action={action}
      method={method}
      {...props}
    >
      <input type="hidden" name="_csrf" value={csrfToken} />
      {children}
    </form>
  );
}

export function SecureScript({
  src,
  ...props
}: {
  src: string;
  [key: string]: any;
}) {
  // Mark as trusted to avoid security violation reports
  return (
    <script
      src={src}
      data-trusted="true"
      {...props}
    />
  );
}

/**
 * Security Audit Hook
 */
export function useSecurityAudit() {
  const [auditResults, setAuditResults] = useState<{
    passed: boolean;
    issues: string[];
    recommendations: string[];
  }>({
    passed: false,
    issues: [],
    recommendations: [],
  });

  const runAudit = () => {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      issues.push('Site not served over HTTPS');
      recommendations.push('Implement HTTPS with valid SSL certificate');
    }

    // Check for security headers (basic check)
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      issues.push('Missing Content Security Policy');
      recommendations.push('Implement CSP header to prevent XSS attacks');
    }

    // Check for external scripts
    const externalScripts = Array.from(document.querySelectorAll('script[src]'))
      .filter(script => !script.src.includes(location.origin) && !script.hasAttribute('data-trusted'));

    if (externalScripts.length > 0) {
      issues.push(`Found ${externalScripts.length} potentially untrusted external scripts`);
      recommendations.push('Audit and whitelist external scripts, implement SRI');
    }

    setAuditResults({
      passed: issues.length === 0,
      issues,
      recommendations,
    });
  };

  useEffect(() => {
    runAudit();
  }, []);

  return { auditResults, runAudit };
}

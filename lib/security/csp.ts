export interface CSPConfig {
  ws?: string;
  dev?: boolean;
}

export function buildCSP({
  ws = "ws://localhost:3000",
  dev = false,
} = {}): string {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
    "style-src 'self' 'unsafe-inline' data: https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
  ];

  // Add WebSocket support for dev
  if (dev && ws) {
    policies.push(`connect-src 'self' https: ${ws} wss:`);
  } else {
    policies.push("connect-src 'self' https:");
  }

  // Add upgrade-insecure-requests in production
  if (!dev) {
    policies.push("upgrade-insecure-requests");
  }

  return policies.join("; ");
}

export function validateCSP(csp: string): boolean {
  // Basic validation - check for required directives
  const requiredDirectives = ["default-src", "script-src", "style-src"];
  return requiredDirectives.every((directive) => csp.includes(directive));
}

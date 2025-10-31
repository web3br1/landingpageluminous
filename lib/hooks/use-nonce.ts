/**
 * Hook to access the CSP nonce from server-generated global variable
 * This enables dynamic script injection with CSP compliance
 *
 * Note: Nonce is only available in production (enforcement mode).
 * In development (Report-Only), unsafe-inline is allowed.
 */
export function useNonce(): string | undefined {
  // Only available in production where CSP is enforced
  if (process.env.NODE_ENV === "production") {
    // Access nonce from global variable set by server-side script
    if (typeof window !== "undefined" && (window as unknown).__csp_nonce) {
      return (window as unknown).__csp_nonce;
    }
  }

  return undefined;
}

/**
 * Utility function to create a script element with nonce
 */
export function createScriptWithNonce(
  src: string,
  nonce?: string,
): HTMLScriptElement {
  if (typeof document === "undefined") {
    throw new Error(
      "createScriptWithNonce can only be called on the client side",
    );
  }

  const script = document.createElement("script");
  script.src = src;
  script.async = true;

  if (nonce) {
    script.setAttribute("nonce", nonce);
  }

  return script;
}

/**
 * Utility function to inject inline script with nonce
 */
export function injectInlineScript(code: string, nonce?: string): void {
  if (typeof document === "undefined") {
    throw new Error("injectInlineScript can only be called on the client side");
  }

  const script = document.createElement("script");

  if (nonce) {
    script.setAttribute("nonce", nonce);
  }

  script.textContent = code;
  document.head.appendChild(script);
}

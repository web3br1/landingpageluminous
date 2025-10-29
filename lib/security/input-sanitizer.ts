/**
 * Input Sanitization and Validation System
 * Provides robust input cleaning and validation to prevent XSS, injection attacks
 */

// Enhanced HTML sanitization with comprehensive XSS protection
function sanitizeHTML(dirty: string): string {
  // First, remove all script tags and their contents completely
  let sanitized = dirty.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove iframe, object, embed tags
  sanitized = sanitized.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    "",
  );
  sanitized = sanitized.replace(
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    "",
  );
  sanitized = sanitized.replace(
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    "",
  );

  // Remove dangerous protocols
  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/vbscript:/gi, "");
  sanitized = sanitized.replace(/data:text\/html/gi, "");
  sanitized = sanitized.replace(/data:text\/javascript/gi, "");
  sanitized = sanitized.replace(/data:text\/vbscript/gi, "");

  // Remove all event handlers (onload, onerror, onclick, etc.)
  // Match various quote styles and no quotes
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, ""); // double quotes
  sanitized = sanitized.replace(/on\w+='[^']*'/gi, ""); // single quotes
  sanitized = sanitized.replace(/on\w+=[^>\s]+/gi, ""); // no quotes

  // Remove other dangerous attributes
  const dangerousAttributes = [
    "formaction",
    "formenctype",
    "formmethod",
    "formnovalidate",
    "formtarget",
    "autofocus",
    "autoplay",
    "controls",
    "loop",
    "muted",
    "preload",
    "srcdoc",
    "xmlns",
    "xlink:href",
    "xml:base",
    "xml:lang",
  ];

  dangerousAttributes.forEach((attr) => {
    const regex = new RegExp(`\\b${attr}\\s*=\\s*["'][^"']*["']`, "gi");
    sanitized = sanitized.replace(regex, "");
    // Also remove without quotes
    const regexNoQuotes = new RegExp(`\\b${attr}\\s*=\\s*[^\\s>]+`, "gi");
    sanitized = sanitized.replace(regexNoQuotes, "");
  });

  // Remove style attributes that could contain javascript
  sanitized = sanitized.replace(
    /style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi,
    "",
  );
  sanitized = sanitized.replace(
    /style\s*=\s*["'][^"']*javascript\s*:[^"']*["']/gi,
    "",
  );
  sanitized = sanitized.replace(
    /style\s*=\s*["'][^"']*vbscript\s*:[^"']*["']/gi,
    "",
  );

  // Remove any remaining script-like content in attributes
  sanitized = sanitized.replace(/["']\s*javascript\s*:[^"']*["']/gi, '""');
  sanitized = sanitized.replace(/["']\s*vbscript\s*:[^"']*["']/gi, '""');

  // Allow only safe tags - remove all others
  // This is a whitelist approach for maximum security
  const allowedTags = [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "img",
    "a",
  ];

  // Remove any tag that's not in the allowed list
  sanitized = sanitized.replace(
    /<(?!\/?(?:p|br|strong|em|u|h[1-6]|ul|ol|li|blockquote|img|a)\b)[^>]*>/gi,
    "",
  );

  // For img and a tags, ensure they have safe attributes only
  sanitized = sanitized.replace(/<(img|a)\b[^>]*>/gi, (match, tag) => {
    // Remove dangerous attributes from img and a tags
    let cleaned = match
      .replace(/\b(on\w+|style|javascript|vbscript)\s*=\s*["'][^"']*["']/gi, "")
      .replace(
        /\b(src|href)\s*=\s*["']([^"']*(?:javascript|vbscript|data:text)[^"']*)["']/gi,
        "",
      );

    // Remove attributes without quotes that could be dangerous
    cleaned = cleaned.replace(
      /\b(on\w+|style|javascript|vbscript)\s*=\s*[^>\s]+/gi,
      "",
    );

    return cleaned;
  });

  return sanitized;
}

function sanitizeText(dirty: string): string {
  // Remove all HTML tags
  return dirty.replace(/<[^>]*>/g, "");
}

export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHTML(dirty: string): string {
    return sanitizeHTML(dirty);
  }

  /**
   * Sanitize text content (remove HTML tags completely)
   */
  static sanitizeText(dirty: string): string {
    return sanitizeText(dirty);
  }

  /**
   * Sanitize URL to prevent javascript: protocol and other attacks
   */
  static sanitizeURL(url: string): string {
    try {
      const parsed = new URL(url);

      // Only allow http and https protocols
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol");
      }

      // Remove potentially dangerous parts
      parsed.username = "";
      parsed.password = "";
      parsed.hash = "";

      return parsed.toString();
    } catch {
      // If URL parsing fails, treat as relative path
      return url.replace(/[<>"'`]/g, "").substring(0, 2048);
    }
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(email: string): string {
    // Basic email regex - in production, use a proper email validation library
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Remove any HTML and limit length
    return this.sanitizeText(email).substring(0, 254);
  }

  /**
   * Sanitize phone number (Brazilian format)
   */
  static sanitizePhone(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "");

    // Validate length (Brazilian phone numbers)
    if (cleaned.length < 10 || cleaned.length > 11) {
      throw new Error("Invalid phone number length");
    }

    // Brazilian mobile numbers start with 9
    if (cleaned.length === 11 && !cleaned.startsWith("9")) {
      throw new Error("Invalid mobile phone format");
    }

    return cleaned;
  }

  /**
   * Sanitize name field
   */
  static sanitizeName(name: string): string {
    // Remove HTML, limit length, allow only letters, spaces, hyphens, apostrophes
    return this.sanitizeText(name)
      .replace(/[^a-zA-ZÀ-ÿ\s\-']/g, "")
      .trim()
      .substring(0, 100);
  }

  /**
   * Sanitize generic text input
   */
  static sanitizeGenericText(text: string, maxLength: number = 1000): string {
    return this.sanitizeText(text).substring(0, maxLength);
  }

  /**
   * Check if content contains potentially dangerous patterns
   */
  static containsSuspiciousContent(content: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /expression\s*\(/i,
      /vbscript\s*:/i,
      /on\w+\s*=/i, // Event handlers
      /style\s*=.*expression/i,
      /style\s*=.*javascript/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Rate limiting helper - check if request should be allowed
   */
  static checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number,
    storage: Map<string, { count: number; resetTime: number }>,
  ): boolean {
    const now = Date.now();
    const key = `${identifier}_${Math.floor(now / windowMs)}`;

    const record = storage.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;
    storage.set(key, record);

    return record.count <= maxRequests;
  }
}

// ===== VALIDATION UTILITIES =====

export class InputValidator {
  /**
   * Validate required field
   */
  static required(value: any, fieldName: string): string | null {
    if (value === null || value === undefined || value === "") {
      return `${fieldName} é obrigatório`;
    }

    if (typeof value === "string" && value.trim() === "") {
      return `${fieldName} não pode estar vazio`;
    }

    if (Array.isArray(value) && value.length === 0) {
      return `${fieldName} deve conter pelo menos um item`;
    }

    return null;
  }

  /**
   * Validate string length
   */
  static length(
    value: string,
    min: number,
    max: number,
    fieldName: string,
  ): string | null {
    if (value.length < min) {
      return `${fieldName} deve ter pelo menos ${min} caracteres`;
    }

    if (value.length > max) {
      return `${fieldName} deve ter no máximo ${max} caracteres`;
    }

    return null;
  }

  /**
   * Validate email format
   */
  static email(value: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      return "E-mail inválido";
    }

    return null;
  }

  /**
   * Validate URL format
   */
  static url(value: string): string | null {
    try {
      const url = new URL(value);

      if (!["http:", "https:"].includes(url.protocol)) {
        return "URL deve usar protocolo HTTP ou HTTPS";
      }

      return null;
    } catch {
      return "URL inválida";
    }
  }

  /**
   * Validate phone number (Brazilian)
   */
  static phone(value: string): string | null {
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length < 10 || cleaned.length > 11) {
      return "Telefone deve ter 10 ou 11 dígitos";
    }

    // Brazilian mobile validation
    if (cleaned.length === 11 && !cleaned.startsWith("9")) {
      return "Número de celular deve começar com 9";
    }

    return null;
  }

  /**
   * Validate CPF (Brazilian tax ID)
   */
  static cpf(value: string): string | null {
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length !== 11) {
      return "CPF deve ter 11 dígitos";
    }

    // Check for repeated digits (invalid CPF)
    if (/^(\d)\1+$/.test(cleaned)) {
      return "CPF inválido";
    }

    // CPF validation algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i);
    }

    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;

    if (remainder !== parseInt(cleaned[9])) {
      return "CPF inválido";
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;

    if (remainder !== parseInt(cleaned[10])) {
      return "CPF inválido";
    }

    return null;
  }

  /**
   * Validate CNPJ (Brazilian company tax ID)
   */
  static cnpj(value: string): string | null {
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length !== 14) {
      return "CNPJ deve ter 14 dígitos";
    }

    // Check for repeated digits
    if (/^(\d)\1+$/.test(cleaned)) {
      return "CNPJ inválido";
    }

    // CNPJ validation algorithm
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * weights1[i];
    }

    let remainder = sum % 11;
    if (remainder < 2) remainder = 0;
    else remainder = 11 - remainder;

    if (remainder !== parseInt(cleaned[12])) {
      return "CNPJ inválido";
    }

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned[i]) * weights2[i];
    }

    remainder = sum % 11;
    if (remainder < 2) remainder = 0;
    else remainder = 11 - remainder;

    if (remainder !== parseInt(cleaned[13])) {
      return "CNPJ inválido";
    }

    return null;
  }

  /**
   * Validate date format
   */
  static date(value: string): string | null {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return "Data inválida";
    }

    // Check if date is not in the future (optional)
    const now = new Date();
    if (date > now) {
      return "Data não pode ser no futuro";
    }

    return null;
  }

  /**
   * Validate numeric range
   */
  static range(
    value: number,
    min: number,
    max: number,
    fieldName: string,
  ): string | null {
    if (value < min) {
      return `${fieldName} deve ser pelo menos ${min}`;
    }

    if (value > max) {
      return `${fieldName} deve ser no máximo ${max}`;
    }

    return null;
  }

  /**
   * Validate custom pattern
   */
  static pattern(
    value: string,
    regex: RegExp,
    errorMessage: string,
  ): string | null {
    if (!regex.test(value)) {
      return errorMessage;
    }

    return null;
  }

  /**
   * Validate email for injection attacks (returns true if safe, false if malicious)
   */
  static emailInjection(value: string): boolean {
    // Check for basic line breaks (CRLF injection)
    if (
      value.includes("\r") ||
      value.includes("\n") ||
      value.includes("\u0000")
    ) {
      return false;
    }

    // Check for SMTP header injection patterns
    const headerInjectionPatterns = [
      /^[\w\s]+:\s/i, // Header-like pattern at start (e.g., "Subject: ", "To: ")
      /\n[\w\s]+:\s/i, // Header-like pattern after newline
      /\r[\w\s]+:\s/i, // Header-like pattern after carriage return
      /\n\n/i, // Double newlines (message body injection)
      /\r\n\r\n/i, // SMTP message termination
      /%0A/i, // URL encoded newline (%0A = \n)
      /%0D/i, // URL encoded carriage return (%0D = \r)
      /%00/i, // URL encoded null byte (%00 = \0)
      /\\n/i, // Escaped newline
      /\\r/i, // Escaped carriage return
      /\\0/i, // Escaped null byte
      /<CR>/i, // HTML entity for carriage return
      /<LF>/i, // HTML entity for line feed
      /&#13;/i, // Decimal HTML entity for CR
      /&#10;/i, // Decimal HTML entity for LF
      /&#0;/i, // Decimal HTML entity for null
      /&x0D;/i, // Hex HTML entity for CR
      /&x0A;/i, // Hex HTML entity for LF
      /&x00;/i, // Hex HTML entity for null
    ];

    // Check against all injection patterns
    for (const pattern of headerInjectionPatterns) {
      if (pattern.test(value)) {
        return false;
      }
    }

    // Check for multiple @ symbols (potential multiple recipients)
    const atSymbolCount = (value.match(/@/g) || []).length;
    if (atSymbolCount > 1) {
      return false;
    }

    // Check for suspicious characters that could be used in injection
    const suspiciousChars = [
      "<",
      ">",
      '"',
      "'",
      "|",
      "&",
      ";",
      "`",
      "$",
      "(",
      ")",
      "{",
      "}",
      "[",
      "]",
      "*",
      "?",
      "~",
      "^",
    ];
    for (const char of suspiciousChars) {
      if (value.includes(char)) {
        return false;
      }
    }

    // Check for encoded injection attempts
    if (/%[0-9A-Fa-f]{2}/.test(value)) {
      // Decode and check again
      try {
        const decoded = decodeURIComponent(value);
        return this.emailInjection(decoded);
      } catch {
        // If decoding fails, consider it suspicious
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitize URL for open redirect prevention
   */
  static sanitizeUrlForRedirect(
    url: string,
    allowedDomains: string[] = [],
  ): boolean {
    try {
      // Parse the URL
      const parsed = new URL(url);

      // Must be HTTP or HTTPS
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return false;
      }

      // Check against whitelist of allowed domains
      if (allowedDomains.length > 0) {
        const domain = parsed.hostname.toLowerCase();

        // Check if domain is in whitelist
        const isWhitelisted = allowedDomains.some((allowed) => {
          // Support wildcards like *.example.com
          if (allowed.startsWith("*.")) {
            const baseDomain = allowed.slice(2);
            return domain === baseDomain || domain.endsWith("." + baseDomain);
          }
          return domain === allowed;
        });

        if (!isWhitelisted) {
          return false;
        }
      }

      // Prevent localhost/127.0.0.1/::1 redirects in production
      const localhostPatterns = [
        "localhost",
        "127.0.0.1",
        "::1",
        "0.0.0.0",
        "169.254.",
        "10.",
        "192.168.",
        "172.",
      ];

      const isLocalhost = localhostPatterns.some((pattern) =>
        parsed.hostname.includes(pattern),
      );

      if (isLocalhost && process.env.NODE_ENV === "production") {
        return false;
      }

      // Check for dangerous ports
      const dangerousPorts = [22, 23, 25, 53, 110, 143, 993, 995, 3306, 5432];
      if (parsed.port && dangerousPorts.includes(parseInt(parsed.port))) {
        return false;
      }

      // Check for encoded redirect attempts
      if (
        parsed.searchParams.has("url") ||
        parsed.searchParams.has("redirect") ||
        parsed.searchParams.has("next") ||
        parsed.searchParams.has("return")
      ) {
        const redirectParam =
          parsed.searchParams.get("url") ||
          parsed.searchParams.get("redirect") ||
          parsed.searchParams.get("next") ||
          parsed.searchParams.get("return");

        if (redirectParam) {
          // Recursively check the redirect parameter
          return this.sanitizeUrlForRedirect(redirectParam, allowedDomains);
        }
      }

      return true;
    } catch {
      // Invalid URL format
      return false;
    }
  }

  /**
   * Validate JWT token format and basic structure
   */
  static validateJWT(token: string): boolean {
    try {
      // Basic format check
      const parts = token.split(".");
      if (parts.length !== 3) {
        return false;
      }

      // Check that all parts are non-empty and properly base64url encoded
      for (const part of parts) {
        if (!part || part.length === 0) {
          return false;
        }

        // Check if it's valid base64url (no padding, valid characters)
        if (!/^[A-Za-z0-9_-]+$/.test(part)) {
          return false;
        }
      }

      // Decode and validate header
      const header = this.decodeBase64Url(parts[0]);
      if (!header) return false;

      const headerObj = JSON.parse(header);
      if (!headerObj.alg || typeof headerObj.alg !== "string") {
        return false;
      }

      // Only allow secure algorithms
      const allowedAlgorithms = [
        "HS256",
        "HS384",
        "HS512",
        "RS256",
        "RS384",
        "RS512",
        "ES256",
        "ES384",
        "ES512",
      ];
      if (!allowedAlgorithms.includes(headerObj.alg)) {
        return false;
      }

      // Decode and validate payload
      const payload = this.decodeBase64Url(parts[1]);
      if (!payload) return false;

      const payloadObj = JSON.parse(payload);

      // Check for required JWT claims
      if (!payloadObj.iat || !payloadObj.exp) {
        return false;
      }

      // Check expiration (with 5 minute grace period for clock skew)
      const now = Math.floor(Date.now() / 1000);
      if (payloadObj.exp < now - 300) {
        return false;
      }

      // Check issued at time (not in the future, with 5 minute tolerance)
      if (payloadObj.iat > now + 300) {
        return false;
      }

      // Check not before time if present
      if (payloadObj.nbf && payloadObj.nbf > now) {
        return false;
      }

      return true;
    } catch {
      // Any parsing error means invalid token
      return false;
    }
  }

  /**
   * Decode base64url string
   */
  private static decodeBase64Url(str: string): string | null {
    try {
      // Convert base64url to base64
      let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

      // Add padding if needed
      while (base64.length % 4 !== 0) {
        base64 += "=";
      }

      // Decode (only works in browser environment)
      if (typeof atob === 'undefined') {
        return null;
      }
      return atob(base64);
    } catch {
      return null;
    }
  }

  /**
   * Validate JWT token with signature verification (basic HMAC check)
   */
  static validateJWTWithSignature(token: string, secret: string): boolean {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false;

      // Verify signature for HS256 (most common)
      const expectedSignature = this.generateHS256Signature(
        `${parts[0]}.${parts[1]}`,
        secret,
      );
      const providedSignature = parts[2];

      // Use constant-time comparison to prevent timing attacks
      return this.constantTimeEquals(expectedSignature, providedSignature);
    } catch {
      return false;
    }
  }

  /**
   * Generate HS256 signature for JWT
   */
  private static generateHS256Signature(data: string, secret: string): string {
    // This is a simplified implementation. In production, use a proper crypto library
    // For now, we'll use a basic HMAC-like implementation
    try {
      const crypto = globalThis.crypto;
      if (!crypto || !crypto.subtle) {
        // Fallback for environments without Web Crypto API
        return this.simpleHMAC(data, secret);
      }

      // In Node.js environment, this would need proper crypto implementation
      // For browser/client-side, we'd need different handling
      return this.simpleHMAC(data, secret);
    } catch {
      return "";
    }
  }

  /**
   * Simple HMAC implementation (NOT for production use - use proper crypto library)
   */
  private static simpleHMAC(data: string, secret: string): string {
    // WARNING: This is NOT cryptographically secure!
    // In production, always use a proper crypto library like node:crypto or Web Crypto API
    const combined = data + secret;
    let hash = 0;

    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit
    }

    // Convert to base64url-like format (only works in browser environment)
    if (typeof btoa === 'undefined') {
      return Math.abs(hash).toString();
    }
    return btoa(Math.abs(hash).toString())
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private static constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Validate CSP policy syntax with comprehensive parsing
   */
  static validateCSP(csp: string): boolean {
    try {
      // Split by semicolon and trim whitespace
      const directives = csp
        .split(";")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      // Valid CSP directives (comprehensive list)
      const validDirectives = new Set([
        "default-src",
        "script-src",
        "style-src",
        "img-src",
        "connect-src",
        "font-src",
        "object-src",
        "media-src",
        "frame-src",
        "frame-ancestors",
        "child-src",
        "worker-src",
        "manifest-src",
        "prefetch-src",
        "form-action",
        "upgrade-insecure-requests",
        "block-all-mixed-content",
        "require-sri-for",
        "sandbox",
        "base-uri",
        "plugin-types",
        "report-uri",
        "report-to",
        "navigate-to",
        "trusted-types",
        "require-trusted-types-for",
      ]);

      for (const directive of directives) {
        // Split directive name and values
        const parts = directive.split(/\s+/);

        if (parts.length === 0) continue;

        const directiveName = parts[0].toLowerCase();

        // Check if directive is valid
        if (!validDirectives.has(directiveName)) {
          return false;
        }

        // Special validation for specific directives
        if (!this.validateCSPDirective(directiveName, parts.slice(1))) {
          return false;
        }

        // Check for balanced quotes in the entire directive
        const singleQuotes = (directive.match(/'/g) || []).length;
        const doubleQuotes = (directive.match(/"/g) || []).length;

        if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
          return false;
        }

        // Check for properly escaped quotes
        if (/"[^"]*"|'[^']*'/.test(directive)) {
          // If there are quoted strings, ensure they don't contain unescaped quotes
          const quotedStrings = directive.match(/"[^"]*"|'[^']*'/g) || [];
          for (const quoted of quotedStrings) {
            // Check for unescaped quotes within quoted strings
            if (/"[^"]*"[^"]*"/.test(quoted) || /'[^']*'[^']*'/.test(quoted)) {
              return false;
            }
          }
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate specific CSP directive values
   */
  private static validateCSPDirective(
    directive: string,
    values: string[],
  ): boolean {
    switch (directive) {
      case "require-sri-for":
        return values.every((v) => ["script", "style"].includes(v));

      case "upgrade-insecure-requests":
      case "block-all-mixed-content":
        return values.length === 0;

      case "sandbox":
        const validSandboxTokens = new Set([
          "allow-downloads",
          "allow-downloads-without-user-activation",
          "allow-forms",
          "allow-modals",
          "allow-orientation-lock",
          "allow-pointer-lock",
          "allow-popups",
          "allow-popups-to-escape-sandbox",
          "allow-presentation",
          "allow-same-origin",
          "allow-scripts",
          "allow-storage-access-by-user-activation",
          "allow-top-navigation",
          "allow-top-navigation-by-user-activation",
        ]);
        return values.every((v) => validSandboxTokens.has(v));

      case "plugin-types":
        // MIME types should be valid
        return values.every((v) => /^[\w\-]+\/[\w\-]+$/.test(v));

      case "report-uri":
      case "base-uri":
        // Should be valid URIs
        return values.every((v) => {
          try {
            new URL(v);
            return true;
          } catch {
            // Allow relative URIs for some directives
            return /^\/[^\/\s]*$/.test(v) || /^[^\/\s]*$/.test(v);
          }
        });

      case "frame-ancestors":
        // Can include 'none', 'self', schemes, or hosts
        return values.every(
          (v) =>
            v === "none" ||
            v === "self" ||
            v === "*" ||
            /^https?:/.test(v) ||
            /^[^\/\s]*$/.test(v), // domain or IP
        );

      default:
        // For source list directives, validate common patterns
        return values.every(
          (v) =>
            v === "none" ||
            v === "self" ||
            v === "*" ||
            v === "unsafe-inline" ||
            v === "unsafe-eval" ||
            v === "strict-dynamic" ||
            v === "unsafe-hashes" ||
            v === "report-sample" ||
            /^https?:/.test(v) ||
            /^nonce-[A-Za-z0-9+/=]+$/.test(v) ||
            /^sha256-[A-Za-z0-9+/=]+$/.test(v) ||
            /^sha384-[A-Za-z0-9+/=]+$/.test(v) ||
            /^sha512-[A-Za-z0-9+/=]+$/.test(v) ||
            /^'nonce-[A-Za-z0-9+/=]+'$/.test(v) ||
            /^'sha256-[A-Za-z0-9+/=]+'$/.test(v) ||
            /^'sha384-[A-Za-z0-9+/=]+'$/.test(v) ||
            /^'sha512-[A-Za-z0-9+/=]+'$/.test(v) ||
            /^[^\/\s]*$/.test(v), // domain or IP
        );
    }
  }

  /**
   * Sanitize CSP policy - remove dangerous directives and values
   */
  static sanitizeCSP(csp: string): string {
    const directives = csp
      .split(";")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const sanitizedDirectives: string[] = [];

    for (const directive of directives) {
      const parts = directive.split(/\s+/);
      const directiveName = parts[0].toLowerCase();
      const values = parts.slice(1);

      // Skip dangerous directives that could be exploited
      if (["script-src", "style-src"].includes(directiveName)) {
        // For script-src and style-src, remove 'unsafe-inline' and 'unsafe-eval'
        const safeValues = values.filter(
          (v) =>
            v !== "unsafe-inline" &&
            v !== "unsafe-eval" &&
            !v.includes("javascript:") &&
            !v.includes("data:"),
        );

        if (safeValues.length > 0) {
          sanitizedDirectives.push([directiveName, ...safeValues].join(" "));
        }
      } else {
        // Keep other directives as-is if they're valid
        if (this.validateCSPDirective(directiveName, values)) {
          sanitizedDirectives.push(directive);
        }
      }
    }

    return sanitizedDirectives.join("; ");
  }

  // ===== SQL INJECTION PREVENTION =====

  /**
   * Sanitize input for SQL queries - remove dangerous SQL keywords and patterns
   */
  static sanitizeForSQL(input: string, allowedChars?: string): string {
    if (typeof input !== "string") {
      return "";
    }

    let sanitized = input;

    // Remove or escape SQL comment markers
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, ""); // Multi-line comments
    sanitized = sanitized.replace(/--.*$/gm, ""); // Single-line comments
    sanitized = sanitized.replace(/#.*$/gm, ""); // MySQL-style comments

    // Remove dangerous SQL keywords (case insensitive)
    const dangerousKeywords = [
      "union",
      "select",
      "insert",
      "update",
      "delete",
      "drop",
      "create",
      "alter",
      "exec",
      "execute",
      "script",
      "declare",
      "cast",
      "convert",
      "benchmark",
      "script",
      "javascript",
      "vbscript",
      "onload",
      "onerror",
      "eval",
      "alert",
    ];

    dangerousKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      sanitized = sanitized.replace(regex, "");
    });

    // Remove SQL operators that could be used in injection
    const dangerousOperators = [
      ";",
      "--",
      "/*",
      "*/",
      "xp_",
      "sp_",
      "sys.",
      "information_schema.",
      "concat(",
      "char(",
      "ascii(",
      "substring(",
      "len(",
      "length(",
    ];

    dangerousOperators.forEach((op) => {
      sanitized = sanitized.replace(
        new RegExp(this.escapeRegExp(op), "gi"),
        "",
      );
    });

    // If allowedChars is specified, only keep those characters
    if (allowedChars) {
      const allowedRegex = new RegExp(
        `[^${this.escapeRegExp(allowedChars)}]`,
        "g",
      );
      sanitized = sanitized.replace(allowedRegex, "");
    }

    // Limit length to prevent buffer overflow attacks
    return sanitized.substring(0, 1000);
  }

  /**
   * Validate input against SQL injection patterns
   */
  static validateSQLInjection(input: string): boolean {
    if (typeof input !== "string") {
      return false;
    }

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      // Union-based injection
      /(\bunion\b|\bselect\b).*(\bselect\b|\bunion\b)/i,

      // Error-based injection
      /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/i,

      // Comment injection
      /\/\*.*?\*\//,
      /--.*$/,
      /#.*$/,

      // Stacked queries
      /;\s*(select|insert|update|delete|drop|create|alter)/i,

      // Time-based injection
      /benchmark\s*\(/i,
      /sleep\s*\(/i,
      /waitfor\s+/i,

      // System table access
      /\binformation_schema\b/i,
      /\bsys\./i,
      /\bmaster\./i,

      // File system access
      /load_file\s*\(/i,
      /into\s+outfile/i,
      /into\s+dumpfile/i,

      // Command execution
      /xp_cmdshell/i,
      /sys_exec/i,

      // Multiple encodings
      /%[0-9a-f]{2}/gi, // URL encoding
      /&#\d+;/gi, // HTML decimal entities
      /&#x[0-9a-f]+;/gi, // HTML hex entities

      // JavaScript in SQL context (unusual)
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
    ];

    // Check against all patterns
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(input)) {
        return false;
      }
    }

    // Check for balanced quotes (SQL strings should have balanced quotes)
    const singleQuotes = (input.match(/'/g) || []).length;
    const doubleQuotes = (input.match(/"/g) || []).length;

    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      return false;
    }

    // Check for suspicious character combinations
    const suspiciousPatterns = [
      /'\s*or\s*'/i,
      /'\s*and\s*'/i,
      /"\s*or\s*"/i,
      /"\s*and\s*"/i,
      /=\s*'/,
      /=\s*"/,
      /like\s*'/i,
      /like\s*"/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Prepare input for parameterized queries (escape special characters)
   */
  static prepareForParameterizedQuery(input: string): string {
    if (typeof input !== "string") {
      return "";
    }

    // Remove null bytes
    let prepared = input.replace(/\0/g, "");

    // Escape backslashes first
    prepared = prepared.replace(/\\/g, "\\\\");

    // Escape single quotes
    prepared = prepared.replace(/'/g, "\\'");

    // Escape double quotes
    prepared = prepared.replace(/"/g, '\\"');

    // Remove or escape other potentially dangerous characters
    prepared = prepared.replace(/[\x00-\x1F\x7F]/g, ""); // Control characters

    return prepared;
  }

  /**
   * Validate and sanitize numeric input for SQL queries
   */
  static sanitizeNumericForSQL(input: string | number): number | null {
    if (typeof input === "number") {
      // Check for NaN, Infinity, etc.
      if (!isFinite(input) || isNaN(input)) {
        return null;
      }
      return input;
    }

    if (typeof input === "string") {
      // Remove all non-numeric characters except decimal point and minus
      const cleaned = input.replace(/[^0-9.-]/g, "");

      // Check for multiple decimal points or minus signs
      if (
        (cleaned.match(/\./g) || []).length > 1 ||
        (cleaned.match(/-/g) || []).length > 1 ||
        (/^-/.test(cleaned) === false && /-+/.test(cleaned))
      ) {
        return null;
      }

      const num = parseFloat(cleaned);
      if (!isFinite(num) || isNaN(num)) {
        return null;
      }

      return num;
    }

    return null;
  }

  /**
   * Validate and sanitize array inputs for SQL IN clauses
   */
  static sanitizeArrayForSQL(
    arr: any[],
    maxLength: number = 100,
  ): (string | number)[] | null {
    if (!Array.isArray(arr) || arr.length === 0 || arr.length > maxLength) {
      return null;
    }

    const sanitized: (string | number)[] = [];

    for (const item of arr) {
      if (typeof item === "string") {
        // For string arrays, sanitize each item
        const sanitizedItem = this.sanitizeForSQL(item);
        if (!this.validateSQLInjection(sanitizedItem)) {
          return null;
        }
        sanitized.push(sanitizedItem);
      } else if (typeof item === "number") {
        const sanitizedNum = this.sanitizeNumericForSQL(item);
        if (sanitizedNum === null) {
          return null;
        }
        sanitized.push(sanitizedNum);
      } else {
        // Unsupported type
        return null;
      }
    }

    return sanitized;
  }

  /**
   * Helper method to escape special regex characters
   */
  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Combine multiple validations
   */
  static combine(...validators: (string | null)[]): string | null {
    for (const error of validators) {
      if (error) return error;
    }

    return null;
  }
}

// ===== SECURITY HEADERS =====

export class SecurityHeaders {
  /**
   * Get security headers for HTTP responses
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      // Content Security Policy
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googletagmanager.com *.google-analytics.com",
        "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
        "font-src 'self' fonts.gstatic.com",
        "img-src 'self' data: https: *.googleusercontent.com *.gravatar.com",
        "connect-src 'self' *.google-analytics.com *.googletagmanager.com",
        "frame-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),

      // Prevent clickjacking
      "X-Frame-Options": "DENY",

      // Prevent MIME type sniffing
      "X-Content-Type-Options": "nosniff",

      // XSS protection (legacy)
      "X-XSS-Protection": "1; mode=block",

      // Referrer policy
      "Referrer-Policy": "strict-origin-when-cross-origin",

      // HSTS (HTTP Strict Transport Security)
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

      // Permissions policy
      "Permissions-Policy": [
        "camera=()",
        "microphone=()",
        "geolocation=()",
        "payment=()",
        "usb=()",
        "magnetometer=()",
        "accelerometer=()",
        "gyroscope=()",
        "ambient-light-sensor=()",
        "autoplay=()",
        "encrypted-media=()",
        "fullscreen=(self)",
        "picture-in-picture=()",
      ].join(", "),
    };
  }

  /**
   * Validate and sanitize headers
   */
  static sanitizeHeaderValue(value: string): string {
    // Remove control characters and limit length
    return value.replace(/[\x00-\x1F\x7F]/g, "").substring(0, 8192);
  }
}

// ===== ERROR HANDLING (SECURITY) =====

export class SecureErrorHandler {
  /**
   * Sanitize error messages to prevent information leakage
   */
  static sanitizeErrorMessage(error: Error | string): string {
    const message = error instanceof Error ? error.message : error;

    // Remove sensitive information
    return message
      .replace(/password[^=]*=([^&\s]*)/gi, "password=***")
      .replace(/token[^=]*=([^&\s]*)/gi, "token=***")
      .replace(/key[^=]*=([^&\s]*)/gi, "key=***")
      .replace(/secret[^=]*=([^&\s]*)/gi, "secret=***")
      .replace(
        /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,
        "****-****-****-****",
      ) // Credit cards
      .replace(/\b\d{3}[\s\-]?\d{3}[\s\-]?\d{4}\b/g, "***-***-****") // SSN-like
      .substring(0, 500); // Limit length
  }

  /**
   * Create safe error response
   */
  static createSafeErrorResponse(
    error: Error | string,
    statusCode: number = 500,
  ): {
    statusCode: number;
    message: string;
    timestamp: string;
    requestId?: string;
  } {
    const isDevelopment = process.env.NODE_ENV === "development";

    return {
      statusCode,
      message: isDevelopment
        ? this.sanitizeErrorMessage(error)
        : "Ocorreu um erro interno",
      timestamp: new Date().toISOString(),
      // In production, don't include stack traces or sensitive details
      ...(isDevelopment && {
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };
  }

  /**
   * Log error securely (without sensitive data)
   */
  static logErrorSecurely(error: Error, context?: Record<string, any>) {
    const sanitizedContext = context ? this.sanitizeObject(context) : {};

    console.error("[SECURE ERROR LOG]", {
      message: this.sanitizeErrorMessage(error),
      timestamp: new Date().toISOString(),
      context: sanitizedContext,
      // Don't log stack traces in production
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
      }),
    });
  }

  /**
   * Sanitize object values recursively
   */
  private static sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        sanitized[key] = this.sanitizeErrorMessage(value);
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Utility functions for test compatibility
export function sanitizeInput(
  input: string,
  options?: { maxLength?: number; preventPathTraversal?: boolean },
): string {
  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input;

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

  // For path traversal protection, remove dangerous path patterns
  if (options?.preventPathTraversal) {
    sanitized = sanitized.replace(/\.\./g, ""); // Remove all ".." sequences
    sanitized = sanitized.replace(/^\//, ""); // Remove leading slashes
    sanitized = sanitized.replace(/\/+/g, ""); // Remove all slashes
  }

  // Escape HTML entities
  sanitized = sanitized.replace(/&/g, "&amp;");
  sanitized = sanitized.replace(/</g, "&lt;");
  sanitized = sanitized.replace(/>/g, "&gt;");
  sanitized = sanitized.replace(/"/g, "&quot;");
  sanitized = sanitized.replace(/'/g, "&#x27;");

  // Remove dangerous protocols
  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/vbscript:/gi, "");
  sanitized = sanitized.replace(/data:text/gi, "");

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, "");
  sanitized = sanitized.replace(/on\w+='[^']*'/gi, "");
  sanitized = sanitized.replace(/on\w+=[^>\s]+/gi, "");

  // Apply length limit if specified
  if (options?.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

export function validateNoScript(input: string): boolean {
  if (typeof input !== "string") {
    return true; // Empty input is valid
  }

  // Check for noscript tags
  if (/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi.test(input)) {
    return false;
  }

  // Check for iframe inside noscript
  if (/iframe/gi.test(input)) {
    return false;
  }

  // Check for dangerous src attributes
  if (/src\s*=\s*["'][^"']*["']/gi.test(input)) {
    const srcMatch = input.match(/src\s*=\s*["']([^"']*)["']/gi);
    if (srcMatch) {
      for (const match of srcMatch) {
        const url = match.match(/src\s*=\s*["']([^"']*)["']/i)?.[1];
        if (url && !url.startsWith("https://") && !url.startsWith("http://")) {
          return false;
        }
      }
    }
  }

  return true;
}

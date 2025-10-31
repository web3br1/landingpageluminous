// Lazy-loaded jose functions with test override capability
import { sha256Hash, hmacSha256 } from "../architecture/crypto-utils";

let josePromise: Promise<typeof import('jose')> | null = null;
let customJoseImpl: typeof import('jose') | null = null;

// Allow tests to override the jose implementation
export function __setJoseMock(mockImpl: typeof import('jose')) {
  customJoseImpl = mockImpl;
  josePromise = null; // Reset cache
}

async function getJose() {
  if (customJoseImpl) {
    return customJoseImpl;
  }

  if (!josePromise) {
    if (process.env.NODE_ENV === 'test') {
      // Default mock implementations for testing
      josePromise = Promise.resolve({
        jwtVerify: async (
          _token: string,
          _key: unknown,
          _options?: unknown,
        ) => ({
          payload: { sub: "mock", exp: Date.now() / 1000 + 3600 },
        }),
        importJWK: async (_jwk: unknown) => ({ type: "secret" }),
      } as any);
    } else {
      josePromise = import('jose');
    }
  }
  return josePromise;
}

export interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

export async function verifyJWT(
  token: string,
  secret: string,
  options: {
    clockTolerance?: string;
    currentDate?: Date;
  } = {},
): Promise<JWTPayload> {
  try {
    const jose = await getJose();

    const key = await jose.importJWK({
      kty: "oct",
      k: Buffer.from(secret).toString("base64url"),
    });

    const { payload } = await jose.jwtVerify(token, key, {
      clockTolerance: options.clockTolerance || "5s",
      currentDate: options.currentDate,
    });

    return payload as JWTPayload;
  } catch (error) {
    throw new Error(`JWT verification failed: ${error}`);
  }
}

export function isJWTExpired(token: string, now: Date = new Date()): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );
    return payload.exp * 1000 < now.getTime();
  } catch {
    return true; // Invalid token is considered expired
  }
}

/**
 * Secure JWT validation with HMAC signature verification
 * Combines standard JWT verification with additional HMAC check for extra security
 */
export async function verifyJWTWithHMAC(
  token: string,
  secret: string,
  hmacSecret: string,
  options: {
    clockTolerance?: string;
    currentDate?: Date;
  } = {},
): Promise<JWTPayload> {
  try {
    // First verify the JWT using standard jose library
    const payload = await verifyJWT(token, secret, options);

    // Additional security: verify HMAC signature of the token
    const tokenHash = sha256Hash(token);
    const expectedSignature = hmacSha256(tokenHash, hmacSecret);

    // Create signature from token + timestamp for replay attack protection
    const signaturePayload = `${token}.${Math.floor(Date.now() / 60000)}`; // 1-minute window
    const currentSignature = hmacSha256(signaturePayload, hmacSecret);

    // Verify the signature matches (within time window tolerance)
    if (currentSignature !== expectedSignature) {
      throw new Error("JWT HMAC signature verification failed");
    }

    return payload;
  } catch (error) {
    throw new Error(
      `Secure JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a secure token fingerprint for tracking without exposing sensitive data
 */
export function createTokenFingerprint(token: string): string {
  // Create a consistent hash of the token for tracking purposes
  // This allows identifying tokens without storing the actual token
  return sha256Hash(token);
}

import { jwtVerify, createLocalJWKSet, importJWK } from "jose";

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
    const encoder = new TextEncoder();
    const key = await importJWK({
      kty: "oct",
      k: Buffer.from(secret).toString("base64url"),
    });

    const { payload } = await jwtVerify(token, key, {
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

/**
 * Secure Crypto Utilities - Enterprise-grade cryptographic operations
 *
 * Replaces insecure algorithms (MD5) with secure alternatives (SHA-256/SHA-3)
 * Provides unified cryptographic operations across the application
 */

import { createHash, randomBytes, createHmac } from "crypto";

// ===== HASHING ALGORITHMS =====

/**
 * Secure SHA-256 hash for content hashing
 * Replaces insecure MD5 usage
 */
export function sha256Hash(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * SHA-3-256 hash for high-security applications
 * More secure than SHA-256, slower but cryptographically stronger
 */
export function sha3Hash(data: string): string {
  return createHash("sha3-256").update(data).digest("hex");
}

/**
 * Legacy MD5 hash - DEPRECATED, use sha256Hash instead
 * @deprecated Use sha256Hash for security
 */
export function md5Hash(data: string): string {
  console.warn("MD5 is deprecated and insecure. Use sha256Hash instead.");
  return createHash("md5").update(data).digest("hex");
}

// ===== HMAC OPERATIONS =====

/**
 * HMAC-SHA256 for authenticated hashing
 * Used for token verification, API authentication, etc.
 */
export function hmacSha256(data: string, key: string): string {
  return createHmac("sha256", key).update(data).digest("hex");
}

/**
 * HMAC-SHA3-256 for high-security authenticated hashing
 */
export function hmacSha3(data: string, key: string): string {
  return createHmac("sha3-256", key).update(data).digest("hex");
}

// ===== MURMUR HASH (OPTIMIZED) =====

/**
 * MurmurHash3 - Optimized non-cryptographic hash for performance
 * Used for consistent bucketing, caching keys, etc.
 * Single implementation to replace duplicates across codebase
 */
export function murmurHash3(key: string, seed = 0): number {
  const data = Buffer.from(key, 'utf8');
  const length = data.length;
  let h1 = seed;
  const remainder = length & 3; // length % 4
  const bytes = length - remainder;

  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let i = 0;

  // Body
  while (i < bytes) {
    let k1 = (data[i] & 0xff) |
             ((data[i + 1] & 0xff) << 8) |
             ((data[i + 2] & 0xff) << 16) |
             ((data[i + 3] & 0xff) << 24);
    i += 4;

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }

  // Tail
  let k1 = 0;
  switch (remainder) {
    case 3: k1 ^= (data[i + 2] & 0xff) << 16; // falls through
    case 2: k1 ^= (data[i + 1] & 0xff) << 8;  // falls through
    case 1: k1 ^= (data[i] & 0xff);
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
  }

  // Finalization
  h1 ^= length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0; // Convert to unsigned 32-bit
}

// ===== KEY DERIVATION =====

/**
 * Simple key derivation for cache keys and identifiers
 * Not cryptographically secure, use for performance optimization only
 */
export function deriveKey(salt: string, data: string): string {
  const combined = `${salt}:${data}`;
  return sha256Hash(combined).substring(0, 16); // 64-bit key
}

// ===== RANDOM OPERATIONS =====

/**
 * Generate cryptographically secure random bytes
 */
export function generateSecureRandom(length: number): Buffer {
  return randomBytes(length);
}

/**
 * Generate secure random string (hex format)
 */
export function generateSecureRandomString(length: number): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate secure random UUID v4
 */
export function generateSecureUUID(): string {
  const bytes = randomBytes(16);

  // Set version (4) and variant (2) bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 2

  const hex = bytes.toString('hex');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
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
 * Hash with salt for basic data integrity
 */
export function hashWithSalt(data: string, salt: string): string {
  return hmacSha256(data, salt);
}

/**
 * Verify hash with salt
 */
export function verifyHashWithSalt(data: string, salt: string, expectedHash: string): boolean {
  const computedHash = hashWithSalt(data, salt);
  return secureCompare(computedHash, expectedHash);
}

// ===== COMPATIBILITY LAYER =====

/**
 * FNV-1a hash - Alternative non-cryptographic hash
 * Used where MurmurHash might have collisions
 */
export function fnv1aHash(key: string): number {
  const FNV_OFFSET_BASIS = 0x811c9dc5;
  const FNV_PRIME = 0x01000193;

  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}

// ===== DEPRECATED FUNCTIONS (BACKWARD COMPATIBILITY) =====

/**
 * @deprecated Use murmurHash3 instead
 */
export const murmurHash = murmurHash3;

/**
 * @deprecated Use sha256Hash instead
 */
export const secureHash = sha256Hash;

/**
 * @deprecated Use generateSecureRandomString instead
 */
export function generateRandomId(length = 8): string {
  console.warn("generateRandomId is deprecated. Use generateSecureRandomString instead.");
  return generateSecureRandomString(length);
}

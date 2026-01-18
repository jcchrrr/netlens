/**
 * Encrypted storage for sensitive data like API keys
 * Uses AES-GCM with a key derived from extension ID via PBKDF2
 */

// Salt for key derivation (static but unique to NetLens)
const SALT = new TextEncoder().encode("netlens-storage-salt-v1");
const ITERATIONS = 100000;

/**
 * Derive an encryption key from the extension ID
 */
async function deriveKey(): Promise<CryptoKey> {
  // Use extension ID as the base secret, or fallback for dev
  const extensionId = chrome.runtime?.id || "netlens-dev-mode";
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(extensionId),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: SALT,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a string value
 * Returns base64-encoded string containing IV + ciphertext
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return "";

  try {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );

    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a previously encrypted value
 * Expects base64-encoded string containing IV + ciphertext
 */
export async function decrypt(encrypted: string): Promise<string> {
  if (!encrypted) return "";

  try {
    const key = await deriveKey();

    // Decode from base64
    const combined = new Uint8Array(
      atob(encrypted)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    // Return empty string on failure (key might have been corrupted)
    return "";
  }
}

/**
 * Check if a string looks like an encrypted value
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  // Encrypted values are base64 and at least 12 bytes (IV) + some ciphertext
  try {
    const decoded = atob(value);
    return decoded.length >= 16; // At least IV + a few bytes
  } catch {
    return false;
  }
}

/**
 * Encrypt an API key for storage
 * Only encrypts if the key is not already encrypted
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  if (!apiKey) return "";
  if (isEncrypted(apiKey)) return apiKey; // Already encrypted
  return encrypt(apiKey);
}

/**
 * Decrypt an API key from storage
 * Returns the key as-is if it doesn't look encrypted (migration case)
 */
export async function decryptApiKey(encrypted: string): Promise<string> {
  if (!encrypted) return "";
  if (!isEncrypted(encrypted)) return encrypted; // Not encrypted, return as-is
  return decrypt(encrypted);
}

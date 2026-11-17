// WebCrypto checks for downloaded locale files: ECDSA P-256 / SHA-256 signatures (raw r||s, base64)
// over the exact bytes of the file, and hex SHA-256 digests. Both run in every browser we target,
// Android WebView included (Ed25519 does not, so it is not used).
import { LOCALE_PUBLIC_KEY_JWK } from './publicKey';

let keyPromise: Promise<CryptoKey> | null = null;

function subtle(): SubtleCrypto {
  const api = globalThis.crypto?.subtle;
  if (!api) throw new Error('WebCrypto is not available');
  return api;
}

function publicKey(): Promise<CryptoKey> {
  keyPromise ??= subtle().importKey('jwk', { ...LOCALE_PUBLIC_KEY_JWK, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  return keyPromise;
}

function base64ToBytes(text: string): Uint8Array {
  const binary = atob(text.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** UTF-8 bytes of a response body; equal to the file bytes for UTF-8 files without a BOM. */
export const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text);

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await subtle().digest('SHA-256', bytes as BufferSource));
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** True when `signature` (base64) is a valid signature of `bytes` by the embedded key. */
export async function verifySignature(bytes: Uint8Array, signature: string): Promise<boolean> {
  let sig: Uint8Array;
  try {
    sig = base64ToBytes(signature);
  } catch {
    return false;
  }
  if (sig.length !== 64) return false;
  return subtle().verify({ name: 'ECDSA', hash: 'SHA-256' }, await publicKey(), sig as BufferSource, bytes as BufferSource);
}

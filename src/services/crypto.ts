/**
 * Web Crypto API security helper for local Master Passcode protection
 * and backup file encryption/decryption.
 */

import { EncryptedPayload } from '../types';

// Generate random salt/IV
function getBuffer(byteLength: number = 16): Uint8Array {
  const arr = new Uint8Array(byteLength);
  window.crypto.getRandomValues(arr);
  return arr;
}

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): Uint8Array {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    buf[i] = bin.charCodeAt(i);
  }
  return buf;
}

// Derive AES-GCM Key using PBKDF2
async function deriveKey(passcode: string, saltBuffer: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passcode) as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface HashPasscodeResult {
  hashB64: string;
  saltB64: string;
}

// Compute hash of passcode for verification
export async function hashPasscode(passcode: string, existingSaltB64: string | null = null): Promise<HashPasscodeResult> {
  let saltBuffer: Uint8Array;
  if (existingSaltB64) {
    saltBuffer = base64ToBuffer(existingSaltB64);
  } else {
    saltBuffer = getBuffer(16);
  }

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passcode) as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return {
    hashB64: bufferToBase64(bits),
    saltB64: bufferToBase64(saltBuffer)
  };
}

// Verify Passcode against stored hash
export async function verifyPasscode(
  passcode: string | null,
  storedHashB64: string | null,
  storedSaltB64: string | null
): Promise<boolean> {
  if (!passcode || !storedHashB64 || !storedSaltB64) return false;
  const result = await hashPasscode(passcode, storedSaltB64);
  return result.hashB64 === storedHashB64;
}

// Encrypt JSON object string using passcode
export async function encryptData(jsonDataString: string, passcode: string): Promise<string> {
  const salt = getBuffer(16);
  const iv = getBuffer(12);
  const key = await deriveKey(passcode, salt);

  const enc = new TextEncoder();
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    enc.encode(jsonDataString) as unknown as BufferSource
  );

  const payload: EncryptedPayload = {
    version: 1,
    encrypted: true,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    data: bufferToBase64(encryptedBuf)
  };

  return JSON.stringify(payload);
}

// Decrypt encrypted payload
export async function decryptData(encryptedPayloadJson: string | EncryptedPayload, passcode: string): Promise<string> {
  const payload: EncryptedPayload = typeof encryptedPayloadJson === 'string'
    ? JSON.parse(encryptedPayloadJson)
    : encryptedPayloadJson;

  if (!payload.encrypted || !payload.salt || !payload.iv || !payload.data) {
    throw new Error('Invalid encrypted backup payload structure');
  }

  const saltBuf = base64ToBuffer(payload.salt);
  const ivBuf = base64ToBuffer(payload.iv);
  const dataBuf = base64ToBuffer(payload.data);

  const key = await deriveKey(passcode, saltBuf);

  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuf as unknown as BufferSource },
    key,
    dataBuf as unknown as BufferSource
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuf);
}

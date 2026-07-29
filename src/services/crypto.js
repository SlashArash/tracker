/**
 * Web Crypto API security helper for local Master Passcode protection
 * and backup file encryption/decryption.
 */

// Generate random salt/IV
function getBuffer(byteLength = 16) {
  const arr = new Uint8Array(byteLength);
  window.crypto.getRandomValues(arr);
  return arr;
}

function bufferToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuffer(b64) {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    buf[i] = bin.charCodeAt(i);
  }
  return buf.buffer;
}

// Derive AES-GCM Key using PBKDF2
async function deriveKey(passcode, saltBuffer) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Compute hash of passcode for verification
export async function hashPasscode(passcode, existingSaltB64 = null) {
  let saltBuffer;
  if (existingSaltB64) {
    saltBuffer = base64ToBuffer(existingSaltB64);
  } else {
    saltBuffer = getBuffer(16);
  }

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
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
export async function verifyPasscode(passcode, storedHashB64, storedSaltB64) {
  if (!passcode || !storedHashB64 || !storedSaltB64) return false;
  const result = await hashPasscode(passcode, storedSaltB64);
  return result.hashB64 === storedHashB64;
}

// Encrypt JSON object string using passcode
export async function encryptData(jsonDataString, passcode) {
  const salt = getBuffer(16);
  const iv = getBuffer(12);
  const key = await deriveKey(passcode, salt);

  const enc = new TextEncoder();
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(jsonDataString)
  );

  return JSON.stringify({
    version: 1,
    encrypted: true,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    data: bufferToBase64(encryptedBuf)
  });
}

// Decrypt encrypted payload
export async function decryptData(encryptedPayloadJson, passcode) {
  const payload = typeof encryptedPayloadJson === 'string' 
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
    { name: 'AES-GCM', iv: new Uint8Array(ivBuf) },
    key,
    dataBuf
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuf);
}

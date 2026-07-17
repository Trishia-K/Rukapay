// Converts the base64url strings the backend sends into the raw byte
// buffers the browser's native fingerprint API actually requires, and back.
export function base64urlToBuffer(base64url) {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);
  return buffer;
}

export function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

import { api } from '../api/client';

export async function registerFingerprintFor(personId) {
  const options = await api.post(`/fingerprint/${personId}/register-options`, {});

  const publicKey = {
    challenge: base64urlToBuffer(options.challenge),
    rp: options.rp,
    user: {
      id: new TextEncoder().encode(options.user.id),
      name: options.user.name,
      displayName: options.user.displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    attestation: options.attestation,
    authenticatorSelection: options.authenticatorSelection,
  };

  const credential = await navigator.credentials.create({ publicKey });

  const attestation = {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {},
    response: {
      clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
      attestationObject: bufferToBase64url(credential.response.attestationObject),
    },
  };

  await api.post(`/fingerprint/${personId}/register-verify`, attestation);
}
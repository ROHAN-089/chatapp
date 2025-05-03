/**
 * Key Manager for E2EE Chat Application
 * 
 * This file handles generating and storing RSA key pairs for secure messaging.
 */

// Constants for localStorage keys
const PRIVATE_KEY_STORAGE = 'privateKey';
const PUBLIC_KEY_STORAGE = 'publicKey';

/**
 * Generates a new RSA key pair
 * @returns {Promise<Object>} Object containing public and private keys
 */
export async function generateKeyPair() {
  try {
    // Generate RSA-OAEP key pair using Web Crypto API
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"] // allowed operations
    );

    // Export the keys to a format suitable for storage
    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    // Convert ArrayBuffer to base64 for storage
    const publicKeyBase64 = _arrayBufferToBase64(publicKeyBuffer);
    const privateKeyBase64 = _arrayBufferToBase64(privateKeyBuffer);

    // Add PEM headers for easier identification
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;
    const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`;

    return {
      publicKey: publicKeyPem,
      privateKey: privateKeyPem
    };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw error;
  }
}

/**
 * Stores a key pair in localStorage
 * @param {Object} keyPair Object containing public and private keys
 */
export function storeKeyPair(keyPair) {
  localStorage.setItem(PUBLIC_KEY_STORAGE, keyPair.publicKey);
  localStorage.setItem(PRIVATE_KEY_STORAGE, keyPair.privateKey);
  console.log('Key pair stored in localStorage');
}

/**
 * Generates a key pair and stores it in localStorage
 * @returns {Promise<Object>} The generated key pair
 */
export async function generateAndStoreKeyPair() {
  try {
    const keyPair = await generateKeyPair();
    storeKeyPair(keyPair);
    return keyPair;
  } catch (error) {
    console.error('Failed to generate and store key pair:', error);
    throw error;
  }
}

/**
 * Gets the user's private key from localStorage
 * @returns {string|null} The private key or null if not found
 */
export function getPrivateKey() {
  return localStorage.getItem(PRIVATE_KEY_STORAGE);
}

/**
 * Gets the user's public key from localStorage
 * @returns {string|null} The public key or null if not found
 */
export function getPublicKey() {
  return localStorage.getItem(PUBLIC_KEY_STORAGE);
}

/**
 * Checks if the user has generated keys
 * @returns {boolean} True if keys exist in localStorage
 */
export function hasKeys() {
  return Boolean(getPrivateKey() && getPublicKey());
}

/**
 * Utility to convert ArrayBuffer to Base64 string
 * @private
 */
function _arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Utility to convert Base64 string to ArrayBuffer
 * @private
 */
function _base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

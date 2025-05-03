/**
 * Message Decryption Utility for E2EE Chat Application
 * 
 * This file handles decrypting messages using the user's private key:
 * 1. Decrypt the AES key using our RSA private key
 * 2. Use the decrypted AES key to decrypt the message
 */

import { getPrivateKey } from './keyManager';

/**
 * Converts a base64 string to an ArrayBuffer
 * @param {string} base64 - Base64 encoded string
 * @returns {ArrayBuffer} The decoded ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Imports a private key from PEM format
 * @param {string} privateKeyPem - The private key in PEM format
 * @returns {Promise<CryptoKey>} The imported private key
 */
async function importPrivateKey(privateKeyPem) {
  try {
    // Clean up the PEM format
    const pemContents = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\\s/g, '');
    
    // Convert to binary
    const binaryDer = base64ToArrayBuffer(pemContents);
    
    // Import as RSA-OAEP key
    return await window.crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false, // not extractable
      ['decrypt']
    );
  } catch (error) {
    console.error('Error importing private key:', error);
    throw new Error('Failed to import private key');
  }
}

/**
 * Decrypts a message using the user's private key
 * @param {string} encryptedPayload - The encrypted message payload as a JSON string
 * @param {string} senderId - Optional ID of the sender for logging
 * @returns {Promise<string|object>} The decrypted message text or error object
 */
export async function decryptMessage(encryptedPayload, senderId = null) {
  const senderLabel = senderId ? `from user ${senderId}` : '';
  
  try {
    // Parse the encrypted payload
    const { encryptedMessage, encryptedKey, iv } = JSON.parse(encryptedPayload);
    
    if (!encryptedMessage || !encryptedKey || !iv) {
      throw new Error('Missing required encryption fields');
    }

    // Get the private key from storage
    const privateKeyPem = getPrivateKey();
    if (!privateKeyPem) {
      throw new Error('Private key not found');
    }
    
    // Import the private key
    const privateKey = await importPrivateKey(privateKeyPem);
    
    // Step 1: Decrypt the AES key with our private RSA key
    const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey);
    const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedKeyBuffer
    );
    
    // Step 2: Import the AES key for use with AES-GCM
    const aesKey = await window.crypto.subtle.importKey(
      'raw',
      decryptedKeyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Step 3: Decrypt the message with AES-GCM
    const ivBuffer = base64ToArrayBuffer(iv);
    const encryptedMessageBuffer = base64ToArrayBuffer(encryptedMessage);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      aesKey,
      encryptedMessageBuffer
    );
    
    // Convert ArrayBuffer to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
    
  } catch (error) {
    console.error(`Decryption error ${senderLabel}:`, error);
    
    // Return an error object
    return {
      text: '🔒 Encrypted message (unable to decrypt)',
      error: `Decryption failed: ${error.message}`
    };
  }
}

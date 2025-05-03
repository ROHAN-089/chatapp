/**
 * Message Encryption Utility for E2EE Chat Application
 * 
 * This file handles encrypting messages using a hybrid RSA/AES approach:
 * 1. Generate a random AES key
 * 2. Encrypt the message with the AES key
 * 3. Encrypt the AES key with the recipient's RSA public key
 * 4. Send both the encrypted message and encrypted key
 */

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
 * Converts an ArrayBuffer to a base64 string
 * @param {ArrayBuffer} buffer - The ArrayBuffer to convert
 * @returns {string} Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Imports a public key from PEM format
 * @param {string} publicKeyPem - The public key in PEM format
 * @returns {Promise<CryptoKey>} The imported public key
 */
async function importPublicKey(publicKeyPem) {
  try {
    // Clean up the PEM format
    const pemContents = publicKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\\s/g, '');
    
    // Convert to binary
    const binaryDer = base64ToArrayBuffer(pemContents);
    
    // Import as RSA-OAEP key
    return await window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false, // not extractable
      ['encrypt']
    );
  } catch (error) {
    console.error('Error importing public key:', error);
    throw new Error('Failed to import public key');
  }
}

/**
 * Encrypts a message using the recipient's public key
 * @param {string} message - The message to encrypt
 * @param {string} recipientPublicKey - The recipient's public key in PEM format
 * @returns {Promise<string>} JSON string containing encrypted message data
 */
export async function encryptMessage(message, recipientPublicKey) {
  try {
    if (!message || !recipientPublicKey) {
      throw new Error('Message and recipient public key are required');
    }

    // Step 1: Generate a random AES key
    const aesKey = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt']
    );

    // Step 2: Generate a random initialization vector (IV)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Step 3: Encrypt the message with AES-GCM
    const encoder = new TextEncoder();
    const messageData = encoder.encode(message);
    
    const encryptedMessageBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      aesKey,
      messageData
    );

    // Step 4: Export the AES key
    const aesKeyBuffer = await window.crypto.subtle.exportKey('raw', aesKey);

    // Step 5: Import the recipient's public key
    const publicKey = await importPublicKey(recipientPublicKey);

    // Step 6: Encrypt the AES key with the recipient's RSA public key
    const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      aesKeyBuffer
    );

    // Step 7: Convert all ArrayBuffers to base64 for transmission
    const encryptedMessage = arrayBufferToBase64(encryptedMessageBuffer);
    const encryptedKey = arrayBufferToBase64(encryptedKeyBuffer);
    const ivBase64 = arrayBufferToBase64(iv);

    // Step 8: Return the encrypted data as a JSON string
    return JSON.stringify({
      encryptedMessage,
      encryptedKey,
      iv: ivBase64
    });
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw error;
  }
}

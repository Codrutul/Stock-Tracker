const crypto = require('crypto');

// Ensure you have a strong, unique encryption key stored securely in your environment variables.
// For demonstration, using a default key. REPLACE THIS IN PRODUCTION.
const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'default_strong_encryption_key_32bytes'; // Must be 32 bytes for AES-256
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
    if (text === null || typeof text === 'undefined') {
        return null;
    }
    const textString = String(text);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(textString);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (text === null || typeof text === 'undefined') {
        return null;
    }
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption failed:", error);
        // It's important to handle decryption errors carefully.
        // For a 2FA secret, if decryption fails, the user might be locked out
        // unless they have recovery codes or an admin can reset it.
        // Returning null or throwing an error might be appropriate.
        return null; 
    }
}

module.exports = { encrypt, decrypt }; 
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const UserRepo = require('../models/UserRepo'); // Assuming UserRepo handles DB interactions
const { encrypt, decrypt } = require('../utils/cryptoUtil');

class TwoFactorService {
    constructor() {
        this.appName = 'StockTrackerApp'; // Or your application's name
    }

    generateSecret() {
        const secret = speakeasy.generateSecret({ length: 20, name: this.appName });
        // secret.ascii, secret.hex, secret.base32, secret.otpauth_url
        return secret;
    }

    async generateQrCodeDataUrl(otpAuthUrl) {
        try {
            const dataUrl = await qrcode.toDataURL(otpAuthUrl);
            return dataUrl;
        } catch (err) {
            console.error('Error generating QR code:', err);
            throw new Error('Failed to generate QR code for 2FA setup.');
        }
    }

    verifyToken(secret, token) {
        // The secret here must be the user's stored (and decrypted) base32 secret
        return speakeasy.totp.verify({
            secret: secret, // User's base32 secret
            encoding: 'base32',
            token: token,
            window: 1 // Allow tokens from 1 time step before or after the current one
        });
    }

    generateRecoveryCodes(count = 10, length = 10) {
        const codes = [];
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < count; i++) {
            let code = '';
            for (let j = 0; j < length; j++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            codes.push(code);
        }
        return codes;
    }

    async verifyRecoveryCode(userId, providedCode) {
        const storedEncryptedCodes = await UserRepo.getRecoveryCodes(userId); // This should get raw JSON string or null
        if (!storedEncryptedCodes || storedEncryptedCodes.length === 0) {
            return false;
        }
        
        let recoveryCodes = [];
        try {
            // UserRepo.getRecoveryCodes should ideally return already decrypted and parsed array.
            // If it returns encrypted string, we decrypt here.
            // For now, assuming UserRepo.getRecoveryCodes returns decrypted array (updated UserRepo for this)
            recoveryCodes = storedEncryptedCodes; 
        } catch(e) {
            console.error("Error parsing recovery codes from DB", e);
            return false;
        }

        const codeIndex = recoveryCodes.indexOf(providedCode);
        if (codeIndex > -1) {
            // Code is valid, remove it so it can't be used again
            recoveryCodes.splice(codeIndex, 1);
            await UserRepo.updateRecoveryCodes(userId, recoveryCodes);
            return true;
        }
        return false;
    }
}

module.exports = new TwoFactorService(); 
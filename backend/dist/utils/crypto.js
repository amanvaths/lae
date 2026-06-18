const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateReferralCode() {
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)];
    }
    return code;
}
export function normalizeWalletAddress(address) {
    return address.toLowerCase();
}
export function isValidWalletAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
//# sourceMappingURL=crypto.js.map
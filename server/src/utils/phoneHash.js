/**
 * Phone Number Hashing Utility
 * 
 * Uses HMAC-SHA256 with a server-side pepper (secret key) to create
 * a deterministic, irreversible hash of phone numbers.
 * 
 * WHY HMAC-SHA256 instead of plain SHA-256?
 * -----------------------------------------
 * Phone numbers are short (10-13 digits) — there are only ~10 billion
 * possible combinations. A plain SHA-256 hash can be brute-forced by
 * simply hashing all possible phone numbers and building a rainbow table.
 * 
 * HMAC-SHA256 uses a secret key (pepper) that the attacker doesn't have,
 * making rainbow tables useless. Even if the database is breached and all
 * hashes are leaked, the phone numbers cannot be recovered without the pepper.
 * 
 * WHY NOT bcrypt/scrypt/argon2?
 * ----------------------------
 * These use random per-record salts, which means the same input produces
 * different outputs each time. We NEED deterministic output so we can
 * look up "does this phone number's hash already exist in the ledger?"
 * 
 * CRITICAL: The PHONE_HASH_PEPPER must NEVER change in production.
 * If it changes, all existing hashes become unmatchable and the entire
 * anti-abuse system breaks silently.
 */

import { createHmac } from 'crypto';

/**
 * Normalize a phone number to a canonical form before hashing.
 * This ensures "+91 98765 43210", "9876543210", "+919876543210"
 * all produce the same hash.
 * 
 * @param {string} phone - Raw phone number input
 * @returns {string} Normalized phone number (digits only, with country code)
 */
export function normalizePhoneNumber(phone) {
  // Strip all non-digit characters (spaces, dashes, parentheses, plus sign)
  let digits = phone.replace(/\D/g, '');

  // If it starts with country code 91 and is 12 digits, keep it
  // If it's 10 digits, prepend India country code (91)
  if (digits.length === 10) {
    digits = '91' + digits;
  }

  // For other countries, the number should already include country code
  return digits;
}

/**
 * Generate an HMAC-SHA256 hash of a phone number using the server pepper.
 * 
 * The output is deterministic: same phone + same pepper = same hash.
 * This allows us to check if a phone number was previously registered
 * WITHOUT storing the actual phone number.
 * 
 * @param {string} phone - Raw phone number
 * @returns {string} 64-character hex hash
 * 
 * @example
 * hashPhoneNumber("+91 98765 43210") // => "a3f8b2c1d4e5..."
 * hashPhoneNumber("9876543210")       // => "a3f8b2c1d4e5..." (same hash!)
 */
export function hashPhoneNumber(phone) {
  const pepper = process.env.PHONE_HASH_PEPPER;

  if (!pepper || pepper.includes('do_not_use_in_production')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: PHONE_HASH_PEPPER is not set or is using a development value in production. ' +
        'Generate a secure pepper with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
  }

  const normalized = normalizePhoneNumber(phone);

  const hash = createHmac('sha256', pepper)
    .update(normalized)
    .digest('hex');

  return hash;
}

/**
 * Check if two phone numbers produce the same hash.
 * Useful for verification without exposing the hash comparison logic.
 * 
 * @param {string} phone - Phone number to check
 * @param {string} existingHash - Hash from the database
 * @returns {boolean}
 */
export function phoneMatchesHash(phone, existingHash) {
  const newHash = hashPhoneNumber(phone);
  // Use timing-safe comparison to prevent timing attacks
  if (newHash.length !== existingHash.length) return false;

  const a = Buffer.from(newHash, 'hex');
  const b = Buffer.from(existingHash, 'hex');
  return require('crypto').timingSafeEqual(a, b);
}


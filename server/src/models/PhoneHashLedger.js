/**
 * PhoneHashLedger Model
 * 
 * This is the PERMANENT record that survives account deletion.
 * It stores ONLY the HMAC hash of a phone number — never the actual number.
 * 
 * Purpose:
 * When a user deletes their account and re-registers with the same phone number,
 * we hash the new number, look it up in this ledger, and if found:
 *   - The user is flagged as a RETURNING user
 *   - New-user benefits (free delivery, signup coupons, referral bonuses) are DENIED
 * 
 * Data Flow:
 *   1. User registers  → hash created → stored in ledger (isReturningUser = false)
 *   2. User deletes     → User document deleted → ledger entry STAYS (deletedAt set)
 *   3. User re-registers → hash matches ledger → isReturningUser = true, benefits denied
 * 
 * Privacy:
 *   - The phone number CANNOT be recovered from the hash (HMAC is one-way)
 *   - The hash is pseudonymized data under GDPR, not PII
 *   - Even if the database is breached, phone numbers remain protected
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const PhoneHashLedgerSchema = new Schema({
  // The HMAC-SHA256 hash of the normalized phone number
  // This is the ONLY identifier — the actual phone number is NEVER stored here
  phoneHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
    immutable: true // Once written, this hash can NEVER be modified
  },

  // When this phone number was first seen in the system
  firstRegisteredAt: {
    type: Date,
    required: true,
    default: Date.now
  },

  // When the most recent account using this number was deleted
  // null = account is currently active
  lastDeletedAt: {
    type: Date,
    default: null
  },

  // Total number of times this phone number has been used to register
  // Starts at 1, increments on each re-registration
  registrationCount: {
    type: Number,
    default: 1,
    min: 1
  },

  // History of account lifecycle events for audit trail
  accountHistory: [{
    event: {
      type: String,
      enum: ['REGISTERED', 'DELETED', 'RE_REGISTERED'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    // Optional metadata (e.g., deletion reason)
    metadata: {
      type: Schema.Types.Mixed,
      default: null
    }
  }],

  // Quick flag: has this number been used before and deleted?
  // true = this is a returning user who previously deleted their account
  hasBeenPreviouslyDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, // adds createdAt, updatedAt
  collection: 'phone_hash_ledger' // explicit collection name
});

// Compound index for analytics queries
PhoneHashLedgerSchema.index({ hasBeenPreviouslyDeleted: 1, registrationCount: 1 });

/**
 * Static method: Record a new phone registration
 * Called during user signup
 * 
 * @param {string} phoneHash - HMAC-SHA256 hash of the phone number
 * @returns {{ isReturningUser: boolean, registrationCount: number, ledgerEntry: Document }}
 */
PhoneHashLedgerSchema.statics.recordRegistration = async function (phoneHash) {
  // Try to find an existing ledger entry for this hash
  let ledger = await this.findOne({ phoneHash });

  if (!ledger) {
    // First time this phone number is seen — genuinely new user
    ledger = await this.create({
      phoneHash,
      firstRegisteredAt: new Date(),
      registrationCount: 1,
      hasBeenPreviouslyDeleted: false,
      accountHistory: [{
        event: 'REGISTERED',
        timestamp: new Date()
      }]
    });

    return {
      isReturningUser: false,
      registrationCount: 1,
      ledgerEntry: ledger
    };
  }

  // Hash already exists — this phone number was used before!
  ledger.registrationCount += 1;
  ledger.lastDeletedAt = null; // Account is now active again
  ledger.accountHistory.push({
    event: 'RE_REGISTERED',
    timestamp: new Date(),
    metadata: { previousRegistrations: ledger.registrationCount - 1 }
  });

  await ledger.save();

  return {
    isReturningUser: true, // 🚫 DENY new-user benefits
    registrationCount: ledger.registrationCount,
    ledgerEntry: ledger
  };
};

/**
 * Static method: Record account deletion
 * Called when a user deletes their account
 * 
 * @param {string} phoneHash - HMAC-SHA256 hash of the phone number
 */
PhoneHashLedgerSchema.statics.recordDeletion = async function (phoneHash) {
  const ledger = await this.findOne({ phoneHash });

  if (!ledger) {
    console.warn(`[PhoneHashLedger] Attempted to record deletion for unknown hash. Skipping.`);
    return;
  }

  ledger.lastDeletedAt = new Date();
  ledger.hasBeenPreviouslyDeleted = true;
  ledger.accountHistory.push({
    event: 'DELETED',
    timestamp: new Date()
  });

  await ledger.save();
};

/**
 * Static method: Check if a phone hash indicates a returning user
 * Used to determine benefit eligibility without modifying the ledger
 * 
 * @param {string} phoneHash - HMAC-SHA256 hash
 * @returns {{ exists: boolean, isReturningUser: boolean, registrationCount: number }}
 */
PhoneHashLedgerSchema.statics.checkPhoneStatus = async function (phoneHash) {
  const ledger = await this.findOne({ phoneHash });

  if (!ledger) {
    return { exists: false, isReturningUser: false, registrationCount: 0 };
  }

  return {
    exists: true,
    isReturningUser: ledger.hasBeenPreviouslyDeleted,
    registrationCount: ledger.registrationCount
  };
};

const PhoneHashLedger = mongoose.model('PhoneHashLedger', PhoneHashLedgerSchema);

export default PhoneHashLedger;


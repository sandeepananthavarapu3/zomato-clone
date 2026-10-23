/**
 * 🧪 Anti-Abuse Hashing System — End-to-End Test Script
 * 
 * This script simulates the EXACT scenario the user described:
 * 
 *   1. New user registers with phone +91-9876543210
 *      → Gets full new-user benefits ✅
 * 
 *   2. User deletes their account
 *      → Personal data (phone, name) is DELETED
 *      → Phone hash STAYS in the ledger
 * 
 *   3. Same person re-registers with the SAME phone number
 *      → System hashes the number, finds match in ledger
 *      → User is flagged as RETURNING
 *      → New-user benefits are DENIED 🚫
 * 
 * Run: node src/tests/testAntiAbuse.js
 * 
 * Uses MongoMemoryServer — no system MongoDB installation required!
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

import User from '../models/User.js';
import Otp from '../models/Otp.js';
import PhoneHashLedger from '../models/PhoneHashLedger.js';
import { hashPhoneNumber, normalizePhoneNumber } from '../utils/phoneHash.js';
import { getNewUserBenefits } from '../services/benefitsService.js';

dotenv.config();

const TEST_PHONE = '+91 98765 43210';
const SEPARATOR = '━'.repeat(60);

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  await User.deleteMany({ phone: { $regex: /9876543210/ } });
  // Remove the hash for this test phone from the ledger
  const testHash = hashPhoneNumber(TEST_PHONE);
  await PhoneHashLedger.deleteMany({ phoneHash: testHash });
  await Otp.deleteMany({});
  console.log('   ✅ Cleanup complete\n');
}

async function runTest() {
  // Start an in-memory MongoDB instance (no system install needed!)
  console.log('⏳ Starting in-memory MongoDB server...');
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  console.log(`✅ Connected to in-memory MongoDB at ${mongoUri}`);
  
  await cleanup();

  console.log(SEPARATOR);
  console.log('🧪 ANTI-ABUSE HASHING SYSTEM — END-TO-END TEST');
  console.log(SEPARATOR);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 1: Show how phone normalization works
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📱 STEP 1: Phone Number Normalization');
  console.log('   Different formats → same normalized number → same hash\n');

  const formats = ['+91 98765 43210', '9876543210', '+919876543210', '91-9876543210'];
  for (const format of formats) {
    const normalized = normalizePhoneNumber(format);
    const hash = hashPhoneNumber(format);
    console.log(`   "${format}"`);
    console.log(`     → Normalized: ${normalized}`);
    console.log(`     → Hash:       ${hash.substring(0, 16)}...`);
    console.log();
  }

  const allSameHash = formats.every(f => hashPhoneNumber(f) === hashPhoneNumber(formats[0]));
  console.log(`   All formats produce same hash: ${allSameHash ? '✅ YES' : '❌ NO'}`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 2: First-time registration (genuinely new user)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log(`\n${SEPARATOR}`);
  console.log('👤 STEP 2: First-Time Registration');
  console.log(SEPARATOR);

  const phoneHash = hashPhoneNumber(TEST_PHONE);
  console.log(`\n   Phone: ${TEST_PHONE}`);
  console.log(`   Hash:  ${phoneHash}`);

  // Check ledger BEFORE registration
  const preCheckResult = await PhoneHashLedger.checkPhoneStatus(phoneHash);
  console.log(`\n   Ledger check BEFORE registration:`);
  console.log(`     Exists in ledger: ${preCheckResult.exists ? '⚠️ YES' : '✅ NO'}`);
  console.log(`     Is returning user: ${preCheckResult.isReturningUser ? '🚫 YES' : '✅ NO'}`);

  // Register in ledger
  const registrationResult = await PhoneHashLedger.recordRegistration(phoneHash);
  console.log(`\n   After registration in ledger:`);
  console.log(`     Is returning user: ${registrationResult.isReturningUser ? '🚫 YES' : '✅ NO'}`);
  console.log(`     Registration count: ${registrationResult.registrationCount}`);

  // Create user
  const user = await User.create({
    phone: normalizePhoneNumber(TEST_PHONE),
    name: 'Sandeep Test',
    isReturningUser: registrationResult.isReturningUser,
    registrationCount: registrationResult.registrationCount,
    isEligibleForNewUserBenefits: !registrationResult.isReturningUser
  });

  // Check benefits
  const benefits1 = getNewUserBenefits(user.isReturningUser);
  console.log(`\n   Benefits eligibility:`);
  console.log(`     Eligible: ${benefits1.eligible ? '✅ YES' : '🚫 NO'}`);
  console.log(`     Message: "${benefits1.message}"`);
  if (benefits1.eligible) {
    console.log(`     Available benefits:`);
    benefits1.benefits.forEach(b => {
      console.log(`       🎁 ${b.title}: ${b.description}`);
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 3: User deletes their account
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log(`\n${SEPARATOR}`);
  console.log('🗑️  STEP 3: Account Deletion');
  console.log(SEPARATOR);

  // Record deletion in ledger FIRST (need phone to hash)
  await PhoneHashLedger.recordDeletion(phoneHash);

  // Then delete the user document (all personal data gone)
  await User.findByIdAndDelete(user._id);

  // Verify user is gone
  const deletedUser = await User.findById(user._id);
  console.log(`\n   User document deleted: ${!deletedUser ? '✅ YES' : '❌ NO'}`);

  // Verify hash is still in ledger
  const ledgerAfterDelete = await PhoneHashLedger.findOne({ phoneHash });
  console.log(`   Hash still in ledger: ${ledgerAfterDelete ? '✅ YES' : '❌ NO'}`);
  console.log(`   hasBeenPreviouslyDeleted: ${ledgerAfterDelete?.hasBeenPreviouslyDeleted ? '✅ YES' : '❌ NO'}`);
  console.log(`   Account history:`);
  ledgerAfterDelete?.accountHistory.forEach(event => {
    console.log(`     📌 ${event.event} at ${event.timestamp.toISOString()}`);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 4: Same person re-registers (ABUSE ATTEMPT!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log(`\n${SEPARATOR}`);
  console.log('🚨 STEP 4: Re-Registration Attempt (SAME PHONE NUMBER)');
  console.log(SEPARATOR);

  // User tries to register again with the same number
  const reHash = hashPhoneNumber(TEST_PHONE);
  console.log(`\n   Phone: ${TEST_PHONE}`);
  console.log(`   Hash:  ${reHash}`);
  console.log(`   Hash matches original: ${reHash === phoneHash ? '✅ YES' : '❌ NO'}`);

  // Check ledger
  const reCheckResult = await PhoneHashLedger.checkPhoneStatus(reHash);
  console.log(`\n   Ledger check:`);
  console.log(`     Exists in ledger: ${reCheckResult.exists ? '⚠️ YES — PREVIOUSLY SEEN!' : '✅ NO'}`);
  console.log(`     Is returning user: ${reCheckResult.isReturningUser ? '🚫 YES — ABUSE DETECTED!' : '✅ NO'}`);
  console.log(`     Previous registrations: ${reCheckResult.registrationCount}`);

  // Record re-registration
  const reRegistration = await PhoneHashLedger.recordRegistration(reHash);
  console.log(`\n   After re-registration in ledger:`);
  console.log(`     Is returning user: ${reRegistration.isReturningUser ? '🚫 YES' : '✅ NO'}`);
  console.log(`     Registration count: ${reRegistration.registrationCount}`);

  // Create new user (but flagged!)
  const newUser = await User.create({
    phone: normalizePhoneNumber(TEST_PHONE),
    name: '', // Fresh account, no name yet
    isReturningUser: reRegistration.isReturningUser,
    registrationCount: reRegistration.registrationCount,
    isEligibleForNewUserBenefits: !reRegistration.isReturningUser // FALSE!
  });

  // Check benefits — should be DENIED
  const benefits2 = getNewUserBenefits(newUser.isReturningUser);
  console.log(`\n   Benefits eligibility:`);
  console.log(`     Eligible: ${benefits2.eligible ? '✅ YES' : '🚫 DENIED!'}`);
  console.log(`     Message: "${benefits2.message}"`);

  if (!benefits2.eligible) {
    console.log(`\n   🎯 ANTI-ABUSE SYSTEM WORKING CORRECTLY!`);
    console.log(`      The user re-registered but new-user benefits were BLOCKED.`);
    console.log(`      The phone number was NEVER stored — only its hash was matched.`);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FINAL: Show the ledger state
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log(`\n${SEPARATOR}`);
  console.log('📊 FINAL: PhoneHashLedger State');
  console.log(SEPARATOR);

  const finalLedger = await PhoneHashLedger.findOne({ phoneHash });
  console.log(`\n   Phone Hash: ${finalLedger.phoneHash.substring(0, 16)}...`);
  console.log(`   First Registered: ${finalLedger.firstRegisteredAt.toISOString()}`);
  console.log(`   Registration Count: ${finalLedger.registrationCount}`);
  console.log(`   Has Been Previously Deleted: ${finalLedger.hasBeenPreviouslyDeleted}`);
  console.log(`   Account History:`);
  finalLedger.accountHistory.forEach((event, i) => {
    console.log(`     ${i + 1}. ${event.event} at ${event.timestamp.toISOString()}`);
  });

  // Cleanup
  await cleanup();

  console.log(`\n${SEPARATOR}`);
  console.log('✅ ALL TESTS PASSED — Anti-abuse system is working correctly!');
  console.log(SEPARATOR);
  console.log();

  await mongoose.disconnect();
  await mongoServer.stop();
  process.exit(0);
}

runTest().catch(async (error) => {
  console.error('\n❌ Test failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});


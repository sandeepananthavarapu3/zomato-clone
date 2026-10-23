/**
 * New User Benefits Service
 * 
 * Manages which promotional benefits a user is eligible for.
 * Returning users (detected via phone hash ledger) are DENIED all new-user benefits.
 * 
 * Benefits include:
 *   - FREE_DELIVERY_FIRST_ORDER: Free delivery on first order
 *   - SIGNUP_DISCOUNT: Flat discount on first 3 orders
 *   - WELCOME_COUPON: Special coupon code auto-applied
 *   - REFERRAL_BONUS: Cashback from referral
 *   - FIRST_ORDER_CASHBACK: Cashback credited after first order
 */

// All benefits available to genuinely new users
const NEW_USER_BENEFITS = [
  {
    type: 'FREE_DELIVERY_FIRST_ORDER',
    title: 'Free Delivery',
    description: 'Free delivery on your first order!',
    value: 'FREE_DELIVERY',
    maxUses: 1
  },
  {
    type: 'SIGNUP_DISCOUNT',
    title: '50% OFF up to ₹100',
    description: 'Flat 50% off on your first 3 orders',
    value: 50, // percentage
    maxDiscount: 10000, // ₹100 in paise
    maxUses: 3
  },
  {
    type: 'WELCOME_COUPON',
    title: 'WELCOME50',
    description: 'Use code WELCOME50 for ₹50 off',
    value: 5000, // ₹50 in paise
    maxUses: 1
  },
  {
    type: 'FIRST_ORDER_CASHBACK',
    title: '₹75 Cashback',
    description: 'Get ₹75 cashback on your first order above ₹199',
    value: 7500, // ₹75 in paise
    minOrderValue: 19900, // ₹199 in paise
    maxUses: 1
  }
];

/**
 * Get the list of benefits for a user based on their returning status.
 * 
 * @param {boolean} isReturningUser - Whether the user is returning (previously deleted account)
 * @returns {{ eligible: boolean, benefits: Array, message: string }}
 */
export function getNewUserBenefits(isReturningUser) {
  if (isReturningUser) {
    return {
      eligible: false,
      benefits: [],
      message: 'Welcome back! Standard pricing applies to your account.'
    };
  }

  return {
    eligible: true,
    benefits: NEW_USER_BENEFITS,
    message: 'Welcome! Enjoy these exclusive new user offers! 🎉'
  };
}

/**
 * Check if a specific benefit can be applied to an order.
 * 
 * @param {Object} user - User document from MongoDB
 * @param {string} benefitType - The benefit type to check
 * @returns {{ canApply: boolean, reason?: string }}
 */
export function canApplyBenefit(user, benefitType) {
  // Returning users can NEVER use new-user benefits
  if (user.isReturningUser) {
    return {
      canApply: false,
      reason: 'This offer is only available for new users.'
    };
  }

  if (!user.isEligibleForNewUserBenefits) {
    return {
      canApply: false,
      reason: 'You have already used your new user benefits.'
    };
  }

  // Check if the benefit has already been claimed the maximum number of times
  const benefitConfig = NEW_USER_BENEFITS.find(b => b.type === benefitType);
  if (!benefitConfig) {
    return { canApply: false, reason: 'Unknown benefit type.' };
  }

  const claimedCount = user.claimedBenefits.filter(
    b => b.benefitType === benefitType
  ).length;

  if (claimedCount >= benefitConfig.maxUses) {
    return {
      canApply: false,
      reason: `You have already used this benefit ${claimedCount} time(s).`
    };
  }

  return { canApply: true };
}

export { NEW_USER_BENEFITS };


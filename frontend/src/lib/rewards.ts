export interface RewardTier {
  name: string;
  min: number;
  color: string;
  bg: string;
}

export const REWARD_TIERS: RewardTier[] = [
  { name: 'Bronze', min: 0, color: '#b45309', bg: 'rgba(180,83,9,0.12)' },
  { name: 'Silver', min: 500, color: '#475569', bg: 'rgba(71,85,105,0.12)' },
  { name: 'Gold', min: 1500, color: '#ca8a04', bg: 'rgba(202,138,4,0.14)' },
  { name: 'Platinum', min: 3000, color: '#6d28d9', bg: 'rgba(109,40,217,0.12)' },
];

/** Points earned per $1 spent on paid orders. */
export const POINTS_PER_DOLLAR = 1;
/** Points required for $1 of wallet credit. */
export const POINTS_PER_DOLLAR_REDEEM = 100;
/** Minimum points needed before redeeming. */
export const MIN_REDEEM_POINTS = 500;

const REDEEMED_KEY = 'rewardPointsRedeemed';

export interface RewardOrder {
  isPaid?: boolean;
  totalPrice?: number;
  status?: string;
}

export interface RewardsSummary {
  earned: number;
  redeemed: number;
  available: number;
  tier: RewardTier;
  nextTier: RewardTier | null;
  progress: number;
  redeemableValue: number;
  canRedeem: boolean;
  redeemPoints: number;
}

export function getRedeemedPoints(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const value = Number(localStorage.getItem(REDEEMED_KEY));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function calculateRewards(orders: RewardOrder[]): RewardsSummary {
  const earned = Math.floor(
    (orders || [])
      .filter((order) => order.isPaid && order.status !== 'cancelled')
      .reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0) *
      POINTS_PER_DOLLAR,
  );
  const redeemed = Math.min(getRedeemedPoints(), earned);
  const available = Math.max(0, earned - redeemed);

  let tier = REWARD_TIERS[0];
  for (const candidate of REWARD_TIERS) {
    if (earned >= candidate.min) tier = candidate;
  }
  const nextTier =
    REWARD_TIERS.find((candidate) => candidate.min > earned) || null;
  const progress = nextTier
    ? Math.min(
        100,
        Math.max(0, ((earned - tier.min) / (nextTier.min - tier.min)) * 100),
      )
    : 100;

  const redeemPoints = Math.floor(available / POINTS_PER_DOLLAR_REDEEM) * POINTS_PER_DOLLAR_REDEEM;

  return {
    earned,
    redeemed,
    available,
    tier,
    nextTier,
    progress,
    redeemableValue: redeemPoints / POINTS_PER_DOLLAR_REDEEM,
    canRedeem: available >= MIN_REDEEM_POINTS,
    redeemPoints,
  };
}

export interface RedeemResult {
  ok: boolean;
  value: number;
  message: string;
}

/** Convert available points into wallet (gift-card) credit. */
export function redeemPointsToWallet(points: number, available: number): RedeemResult {
  if (typeof window === 'undefined') {
    return { ok: false, value: 0, message: 'Redemption is only available in the browser.' };
  }
  if (points < MIN_REDEEM_POINTS) {
    return {
      ok: false,
      value: 0,
      message: `You need at least ${MIN_REDEEM_POINTS} points to redeem.`,
    };
  }
  if (points > available) {
    return { ok: false, value: 0, message: 'Not enough points available.' };
  }
  const value = Math.round((points / POINTS_PER_DOLLAR_REDEEM) * 100) / 100;
  try {
    const balance = Number(localStorage.getItem('walletBalance')) || 0;
    localStorage.setItem('walletBalance', String(Math.round((balance + value) * 100) / 100));
    localStorage.setItem(REDEEMED_KEY, String(getRedeemedPoints() + points));
    return {
      ok: true,
      value,
      message: `${points} points redeemed for $${value.toFixed(2)} wallet credit.`,
    };
  } catch {
    return { ok: false, value: 0, message: 'Could not redeem points in this browser.' };
  }
}

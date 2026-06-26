import React, { useState } from 'react';

interface Coupon {
  code: string;
  discount: number;
  description: string;
  minPurchase?: number;
}

interface Props {
  productPrice: number;
  productName: string;
}

const AVAILABLE_COUPONS: Coupon[] = [
  { code: 'SAVE10', discount: 10, description: 'Save 10% on this item', minPurchase: 20 },
  { code: 'WELCOME5', discount: 5, description: '$5 off your purchase', minPurchase: 15 },
];

const getAppliedCoupons = (): Coupon[] => {
  try { return JSON.parse(localStorage.getItem('clippedCoupons') || '[]'); } catch { return []; }
};

const saveAppliedCoupons = (coupons: Coupon[]) => {
  localStorage.setItem('clippedCoupons', JSON.stringify(coupons));
};

const CouponClip: React.FC<Props> = ({ productPrice, productName }) => {
  const [clipped, setClipped] = useState<Coupon[]>(getAppliedCoupons);
  const [showAll, setShowAll] = useState(false);

  const eligibleCoupons = AVAILABLE_COUPONS.filter(
    (c) => !c.minPurchase || productPrice >= c.minPurchase
  );

  const isClipped = (code: string) => clipped.some((c) => c.code === code);

  const handleClip = (coupon: Coupon) => {
    const updated = [...clipped, coupon];
    setClipped(updated);
    saveAppliedCoupons(updated);
  };

  const handleUnclip = (code: string) => {
    const updated = clipped.filter((c) => c.code !== code);
    setClipped(updated);
    saveAppliedCoupons(updated);
  };

  if (!eligibleCoupons.length) return null;

  return (
    <div className="coupon-clip-section">
      <div className="coupon-clip-header">
        <span className="coupon-clip-icon">{'\u2702'}</span>
        <span>Available coupons</span>
        <button className="coupon-clip-toggle" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Hide' : `${eligibleCoupons.length} available`}
        </button>
      </div>
      {showAll && (
        <div className="coupon-clip-list">
          {eligibleCoupons.map((coupon) => {
            const clipped = isClipped(coupon.code);
            return (
              <div key={coupon.code} className={`coupon-clip-card ${clipped ? 'clipped' : ''}`}>
                <div className="coupon-clip-left">
                  <div className="coupon-clip-code">{coupon.code}</div>
                  <div className="coupon-clip-desc">{coupon.description}</div>
                  {coupon.minPurchase && (
                    <div className="coupon-clip-min">Min. purchase ${coupon.minPurchase}</div>
                  )}
                </div>
                <button className={`coupon-clip-btn ${clipped ? 'clipped' : ''}`}
                  onClick={() => clipped ? handleUnclip(coupon.code) : handleClip(coupon)}>
                  {clipped ? 'Clipped \u2713' : 'Clip Coupon'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { AVAILABLE_COUPONS, getAppliedCoupons };
export default CouponClip;

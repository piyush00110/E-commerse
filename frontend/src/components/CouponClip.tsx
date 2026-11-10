'use client';
import React, { useEffect, useState } from 'react';
import {
  AVAILABLE_COUPONS,
  clipCoupon,
  getClippedCouponCodes,
  unclipCoupon,
  type CouponDefinition,
} from '../lib/coupons';

interface Props {
  productPrice: number;
  productName: string;
}

const CouponClip: React.FC<Props> = ({ productPrice }) => {
  const [clippedCodes, setClippedCodes] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setClippedCodes(getClippedCouponCodes());
  }, []);

  const eligibleCoupons = AVAILABLE_COUPONS.filter(
    (c) => !c.minPurchase || productPrice >= c.minPurchase,
  );

  const isClipped = (code: string) => clippedCodes.includes(code);

  const handleClip = (coupon: CouponDefinition) => {
    if (isClipped(coupon.code)) return;
    setClippedCodes(clipCoupon(coupon.code));
  };

  const handleUnclip = (code: string) => {
    setClippedCodes(unclipCoupon(code));
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
                  {coupon.minPurchase > 0 && (
                    <div className="coupon-clip-min">
                      Min. purchase ${coupon.minPurchase.toFixed(2)}
                    </div>
                  )}
                </div>
                <button
                  className={`coupon-clip-btn ${clipped ? 'clipped' : ''}`}
                  onClick={() =>
                    clipped ? handleUnclip(coupon.code) : handleClip(coupon)
                  }
                >
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

export default CouponClip;

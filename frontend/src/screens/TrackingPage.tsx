'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, BadgeCheck, Package, Truck, Warehouse, Bike } from 'lucide-react';
import RadialOrbitalTimeline, { TimelineItem } from '../components/ui/radial-orbital-timeline';
import GlowCard from '../components/ui/spotlight-card';
import { Boxes } from '../components/ui/background-boxes';

interface TrackingEvent {
  status: string;
  date: string;
  location: string;
  description: string;
  icon: string;
}

const TRACKING_EVENTS: TrackingEvent[] = [
  { status: 'ordered', date: 'Jun 22, 2026, 2:30 PM', location: 'Online', description: 'Order placed successfully.', icon: '\u{1F4CB}' },
  { status: 'confirmed', date: 'Jun 22, 2026, 2:35 PM', location: 'ShopSmart Hub', description: 'Payment confirmed. Order processing.', icon: '\u2705' },
  { status: 'packed', date: 'Jun 23, 2026, 9:15 AM', location: 'ShopSmart Warehouse', description: 'Item packed and label created.', icon: '\u{1F4E6}' },
  { status: 'shipped', date: 'Jun 23, 2026, 4:45 PM', location: 'ShopSmart Distribution Center', description: 'Picked up by carrier. En route.', icon: '\u{1F69A}' },
  { status: 'transit', date: 'Jun 24, 2026, 8:30 AM', location: 'Regional Sort Facility', description: 'Arrived at sorting facility.', icon: '\u{1F3D7}' },
  { status: 'out_for_delivery', date: 'Jun 25, 2026, 7:00 AM', location: 'Local Delivery Hub', description: 'Out for delivery with driver.', icon: '\u{1F698}' },
];

const SAMPLE_TRACKING_NUMBERS = ['1Z999AA10123456784', '9400111899223456789012', 'EH123456785US'];

const ORBIT_ICONS = [ClipboardCheck, BadgeCheck, Package, Truck, Warehouse, Bike] as const;
const ORBIT_CATEGORIES = ['Order', 'Payment', 'Warehouse', 'Carrier', 'Transit', 'Delivery'] as const;

function toOrbitData(): TimelineItem[] {
  return TRACKING_EVENTS.map((event, idx) => ({
    id: idx + 1,
    title: event.location === 'Online' ? 'Order Placed' : event.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    date: event.date,
    content: `${event.description} — ${event.location}.`,
    category: ORBIT_CATEGORIES[idx] ?? 'Shipment',
    icon: ORBIT_ICONS[idx] ?? Package,
    relatedIds: idx === 0 ? [2] : idx === TRACKING_EVENTS.length - 1 ? [TRACKING_EVENTS.length - 1] : [idx, idx + 2],
    status: idx < TRACKING_EVENTS.length - 1 ? ('completed' as const) : ('in-progress' as const),
    energy: Math.max(15, 100 - idx * 12),
  }));
}

const TrackingPage: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const quickFill = (num: string) => {
    setTrackingNumber(num);
    setSearched(true);
  };

  return (
    <div className="tracking-page" style={{ maxWidth: 1040, margin: '0 auto', padding: '0 16px 48px' }}>
      {/* Hero Search */}
      <div className="tracking-hero" style={{ position: 'relative', overflow: 'hidden', background: '#0f172a', borderRadius: 20, margin: '24px auto', maxWidth: 1000 }}>
        <Boxes />
        <div style={{ position: 'absolute', inset: 0, background: '#0f172a', zIndex: 1, WebkitMaskImage: 'radial-gradient(transparent, white)', maskImage: 'radial-gradient(transparent, white)', pointerEvents: 'none' }} />
        <div className="tracking-hero-content" style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '56px 24px', color: '#fff' }}>
          <div className="tracking-hero-icon" style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 8px' }}>Track Your Package</h1>
          <p style={{ color: '#d4d4d8', margin: '0 0 24px', fontSize: 14 }}>Enter your tracking number to see real-time delivery status</p>
          <form onSubmit={handleSearch} className="tracking-search-form" style={{ display: 'flex', gap: 8, maxWidth: 520, margin: '0 auto' }}>
            <input type="text" className="tracking-search-input"
              placeholder="Enter tracking number (e.g. 1Z999AA10123456784)"
              value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
              style={{ flex: 1, padding: '13px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', minWidth: 0 }} />
            <button type="submit" className="tracking-search-btn" style={{ padding: '13px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #ff3f6c, #ff905a)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>Track</button>
          </form>
          <div className="tracking-quick-fill" style={{ marginTop: 16, fontSize: 13, color: '#a1a1aa' }}>
            <span>Try: </span>
            {SAMPLE_TRACKING_NUMBERS.map((num) => (
              <button key={num} type="button" className="tracking-sample-btn" onClick={() => quickFill(num)}
                style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 9999, border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}>
                {num.slice(0, 10)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tracking Result */}
      {searched && (
        <div className="tracking-result">
          {/* Progress Bar */}
          <div className="tracking-progress-card">
            <div className="tracking-progress-header">
              <div>
                <div className="tracking-progress-label">Tracking Number</div>
                <div className="tracking-progress-num">{trackingNumber}</div>
              </div>
              <div className="tracking-progress-est">
                <div className="tracking-est-label">Estimated Delivery</div>
                <div className="tracking-est-date">Fri, Jun 26</div>
              </div>
            </div>
            <div className="tracking-progress-bar">
              <div className="tracking-progress-fill" style={{ width: '83%' }} />
            </div>
            <div className="tracking-progress-stops">
              <div className="tracking-progress-stop done">
                <div className="tps-dot" />
                <span className="tps-label">Ordered</span>
              </div>
              <div className="tracking-progress-stop done">
                <div className="tps-dot" />
                <span className="tps-label">Packed</span>
              </div>
              <div className="tracking-progress-stop done">
                <div className="tps-dot" />
                <span className="tps-label">Shipped</span>
              </div>
              <div className="tracking-progress-stop active">
                <div className="tps-dot" />
                <span className="tps-label">In Transit</span>
              </div>
              <div className="tracking-progress-stop">
                <div className="tps-dot" />
                <span className="tps-label">Delivered</span>
              </div>
            </div>
          </div>

          {/* Orbit View */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>Journey Orbit</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
              Tap any stop to inspect it. Overall progress lives in the center.
            </p>
            <RadialOrbitalTimeline timelineData={toOrbitData()} />
          </div>

          {/* Timeline */}
          <div className="tracking-timeline">
            {TRACKING_EVENTS.map((event, idx) => {
              const isLatest = idx === 0;
              const isPast = idx < 3;
              return (
                <div key={idx} className={`tracking-event ${isLatest ? 'latest' : ''} ${isPast ? 'past' : ''}`}>
                  <div className="tracking-icon-wrapper">
                    <div className="tracking-icon" style={{
                      background: isPast ? 'var(--success)' : isLatest ? 'var(--tertiary)' : 'var(--surface-container)',
                      color: isPast || isLatest ? 'var(--text-white)' : 'var(--text-secondary)',
                    }}>
                      {event.icon}
                    </div>
                    {idx < TRACKING_EVENTS.length - 1 && <div className="tracking-line" />}
                  </div>
                  <div className="tracking-content">
                    <div className="tracking-date">{event.date}</div>
                    <div className="tracking-location">{event.location}</div>
                    <div className="tracking-desc">{event.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivery Card */}
          <div className="tracking-delivery-card">
            <h3>{'\u{1F3E0}'} Delivery Address</h3>
            <div className="tracking-delivery-details">
              <div className="tracking-delivery-row">
                <span className="tracking-delivery-label">Name</span>
                <span>John Smith</span>
              </div>
              <div className="tracking-delivery-row">
                <span className="tracking-delivery-label">Address</span>
                <span>123 Main Street, Apt 4B, New York, NY 10001</span>
              </div>
              <div className="tracking-delivery-row">
                <span className="tracking-delivery-label">Service</span>
                <span>ShopSmart Express Shipping</span>
              </div>
              <div className="tracking-delivery-row">
                <span className="tracking-delivery-label">Signature</span>
                <span>Not required</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="tracking-actions">
            <Link href="/orders" className="tracking-action-btn">
              {'\u{1F4CB}'} My Orders
            </Link>
            <Link href="/help" className="tracking-action-btn secondary">
              {'\u2753'} Get Help
            </Link>
          </div>
        </div>
      )}

      {/* Info cards when not searched */}
      {!searched && (
        <div className="tracking-info-cards">
          <GlowCard className="tracking-info-card">
            <div className="tracking-info-icon">{'\u{1F69A}'}</div>
            <h3>Real-Time Tracking</h3>
            <p>See exactly where your package is at every step of its journey.</p>
          </GlowCard>
          <GlowCard className="tracking-info-card">
            <div className="tracking-info-icon">{'\u{1F4E2}'}</div>
            <h3>Instant Notifications</h3>
            <p>Get notified when your package ships, arrives at local hub, or is out for delivery.</p>
          </GlowCard>
          <GlowCard className="tracking-info-card">
            <div className="tracking-info-icon">{'\u{1F3ED}'}</div>
            <h3>Delivery Preferences</h3>
            <p>Redirect to a pickup point, schedule a delivery window, or leave instructions for the driver.</p>
          </GlowCard>
          <GlowCard className="tracking-info-card">
            <div className="tracking-info-icon">{'\u{1F504}'}</div>
            <h3>Easy Returns</h3>
            <p>Start a return from your orders page and generate a return shipping label instantly.</p>
          </GlowCard>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
    <div className="tracking-page">
      {/* Hero Search */}
      <div className="tracking-hero">
        <div className="tracking-hero-content">
          <div className="tracking-hero-icon">{'\u{1F50D}'}</div>
          <h1>Track Your Package</h1>
          <p>Enter your tracking number to see real-time delivery status</p>
          <form onSubmit={handleSearch} className="tracking-search-form">
            <input type="text" className="tracking-search-input"
              placeholder="Enter tracking number (e.g. 1Z999AA10123456784)"
              value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
            <button type="submit" className="tracking-search-btn">Track</button>
          </form>
          <div className="tracking-quick-fill">
            <span>Try: </span>
            {SAMPLE_TRACKING_NUMBERS.map((num) => (
              <button key={num} className="tracking-sample-btn" onClick={() => quickFill(num)}>
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

          {/* Timeline */}
          <div className="tracking-timeline">
            {TRACKING_EVENTS.map((event, idx) => {
              const isLatest = idx === 0;
              const isPast = idx < 3;
              return (
                <div key={idx} className={`tracking-event ${isLatest ? 'latest' : ''} ${isPast ? 'past' : ''}`}>
                  <div className="tracking-icon-wrapper">
                    <div className="tracking-icon" style={{
                      background: isPast ? 'var(--color-primary, #067d62)' : isLatest ? 'var(--color-accent, #ff9900)' : 'var(--bg-card, #e0e0e0)',
                      color: isPast || isLatest ? 'white' : 'var(--text-secondary, #565959)',
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
            <Link to="/orders" className="tracking-action-btn">
              {'\u{1F4CB}'} My Orders
            </Link>
            <Link to="/help" className="tracking-action-btn secondary">
              {'\u2753'} Get Help
            </Link>
          </div>
        </div>
      )}

      {/* Info cards when not searched */}
      {!searched && (
        <div className="tracking-info-cards">
          <div className="tracking-info-card">
            <div className="tracking-info-icon">{'\u{1F69A}'}</div>
            <h3>Real-Time Tracking</h3>
            <p>See exactly where your package is at every step of its journey.</p>
          </div>
          <div className="tracking-info-card">
            <div className="tracking-info-icon">{'\u{1F4E2}'}</div>
            <h3>Instant Notifications</h3>
            <p>Get notified when your package ships, arrives at local hub, or is out for delivery.</p>
          </div>
          <div className="tracking-info-card">
            <div className="tracking-info-icon">{'\u{1F3ED}'}</div>
            <h3>Delivery Preferences</h3>
            <p>Redirect to a pickup point, schedule a delivery window, or leave instructions for the driver.</p>
          </div>
          <div className="tracking-info-card">
            <div className="tracking-info-icon">{'\u{1F504}'}</div>
            <h3>Easy Returns</h3>
            <p>Start a return from your orders page and generate a return shipping label instantly.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;

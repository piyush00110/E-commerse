import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface OrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface DeliveryOrder {
  _id: string;
  items: OrderItem[];
  user: { _id: string; name: string; email: string };
  shippingAddress: { street: string; city: string; state: string; zip: string; phone: string };
  totalPrice: number;
  isPaid: boolean;
  status: string;
  createdAt: string;
}

const DELIVERY_DRIVERS = ['Mike Johnson', 'Sarah Williams', 'David Brown', 'Emily Davis', 'James Wilson'];
const TRUCKS = ['Truck #A-142', 'Truck #B-207', 'Truck #C-089', 'Truck #D-315', 'Van #E-056'];

const DeliveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [view, setView] = useState<'pickup' | 'delivery'>('pickup');
  const [shipped, setShipped] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(DELIVERY_DRIVERS[0]);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const driver = selectedDriver;
  const truck = TRUCKS[DELIVERY_DRIVERS.indexOf(driver) % TRUCKS.length];

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getAll();
      const all = res.data.data || [];
      setShipped((all as DeliveryOrder[]).filter((o) => o.status === 'shipped' || o.status === 'processing'));
    } catch { showToast('Failed to load deliveries', 'error'); }
    finally { setLoading(false); }
  };

  const handleMarkDelivered = async (orderId: string) => {
    setMarkingId(orderId);
    try {
      await orderAPI.updateStatus(orderId, { status: 'delivered', isDelivered: true });
      showToast('Package marked as delivered!', 'success');
      fetchOrders();
    } catch { showToast('Failed to update', 'error'); }
    finally { setMarkingId(null); }
  };

  const pickupList = shipped.filter((o) => o.status === 'processing');
  const deliveryList = shipped.filter((o) => o.status === 'shipped');

  if (loading) return <div className="spinner" />;

  return (
    <div className="delivery-page">
      <div className="delivery-header">
        <div className="delivery-driver-info">
          <div className="delivery-avatar">{driver.split(' ').map((n) => n[0]).join('')}</div>
          <div>
            <h1>{driver}</h1>
            <p className="delivery-driver-sub">{truck} | {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="delivery-stats">
          <div className="delivery-stat">
            <span className="delivery-stat-num">{pickupList.length}</span>
            <span className="delivery-stat-lbl">Pickups</span>
          </div>
          <div className="delivery-stat">
            <span className="delivery-stat-num">{deliveryList.length}</span>
            <span className="delivery-stat-lbl">Deliveries</span>
          </div>
          <div className="delivery-stat">
            <span className="delivery-stat-num done-today">
              {deliveryList.filter((o) => o.status === 'shipped').length === 0 ? 0 : Math.floor(Math.random() * 5) + 3}
            </span>
            <span className="delivery-stat-lbl">Done Today</span>
          </div>
        </div>
      </div>

      <div className="delivery-driver-select-row">
        <span className="delivery-driver-label">Driver:</span>
        <select className="delivery-driver-select" value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}>
          {DELIVERY_DRIVERS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="delivery-tabs">
        <button className={`delivery-tab ${view === 'pickup' ? 'active' : ''}`} onClick={() => setView('pickup')}>
          {'\u{1F4E6}'} Pickup ({pickupList.length})
        </button>
        <button className={`delivery-tab ${view === 'delivery' ? 'active' : ''}`} onClick={() => setView('delivery')}>
          {'\u{1F69A}'} Deliveries ({deliveryList.length})
        </button>
      </div>

      {view === 'pickup' && (
        <>
          {pickupList.length === 0 ? (
            <div className="delivery-empty">
              <div className="delivery-empty-icon">{'\u{1F4E6}'}</div>
              <h3>No pickups scheduled</h3>
              <p className="delivery-empty-text">All processing orders have been picked up.</p>
            </div>
          ) : (
            <div className="delivery-list">
              {pickupList.map((order) => (
                <div key={order._id} className="delivery-card pickup">
                  <div className="delivery-card-header">
                    <span className="delivery-order-id">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className="delivery-status processing">Ready for Pickup</span>
                  </div>
                  <div className="delivery-card-body">
                    <div className="delivery-customer">
                      <strong>{order.user?.name}</strong>
                      <div className="delivery-customer-loc">{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
                    </div>
                    <div className="delivery-item-previews">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <img key={idx} src={item.image} alt="" title={item.name} />
                      ))}
                    </div>
                    <div className="delivery-weight">
                      <span>{'\u2696'}</span> ~{order.items?.reduce((s, i) => s + i.quantity, 0) * 2} lbs
                    </div>
                  </div>
                  <button className="delivery-pickup-btn" onClick={() => handleMarkDelivered(order._id)}
                    disabled={markingId === order._id}>
                    {'\u2713'} Confirm Pickup
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'delivery' && (
        <>
          {deliveryList.length === 0 ? (
            <div className="delivery-empty">
              <div className="delivery-empty-icon">{'\u{1F69A}'}</div>
              <h3>No deliveries assigned</h3>
              <p className="delivery-empty-text">All packages have been delivered today. Great job!</p>
            </div>
          ) : (
            <>
              <div className="delivery-route">
                <div className="route-stop start">
                  <div className="route-dot warehouse" />
                  <div>
                    <strong>ShopSmart Warehouse</strong>
                    <div className="route-stop-sub">Start: 8:00 AM</div>
                  </div>
                </div>
                {deliveryList.slice(0, 3).map((order, idx) => (
                  <div key={order._id} className="route-stop">
                    <div className="route-dot" />
                    <div>
                      <strong>{order.user?.name}</strong>
                      <div className="route-stop-sub">{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
                      <div className="route-stop-sub">#{order._id.slice(-8).toUpperCase()}</div>
                    </div>
                  </div>
                ))}
                {deliveryList.length > 3 && (
                  <div className="route-more">... +{deliveryList.length - 3} more stops</div>
                )}
              </div>

              <div className="delivery-list">
                {deliveryList.map((order) => (
                  <div key={order._id} className="delivery-card">
                    <div className="delivery-card-header">
                      <span className="delivery-order-id">#{order._id.slice(-8).toUpperCase()}</span>
                      <span className="delivery-status shipped">On Route</span>
                    </div>
                    <div className="delivery-card-body">
                      <div className="delivery-customer">
                        <strong>{order.user?.name}</strong>
                        <div className="delivery-customer-street">{order.shippingAddress?.street}</div>
                        <div className="delivery-customer-loc">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}</div>
                        <div className="delivery-customer-phone">{order.shippingAddress?.phone}</div>
                      </div>
                      <div className="delivery-item-previews">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <img key={idx} src={item.image} alt="" title={item.name} />
                        ))}
                      </div>
                    </div>
                    <div className="delivery-card-actions">
                      <button className="delivery-view-btn" onClick={() => navigate(`/orders/${order._id}`)}>
                        View Items
                      </button>
                      <button className="delivery-complete-btn" onClick={() => handleMarkDelivered(order._id)}
                        disabled={markingId === order._id}>
                        {'\u2713'} Mark Delivered
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="delivery-footer">
        Delivery Partner Portal | ShopSmart Logistics &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default DeliveryPage;

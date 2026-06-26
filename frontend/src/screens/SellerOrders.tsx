import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';

const SellerOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'delivered'>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderAPI.getAll();
        setOrders(res.data.data);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await orderAPI.updateStatus(id, { status, isDelivered: status === 'delivered' });
      setOrders(orders.map((o) =>
        o._id === id ? { ...o, status, isDelivered: status === 'delivered', deliveredAt: status === 'delivered' ? new Date().toISOString() : o.deliveredAt } : o
      ));
    } catch (err) {
      console.error('Failed to update order', err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !o.isPaid && o.status === 'pending';
    if (filter === 'paid') return o.isPaid && !o.isDelivered;
    if (filter === 'delivered') return o.isDelivered;
    return true;
  });

  if (loading) return <div className="spinner" />;

  return (
    <div className="seller-orders-page">
      <div className="seller-orders-header">
        <h1>Orders</h1>
        <p>{orders.length} total orders</p>
      </div>

      <div className="seller-orders-tabs">
        {(['all', 'pending', 'paid', 'delivered'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`seller-orders-tab ${filter === f ? 'active' : ''}`}>
            {f === 'paid' ? 'Processing' : f}
            {f === 'all' ? ` (${orders.length})` : ''}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="seller-orders-empty">
          <div className="seller-orders-empty-icon">{'\u{1F4ED}'}</div>
          <h2>No orders found</h2>
          <p>Orders will appear here when customers make purchases.</p>
        </div>
      ) : (
        <div className="seller-orders-list">
          {filteredOrders.map((order) => (
            <div key={order._id} className="seller-orders-card">
              <div className="seller-orders-card-top">
                <div>
                  <div className="seller-orders-id">Order #{order._id.slice(-8).toUpperCase()}</div>
                  <div className="seller-orders-date">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className="seller-orders-actions">
                  <span className={`seller-orders-badge ${order.isDelivered ? 'delivered' : order.isPaid ? 'paid' : 'pending'}`}>
                    {order.isDelivered ? 'Delivered' : order.isPaid ? 'Processing' : 'Pending'}
                  </span>
                  <select className="seller-orders-select"
                    value={order.status || 'pending'}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="seller-orders-items">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="seller-orders-item">
                    <img src={item.image} alt="" className="seller-orders-item-img" />
                    <div className="seller-orders-item-info">
                      <div className="seller-orders-item-name">{item.name}</div>
                      <div className="seller-orders-item-qty">Qty: {item.quantity} x ${item.price.toFixed(2)}</div>
                    </div>
                    <div className="seller-orders-item-total">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="seller-orders-card-footer">
                <div className="seller-orders-address">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                  <span className="seller-orders-payment">{order.paymentMethod?.replace('_', ' ')}</span>
                </div>
                <div className="seller-orders-total-price">${order.totalPrice?.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;

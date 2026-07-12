import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';

interface OrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  shippingAddress: { street: string; city: string; state: string; zip: string; phone: string; country?: string };
  paymentMethod: string;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  status: string;
  createdAt: string;
  deliveredAt?: string;
  user?: { name: string; email: string };
}

const SellerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'delivered'>('all');
  const [showPdfForm, setShowPdfForm] = useState(false);
  const [pdfOrderId, setPdfOrderId] = useState<string | null>(null);
  const [pdfForm, setPdfForm] = useState({
    companyName: 'ShopSmart Seller',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    notes: '',
    includeTaxDetails: true,
    includeShippingDetails: true,
    paperSize: 'a4' as 'a4' | 'letter',
  });

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

  const openPdfForm = (orderId?: string) => {
    setPdfOrderId(orderId || null);
    setShowPdfForm(true);
  };

  const generatePdf = () => {
    const ordersToPrint = pdfOrderId
      ? orders.filter((o) => o._id === pdfOrderId)
      : filteredOrders;

    if (ordersToPrint.length === 0) return;

    const itemsTotal = ordersToPrint.reduce((sum, o) => {
      return sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0);
    }, 0);
    const totalTax = ordersToPrint.reduce((sum, o) => sum + (o.taxPrice || 0), 0);
    const totalShipping = ordersToPrint.reduce((sum, o) => sum + (o.shippingPrice || 0), 0);
    const grandTotal = ordersToPrint.reduce((sum, o) => sum + o.totalPrice, 0);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Report - ${pdfOrderId ? `Order #${pdfOrderId.slice(-8).toUpperCase()}` : 'All Orders'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #333; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #37475a; padding-bottom: 20px; margin-bottom: 24px; }
    .company-info h1 { font-size: 24px; color: #37475a; margin-bottom: 4px; }
    .company-info p { font-size: 11px; color: #666; line-height: 1.6; }
    .doc-info { text-align: right; }
    .doc-info h2 { font-size: 18px; color: #37475a; margin-bottom: 8px; }
    .doc-info p { font-size: 11px; color: #666; }
    .doc-info .order-id { font-family: monospace; font-size: 14px; font-weight: bold; color: #00576f; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 13px; font-weight: 700; color: #37475a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f5f6ff; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #555; border-bottom: 2px solid #ddd; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-table { width: 300px; margin-left: auto; }
    .summary-table td { padding: 6px 12px; }
    .summary-table .total-row { font-weight: 700; font-size: 14px; border-top: 2px solid #37475a; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-processing { background: #d4edff; color: #00576f; }
    .status-shipped { background: #d4edda; color: #067d62; }
    .status-delivered { background: #d4edda; color: #067d62; }
    .status-cancelled { background: #f8d7da; color: #b31b25; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; }
    .notes { background: #f8f9fa; padding: 12px; border-radius: 6px; margin-top: 16px; font-size: 11px; color: #555; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${pdfForm.companyName}</h1>
      ${pdfForm.companyAddress ? `<p>${pdfForm.companyAddress}</p>` : ''}
      ${pdfForm.companyPhone ? `<p>Phone: ${pdfForm.companyPhone}</p>` : ''}
      ${pdfForm.companyEmail ? `<p>Email: ${pdfForm.companyEmail}</p>` : ''}
    </div>
    <div class="doc-info">
      <h2>ORDER INVOICE</h2>
      <p>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      ${pdfOrderId ? `<p class="order-id">Order #${pdfOrderId.slice(-8).toUpperCase()}</p>` : `<p>${ordersToPrint.length} order(s) included</p>`}
    </div>
  </div>

  ${ordersToPrint.map((order) => `
    <div class="section" style="page-break-inside: avoid;">
      ${!pdfOrderId ? `<div class="section-title">Order #${order._id?.slice(-8).toUpperCase() ?? 'N/A'} - ${new Date(order.createdAt).toLocaleDateString()}</div>` : ''}

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item) => `
            <tr>
              <td>${item.name}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">$${item.price.toFixed(2)}</td>
              <td class="text-right">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="font-size: 11px; color: #666;">
          <p><strong>Shipping Address:</strong></p>
          <p>${order.shippingAddress?.street || 'N/A'}</p>
          <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zip || ''}</p>
          <p>${order.shippingAddress?.country || 'US'}</p>
          <p style="margin-top: 8px;"><strong>Payment:</strong> ${(order.paymentMethod || 'N/A').replace('_', ' ')}</p>
          <p><strong>Status:</strong> <span class="status-badge status-${order.status || 'pending'}">${(order.status || 'pending').toUpperCase()}</span></p>
          ${order.user ? `<p><strong>Customer:</strong> ${order.user.name} (${order.user.email})</p>` : ''}
        </div>

        <table class="summary-table">
          <tr><td>Subtotal:</td><td class="text-right">$${order.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</td></tr>
          ${pdfForm.includeShippingDetails ? `<tr><td>Shipping:</td><td class="text-right" style="color: ${order.shippingPrice === 0 ? '#067d62' : 'inherit'};">${order.shippingPrice === 0 ? 'FREE' : '$' + (order.shippingPrice || 0).toFixed(2)}</td></tr>` : ''}
          ${pdfForm.includeTaxDetails ? `<tr><td>Tax:</td><td class="text-right">$${(order.taxPrice || 0).toFixed(2)}</td></tr>` : ''}
          <tr class="total-row"><td>Total:</td><td class="text-right">$${order.totalPrice.toFixed(2)}</td></tr>
        </table>
      </div>
    </div>
    ${ordersToPrint.indexOf(order) < ordersToPrint.length - 1 ? '<hr style="margin: 20px 0; border: none; border-top: 1px dashed #ddd;">' : ''}
  `).join('')}

  ${pdfOrderId ? '' : `
    <div class="section" style="margin-top: 24px; background: #f5f6ff; padding: 16px; border-radius: 8px;">
      <div class="section-title">Bulk Summary</div>
      <table class="summary-table" style="width: 100%; max-width: 400px;">
        <tr><td>Total Orders:</td><td class="text-right">${ordersToPrint.length}</td></tr>
        <tr><td>Items Total:</td><td class="text-right">$${itemsTotal.toFixed(2)}</td></tr>
        ${pdfForm.includeShippingDetails ? `<tr><td>Shipping Total:</td><td class="text-right">$${totalShipping.toFixed(2)}</td></tr>` : ''}
        ${pdfForm.includeTaxDetails ? `<tr><td>Tax Total:</td><td class="text-right">$${totalTax.toFixed(2)}</td></tr>` : ''}
        <tr class="total-row"><td>Grand Total:</td><td class="text-right">$${grandTotal.toFixed(2)}</td></tr>
      </table>
    </div>
  `}

  ${pdfForm.notes ? `<div class="notes"><strong>Notes:</strong> ${pdfForm.notes}</div>` : ''}

  <div class="footer">
    <p>Generated on ${new Date().toLocaleString('en-US')} | ${pdfForm.companyName}</p>
    <p>Thank you for your business!</p>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const downloadPdf = () => {
    const ordersToPrint = pdfOrderId
      ? orders.filter((o) => o._id === pdfOrderId)
      : filteredOrders;

    if (ordersToPrint.length === 0) return;

    const itemsTotal = ordersToPrint.reduce((sum, o) => {
      return sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0);
    }, 0);
    const totalTax = ordersToPrint.reduce((sum, o) => sum + (o.taxPrice || 0), 0);
    const totalShipping = ordersToPrint.reduce((sum, o) => sum + (o.shippingPrice || 0), 0);
    const grandTotal = ordersToPrint.reduce((sum, o) => sum + o.totalPrice, 0);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #333; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #37475a; padding-bottom: 20px; margin-bottom: 24px; }
    .company-info h1 { font-size: 24px; color: #37475a; margin-bottom: 4px; }
    .company-info p { font-size: 11px; color: #666; line-height: 1.6; }
    .doc-info { text-align: right; }
    .doc-info h2 { font-size: 18px; color: #37475a; margin-bottom: 8px; }
    .doc-info p { font-size: 11px; color: #666; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 13px; font-weight: 700; color: #37475a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f5f6ff; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #555; border-bottom: 2px solid #ddd; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-table { width: 300px; margin-left: auto; }
    .summary-table td { padding: 6px 12px; }
    .summary-table .total-row { font-weight: 700; font-size: 14px; border-top: 2px solid #37475a; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-processing { background: #d4edff; color: #00576f; }
    .status-shipped { background: #d4edda; color: #067d62; }
    .status-delivered { background: #d4edda; color: #067d62; }
    .status-cancelled { background: #f8d7da; color: #b31b25; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; }
    .notes { background: #f8f9fa; padding: 12px; border-radius: 6px; margin-top: 16px; font-size: 11px; color: #555; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${pdfForm.companyName}</h1>
      ${pdfForm.companyAddress ? `<p>${pdfForm.companyAddress}</p>` : ''}
      ${pdfForm.companyPhone ? `<p>Phone: ${pdfForm.companyPhone}</p>` : ''}
      ${pdfForm.companyEmail ? `<p>Email: ${pdfForm.companyEmail}</p>` : ''}
    </div>
    <div class="doc-info">
      <h2>ORDER INVOICE</h2>
      <p>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      ${pdfOrderId ? `<p>Order #${pdfOrderId.slice(-8).toUpperCase()}</p>` : `<p>${ordersToPrint.length} order(s) included</p>`}
    </div>
  </div>

  ${ordersToPrint.map((order) => `
    <div class="section" style="page-break-inside: avoid;">
      ${!pdfOrderId ? `<div class="section-title">Order #${order._id?.slice(-8).toUpperCase() ?? 'N/A'} - ${new Date(order.createdAt).toLocaleDateString()}</div>` : ''}
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item) => `
            <tr>
              <td>${item.name}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">$${item.price.toFixed(2)}</td>
              <td class="text-right">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="font-size: 11px; color: #666;">
          <p><strong>Shipping Address:</strong></p>
          <p>${order.shippingAddress?.street || 'N/A'}</p>
          <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zip || ''}</p>
          <p><strong>Payment:</strong> ${(order.paymentMethod || 'N/A').replace('_', ' ')}</p>
          <p><strong>Status:</strong> <span class="status-badge status-${order.status || 'pending'}">${(order.status || 'pending').toUpperCase()}</span></p>
        </div>
        <table class="summary-table">
          <tr><td>Subtotal:</td><td class="text-right">$${order.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</td></tr>
          ${pdfForm.includeShippingDetails ? `<tr><td>Shipping:</td><td class="text-right">${order.shippingPrice === 0 ? 'FREE' : '$' + (order.shippingPrice || 0).toFixed(2)}</td></tr>` : ''}
          ${pdfForm.includeTaxDetails ? `<tr><td>Tax:</td><td class="text-right">$${(order.taxPrice || 0).toFixed(2)}</td></tr>` : ''}
          <tr class="total-row"><td>Total:</td><td class="text-right">$${order.totalPrice.toFixed(2)}</td></tr>
        </table>
      </div>
    </div>
    ${ordersToPrint.indexOf(order) < ordersToPrint.length - 1 ? '<hr style="margin: 20px 0; border: none; border-top: 1px dashed #ddd;">' : ''}
  `).join('')}

  ${pdfOrderId ? '' : `
    <div class="section" style="margin-top: 24px; background: #f5f6ff; padding: 16px; border-radius: 8px;">
      <div class="section-title">Bulk Summary</div>
      <table class="summary-table" style="width: 100%; max-width: 400px;">
        <tr><td>Total Orders:</td><td class="text-right">${ordersToPrint.length}</td></tr>
        <tr><td>Items Total:</td><td class="text-right">$${itemsTotal.toFixed(2)}</td></tr>
        ${pdfForm.includeShippingDetails ? `<tr><td>Shipping Total:</td><td class="text-right">$${totalShipping.toFixed(2)}</td></tr>` : ''}
        ${pdfForm.includeTaxDetails ? `<tr><td>Tax Total:</td><td class="text-right">$${totalTax.toFixed(2)}</td></tr>` : ''}
        <tr class="total-row"><td>Grand Total:</td><td class="text-right">$${grandTotal.toFixed(2)}</td></tr>
      </table>
    </div>
  `}

  ${pdfForm.notes ? `<div class="notes"><strong>Notes:</strong> ${pdfForm.notes}</div>` : ''}

  <div class="footer">
    <p>Generated on ${new Date().toLocaleString('en-US')} | ${pdfForm.companyName}</p>
    <p>Thank you for your business!</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfOrderId
      ? `order-${pdfOrderId.slice(-8).toUpperCase()}.html`
      : `orders-report-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="seller-orders-page">
      <div className="seller-orders-header">
        <div>
          <h1>Orders</h1>
          <p>{orders.length} total orders</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => openPdfForm()}
            style={{
              padding: '10px 20px', background: 'var(--tertiary-dim)', color: 'var(--text-white)',
              border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* PDF Configuration Modal */}
      {showPdfForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowPdfForm(false)}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16, padding: 32,
            maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>PDF Order Report</h2>
              <button onClick={() => setShowPdfForm(false)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text)' }}>
                {'\u2715'}
              </button>
            </div>

            {pdfOrderId && (
              <div style={{
                background: 'var(--secondary-container)', borderRadius: 8, padding: 12,
                marginBottom: 16, fontSize: 13,
              }}>
                Generating PDF for Order #{pdfOrderId.slice(-8).toUpperCase()}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Company Name</label>
                <input type="text" value={pdfForm.companyName}
                  onChange={(e) => setPdfForm({ ...pdfForm, companyName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Company Address</label>
                <input type="text" value={pdfForm.companyAddress}
                  onChange={(e) => setPdfForm({ ...pdfForm, companyAddress: e.target.value })}
                  placeholder="123 Business St, City, State 12345"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Phone</label>
                  <input type="tel" value={pdfForm.companyPhone}
                    onChange={(e) => setPdfForm({ ...pdfForm, companyPhone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Email</label>
                  <input type="email" value={pdfForm.companyEmail}
                    onChange={(e) => setPdfForm({ ...pdfForm, companyEmail: e.target.value })}
                    placeholder="seller@example.com"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Notes (optional)</label>
                <textarea value={pdfForm.notes}
                  onChange={(e) => setPdfForm({ ...pdfForm, notes: e.target.value })}
                  placeholder="Thank you for your purchase!"
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={pdfForm.includeTaxDetails}
                    onChange={(e) => setPdfForm({ ...pdfForm, includeTaxDetails: e.target.checked })} />
                  Include tax details
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={pdfForm.includeShippingDetails}
                    onChange={(e) => setPdfForm({ ...pdfForm, includeShippingDetails: e.target.checked })} />
                  Include shipping details
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Paper Size</label>
                <select value={pdfForm.paperSize}
                  onChange={(e) => setPdfForm({ ...pdfForm, paperSize: e.target.value as 'a4' | 'letter' })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}>
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button onClick={generatePdf}
                  style={{
                    flex: 1, padding: '12px 20px', background: 'var(--tertiary-dim)', color: 'var(--text-white)',
                    border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}>
                  Print / Preview
                </button>
                <button onClick={downloadPdf}
                  style={{
                    flex: 1, padding: '12px 20px', background: 'var(--success)', color: 'var(--text-white)',
                    border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}>
                  Download File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <div className="seller-orders-id">Order #{order._id?.slice(-8).toUpperCase() ?? 'N/A'}</div>
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
                  <button onClick={() => openPdfForm(order._id)}
                    style={{
                      padding: '6px 12px', background: 'var(--surface-container)', border: '1px solid var(--border)',
                      borderRadius: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text)',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
                    PDF
                  </button>
                </div>
              </div>

              <div className="seller-orders-items">
                {order.items?.map((item: OrderItem, idx: number) => (
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

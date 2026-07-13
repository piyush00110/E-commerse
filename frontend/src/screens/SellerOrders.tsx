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

  const buildInvoiceHtml = (ordersToPrint: Order[], mode: 'print' | 'download') => {
    if (ordersToPrint.length === 0) return '';

    const itemsTotal = ordersToPrint.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
    const totalTax = ordersToPrint.reduce((sum, o) => sum + (o.taxPrice || 0), 0);
    const totalShipping = ordersToPrint.reduce((sum, o) => sum + (o.shippingPrice || 0), 0);
    const grandTotal = ordersToPrint.reduce((sum, o) => sum + o.totalPrice, 0);

    const statusColor = (s: string) => {
      const map: Record<string, { bg: string; fg: string }> = {
        pending: { bg: '#FFF8E1', fg: '#F57F17' },
        processing: { bg: '#E3F2FD', fg: '#1565C0' },
        shipped: { bg: '#E8F5E9', fg: '#2E7D32' },
        delivered: { bg: '#E0F2F1', fg: '#00695C' },
        cancelled: { bg: '#FFEBEE', fg: '#C62828' },
      };
      return map[s] || map.pending;
    };

    const paymentLabel = (m: string) => {
      const map: Record<string, string> = {
        credit_card: 'Credit / Debit Card',
        paypal: 'PayPal',
        upi: 'UPI',
        cod: 'Cash on Delivery',
      };
      return map[m] || m;
    };

    const printStyles = mode === 'print'
      ? '@media print { body { padding: 16px !important; } .no-print { display: none !important; } }'
      : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invoice - ${pdfForm.companyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      font-size: 13px; color: #1a1a2e; background: #fff;
      padding: 0; line-height: 1.5;
    }

    .invoice-wrapper { max-width: 800px; margin: 0 auto; padding: 40px; }

    /* === HEADER === */
    .inv-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding-bottom: 24px; margin-bottom: 28px;
      border-bottom: 3px solid #1a1a2e;
    }
    .inv-brand h1 {
      font-size: 28px; font-weight: 800; color: #1a1a2e;
      letter-spacing: -0.5px; margin-bottom: 6px;
    }
    .inv-brand-tag {
      display: inline-block; background: #ff9900; color: #fff;
      font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; padding: 3px 10px; border-radius: 3px;
      margin-bottom: 10px;
    }
    .inv-brand p { font-size: 11px; color: #666; line-height: 1.7; }
    .inv-doc { text-align: right; }
    .inv-doc-badge {
      display: inline-block; background: #1a1a2e; color: #fff;
      font-size: 11px; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase; padding: 6px 16px; border-radius: 4px;
      margin-bottom: 10px;
    }
    .inv-doc-date { font-size: 12px; color: #666; margin-bottom: 4px; }
    .inv-doc-id { font-size: 14px; font-weight: 700; color: #1a1a2e; font-family: 'Courier New', monospace; }

    /* === ORDER META GRID === */
    .inv-meta {
      display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 0; margin-bottom: 28px;
      border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;
    }
    .inv-meta-cell {
      padding: 14px 16px; border-right: 1px solid #e0e0e0;
    }
    .inv-meta-cell:last-child { border-right: none; }
    .inv-meta-label { font-size: 10px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .inv-meta-value { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .inv-meta-value.mono { font-family: 'Courier New', monospace; font-size: 12px; }

    /* === CUSTOMER + SHIPPING GRID === */
    .inv-info-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 20px; margin-bottom: 28px;
    }
    .inv-info-card {
      background: #f8f9fc; border: 1px solid #e8eaf0;
      border-radius: 8px; padding: 18px 20px;
    }
    .inv-info-card h3 {
      font-size: 10px; font-weight: 700; color: #999;
      text-transform: uppercase; letter-spacing: 1.2px;
      margin-bottom: 12px; padding-bottom: 8px;
      border-bottom: 1px solid #e0e3ea;
    }
    .inv-info-card p { font-size: 12px; color: #444; line-height: 1.8; }
    .inv-info-card .name { font-weight: 700; color: #1a1a2e; font-size: 13px; }
    .inv-info-card .email { color: #1565C0; font-size: 11px; }

    /* === ITEMS TABLE === */
    .inv-items-section { margin-bottom: 28px; }
    .inv-items-title {
      font-size: 10px; font-weight: 700; color: #999;
      text-transform: uppercase; letter-spacing: 1.2px;
      margin-bottom: 12px;
    }
    .inv-table {
      width: 100%; border-collapse: collapse;
      border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;
    }
    .inv-table thead th {
      background: #1a1a2e; color: #fff;
      padding: 12px 16px; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px;
      text-align: left;
    }
    .inv-table thead th:nth-child(1) { width: 5%; text-align: center; }
    .inv-table thead th:nth-child(2) { width: 45%; }
    .inv-table thead th:nth-child(3) { width: 10%; text-align: center; }
    .inv-table thead th:nth-child(4) { width: 20%; text-align: right; }
    .inv-table thead th:nth-child(5) { width: 20%; text-align: right; }
    .inv-table tbody td {
      padding: 12px 16px; font-size: 12px; color: #333;
      border-bottom: 1px solid #f0f0f0;
    }
    .inv-table tbody tr:nth-child(even) { background: #fafbfd; }
    .inv-table tbody tr:hover { background: #f0f4ff; }
    .inv-table .num { text-align: center; font-weight: 600; color: #666; }
    .inv-table .right { text-align: right; font-family: 'Courier New', monospace; font-weight: 600; }
    .inv-table .item-name { font-weight: 600; color: #1a1a2e; }
    .inv-table .item-idx {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 50%;
      background: #f0f4ff; color: #1565C0;
      font-size: 10px; font-weight: 700;
    }
    .inv-table tfoot td {
      padding: 10px 16px; font-size: 12px;
      border-bottom: none;
    }

    /* === TOTALS === */
    .inv-bottom {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 30px;
    }
    .inv-notes {
      flex: 1; background: #f8f9fc; border: 1px solid #e8eaf0;
      border-radius: 8px; padding: 16px 20px;
    }
    .inv-notes h4 {
      font-size: 10px; font-weight: 700; color: #999;
      text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px;
    }
    .inv-notes p { font-size: 11px; color: #666; line-height: 1.6; }

    .inv-totals { min-width: 280px; }
    .inv-totals-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; font-size: 12px; color: #555;
    }
    .inv-totals-row .label { font-weight: 500; }
    .inv-totals-row .value { font-family: 'Courier New', monospace; font-weight: 600; }
    .inv-totals-row.free .value { color: #2E7D32; font-weight: 700; }
    .inv-totals-divider { border-top: 2px solid #1a1a2e; margin: 4px 0; }
    .inv-totals-total {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0 0; font-size: 18px; font-weight: 800; color: #1a1a2e;
    }
    .inv-totals-total .value { font-family: 'Courier New', monospace; color: #ff9900; }

    /* === PAYMENT BADGE === */
    .inv-payment-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 6px;
      font-size: 11px; font-weight: 600;
      border: 1px solid #e0e0e0;
    }

    /* === FOOTER === */
    .inv-footer {
      margin-top: 36px; padding-top: 20px;
      border-top: 2px solid #e8eaf0;
      display: flex; justify-content: space-between; align-items: flex-end;
    }
    .inv-footer-left { font-size: 10px; color: #aaa; line-height: 1.8; }
    .inv-footer-right { text-align: right; }
    .inv-footer-thank {
      font-size: 14px; font-weight: 700; color: #1a1a2e;
      margin-bottom: 2px;
    }
    .inv-footer-tagline { font-size: 10px; color: #999; }

    ${printStyles}
  </style>
</head>
<body>
  <div class="invoice-wrapper">

    <!-- HEADER -->
    <div class="inv-header">
      <div class="inv-brand">
        <div class="inv-brand-tag">ShopSmart</div>
        <h1>${pdfForm.companyName}</h1>
        ${pdfForm.companyAddress ? `<p>${pdfForm.companyAddress}</p>` : ''}
        ${pdfForm.companyPhone || pdfForm.companyEmail ? `<p>${pdfForm.companyPhone ? `Tel: ${pdfForm.companyPhone}` : ''}${pdfForm.companyPhone && pdfForm.companyEmail ? ' &middot; ' : ''}${pdfForm.companyEmail ? `Email: ${pdfForm.companyEmail}` : ''}</p>` : ''}
      </div>
      <div class="inv-doc">
        <div class="inv-doc-badge">Invoice</div>
        <div class="inv-doc-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        ${pdfOrderId
          ? `<div class="inv-doc-id">#${pdfOrderId.slice(-8).toUpperCase()}</div>`
          : `<div class="inv-doc-id">${ordersToPrint.length} Order${ordersToPrint.length > 1 ? 's' : ''}</div>`
        }
      </div>
    </div>

    ${ordersToPrint.map((order, oIdx) => {
      const sub = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
      const st = statusColor(order.status || 'pending');
      return `
    <div style="page-break-inside: avoid; ${oIdx > 0 ? 'margin-top: 36px; padding-top: 24px; border-top: 2px dashed #e0e0e0;' : ''}">

      ${!pdfOrderId ? `<div style="font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;">Order #${order._id?.slice(-8).toUpperCase() ?? 'N/A'} &middot; ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>` : ''}

      <!-- META -->
      <div class="inv-meta">
        <div class="inv-meta-cell">
          <div class="inv-meta-label">Order ID</div>
          <div class="inv-meta-value mono">#${order._id?.slice(-8).toUpperCase() ?? 'N/A'}</div>
        </div>
        <div class="inv-meta-cell">
          <div class="inv-meta-label">Date Placed</div>
          <div class="inv-meta-value">${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
        <div class="inv-meta-cell">
          <div class="inv-meta-label">Status</div>
          <div class="inv-meta-value">
            <span class="inv-payment-badge" style="background: ${st.bg}; color: ${st.fg}; border-color: ${st.fg}22;">
              ${(order.status || 'pending').toUpperCase()}
            </span>
          </div>
        </div>
        <div class="inv-meta-cell">
          <div class="inv-meta-label">Payment</div>
          <div class="inv-meta-value" style="font-size: 11px;">${paymentLabel(order.paymentMethod || 'N/A')}</div>
        </div>
      </div>

      <!-- CUSTOMER + SHIPPING -->
      <div class="inv-info-grid">
        <div class="inv-info-card">
          <h3>Customer</h3>
          <p class="name">${order.user?.name || 'N/A'}</p>
          ${order.user?.email ? `<p class="email">${order.user.email}</p>` : ''}
        </div>
        <div class="inv-info-card">
          <h3>Shipping Address</h3>
          <p>${order.shippingAddress?.street || 'N/A'}</p>
          <p>${order.shippingAddress?.city || ''}${order.shippingAddress?.city && order.shippingAddress?.state ? ', ' : ''}${order.shippingAddress?.state || ''} ${order.shippingAddress?.zip || ''}</p>
          ${order.shippingAddress?.phone ? `<p style="margin-top: 4px;">Tel: ${order.shippingAddress.phone}</p>` : ''}
        </div>
      </div>

      <!-- ITEMS -->
      <div class="inv-items-section">
        <div class="inv-items-title">Items Ordered (${order.items.length})</div>
        <table class="inv-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item, idx) => `
            <tr>
              <td class="num"><span class="item-idx">${idx + 1}</span></td>
              <td class="item-name">${item.name}</td>
              <td class="num">${item.quantity}</td>
              <td class="right">$${item.price.toFixed(2)}</td>
              <td class="right" style="font-weight: 700;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- BOTTOM: NOTES + TOTALS -->
      <div class="inv-bottom">
        <div class="inv-notes">
          <h4>Notes</h4>
          <p>${pdfForm.notes || 'Thank you for shopping with ShopSmart. This invoice serves as your official order receipt.'}</p>
        </div>
        <div class="inv-totals">
          <div class="inv-totals-row">
            <span class="label">Subtotal</span>
            <span class="value">$${sub.toFixed(2)}</span>
          </div>
          ${pdfForm.includeShippingDetails ? `
          <div class="inv-totals-row ${order.shippingPrice === 0 ? 'free' : ''}">
            <span class="label">Shipping</span>
            <span class="value">${order.shippingPrice === 0 ? 'FREE' : '$' + (order.shippingPrice || 0).toFixed(2)}</span>
          </div>
          ` : ''}
          ${pdfForm.includeTaxDetails ? `
          <div class="inv-totals-row">
            <span class="label">Tax (8%)</span>
            <span class="value">$${(order.taxPrice || 0).toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="inv-totals-divider"></div>
          <div class="inv-totals-total">
            <span>Total</span>
            <span class="value">$${order.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

    </div>`;
    }).join('')}

    ${!pdfOrderId && ordersToPrint.length > 1 ? `
    <!-- BULK SUMMARY -->
    <div style="margin-top: 32px; padding: 20px; background: #1a1a2e; border-radius: 8px; color: #fff;">
      <div style="font-size: 10px; font-weight: 700; color: #ff9900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px;">Bulk Summary &mdash; ${ordersToPrint.length} Orders</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; text-align: center;">
        <div><div style="font-size: 10px; color: #aaa; margin-bottom: 2px;">ORDERS</div><div style="font-size: 18px; font-weight: 700;">${ordersToPrint.length}</div></div>
        <div><div style="font-size: 10px; color: #aaa; margin-bottom: 2px;">ITEMS TOTAL</div><div style="font-size: 18px; font-weight: 700;">$${itemsTotal.toFixed(2)}</div></div>
        <div><div style="font-size: 10px; color: #aaa; margin-bottom: 2px;">TAX TOTAL</div><div style="font-size: 18px; font-weight: 700;">$${totalTax.toFixed(2)}</div></div>
        <div><div style="font-size: 10px; color: #aaa; margin-bottom: 2px;">GRAND TOTAL</div><div style="font-size: 18px; font-weight: 700; color: #ff9900;">$${grandTotal.toFixed(2)}</div></div>
      </div>
    </div>
    ` : ''}

    <!-- FOOTER -->
    <div class="inv-footer">
      <div class="inv-footer-left">
        <p>Generated on ${new Date().toLocaleString('en-US')}</p>
        <p>${pdfForm.companyName} &middot; ShopSmart Marketplace</p>
      </div>
      <div class="inv-footer-right">
        <div class="inv-footer-thank">Thank You!</div>
        <div class="inv-footer-tagline">We appreciate your business.</div>
      </div>
    </div>

  </div>
</body>
</html>`;
  };

  const generatePdf = () => {
    const ordersToPrint = pdfOrderId
      ? orders.filter((o) => o._id === pdfOrderId)
      : filteredOrders;

    const htmlContent = buildInvoiceHtml(ordersToPrint, 'print');
    if (!htmlContent) return;

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

    const htmlContent = buildInvoiceHtml(ordersToPrint, 'download');
    if (!htmlContent) return;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfOrderId
      ? `invoice-${pdfOrderId.slice(-8).toUpperCase()}.html`
      : `invoices-report-${new Date().toISOString().slice(0, 10)}.html`;
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

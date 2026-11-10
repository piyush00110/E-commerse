'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { orderAPI } from '../services/api';
import { paymentMethodLabel } from '../lib/paymentMethods';

interface InvoiceItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface InvoiceOrder {
  _id: string;
  items: InvoiceItem[];
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
  };
  paymentMethod: string;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  status: string;
  createdAt: string;
  user?: { name?: string; email?: string } | string;
}

export default function InvoicePage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const [order, setOrder] = useState<InvoiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    orderAPI
      .getById(id)
      .then((res) => {
        if (!cancelled) setOrder(res.data.data as InvoiceOrder);
      })
      .catch(() => {
        if (!cancelled) setError('We could not find this order, or you do not have access to it.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Invoice unavailable</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
          {error || 'Order not found.'}
        </p>
        <Link
          href="/orders"
          style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 10, background: '#6366f1', color: '#fff', fontWeight: 700, textDecoration: 'none' }}
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );
  const shipping = Number(order.shippingPrice) || 0;
  const tax = Number(order.taxPrice) || 0;
  const total = Number(order.totalPrice) || 0;
  const adjustments = Math.round((total - (itemsSubtotal + shipping + tax)) * 100) / 100;
  const invoiceNo = `INV-${order._id.slice(-8).toUpperCase()}`;
  const customer =
    order.user && typeof order.user === 'object' ? order.user : undefined;
  const address = order.shippingAddress || {};

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '32px 16px' }}>
      <div className="no-print" style={{ maxWidth: 860, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Link
          href={`/orders/${order._id}`}
          style={{ color: '#4f46e5', fontSize: 14, fontWeight: 600, textDecoration: 'none', alignSelf: 'center' }}
        >
          ← Back to order
        </Link>
        <button
          onClick={() => window.print()}
          style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Print / Save as PDF
        </button>
      </div>

      <div
        className="invoice-sheet"
        style={{
          maxWidth: 860,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(15,23,42,0.10)',
          padding: 40,
          color: '#0f172a',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>
              S
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>ShopSmart</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Modern E-Commerce</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1 }}>INVOICE</div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{invoiceNo}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Billed to
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{customer?.name || 'Customer'}</div>
            {customer?.email && <div style={{ fontSize: 13, color: '#475569' }}>{customer.email}</div>}
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginTop: 4 }}>
              {address.street && <div>{address.street}</div>}
              <div>
                {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
              </div>
              {address.country && <div>{address.country}</div>}
              {address.phone && <div>{address.phone}</div>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Payment
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
              <div>
                Method: <strong style={{ color: '#0f172a' }}>{paymentMethodLabel(order.paymentMethod)}</strong>
              </div>
              <div>
                Status:{' '}
                <strong style={{ color: order.isPaid ? '#15803d' : '#b45309' }}>
                  {order.isPaid ? 'Paid' : 'Pending'}
                </strong>
              </div>
              {order.isPaid && order.paidAt && (
                <div>Paid on {new Date(order.paidAt).toLocaleDateString()}</div>
              )}
              <div>
                Order status: <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{order.status}</strong>
              </div>
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                Item
              </th>
              <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                Qty
              </th>
              <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                Unit price
              </th>
              <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '12px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{item.name}</td>
                <td style={{ padding: '12px', fontSize: 13, textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{item.quantity}</td>
                <td style={{ padding: '12px', fontSize: 13, textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>
                  ${Number(item.price).toFixed(2)}
                </td>
                <td style={{ padding: '12px', fontSize: 13, textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>
                  ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 300, maxWidth: '100%' }}>
            <Row label="Subtotal" value={`$${itemsSubtotal.toFixed(2)}`} />
            <Row label="Shipping" value={shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`} />
            <Row label="Tax" value={`$${tax.toFixed(2)}`} />
            {adjustments !== 0 && (
              <Row
                label={adjustments < 0 ? 'Discounts & credits' : 'Adjustments'}
                value={`${adjustments < 0 ? '−' : ''}$${Math.abs(adjustments).toFixed(2)}`}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 8, borderTop: '2px solid #0f172a', fontSize: 16, fontWeight: 800 }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
          Thank you for shopping with ShopSmart. This invoice was generated electronically and is valid without a signature.
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          .invoice-sheet {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
          @page {
            margin: 14mm;
          }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#475569' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>
    </div>
  );
}

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import './agent-plan.css';

export type PlanStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface PlanProps {
  /** Order status driving the plan. Defaults to a live 'shipped' preview. */
  status?: PlanStatus;
  createdAt?: string;
  deliveredAt?: string;
  trackingNumber?: string;
  carrier?: string;
  title?: string;
  className?: string;
}

interface StepDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

const STEPS: StepDef[] = [
  { id: 'placed', name: 'Order placed', desc: 'We received your order and payment.', icon: '🧾' },
  { id: 'confirmed', name: 'Payment confirmed', desc: 'Payment verified, invoice generated.', icon: '💳' },
  { id: 'packed', name: 'Packed at warehouse', desc: 'Items picked, packed and labeled.', icon: '📦' },
  { id: 'shipped', name: 'Shipped', desc: 'Handed to the courier, tracking active.', icon: '🚚' },
  { id: 'out', name: 'Out for delivery', desc: 'Courier is on the way to your address.', icon: '🛵' },
  { id: 'delivered', name: 'Delivered', desc: 'Package handed over. Enjoy!', icon: '✅' },
];

const LIVE_COPY: Record<Exclude<PlanStatus, 'cancelled' | 'delivered'>, string> = {
  pending: 'Awaiting confirmation — usually under an hour',
  processing: 'Warehouse team is packing your items',
  shipped: 'In transit — live tracking is active',
};

function fmtDay(base: string | undefined, offsetDays: number): string {
  try {
    const d = base ? new Date(base) : new Date();
    const t = new Date(d.getTime() + offsetDays * 86400000);
    return t.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function Plan({
  status = 'shipped',
  createdAt,
  deliveredAt,
  trackingNumber = 'TRK8X2K9Q1A4B7',
  carrier = 'UPS',
  title = 'Delivery Plan',
  className,
}: PlanProps) {
  if (status === 'cancelled') {
    return (
      <div className={cn('agent-plan', className)}>
        <div className="agent-plan-header">
          <h3 className="agent-plan-title">
            <span className="agent-plan-mark">✕</span>
            {title}
          </h3>
          <span className="agent-plan-pill stopped">Cancelled</span>
        </div>
        <p className="agent-plan-sub">This delivery plan was stopped. No shipments were made and no charges apply.</p>
      </div>
    );
  }

  const currentIdx =
    status === 'pending' ? 1 : status === 'processing' ? 2 : status === 'shipped' ? 4 : 6;

  const doneCount = status === 'delivered' ? STEPS.length : currentIdx;
  const pct = Math.round((doneCount / STEPS.length) * 100);
  const complete = status === 'delivered';

  return (
    <div className={cn('agent-plan', className)}>
      <div className="agent-plan-header">
        <h3 className="agent-plan-title">
          <span className="agent-plan-mark">🗺️</span>
          {title}
        </h3>
        <span className={cn('agent-plan-pill', complete ? 'done' : 'running')}>
          {complete ? '✓ Complete' : `● Step ${Math.min(currentIdx + 1, STEPS.length)} of ${STEPS.length}`}
        </span>
      </div>
      <p className="agent-plan-sub">
        {complete
          ? `Delivered${deliveredAt ? ` ${new Date(deliveredAt).toLocaleDateString()}` : ''} — thanks for shopping with us.`
          : LIVE_COPY[status]}
      </p>

      <div className="agent-plan-bar">
        <div className={cn('agent-plan-fill', complete && 'complete')} style={{ width: `${pct}%` }} />
      </div>

      <div className="agent-plan-steps">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const current = !complete && i === currentIdx;
          const state = done || complete ? 'done' : current ? 'current' : 'upcoming';
          const time =
            done || complete
              ? step.id === 'delivered' && deliveredAt
                ? new Date(deliveredAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                : fmtDay(createdAt, i)
              : '';
          return (
            <div key={step.id} className={cn('agent-plan-step', state)}>
              <div className="agent-plan-rail">
                <div className={cn('agent-plan-dot', state)}>
                  {state === 'done' ? '✓' : state === 'current' ? '●' : step.icon}
                </div>
                {i < STEPS.length - 1 ? (
                  <div className={cn('agent-plan-line', (done || complete) && 'done')} />
                ) : null}
              </div>
              <div className="agent-plan-body">
                <div className="agent-plan-step-name">{step.name}</div>
                <div className="agent-plan-step-desc">{step.desc}</div>
                {time ? <div className="agent-plan-step-time">{time}</div> : null}
                {current ? (
                  <div className="agent-plan-live">
                    <span className="agent-plan-live-dot" />
                    In progress now
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="agent-plan-footer">
        <span>
          {carrier} · <span className="agent-plan-tracking">{trackingNumber}</span>
        </span>
        <span>{pct}% complete</span>
      </div>
    </div>
  );
}

export default Plan;

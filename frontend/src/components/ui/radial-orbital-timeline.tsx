'use client';

import React, { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import './radial-orbital-timeline.css';

export type OrbitalStatus = 'completed' | 'in-progress' | 'pending';

export interface TimelineItem {
  id: number | string;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: LucideIcon;
  relatedIds: (number | string)[];
  status: OrbitalStatus;
  energy: number;
}

export interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  className?: string;
  /** Diameter of the orbit as % of stage (default 76). */
  orbitRadiusPct?: number;
}

const SPOKE_COLOR: Record<OrbitalStatus, string> = {
  completed: '#14958f',
  'in-progress': '#ff3f6c',
  pending: '#d4d5d9',
};

const STATUS_COPY: Record<OrbitalStatus, string> = {
  completed: '✓ Completed',
  'in-progress': '● In progress',
  pending: '○ Pending',
};

export function RadialOrbitalTimeline({
  timelineData,
  className,
  orbitRadiusPct = 76,
}: RadialOrbitalTimelineProps) {
  const [selectedId, setSelectedId] = useState<number | string | null>(
    () => timelineData.find((t) => t.status === 'in-progress')?.id ?? timelineData[0]?.id ?? null,
  );

  const selected = timelineData.find((t) => t.id === selectedId) ?? timelineData[0];
  const overall = timelineData.length
    ? Math.round(timelineData.reduce((s, t) => s + (t.energy ?? 0), 0) / timelineData.length)
    : 0;

  const positions = useMemo(() => {
    const n = timelineData.length;
    const r = orbitRadiusPct / 2;
    return timelineData.map((t, i) => {
      const angle = (-90 + (i * 360) / Math.max(n, 1)) * (Math.PI / 180);
      return {
        id: t.id,
        x: 50 + r * Math.cos(angle),
        y: 50 + r * Math.sin(angle),
      };
    });
  }, [timelineData, orbitRadiusPct]);

  const posOf = (id: number | string) => positions.find((p) => p.id === id);

  if (timelineData.length === 0) return null;

  return (
    <div className={cn('orbital-wrap', className)}>
      <div className="orbital-stage">
        <svg className="orbital-svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="orbital-ring" cx="50" cy="50" r={orbitRadiusPct / 2} />
          {/* spokes: center -> node */}
          {timelineData.map((t) => {
            const p = posOf(t.id);
            if (!p) return null;
            return (
              <line
                key={`spoke-${t.id}`}
                className="orbital-spoke"
                x1="50"
                y1="50"
                x2={p.x}
                y2={p.y}
                stroke={SPOKE_COLOR[t.status]}
              />
            );
          })}
          {/* related links */}
          {timelineData.flatMap((t) =>
            t.relatedIds
              .map((rid) => {
                const a = posOf(t.id);
                const b = posOf(rid);
                if (!a || !b || t.id === rid) return null;
                return (
                  <line
                    key={`link-${t.id}-${rid}`}
                    className="orbital-link"
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                  />
                );
              })
              .filter(Boolean),
          )}
        </svg>

        <button
          type="button"
          className="orbital-center"
          aria-label={`Overall progress ${overall} percent. Reset selection.`}
          onClick={() => setSelectedId(timelineData.find((t) => t.status === 'in-progress')?.id ?? timelineData[0]?.id)}
        >
          <Package width={22} height={22} strokeWidth={2.2} />
          <span className="orbital-center-pct">{overall}%</span>
          <span className="orbital-center-lbl">Progress</span>
        </button>

        {timelineData.map((t) => {
          const p = posOf(t.id);
          if (!p) return null;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              className={cn('orbital-node', t.status, selected?.id === t.id && 'selected')}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              aria-label={`${t.title}, ${t.status}`}
              aria-pressed={selected?.id === t.id}
              onClick={() => setSelectedId(t.id)}
            >
              <Icon width={22} height={22} strokeWidth={2} />
              <span className={cn('orbital-node-dot', t.status)} />
              <span className="orbital-node-lbl">{t.title}</span>
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="orbital-detail" key={String(selected.id)}>
          <div className="orbital-detail-top">
            <h3 className="orbital-detail-title">{selected.title}</h3>
            <span className="orbital-cat">{selected.category}</span>
          </div>
          <div className="orbital-date">{selected.date}</div>
          <p className="orbital-content">{selected.content}</p>
          <div className="orbital-energy-row">
            <div className="orbital-energy-track">
              <div className="orbital-energy-fill" style={{ width: `${selected.energy}%` }} />
            </div>
            <span className="orbital-energy-num">{selected.energy}%</span>
          </div>
          <div className={cn('orbital-status-line', selected.status)}>
            {STATUS_COPY[selected.status]}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default RadialOrbitalTimeline;

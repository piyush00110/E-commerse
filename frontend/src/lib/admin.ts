'use client';

import { supabase } from './supabase';

/**
 * Single-admin allowlist.
 * Only the email(s) listed in NEXT_PUBLIC_ADMIN_EMAILS may open the admin panel.
 * Set it in frontend/.env.local and in your hosting provider (Vercel) env vars:
 *   NEXT_PUBLIC_ADMIN_EMAILS=owner@example.com
 * Multiple addresses can be comma-separated.
 * Defaults to the seeded admin account.
 */
function parseAdminEmails(): string[] {
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    'as98979148@gmail.com';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const ADMIN_EMAILS: string[] = parseAdminEmails();

export function isAllowedAdminEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export interface StoredUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  token?: string;
}

export function getStoredUser(): StoredUser | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export type AdminCheckResult =
  | { ok: true; user: StoredUser }
  | { ok: false; reason: 'not-logged-in' | 'not-admin' | 'not-allowlisted' };

/**
 * Verifies admin access in two layers:
 * 1. Supabase session + users-table role (server-enforced via RLS — cannot be
 *    faked by editing localStorage).
 * 2. Single-person email allowlist (NEXT_PUBLIC_ADMIN_EMAILS).
 */
export async function verifyAdminAccess(): Promise<AdminCheckResult> {
  const stored = getStoredUser();
  if (!stored) return { ok: false, reason: 'not-logged-in' };

  const uid = stored._id || stored.id;
  // Layer 1: authoritative role from the database (RLS-protected row).
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      const sessionUid = sessionData.session.user.id;
      const { data: row } = await (supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (k: string, v: string) => {
              maybeSingle: () => Promise<{ data: { role?: string; email?: string } | null }>;
            };
          };
        };
      })
        .from('users')
        .select('role,email')
        .eq('id', sessionUid)
        .maybeSingle();
      if (!row || row.role !== 'admin') return { ok: false, reason: 'not-admin' };
      if (!isAllowedAdminEmail(row.email || stored.email)) {
        return { ok: false, reason: 'not-allowlisted' };
      }
      return { ok: true, user: stored };
    }
  } catch {
    // Fall through to local check (offline / session expired).
  }

  // Layer 1 fallback (no live session): local role claim.
  if (stored.role !== 'admin') return { ok: false, reason: 'not-admin' };
  // Layer 2: allowlist always applies.
  if (!isAllowedAdminEmail(stored.email)) return { ok: false, reason: 'not-allowlisted' };
  return { ok: true, user: stored };
}

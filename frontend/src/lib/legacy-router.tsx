'use client';

import { useRouter, useParams as useNextParams, useSearchParams as useNextSearchParams, usePathname } from 'next/navigation';
import NextLink from 'next/link';
import React from 'react';

export function useNavigate() {
  const router = useRouter();
  return (to: string | number) => {
    if (typeof to === 'number') {
      if (to < 0) router.back();
    } else {
      router.push(to);
    }
  };
}

export function useParams<T = Record<string, string | string[] | undefined>>(): T {
  const params = useNextParams();
  return (params || {}) as unknown as T;
}

export function useLocation() {
  const pathname = usePathname();
  return { pathname, search: '', hash: '', state: null, key: '' };
}

export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
  const sp = useNextSearchParams();
  const setSp = (params: URLSearchParams) => {
    const newUrl = new URL(window.location.href);
    newUrl.search = params.toString();
    window.history.pushState({}, '', newUrl.toString());
  };
  return [sp, setSp];
}

export const Navigate: React.FC<{ to: string; replace?: boolean }> = ({ to, replace: doReplace }) => {
  const router = useRouter();
  React.useEffect(() => {
    if (doReplace) router.replace(to);
    else router.push(to);
  }, [to, doReplace, router]);
  return null;
};

export const Link: React.FC<{ to: string; children?: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: (e: React.MouseEvent) => void }> = ({ to, children, className, style, onClick }) => {
  return <NextLink href={to} className={className} style={style} onClick={onClick}>{children}</NextLink>;
};

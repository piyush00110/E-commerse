declare module 'react-router-dom' {
  import React from 'react';

  export function useNavigate(): (to: string | number) => void;
  export function useParams<T = Record<string, string | string[] | undefined>>(): T;
  export function useLocation(): { pathname: string; search: string; hash: string; state: null; key: string };
  export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void];

  export const Link: React.FC<{ to: string; children?: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: (e: React.MouseEvent) => void }>;
  export const Navigate: React.FC<{ to: string; replace?: boolean }>;
}

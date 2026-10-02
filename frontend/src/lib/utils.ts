/** Lightweight classNames joiner (no deps). Usage: cn("a", cond && "b") */
export function cn(...inputs: Array<string | false | null | undefined | Record<string, boolean>>): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string') {
      if (input) out.push(input);
    } else {
      for (const key of Object.keys(input)) {
        if (input[key]) out.push(key);
      }
    }
  }
  return out.join(' ');
}

export default cn;

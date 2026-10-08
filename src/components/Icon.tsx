import type { ReactNode } from "react";
import type { IconName } from "../content/types";

const iconPaths: Record<IconName, ReactNode> = {
  "arrow-right": <><path d="M4.75 12h14.5" /><path d="m13 5.75 6.25 6.25L13 18.25" /></>,
  "arrow-up-right": <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
  "arrow-left": <><path d="M19.25 12H4.75" /><path d="m11 18.25-6.25-6.25L11 5.75" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  bag: <><path d="M5.5 8.5h13l1.1 12H4.4l1.1-12Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  star: <path d="m12 2.8 2.8 5.7 6.3.9-4.55 4.45 1.08 6.3L12 17.2l-5.63 2.95 1.08-6.3L2.9 9.4l6.3-.9L12 2.8Z" fill="currentColor" stroke="none" />,
  spark: <><path d="m12 2 1.65 7.2L21 12l-7.35 2.8L12 22l-1.65-7.2L3 12l7.35-2.8L12 2Z" /><path d="m19 2 .65 2.35L22 5l-2.35.65L19 8l-.65-2.35L16 5l2.35-.65L19 2Z" /></>,
  leaf: <><path d="M20.8 3.3c-8.6-.7-14 1.4-15.9 6.2-1.1 2.8.1 5.5 2.7 6.3 5.2 1.6 10.8-4.7 13.2-12.5Z" /><path d="M4 21c1.8-5.5 6.2-9.4 12-12.8" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.25 2" /></>,
  snow: <><path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5" /><path d="m8.5 5 3.5 2 3.5-2M8.5 19l3.5-2 3.5 2M3.8 11l3.5 1-1 3.5M20.2 11l-3.5 1 1 3.5M8.5 5 8 8.7l-3.2 1.8M15.5 19l.5-3.7 3.2-1.8M15.5 5l.5 3.7 3.2 1.8M8.5 19 8 15.3l-3.2-1.8" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3.5 12h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3c-2.2 2.4-3.3 5.4-3.3 9S9.8 18.6 12 21" /></>,
  shield: <><path d="M12 21s7-3.4 7-9.1V5.4L12 2.7 5 5.4v6.5C5 17.6 12 21 12 21Z" /><path d="m9 12 2 2 4-4" /></>,
  "chevron-down": <path d="m6.5 9 5.5 5.5L17.5 9" />,
  check: <path d="m5 12.5 4.3 4.3L19 7" />,
  lock: <><rect x="4.5" y="10" width="15" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  truck: <><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></>,
  heart: <path d="M20.5 8.7c0 4.1-8.5 10-8.5 10s-8.5-5.9-8.5-10a4.3 4.3 0 0 1 8.5-1.1 4.3 4.3 0 0 1 8.5 1.1Z" />,
  coffee: <><path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" /><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 4v2M12 4v2M16 4v2" /></>,
  "credit-card": <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6.5 15h4" /></>,
};

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      {iconPaths[name] ?? iconPaths.spark}
    </svg>
  );
}

import { Fragment, type ComponentProps, type ReactNode } from "react";
import { titleCase } from "../content";
import type { IconName } from "../content/types";
import { Icon } from "./Icon";

/** Renders "\n" in content as a line break; by default only on wide screens. */
export function Lines({ text, always = false }: { text: string; always?: boolean }) {
  return <>{text.split("\n").map((part, i) => <Fragment key={i}>{i > 0 && <br className={always ? undefined : "desktop-break"} />}{part}</Fragment>)}</>;
}

export function Eyebrow({ children, dot = true, className = "", ...rest }: ComponentProps<"p"> & { dot?: boolean }) {
  return <p className={`eyebrow ${className}`} {...rest}>{dot && <><span className="eyebrow-dot" />{" "}</>}{children}</p>;
}

type PillProps = { tone: "cream" | "dark"; icon?: IconName; children: ReactNode; className?: string };

/** The rounded call-to-action with a circular arrow on the right, as a link or a button. */
export function PillLink({ tone, icon = "arrow-up-right", children, className = "", ...rest }: PillProps & Omit<ComponentProps<"a">, "className">) {
  return <a className={`button button-${tone} ${className}`} {...rest}><span>{children}</span><span className="button-icon"><Icon name={icon} size={17} /></span></a>;
}

export function PillButton({ tone, icon = "arrow-right", children, className = "", ...rest }: PillProps & Omit<ComponentProps<"button">, "className">) {
  return <button className={`button button-${tone} ${className}`} type="button" {...rest}><span>{children}</span><span className="button-icon"><Icon name={icon} size={17} /></span></button>;
}

export function TextLink({ children, icon = "arrow-right", ...rest }: ComponentProps<"a"> & { icon?: IconName }) {
  return <a className="underlined-link" {...rest}>{children} <Icon name={icon} size={16} /></a>;
}

export const Stars = ({ size }: { size: number }) => (
  <span className="love-stars" aria-label="Five stars">{[0, 1, 2, 3, 4].map((i) => <Icon name="star" size={size} key={i} />)}</span>
);

type AttributionProps = { initials: string; name: string; detail: string; large?: boolean; reveal?: boolean };

export function Attribution({ initials, name, detail, large, reveal }: AttributionProps) {
  return <div className="love-attribution" data-reveal={reveal || undefined}><span className={`avatar-initial${large ? " avatar-large" : ""}`}>{initials}</span><span><strong>{name}</strong><small>{detail}</small></span></div>;
}

export function QuantityControl({ name, qty, onChange, className = "quantity-control", size = 13 }: { name: string; qty: number; onChange: (amount: number) => void; className?: string; size?: number }) {
  return (
    <div className={className}>
      <button type="button" aria-label={`Remove one ${name}`} onClick={() => onChange(-1)}><Icon name="minus" size={size} /></button>
      <span aria-label={`Quantity ${qty}`}>{qty}</span>
      <button type="button" aria-label={`Add one ${name}`} onClick={() => onChange(1)}><Icon name="plus" size={size} /></button>
    </div>
  );
}

export function Brand({ name }: { name: string }) {
  return (
    <a className="brand" href="#top" aria-label={`${titleCase(name)} home`}>
      <span className="brand-emblem" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M5 17c5.2 0 5.2-10 10.4-10s5.2 18 10.4 18M5 23c5.2 0 5.2-10 10.4-10s5.2 12 10.4 12" /><circle cx="16" cy="16" r="14.5" /></svg></span>
      <span className="brand-name">{name}<span>.</span></span>
    </a>
  );
}

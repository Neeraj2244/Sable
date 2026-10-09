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

// The rounded call-to-action with a circular arrow on the right, as a link or a button.
const pillClass = (tone: PillProps["tone"], extra = "") => `button button-${tone} ${extra}`.trim();
const PillBody = ({ children, icon }: { children: ReactNode; icon: IconName }) => <><span>{children}</span><span className="button-icon"><Icon name={icon} size={17} /></span></>;

export const PillLink = ({ tone, icon = "arrow-up-right", children, className, ...rest }: PillProps & Omit<ComponentProps<"a">, "className">) =>
  <a className={pillClass(tone, className)} {...rest}><PillBody icon={icon}>{children}</PillBody></a>;

export const PillButton = ({ tone, icon = "arrow-right", children, className, ...rest }: PillProps & Omit<ComponentProps<"button">, "className">) =>
  <button className={pillClass(tone, className)} type="button" {...rest}><PillBody icon={icon}>{children}</PillBody></button>;

export function TextLink({ children, icon = "arrow-right", ...rest }: ComponentProps<"a"> & { icon?: IconName }) {
  return <a className="underlined-link" {...rest}>{children} <Icon name={icon} size={16} /></a>;
}

export const Stars = ({ size }: { size: number }) => (
  <span className="love-stars" role="img" aria-label="Five stars">{[0, 1, 2, 3, 4].map((i) => <Icon name="star" size={size} key={i} />)}</span>
);

type AttributionProps = { initials: string; name: string; detail: string; large?: boolean; reveal?: boolean };

export function Attribution({ initials, name, detail, large, reveal }: AttributionProps) {
  return <div className="love-attribution" data-reveal={reveal || undefined}><span className={`avatar-initial${large ? " avatar-large" : ""}`}>{initials}</span><span><strong>{name}</strong><small>{detail}</small></span></div>;
}

type QuantityProps = { name: string; qty: number; max: number; onChange: (amount: number) => void; className?: string; size?: number };

export function QuantityControl({ name, qty, max, onChange, className = "quantity-control", size = 13 }: QuantityProps) {
  return (
    <div className={className} role="group" aria-label={`${name} quantity`}>
      <button type="button" aria-label={`Remove one ${name}`} onClick={() => onChange(-1)}><Icon name="minus" size={size} /></button>
      <output aria-live="polite">{qty}</output>
      <button type="button" aria-label={qty >= max ? `${name}: maximum of ${max} reached` : `Add one ${name}`} onClick={() => onChange(1)} disabled={qty >= max}><Icon name="plus" size={size} /></button>
    </div>
  );
}

/** One line shared by every footer. */
export const Copyright = ({ name }: { name: string }) => <span>&copy; {new Date().getFullYear()} {titleCase(name)} Tiramisu</span>;

export function Brand({ name }: { name: string }) {
  return (
    <a className="brand" href={import.meta.env.BASE_URL} aria-label={`${titleCase(name)} home`}>
      <span className="brand-emblem" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M5 17c5.2 0 5.2-10 10.4-10s5.2 18 10.4 18M5 23c5.2 0 5.2-10 10.4-10s5.2 12 10.4 12" /><circle cx="16" cy="16" r="14.5" /></svg></span>
      <span className="brand-name">{name}<span>.</span></span>
    </a>
  );
}

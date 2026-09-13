import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1140px] px-4 sm:px-8 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}

/** Mono uppercase marker — the drawing-sheet "Fig." label. */
export function Fig({
  children,
  tone = "live",
  className = "",
}: {
  children: ReactNode;
  tone?: "live" | "muted" | "block";
  className?: string;
}) {
  const tones = {
    live: "text-live",
    muted: "text-muted",
    block: "text-block-muted",
  } as const;
  return <p className={`vc-fig ${tones[tone]} ${className}`}>{children}</p>;
}

/** A dimension line: hairlines running out from a centred caption. */
export function DimensionRule({ children }: { children: ReactNode }) {
  return (
    <p className="vc-dim vc-fig text-muted">
      <span className="shrink-0">{children}</span>
    </p>
  );
}

type ButtonVariant = "live" | "outline" | "underline" | "block";

const buttonBase =
  "inline-flex items-center justify-center gap-2 text-[0.9rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants: Record<ButtonVariant, string> = {
  live: "bg-live px-6 py-3.5 text-live-ink hover:bg-live-hover",
  outline: "border border-ink px-6 py-3.5 text-ink hover:bg-ink hover:text-ground",
  underline: "border-b border-ink px-1 py-2 text-ink hover:border-live hover:text-live",
  block: "bg-ink px-6 py-3.5 text-ground hover:bg-live hover:text-live-ink",
};

export function ButtonLink({
  variant = "live",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props} />
  );
}

export function Button({
  variant = "live",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props} />
  );
}

/** Section wrapper: every band on the site is separated by a single hairline. */
export function Section({
  children,
  className = "",
  divide = true,
}: {
  children: ReactNode;
  className?: string;
  divide?: boolean;
}) {
  return (
    <section
      className={`${divide ? "border-t border-line" : ""} py-12 sm:py-16 lg:py-20 ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  fig,
  title,
  lede,
  action,
}: {
  fig: string;
  title: string;
  lede?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="max-w-[46ch]">
        <Fig>{fig}</Fig>
        <h2 className="mt-3 font-display text-3xl leading-[1.08] tracking-[-0.02em] sm:text-4xl">
          {title}
        </h2>
        {lede ? <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{lede}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StockPill({ text, tone }: { text: string; tone: "in" | "low" | "out" }) {
  const tones = {
    in: "text-earth",
    low: "text-warn",
    out: "text-muted",
  } as const;
  const dots = {
    in: "bg-earth",
    low: "bg-warn",
    out: "bg-muted",
  } as const;
  return (
    <span className={`inline-flex items-center gap-2 text-[0.8rem] font-semibold ${tones[tone]}`}>
      <span className={`size-2 rounded-full ${dots[tone]}`} aria-hidden />
      {text}
    </span>
  );
}

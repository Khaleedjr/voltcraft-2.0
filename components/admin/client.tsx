"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { toast } from "@/components/admin/toaster";
import { btnClass, field } from "@/components/admin/ui";
import type { ActionResult } from "@/lib/admin/action-result";

/**
 * The admin's interactive pieces: forms that report what the server said,
 * submit buttons that know when they are busy, and a confirmation step in
 * front of anything that cannot be undone.
 */

type Action = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

/**
 * The action, wrapped to announce a success the moment the server answers.
 * Not from an effect: the answer arrives together with the refreshed page, and
 * when that page no longer has the form — record a payment and the payment
 * form goes — an effect inside it never runs. `fallback` is what to say when
 * the action gives no message; null says nothing.
 */
function announcing(action: Action, fallback: string | null): Action {
  return async (prev, formData) => {
    const result = await action(prev, formData);
    if (result?.ok && fallback !== null) toast(result.message ?? fallback);
    return result;
  };
}

const ResultContext = createContext<ActionResult | null>(null);
/** Whether the enclosing ActionForm is waiting on the server. */
const PendingContext = createContext(false);

/** The message for one field, from the last submit — for inputs inside an ActionForm. */
export function useFieldError(name: string): string | undefined {
  const result = useContext(ResultContext);
  return result && !result.ok ? result.fieldErrors?.[name] : undefined;
}

export function FieldError({ name }: { name: string }) {
  const error = useFieldError(name);
  return error ? (
    <p className={field.error} role="alert">
      {error}
    </p>
  ) : null;
}

/**
 * A form that posts to a server action and shows what came back.
 *
 * It submits through a transition rather than `<form action>`, on purpose:
 * React resets a form's fields after every `<form action>` completes — even
 * when the action answered "fix these fields" — which would wipe a half-typed
 * product on the first mistake. Here nothing is reset unless asked for.
 */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  showSuccess = true,
  message = "end",
  onChange,
  onResult,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  showSuccess?: boolean;
  /** "end": the status line follows the fields; "none": the form places <FormStatus /> itself. */
  message?: "end" | "none";
  onChange?: (event: React.FormEvent<HTMLFormElement>) => void;
  onResult?: (result: ActionResult) => void;
}) {
  const [state, formAction, pending] = useActionState(announcing(action, showSuccess ? "Saved." : null), null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset();
    if (state) onResult?.(state);
    // onResult is a callback prop; re-running on its identity would repeat it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, resetOnSuccess]);

  return (
    <ResultContext value={state}>
      <PendingContext value={pending}>
        <form
          ref={formRef}
          className={className}
          noValidate
          onChange={onChange}
          onSubmit={(event) => {
            event.preventDefault();
            const submitter = (event.nativeEvent as SubmitEvent).submitter;
            const data = new FormData(event.currentTarget, submitter);
            startTransition(() => formAction(data));
          }}
        >
          {children}
          {message === "end" ? <FormMessage state={state} /> : null}
        </form>
      </PendingContext>
    </ResultContext>
  );
}

/** The last result of the enclosing ActionForm, placed wherever the form wants it. */
export function FormStatus({ showSuccess = true }: { showSuccess?: boolean }) {
  return <FormMessage state={useContext(ResultContext)} showSuccess={showSuccess} />;
}

/** An inline error from the last submit. Successes are announced by the toaster. */
export function FormMessage({ state }: { state: ActionResult | null; showSuccess?: boolean }) {
  if (!state || state.ok) return <p aria-live="polite" className="sr-only" />;
  return (
    <p aria-live="polite" role="alert" className="mt-3 border-l-2 border-warn pl-3 text-[0.85rem] leading-relaxed text-warn">
      {state.error}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  name,
  value,
  onClick,
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  // Pending either way the form was sent: through ActionForm's transition, or
  // as a plain `<form action>` (ConfirmAction, bulk forms).
  const { pending: formPending } = useFormStatus();
  const pending = useContext(PendingContext) || formPending;
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending || disabled}
      aria-busy={pending}
      onClick={onClick}
      className={btnClass(variant, size, className)}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}

/**
 * A button that asks first. The question is a real dialog — focus moves into
 * it, Escape closes it — and the dangerous action is a form inside it, so it
 * works as a plain POST and reports the server's answer in place.
 */
export function ConfirmAction({
  action,
  fields,
  trigger,
  title,
  body,
  confirmLabel,
  tone = "danger",
  size = "sm",
  triggerVariant,
  children,
}: {
  action: Action;
  fields: Record<string, string>;
  trigger: ReactNode;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  size?: "sm" | "md";
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  /** Extra inputs inside the dialog (a note, a checkbox). */
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(announcing(action, "Done."), null);
  const titleId = useId();

  useEffect(() => {
    if (state?.ok) ref.current?.close();
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={btnClass(triggerVariant ?? (tone === "danger" ? "danger" : "secondary"), size)}
      >
        {trigger}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,28rem)] border border-line bg-raised p-0 text-ink shadow-[0_24px_60px_rgba(var(--vc-shadow),0.28)] backdrop:bg-[rgba(20,16,10,0.45)]"
      >
        <form action={formAction} className="p-5">
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <h2 id={titleId} className="font-display text-[1.2rem] tracking-[-0.015em]">
            {title}
          </h2>
          {body ? <div className="mt-2 text-[0.9rem] leading-relaxed text-muted">{body}</div> : null}
          {children ? <div className="mt-4 grid gap-3">{children}</div> : null}
          <FormMessage state={state && !state.ok ? state : null} />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => ref.current?.close()} className={btnClass("ghost", "md")}>
              Keep it
            </button>
            <SubmitButton variant={tone === "danger" ? "danger" : "primary"}>{confirmLabel}</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}

/**
 * Tick rows, then act on all of them — the WooCommerce bulk-edit pattern.
 * Here `<form action>`'s automatic reset is exactly right: once the action
 * completes the ticks clear, and onReset zeroes the count.
 */
export function BulkForm({
  action,
  actions,
  children,
}: {
  action: Action;
  actions: { status: string; label: string; variant?: "primary" | "secondary" | "danger"; confirm?: string }[];
  children: ReactNode;
}) {
  const [state, formAction] = useActionState(announcing(action, "Done."), null);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLFormElement>(null);

  const recount = () =>
    setCount(ref.current?.querySelectorAll<HTMLInputElement>('input[name="ids"]:checked').length ?? 0);

  return (
    <form ref={ref} action={formAction} onChange={recount} onReset={() => setCount(0)}>
      {state && !state.ok ? (
        <div className="border-b border-line px-4 py-2">
          <FormMessage state={state} />
        </div>
      ) : null}
      <div
        className={`flex flex-wrap items-center gap-2 border-b border-line bg-gold/15 px-4 py-2.5 ${count ? "" : "hidden"}`}
        aria-hidden={count === 0}
      >
        <span className="mr-2 text-[0.84rem] font-semibold" aria-live="polite">
          {count} selected
        </span>
        {actions.map((a) => (
          <SubmitButton
            key={a.status}
            name="status"
            value={a.status}
            variant={a.variant ?? "secondary"}
            size="sm"
            onClick={
              a.confirm
                ? (e) => {
                    if (!window.confirm(a.confirm!.replace("{n}", String(count)))) e.preventDefault();
                  }
                : undefined
            }
          >
            {a.label}
          </SubmitButton>
        ))}
      </div>
      {children}
    </form>
  );
}

/** The header checkbox: ticks or clears every row in its form. */
export function SelectAll({ label = "Select all on this page" }: { label?: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      className={field.check}
      onChange={(e) => {
        const on = e.currentTarget.checked;
        e.currentTarget.form
          ?.querySelectorAll<HTMLInputElement>('input[name="ids"]')
          .forEach((box) => (box.checked = on));
      }}
    />
  );
}

/** A filter select that applies itself — no Apply button to find. */
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}

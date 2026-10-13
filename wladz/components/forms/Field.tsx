import { useId, type ComponentProps } from "react";

export function Field({
  label,
  hint,
  ...inputProps
}: { label: string; hint?: string } & ComponentProps<"input">) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-base font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint ? hintId : undefined}
        required
        className="h-12 w-full rounded-2xl border-2 border-dz-green-soft bg-dz-white px-4 text-base text-ink placeholder:text-ink-soft focus:border-dz-green focus:outline-none ltr:text-end"
        {...inputProps}
      />
      {hint ? (
        <p id={hintId} className="mt-1 text-base text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p role="alert" className="rounded-2xl bg-dz-red-soft px-4 py-3 text-base font-bold text-dz-red">
      {message}
    </p>
  );
}

export function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full cursor-pointer rounded-2xl bg-dz-green text-lg font-bold text-dz-white transition hover:bg-dz-green-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dz-green active:translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "لحظة من فضلك…" : label}
    </button>
  );
}

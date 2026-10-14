import { useId, type ComponentProps } from "react";
import { LogIn, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
        className="wz-input ltr:text-end"
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
    <p role="alert" className="rounded-2xl border border-white/80 bg-dz-red-soft/90 px-4 py-3 text-base font-bold text-dz-red">
      {message}
    </p>
  );
}

export function SubmitButton({
  pending,
  label,
  icon = LogIn,
}: {
  pending: boolean;
  label: string;
  icon?: LucideIcon;
}) {
  return (
    <Button type="submit" disabled={pending} size="lg" icon={icon} block>
      {pending ? "لحظة من فضلك…" : label}
    </Button>
  );
}

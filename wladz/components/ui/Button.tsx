import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// Boutons CTA de tout le site, sur le modèle de la page d'accueil : pilule en relief,
// bande blanche qui balaie le bouton au survol, petite étoile et icône qui bouge
// (styles .wz-btn dans app/ui.css).

type Variant = "primary" | "secondary" | "danger" | "light" | "gold" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonStyle = {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  // Icône du côté du début du texte (à droite en arabe), par exemple pour « العودة ».
  iconPosition?: "start" | "end";
  block?: boolean;
  className?: string;
};

function buttonClass(
  { variant = "primary", size = "md", iconPosition = "end", block, className = "" }: ButtonStyle,
  iconOnly: boolean,
) {
  return [
    "wz-btn",
    `wz-btn--${variant}`,
    `wz-btn--${size}`,
    iconOnly ? "wz-btn--icon-only" : `wz-btn--icon-${iconPosition}`,
    block ? "wz-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function Spark() {
  return (
    <svg className="wz-btn-spark" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 1 2.8 7.6L23 12l-8.2 3.4L12 23l-2.8-7.6L1 12l8.2-3.4L12 1Z" fill="currentColor" />
    </svg>
  );
}

function ButtonContent({
  icon: Icon,
  iconPosition = "end",
  children,
}: {
  icon?: LucideIcon;
  iconPosition?: "start" | "end";
  children?: ReactNode;
}) {
  const iconOnly = children == null;
  const icon = Icon ? (
    <span className={iconOnly ? "wz-btn-glyph" : "wz-btn-icon"} aria-hidden="true">
      <Icon strokeWidth={2.4} />
    </span>
  ) : null;

  return (
    <>
      <span className="wz-btn-sweep" aria-hidden="true" />
      {iconPosition === "start" ? icon : null}
      {iconOnly ? null : <span className="wz-btn-label">{children}</span>}
      {iconPosition === "end" ? icon : null}
      <Spark />
    </>
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  icon,
  iconPosition,
  block,
  className,
  children,
  ...linkProps
}: ButtonStyle & { href: string; children?: ReactNode } & Omit<
    ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >) {
  return (
    <Link
      href={href}
      className={buttonClass({ variant, size, iconPosition, block, className }, children == null)}
      {...linkProps}
    >
      <ButtonContent icon={icon} iconPosition={iconPosition}>
        {children}
      </ButtonContent>
    </Link>
  );
}

export function Button({
  variant,
  size,
  icon,
  iconPosition,
  block,
  className,
  children,
  type = "button",
  ...buttonProps
}: ButtonStyle & Omit<ComponentProps<"button">, "className">) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, iconPosition, block, className }, children == null)}
      {...buttonProps}
    >
      <ButtonContent icon={icon} iconPosition={iconPosition}>
        {children}
      </ButtonContent>
    </button>
  );
}

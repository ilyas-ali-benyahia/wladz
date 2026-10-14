import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "./Icon";

export default function FunButton({ href, children, variant = "primary", className = "" }: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const content = <><span className="button-sweep" aria-hidden="true" /><span>{children}</span><span className="button-icon"><Icon name={variant === "primary" ? "arrow" : "compass"} /></span><Icon name="spark" className="button-spark" /></>;
  const classes = `fun-button fun-button--${variant} ${className}`;
  return href.startsWith("#") ? <a href={href} className={classes}>{content}</a> : <Link href={href} prefetch={false} className={classes}>{content}</Link>;
}

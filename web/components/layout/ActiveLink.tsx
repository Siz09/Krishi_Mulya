"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface ActiveLinkProps {
  href: string;
  className: string;
  activeClassName: string;
  children: ReactNode;
}

export default function ActiveLink({
  href,
  className,
  activeClassName,
  children,
}: ActiveLinkProps) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link href={href} className={`${className} ${active ? activeClassName : ""}`}>
      {children}
    </Link>
  );
}

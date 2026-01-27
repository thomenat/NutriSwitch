"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Icon(props: { name: "back" | "menu" | "close" }) {
  const common = "h-5 w-5";
  if (props.name === "back") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden="true">
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (props.name === "close") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden="true">
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isHome = pathname === "/";
  const showBack = !isHome;

  const shareHref = "/share/demo-plan-1";
  const links = useMemo(
    () => [
      { href: "/", label: "Home" },
      { href: "/plan", label: "Plan" },
      { href: shareHref, label: "Share link" },
    ],
    [],
  );

  useEffect(() => {
    // Close menu when route changes.
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--surface)]/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            {showBack ? (
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[var(--surface)] text-[color:var(--foreground)] hover:bg-[var(--surface-2)]"
                aria-label="Back to home"
              >
                <Icon name="back" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[var(--surface)] text-[color:var(--foreground)] hover:bg-[var(--surface-2)]"
                aria-label="Open menu"
              >
                <Icon name="menu" />
              </button>
            )}

            <Link href="/" className="ml-1 text-sm font-semibold tracking-tight">
              NutriSwitch
            </Link>
          </div>

          <nav className="hidden items-center gap-2 sm:flex">
            <Link className="ns-btn h-10 bg-[var(--surface)] px-4 text-sm hover:bg-[var(--surface-2)]" href="/plan">
              Open plan
            </Link>
            <Link className="ns-btn ns-btn-primary h-10 px-4 text-sm" href={shareHref}>
              Share link
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[var(--surface)] text-[color:var(--foreground)] hover:bg-[var(--surface-2)]"
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-[22px] border border-[color:var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3">
              <div className="text-sm font-semibold">Menu</div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid gap-2">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={clsx(
                      "flex items-center justify-between rounded-[16px] border border-[color:var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold",
                      pathname === l.href && "bg-[var(--surface)]",
                    )}
                  >
                    <span>{l.label}</span>
                    <span className="ns-muted" aria-hidden="true">
                      →
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-4 text-xs ns-muted">
                Tip: use the Share link to simulate the patient view.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


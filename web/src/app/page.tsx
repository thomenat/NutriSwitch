import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-5xl px-6 py-12">
        <header className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-5">
            <div className="inline-flex w-fit items-center gap-2 ns-chip text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-pink)]" />
              Nutritionist → patient meal plans
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-5xl">
              NutriSwitch
            </h1>

            <p className="ns-muted max-w-xl text-base leading-7">
              A React app where a nutritionist shares a plan and the patient can swap
              ingredients. The app automatically recalculates quantities and updates
              totals.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link className="ns-btn ns-btn-primary" href="/plan">
                Open demo plan
              </Link>
              <Link className="ns-btn bg-[var(--surface)] text-[color:var(--foreground)]" href="/share/demo-plan-1">
                Patient share link
              </Link>
            </div>

            <div className="ns-muted text-sm">
              Built with Next.js + Tailwind. Next: plan editing + real API.
            </div>
          </div>

          {/* “IG grid” inspired mosaic */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { bg: "from-[color:var(--accent-lemon)] to-[color:var(--accent-sky)]", label: "Fresh & tasty" },
              { bg: "from-[color:var(--accent-pink)] to-[color:var(--accent-lemon)]", label: "Smoothie day" },
              { bg: "from-[color:var(--accent-mint)] to-[color:var(--accent-sky)]", label: "Bowl ideas" },
              { bg: "from-[color:var(--accent-lilac)] to-[color:var(--accent-pink)]", label: "Swap this" },
              { bg: "from-[color:var(--accent-sky)] to-[color:var(--accent-lemon)]", label: "Did you know?" },
              { bg: "from-[color:var(--accent-lemon)] to-[color:var(--accent-mint)]", label: "Recipes" },
            ].map((t, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-[22px] border border-[color:var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${t.bg}`} />
                <div className="absolute inset-0 opacity-[0.18]">
                  <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white" />
                  <div className="absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-white" />
                </div>
                <div className="relative flex h-full flex-col justify-between p-3">
                  <div className="ns-chip w-fit bg-white/70 text-[11px] font-semibold text-zinc-900">
                    Tile {i + 1}
                  </div>
                  <div className="text-[12px] font-semibold tracking-tight text-zinc-900">
                    {t.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </header>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="ns-card ns-blob p-5">
            <div className="text-sm font-semibold">Swap modal + preview</div>
            <p className="ns-muted mt-1 text-sm">
              Patient sees before/after grams and totals before confirming.
            </p>
          </div>
          <div className="ns-card ns-blob p-5">
            <div className="text-sm font-semibold">Recipes per meal</div>
            <p className="ns-muted mt-1 text-sm">
              Each meal is made of 3+ recipes, closer to real practice.
            </p>
          </div>
          <div className="ns-card ns-blob p-5">
            <div className="text-sm font-semibold">Shareable link</div>
            <p className="ns-muted mt-1 text-sm">
              Nutritionist can send a patient URL (demo: <code>/share/demo-plan-1</code>).
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-100">
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">NutriSwitch</h1>
          <p className="max-w-2xl text-zinc-700">
            A React app for meal plans where patients can swap ingredients and the
            quantities update automatically.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Start here</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Open the demo plan and try swapping ingredients while preserving calories
            (or protein/carbs/fat).
          </p>
          <div className="mt-4">
            <Link
              className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              href="/plan"
            >
              Open demo plan
            </Link>
          </div>
        </section>

        <section className="text-sm text-zinc-600">
          <p>
            Next steps we’ll build: better substitution UX, plan editing, and later an
            API-backed ingredient database.
          </p>
        </section>
      </main>
    </div>
  );
}

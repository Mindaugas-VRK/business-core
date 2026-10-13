import Link from "next/link";
import { modules } from "@/modules/registry";

export default function Home() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Apps</h1>
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {modules.map((m) => (
          <li key={m.id}>
            <Link
              href={m.href}
              className="flex h-full flex-col items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span
                aria-hidden
                className={`flex size-12 items-center justify-center rounded-xl text-sm font-semibold text-white ${m.color}`}
              >
                {m.initials}
              </span>
              <span className="font-medium">{m.name}</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{m.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

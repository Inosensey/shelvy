import Link from "next/link";

const STACK = ["NestJS", "Next.js", "PostgreSQL", "Prisma", "Stripe", "Claude"];

export function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-8 sm:py-28">
      <h1 className="font-display text-4xl leading-tight text-linen sm:text-5xl">
        Inventory management,
        <br />
        <span className="italic text-clay">without the spreadsheet.</span>
      </h1>

      <p className="mx-auto mt-5 max-w-xl text-linen/60">
        Multi-tenant stock tracking with a full audit trail, low-stock alerts, and
        AI-generated product descriptions -- built for teams that outgrew manual counts.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/register"
          className="rounded-md bg-clay px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-clay/90"
        >
          Get started free
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-linen/20 px-6 py-2.5 text-sm font-medium text-linen transition-colors hover:bg-linen/5"
        >
          Sign in
        </Link>
      </div>

      <ul className="mx-auto mt-12 flex max-w-lg flex-wrap items-center justify-center gap-2">
        {STACK.map((tech) => (
          <li
            key={tech}
            className="rounded-full border border-linen/10 px-3 py-1 text-xs text-linen/45"
          >
            {tech}
          </li>
        ))}
      </ul>
    </section>
  );
}

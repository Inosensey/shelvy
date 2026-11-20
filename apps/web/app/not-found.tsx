import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 text-center text-linen">
      <p className="text-sm uppercase tracking-widest text-clay">Error 404</p>
      <h1 className="font-display  text-4xl sm:text-5xl">This shelf is empty</h1>
      <p className="max-w-md text-linen/70">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-clay px-5 py-2.5 font-medium text-ink hover:opacity-90"
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-linen/20 px-5 py-2.5 hover:bg-surface"
        >
          Home
        </Link>
      </div>
    </main>
  );
}

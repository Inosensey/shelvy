import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-linen/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" className="font-display text-xl italic text-linen">
          Shelvy
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-linen/70 sm:flex">
          <a href="#features" className="transition-colors hover:text-linen">
            Features
          </a>
          <a href="#pricing" className="transition-colors hover:text-linen">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-linen/70 transition-colors hover:text-linen">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-clay px-4 py-2 font-medium text-ink transition-colors hover:bg-clay/90"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

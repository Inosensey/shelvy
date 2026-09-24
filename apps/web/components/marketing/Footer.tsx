import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-linen/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-linen/45 sm:flex-row sm:px-8">
        <span className="font-display italic text-linen/70">Shelvy</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="transition-colors hover:text-linen">
            Sign in
          </Link>
          <Link href="/register" className="transition-colors hover:text-linen">
            Get started
          </Link>
        </div>
        <span>&copy; {new Date().getFullYear()} Shelvy.</span>
      </div>
    </footer>
  );
}

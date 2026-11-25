import type { Metadata } from "next";

export const metadata: Metadata = { title: "Stock Movements" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

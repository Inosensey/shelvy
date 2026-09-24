import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Subscription | Shelvy',
  description: 'Manage your Shelvy subscription — view your current plan, upgrade, or review your billing history.',
}

export default function subscriptionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen relative">
      <div className="w-full phone:pt-0 mdphone:pt-12">{children}</div>
    </div>
  );
}

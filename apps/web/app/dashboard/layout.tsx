import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard | Shelvy',
  description: 'Overview of your inventory — stock levels, recent movements, low stock alerts, and quick actions.',
}

export default function dashboardLayout({
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

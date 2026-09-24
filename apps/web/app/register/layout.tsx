import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Create Account | Shelvy',
  description: 'Get started with Shelvy. Choose a plan and create your account to start managing your inventory smarter.',
}

export default function onboardingLayout({
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

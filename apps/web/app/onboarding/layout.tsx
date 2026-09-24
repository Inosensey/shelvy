import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Set Up Your Account | Shelvy',
  description: 'Complete your profile and set up your organization to get the most out of Shelvy.',
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

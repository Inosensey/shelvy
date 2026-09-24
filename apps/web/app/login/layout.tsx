import type { Metadata } from "next";


export const metadata: Metadata = {
  title: 'Sign In | Shelvy',
  description: 'Sign in to your Shelvy account to manage your inventory, team, and suppliers.',
}

export default function loginLayout({
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

import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { Toaster } from "sonner";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Home",
  description: "Shelvy - Inventory Management done easy.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <NextTopLoader color="#dcd7c9" showSpinner={true} />
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: "!bg-surface !border !border-linen/10 !text-linen",
              title: "!text-linen",
              description: "!text-linen/60",
              success: "!text-clay",
              error: "!text-red-400",
            },
          }}
        />
      </body>
    </html>
  );
}

import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PWARegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "Hisabo",
  description: "Aapka Business Ka Hisabo - Simple ledger for your business",
  icons: [
    { rel: "icon", url: "/icons/icon-192.svg" },
    { rel: "apple-touch-icon", url: "/icons/icon-512.svg" }
  ],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F97316",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 text-gray-900 antialiased">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}

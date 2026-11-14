import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import QueryProvider from "@/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://catako.site'),
  title: "Alinue - Wall of Portfolios",
  description: "Share and discover designer portfolios and creative works",
  icons: {
    icon: [
      { url: "/logos/LogoAlinue.png" },
      { url: "/logos/LogoAlinue.png", sizes: "192x192", type: "image/png" },
      { url: "/logos/LogoAlinue.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logos/LogoAlinue.png",
    apple: [
      { url: "/logos/LogoAlinue.png" },
    ],
  },
  openGraph: {
    title: "Alinue - Wall of Portfolios",
    description: "Share and discover designer portfolios and creative works",
    url: "/",
    siteName: "Alinue",
    images: [
      {
        url: "/logos/LogoAlinue.png",
        width: 784,
        height: 756,
        alt: "Alinue Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alinue - Wall of Portfolios",
    description: "Share and discover designer portfolios and creative works",
    images: ["/logos/LogoAlinue.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <QueryProvider>
          <Suspense fallback={null}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </QueryProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Membrane | Build Your Trading Intuition",
  description: "Master market making and trading strategies through interactive games with AI-powered feedback. Perfect for aspiring traders and curious minds.",
  keywords: ["trading", "market making", "trading intuition", "quantitative trading", "trading games", "trading education"],
  authors: [{ name: "Membrane" }],
  openGraph: {
    title: "Membrane | Build Your Trading Intuition",
    description: "Master market making and trading strategies through interactive games with AI-powered feedback.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Membrane | Build Your Trading Intuition",
    description: "Master market making and trading strategies through interactive games with AI-powered feedback.",
  },
  icons: {
    icon: '/fav.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

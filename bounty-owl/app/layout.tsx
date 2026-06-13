import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/layout/PwaRegister";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Bounty Owl - AI賞金ハンター",
    template: "%s | Bounty Owl",
  },
  description: "世界中のコンテスト・公募・ハッカソンをAIが分析。あなたの勝率・期待収益を予測します。",
  keywords: ["コンテスト", "公募", "ハッカソン", "賞金", "AI分析", "小説賞", "イラスト"],
  authors: [{ name: "Bounty Owl" }],
  creator: "Bounty Owl",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bounty Owl",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Bounty Owl",
    title: "Bounty Owl - AI賞金ハンター",
    description: "世界中のコンテスト・公募・ハッカソンをAIが分析",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bounty Owl - AI賞金ハンター",
    description: "世界中のコンテスト・公募・ハッカソンをAIが分析",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F59E0B" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A2E" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:4178";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title: "みえのものさし｜三重県のイベントを参加条件で探す",
    description:
      "日付、地域、料金、年齢、予約条件から、三重県のイベントを比べる企画検討用モック。",
    openGraph: {
      title: "みえのものさし",
      description: "今度の休み、どこまで行こう。三重県のイベントを参加条件で比べる。",
      images: [{ url: "/og.png", width: 1732, height: 909, alt: "みえのものさし" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "みえのものさし",
      description: "今度の休み、どこまで行こう。三重県のイベントを参加条件で比べる。",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={geistMono.variable}>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { sitePath } from "./site-path";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Where the site is served from, fixed at build time.
 *
 * This used to be read from the request headers, but any use of `headers()` makes
 * vinext classify the route as dynamic, and the static export then skips it —
 * which left the GitHub Pages build with nothing but a 404 page. A canonical URL
 * is also the right thing for og: tags regardless.
 */
const siteUrl = process.env.SITE_URL ?? "https://aratama-ship-it.github.io/mie-event-monosashi";


export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: "みえのものさし｜三重県のイベントを参加条件で探す",
    description:
      "日付、地域、料金、年齢、予約条件から、三重県のイベントを比べる。掲載はすべて主催者・自治体などの一次資料で確認しています。",
    openGraph: {
      title: "みえのものさし",
      description: "今度の休み、どこまで行こう。三重県のイベントを参加条件で比べる。",
      images: [{ url: sitePath("/og.png"), width: 1732, height: 909, alt: "みえのものさし" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "みえのものさし",
      description: "今度の休み、どこまで行こう。三重県のイベントを参加条件で比べる。",
      images: [sitePath("/og.png")],
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
      <body
        className={geistMono.variable}
        style={
          {
            "--mie-silhouette-url": `url("${sitePath("/mie-silhouette.svg")}")`,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}

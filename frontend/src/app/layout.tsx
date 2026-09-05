import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoLRankupLab - ソロランク勝率向上・対面対策特化ラボ",
  description: "League of Legends ソロランクの勝率向上と対面対策・客観ギャップ分析に特化したアナリティクスプラットフォーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

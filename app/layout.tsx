import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "银城状元星 · 三年级2班成长空间",
  description: "一起读书、探索与创造，记录三年级2班的每一次成长。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/star.svg",
    shortcut: "/star.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}

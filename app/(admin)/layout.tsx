import type { Metadata, Viewport } from "next";
import "@/styles/admin.css";
import AdminShell from "@/components/admin/shell";

export const metadata: Metadata = { title: "لوحة التحكم | كي بلس", robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: "#0B2545" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar-EG" dir="rtl">
      <head>
        <link rel="icon" href="/assets/favicon.png" type="image/png" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&display=swap" />
      </head>
      <body><AdminShell>{children}</AdminShell></body>
    </html>
  );
}

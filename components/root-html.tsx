import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import "@/styles/site.css";

// Self-hosted at build time: no render-blocking request to fonts.googleapis.com.
const plexAr = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], display: "swap", variable: "--font-ar" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "800"], display: "swap", variable: "--font-en" });

export default function RootHtml({ lang, children }: { lang: "ar" | "en"; children: React.ReactNode }) {
  return (
    <html lang={lang + "-EG"} dir={lang === "ar" ? "rtl" : "ltr"} className={`${plexAr.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" href="/assets/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}

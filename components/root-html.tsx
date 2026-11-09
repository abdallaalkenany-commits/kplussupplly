import "@/styles/site.css";

export default function RootHtml({ lang, children }: { lang: "ar" | "en"; children: React.ReactNode }) {
  return (
    <html lang={lang + "-EG"} dir={lang === "ar" ? "rtl" : "ltr"}>
      <head>
        <link rel="icon" href="/assets/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&family=Inter:wght@400;600;800&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}

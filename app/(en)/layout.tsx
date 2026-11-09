import type { Metadata, Viewport } from "next";
import RootHtml from "@/components/root-html";
import { D } from "@/lib/content";

export const metadata: Metadata = { metadataBase: new URL(D) };
export const viewport: Viewport = { themeColor: "#0B2545", colorScheme: "only light" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootHtml lang="en">{children}</RootHtml>;
}

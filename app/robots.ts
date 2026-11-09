import type { MetadataRoute } from "next";
import { D } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/account/", "/en/account/"] }], sitemap: D + "/sitemap.xml" };
}

import type { Metadata } from "next";
import { Shell } from "@/components/site";
import Account from "@/components/account";

export const metadata: Metadata = { title: "حسابي | كي بلس", robots: { index: false } };

export default function Page() {
  return <Shell lang="ar" slug="account"><Account lang="ar" /></Shell>;
}

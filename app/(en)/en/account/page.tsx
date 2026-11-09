import type { Metadata } from "next";
import { Shell } from "@/components/site";
import Account from "@/components/account";

export const metadata: Metadata = { title: "My account | K Plus", robots: { index: false } };

export default function Page() {
  return <Shell lang="en" slug="account"><Account lang="en" /></Shell>;
}

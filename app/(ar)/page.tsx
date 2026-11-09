import { SitePage, pageMeta } from "@/components/pages";

export const revalidate = 300;
export const metadata = pageMeta("ar");

export default function Page() {
  return <SitePage lang="ar" />;
}

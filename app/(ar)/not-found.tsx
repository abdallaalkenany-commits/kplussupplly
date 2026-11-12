import { CatCards, Shell } from "@/components/site";
import { T } from "@/lib/content";
import { getSiteCats } from "@/lib/cats";

export default async function NotFound() {
  const t = T.ar;
  const cats = (await getSiteCats()).ar;
  return (
    <Shell lang="ar" slug="" menu={cats.menu} footerCats={cats.all}>
      <section className="phero"><div className="wrap"><div><h1>{t.nf_h}</h1><p className="lead">{t.nf_p}</p></div></div></section>
      <section className="wrap"><CatCards lang="ar" cats={cats.top} /></section>
    </Shell>
  );
}

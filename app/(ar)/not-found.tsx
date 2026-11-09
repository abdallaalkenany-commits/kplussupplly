import { CatCards, Shell } from "@/components/site";
import { T, TOP } from "@/lib/content";

export default function NotFound() {
  const t = T.ar;
  return (
    <Shell lang="ar" slug="">
      <section className="phero"><div className="wrap"><div><h1>{t.nf_h}</h1><p className="lead">{t.nf_p}</p></div></div></section>
      <section className="wrap"><CatCards lang="ar" cats={TOP} /></section>
    </Shell>
  );
}

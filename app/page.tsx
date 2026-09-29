import { Correspondence } from "@/components/Correspondence";
import { Desk } from "@/components/Desk";
import { envelope } from "@/content/letters/durrell-1978.envelope";
import { loadLetter } from "@/lib/letters";

export default async function Home() {
  const letter = await loadLetter("durrell-1978");
  const { from, to, dateline } = letter.meta;

  return (
    <Desk caption={`${from} to ${to} · ${dateline}`}>
      <Correspondence letter={letter} envelope={envelope} />
    </Desk>
  );
}

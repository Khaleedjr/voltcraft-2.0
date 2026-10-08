import { notFound } from "next/navigation";
import { HomeV1 } from "@/components/home-v/v1";
import { HomeV2 } from "@/components/home-v/v2";
import { HomeV3 } from "@/components/home-v/v3";
import { HomeV4 } from "@/components/home-v/v4";
import { HomeV5 } from "@/components/home-v/v5";
import { VersionSwitcher, VERSIONS } from "@/components/home-v/switcher";
import { getHomeData } from "@/lib/home-data";

const PAGES = { 1: HomeV1, 2: HomeV2, 3: HomeV3, 4: HomeV4, 5: HomeV5 } as const;

export function generateStaticParams() {
  return VERSIONS.map((v) => ({ v: String(v.n) }));
}

export default async function PreviewVersion({ params }: PageProps<"/preview/[v]">) {
  const { v } = await params;
  const n = Number(v) as keyof typeof PAGES;
  const Version = PAGES[n];
  if (!Version) notFound();
  const d = await getHomeData();
  return (
    <>
      <Version d={d} />
      <VersionSwitcher current={n} />
      <div className="h-16" aria-hidden />
    </>
  );
}

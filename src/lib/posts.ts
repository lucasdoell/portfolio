import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"writing">;

/** Published posts, newest first. Drafts only show up in `astro dev`. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("writing", (p) => import.meta.env.DEV || !p.data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });
export const formatDate = (d: Date) => dateFmt.format(d);

/** Rough reading time at 230 words a minute. */
export function readingTime(body = "") {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 230));
}

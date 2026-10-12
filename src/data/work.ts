import { links } from "./links";

export type Link = { label: string; href: string; accent?: boolean };

export type Entry = {
  id: string;
  title: string;
  span: string;
  role: string;
  decision: string;
  body: string;
  facts: string[];
  links: Link[];
};

/** Logbook entries after Polaris, which has its own layout on the home page. */
export const entries: Entry[] = [
  {
    id: "sightline",
    title: "Parsertime & Sightline",
    span: "2023 — Now",
    role: "Founder. Design and code.",
    decision: "Scrim stats for Overwatch teams.",
    body: "Parsertime turns scrim logs into stats for more than 2,000 players on 430 teams, and the code is open source. Sightline is what comes next: coaching tools for esports teams, now in private beta.",
    facts: ["21M+ stats tracked", "Open source"],
    links: [
      { label: "Case study →", href: "/work/sightline", accent: true },
      { label: "parsertime.app ↗", href: links.parsertime },
    ],
  },
  {
    id: "chatdca",
    title: "ChatDCA",
    span: "2025 — Now",
    role: "Team lead. NJ Department of Community Affairs.",
    decision: "An AI assistant for New Jersey state staff.",
    body: "Staff ask one assistant, and it hands the work to a specialist agent for data analysis, forms or writing. Built on Vercel's eve framework and AWS Bedrock, with any code an agent writes kept in a sandbox.",
    facts: ["Five agents", "eve · AWS Bedrock"],
    links: [{ label: "Case study →", href: "/work/chatdca", accent: true }],
  },
  {
    id: "eve",
    title: "eve, upstream",
    span: "Jul — Sep 2026",
    role: "Contributor. Vercel's agent framework.",
    decision: "Fixes to the framework I build on.",
    body: "Two pull requests to eve. One stops an agent from seeing Linear threads that belong to other agents. The other keeps a failed web search on Bedrock from taking down the whole request. Vercel's own follow-up took the same approach.",
    facts: [],
    links: [
      { label: "vercel/eve #1452 ↗", href: links.eve1452 },
      { label: "#1453 ↗", href: links.eve1453 },
    ],
  },
];

export type AlsoRow = { name: string; note: string; tag: string; href?: string };

export const also: AlsoRow[] = [
  {
    name: "blueseam",
    note: "Finds where two utilities plan power lines close enough to share the work. Built in one night.",
    tag: "ShellHacks 2026",
  },
  {
    name: "NJ Eviction Guide",
    note: "Plain-language tenant rights in English and Spanish, linked from court summonses.",
    tag: "NJ DCA · 2025",
  },
  {
    name: "next.js #98073",
    note: "Fixes an endless prefetch loop in parallel routes.",
    tag: "Open source",
    href: links.next98073,
  },
  {
    name: "Interpreter",
    note: "A small programming language, built twice: once in Go, once in Rust.",
    tag: "2023",
  },
  {
    name: "CaffTrack",
    note: "Snap a photo of a drink and log the caffeine. Won Best Software at Big Red Makeathon.",
    tag: "2025",
    href: "https://github.com/lucasdoell/cafftrack",
  },
];

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Launches empty on purpose: pages render an empty state until the first real post lands.
const writing = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/writing" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    topic: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing };

import { BentoBoxProjects } from "@/components/BentoBoxProjects";
import { FeaturedProjects } from "@/components/FeaturedProjects";

interface Project {
  title: string;
  subtitle: string;
  description: string;
  images?: string[]; // Optional images property
  caseStudyUrl: string;
  projectUrl: string;
}

const projects: Project[] = [
  {
    title: "Parsertime",
    subtitle: "November 2023-Present",
    description:
      "An open source, full-stack TypeScript Next.js web app for Overwatch players to track scrimmage stats, featuring team management and performance analytics. Documentation and support included.",
    images: ["/ptime_img1.png", "/ptime_img2.png", "/ptime_img3.png"],
    caseStudyUrl: "https://lux.dev/work/parsertime",
    projectUrl: "https://parsertime.app",
  },
  {
    title: "Cassini",
    subtitle: "January 2025-Present",
    description:
      "A comprehensive analytics and observability suite written in TypeScript and Go. Fully open source and self-hostable. Designed to be easy to use and extend.",
    images: [],
    caseStudyUrl: "https://lux.dev/work/cassini",
    projectUrl: "https://github.com/lucasdoell/cassini",
  },
  {
    title: "CaffTrack (Hackathon Project)",
    subtitle: "February 2025-Present",
    description:
      "Developed a caﬀeine tracking app in a three-person team for Cornell's Big Red Makeathon, using Vite, React, Django, Cloudflare R2, and Google Gemini. Awarded ”Best Software” for innovation and execution.",
    images: ["/cafftrack_1.png", "/cafftrack_2.png", "/cafftrack_3.png"],
    caseStudyUrl: "https://caffeine.lucasdoell.dev/",
    projectUrl: "https://github.com/lucasdoell/cafftrack",
  },
  {
    title: "OWL Bot",
    subtitle: "March 2023-July 2023",
    description:
      "Overwatch League data-fetching Discord bot using TypeScript, integrating web scraping and API microservices.",
    images: [],
    caseStudyUrl: "#",
    projectUrl: "https://github.com/lucasdoell/OWLbot",
  },
  {
    title: "Sports Stats Web Scraper",
    subtitle: "September 2022-December 2022",
    description:
      "During studies at Cornell, my partner and I developed an OCaml-based web scraper for sports statistics, focusing on command-line interaction and data parsing.",
    images: [],
    caseStudyUrl: "#",
    projectUrl: "https://github.com/lucasdoell/CS3110-scraping",
  },
];

export default function ProjectsSection() {
  return (
    <div>
      <FeaturedProjects projects={projects} />
      <BentoBoxProjects projects={projects} />
    </div>
  );
}

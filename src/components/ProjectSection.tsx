import { BentoBoxProjects } from "@/components/BentoBoxProjects";

interface Project {
  title: string;
  subtitle: string;
  description: string;
  images?: string[];
  caseStudyUrl: string;
  projectUrl: string;
}

const projects: Project[] = [
  {
    title: "Parsertime",
    subtitle: "November 2023-Present",
    description:
      "An open-source app for Overwatch 2 data visualization with over 800 users. Features custom analytics and team management, processing over 400,000 player kills and 700,000 player statistics across 150 teams.",
    images: ["/ptime_img1.png", "/ptime_img2.png", "/ptime_img3.png"],
    caseStudyUrl: "https://lux.dev/work/parsertime",
    projectUrl: "https://parsertime.app",
  },
  {
    title: "CaffTrack (Hackathon Project)",
    subtitle: "February 2025-February 2025",
    description:
      'Developed a caﬀeine tracking app in a three-person team for Cornell\'s Big Red Makeathon, using Vite, React, Django, Cloudflare R2, and Google Gemini. Awarded "Best Software" for innovation and execution.',
    images: ["/cafftrack_1.png", "/cafftrack_2.png", "/cafftrack_3.png"],
    caseStudyUrl: "#",
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
  return <BentoBoxProjects projects={projects} />;
}

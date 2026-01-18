interface Project {
  title: string;
  subtitle: string;
  description: string;
  images?: string[];
  caseStudyUrl: string;
  projectUrl: string;
}

interface BentoBoxProjectsProps {
  projects: Project[];
}

export function BentoBoxProjects({ projects }: BentoBoxProjectsProps) {
  return (
    <section className="py-24 max-w-5xl mx-auto px-8 xl:px-0" id="work">
      <h2 className="text-3xl font-bold text-gray-950 dark:text-gray-50 mb-12">
        Projects
      </h2>
      <div className="grid gap-8 sm:grid-cols-2">
        {projects.map((project, idx) => (
          <article
            key={idx}
            className="border border-gray-200 dark:border-gray-800 p-8 hover:border-gray-950 dark:hover:border-gray-50 focus-within:border-gray-950 dark:focus-within:border-gray-50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gray-950 dark:focus-within:outline-gray-50 transition-colors"
          >
            <h3 className="text-xl font-bold text-gray-950 dark:text-gray-50 mb-2">
              {project.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {project.subtitle}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              {project.description}
            </p>
            <div className="flex gap-6">
              {project.caseStudyUrl !== "#" && (
                <a
                  href={project.caseStudyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-700 dark:text-neutral-400 hover:text-gray-950 dark:hover:text-gray-50 transition-colors underline underline-offset-2 text-sm"
                >
                  Read case study →
                </a>
              )}
              {project.projectUrl !== "#" && (
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-700 dark:text-neutral-400 hover:text-gray-950 dark:hover:text-gray-50 transition-colors underline underline-offset-2 text-sm"
                >
                  View project ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="text-gray-600 dark:text-gray-400 text-center mt-8">
        See more of my work on my <a href="https://github.com/lucasdoell" target="_blank" rel="noreferrer" className="text-black dark:text-white">GitHub</a>.
      </div>
    </section>
  );
}

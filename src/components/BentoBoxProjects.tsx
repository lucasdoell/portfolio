// BentoBoxProjects.tsx

interface Project {
  title: string;
  subtitle: string;
  description: string;
  images?: string[]; // Optional images property
  caseStudyUrl: string;
  projectUrl: string;
}

interface BentoBoxProjectsProps {
  projects: Project[];
}

export function BentoBoxProjects({ projects }: BentoBoxProjectsProps) {
  // Filter projects that have no images.
  const noImageProjects = projects.filter(
    (project) => !project.images || project.images.length === 0
  );

  if (noImageProjects.length === 0) return null;

  return (
    <section className="py-12 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Other Projects
      </h2>
      <div className="mt-6 grid gap-4 sm:mt-8 lg:grid-cols-3 lg:grid-rows-2">
        {noImageProjects.map((project, idx) => {
          // When there are exactly 4 projects, apply custom grid placement.
          let gridClasses = "relative";
          if (noImageProjects.length === 4) {
            if (idx === 0) gridClasses = "relative lg:row-span-2";
            else if (idx === 1) gridClasses = "relative lg:row-start-1";
            else if (idx === 2)
              gridClasses = "relative lg:col-start-2 lg:row-start-2";
            else if (idx === 3) gridClasses = "relative lg:row-span-2";
          }
          return (
            <div
              key={idx}
              className={`${gridClasses} bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-6`}
            >
              <h3 className="text-xl font-bold text-white mb-2">
                {project.title}
              </h3>
              <p className="text-gray-400 mb-2">{project.subtitle}</p>
              <p className="text-gray-500 text-sm mb-4">
                {project.description}
              </p>
              <div className="flex gap-4">
                {project.caseStudyUrl !== "#" && (
                  <a
                    href={project.caseStudyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#094074] hover:text-blue-400 transition-colors text-sm inline-flex items-center"
                  >
                    Read case study
                    <svg
                      className="w-4 h-4 ml-1"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M6.5 3.5L11 8L6.5 12.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </a>
                )}
                {project.projectUrl !== "#" && (
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#094074] hover:text-blue-400 transition-colors text-sm inline-flex items-center"
                  >
                    View project
                    <svg
                      className="w-4 h-4 ml-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 17L17 7M17 7H8M17 7V16"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

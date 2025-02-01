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
    <section className="w-full max-w-5xl mx-auto px-8 xl:px-0 py-24">
      <h2 className="text-2xl font-bold text-white mb-6">Other Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {noImageProjects.map((project, idx) => (
          <div
            key={idx}
            className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-6"
          >
            <h3 className="text-xl font-bold text-white mb-2">
              {project.title}
            </h3>
            <p className="text-gray-400 mb-2">{project.subtitle}</p>
            <p className="text-gray-500 text-sm mb-4">{project.description}</p>
            <div className="flex gap-4">
              {project.caseStudyUrl !== "#" && (
                <a
                  href={project.caseStudyUrl}
                  className="text-[#094074] hover:text-blue-400 transition-colors text-sm inline-flex items-center"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read case study
                  <svg className="w-4 h-4 ml-1" viewBox="0 0 16 16" fill="none">
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
                  className="text-[#094074] hover:text-blue-400 transition-colors text-sm inline-flex items-center"
                  target="_blank"
                  rel="noreferrer"
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
        ))}
      </div>
    </section>
  );
}

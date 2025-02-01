import EmblaCarouselWrapper from "./ui/carousel-wrapper";

interface Project {
  title: string;
  subtitle: string;
  description: string;
  images: string[];
  caseStudyUrl: string;
  projectUrl: string;
}

interface FeaturedProjectsProps {
  className?: string;
}

const projects: Project[] = [
  {
    title: "Parsertime",
    subtitle: "A data analytics platform for Overwatch players",
    description:
      "Parsertime is a data analytics platform for Overwatch players. It helps users improve their performance by providing insights into their gameplay.",
    images: ["/ptime_img1.png", "/ptime_img2.png", "/ptime_img3.png"],
    caseStudyUrl: "https://lux.dev/work/parsertime",
    projectUrl: "https://parsertime.app",
  },
  {
    title: "Data Visualization Platform",
    subtitle: "Building Interactive Analytics",
    description:
      "Creating intuitive interfaces for complex data analysis, making information accessible and actionable.",
    images: ["/project-2.jpg", "/project-2-2.jpg"],
    caseStudyUrl: "#",
    projectUrl: "#",
  },
];

function FeaturedProjects({ className }: FeaturedProjectsProps) {
  return (
    <section
      className={`w-full max-w-5xl mx-auto px-8 xl:px-0 py-24 ${
        className || ""
      }`}
      id="work"
    >
      <h2 className="text-2xl font-bold text-white mb-12">Featured Projects</h2>

      <div className="flex flex-col gap-12">
        {projects.map((project, idx) => (
          <article
            key={idx}
            className="group relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden"
          >
            {/* Carousel section with responsive horizontal padding */}
            <div className="mb-6 px-0 pt-0 lg:pt-6 lg:px-6">
              <EmblaCarouselWrapper images={project.images} />
            </div>

            {/* Text content container with responsive padding */}
            <div className="p-4 lg:p-6">
              <h3 className="text-xl font-bold text-white mb-1">
                {project.title}
              </h3>
              <p className="text-gray-400 mb-2">{project.subtitle}</p>
              <p className="text-gray-500 text-sm mb-6">
                {project.description}
              </p>
              <div className="flex gap-6">
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
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FeaturedProjects;

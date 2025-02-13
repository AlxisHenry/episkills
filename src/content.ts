type Grade = "A" | "B" | "C" | "D" | "Failed" | null;

type Project = {
  id: number;
  code: string;
  name: string;
  grade: Grade;
  acquired: number;
  max: number;
  modules?: Module[];
};

type Module = {
  name: string;
  acquired: number;
  max: number;
  projects?: Project[];
};

const formatProjectTitle = (
  title: string
): {
  code: string;
  name: string;
} => {
  const [code, ...name] = title.split(" - ");
  return {
    code,
    name: name.join(" "),
  };
};

const formatModuleName = (name: string): string => {
  return name?.split(". ")[1];
};

const createCompetenciesNavigation = () => {
  const nav = document.querySelector(".nav.nav-tabs");
  const competenciesTab = document.createElement("li");
  competenciesTab.classList.add("nav-item");
  const competenciesLink = document.createElement("span");
  competenciesLink.classList.add("nav-link");
  competenciesLink.textContent = "Competencies";
  competenciesLink.setAttribute("data-content-tab", "competencies");
  competenciesTab.appendChild(competenciesLink);
  nav?.appendChild(competenciesTab);

  const tabContent = document.querySelector(".tab-content");
  const competenciesContent = document.createElement("div");
  competenciesContent.classList.add("tab-pane");
  competenciesContent.id = "competencies";
  tabContent?.appendChild(competenciesContent);

  competenciesTab.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });
    document.querySelectorAll(".tab-pane").forEach((tab) => {
      tab.classList.remove("active");
    });
    competenciesContent.classList.add("active");
    competenciesLink.classList.add("active");
  });
};

const extractProjectsAndModules = (): {
  projects: Project[];
  modules: Module[];
} => {
  const projects: Project[] = [];
  const modules: Module[] = [];

  document.querySelectorAll(".projects-details").forEach((p) => {
    const summary = p
      .querySelector(".projects-summary")
      ?.cloneNode(true) as HTMLElement;
    summary?.querySelectorAll("small").forEach((small) => small.remove());
    const title = summary?.textContent;
    const link = p.querySelector(".courseInfo a")?.getAttribute("href");

    if (!title || !link) return;

    const id = +link.split("=")[1];
    const { code, name } = formatProjectTitle(title);
    const grade = (p
      .querySelector(".projects-summary small")
      ?.textContent?.trim()
      ?.split(" ")[1] || null) as Grade;

    const project: Project = {
      id,
      code,
      name,
      grade,
      acquired: 0,
      max: 0,
      modules: [],
    };

    projects.push(project);

    const table = p.querySelector(".chart-output-htmltable");

    if (!table) return;

    const rows = Array.from(table.querySelectorAll("tr")).slice(1);

    const currentModules: Module[] = rows
      .map((row) => {
        const module = row.querySelector("th");
        const [acquired, max] = row.querySelectorAll("td");

        if (!module) return undefined;

        return {
          name: formatModuleName(module?.textContent || ""),
          acquired: +(acquired?.textContent || 0),
          max: +(max?.textContent || 0),
        };
      })
      .filter((module): module is Module => module !== undefined);

    currentModules.forEach((module) => {
      project.acquired += module.acquired;
      project.max += module.max;

      if (!modules.find((m) => m.name === module.name)) {
        modules.push({
          ...module,
          projects: [project],
        });
      } else {
        const currentModule = modules.find((m) => m.name === module.name);

        if (
          currentModule &&
          !currentModule.projects?.find((p) => p.id === project.id)
        ) {
          currentModule.acquired += module.acquired;
          currentModule.max += module.max;
          currentModule.projects?.push(project);
        }
      }
    });

    project.modules?.push(...currentModules);
  });

  return {
    projects,
    modules,
  };
};

const createModuleChart = (module: Module) => {
  if (module.max === 0) return;

  const chart = document.createElement("div");
  chart.classList.add("module-chart");
  chart.classList.add("mb-3");

  const title = document.createElement("h3");
  title.setAttribute("style", "display: flex; justify-content: space-between;");
  title.textContent = `${module.name}`;
  const small = document.createElement("small");
  small.classList.add("text-muted");
  small.textContent = `(${module.acquired}/${module.max})`;
  title.appendChild(small);
  chart.appendChild(title);

  const progress = document.createElement("div");
  progress.classList.add("progress");

  const bar = document.createElement("div");
  bar.classList.add("progress-bar");

  const percentage = (module.acquired / module.max) * 100;

  bar.style.width = `${percentage}%`;
  bar.textContent = `${Math.round(percentage)}%`;
  progress.appendChild(bar);

  chart.appendChild(progress);

  const details = document.createElement("details");
  details.classList.add("py-2", "projects-details");
  const summary = document.createElement("summary");
  summary.classList.add("projects-summary");
  summary.textContent = "Projects";
  details.appendChild(summary);
  const projects = document.createElement("div");
  projects.classList.add("p-2", "flex-project");
  module.projects?.forEach((project) => {
    const projectElement = document.createElement("div");
    projectElement.classList.add("project", "mb-2");
    projectElement.setAttribute(
      "style",
      "display: flex; justify-content: space-between;"
    );
    projectElement.textContent = `${project.code} - ${project.name}`;
    const small = document.createElement("small");
    const currentModule = project.modules?.find((m) => m.name === module.name);
    small.classList.add("text-muted");
    small.textContent = `(${currentModule?.acquired}/${currentModule?.max})`;
    projectElement.appendChild(small);
    projects.appendChild(projectElement);
  });
  details.appendChild(projects);
  chart.appendChild(details);

  return chart;
};

const createCharts = (modules: Module[], projects: Project[]) => {
  const competenciesContent = document.querySelector("#competencies");
  competenciesContent?.classList.add("p-3");

  const chart = document.createElement("div");
  chart.classList.add("module-chart");
  const acquired = modules.reduce((acc, module) => acc + module.acquired, 0);
  const max = modules.reduce((acc, module) => acc + module.max, 0);
  const percentage = (acquired / max) * 100;
  const title = document.createElement("h3");
  title.setAttribute("style", "display: flex; justify-content: space-between;");
  title.textContent = "General";
  const small = document.createElement("small");
  small.classList.add("text-muted");
  small.textContent = `(${acquired}/${max})`;
  title.appendChild(small);
  chart.appendChild(title);
  const progress = document.createElement("div");
  progress.classList.add("progress");
  const bar = document.createElement("div");
  bar.classList.add("progress-bar");
  bar.style.width = `${percentage}%`;
  bar.textContent = `${Math.round(percentage)}%`;
  progress.appendChild(bar);
  chart.appendChild(progress);
  competenciesContent?.appendChild(chart);

  const details = document.createElement("details");
  details.classList.add("py-2", "mb-3", "projects-details");
  const summary = document.createElement("summary");
  summary.classList.add("projects-summary");
  summary.textContent = "Projects";
  details.appendChild(summary);
  const projectsDiv = document.createElement("div");
  projectsDiv.classList.add("p-2", "flex-project");
  projects?.forEach((project) => {
    if (project?.modules?.length === 0 || project.max === 0) return;

    const projectElement = document.createElement("div");
    projectElement.classList.add("project", "mb-2");
    projectElement.setAttribute(
      "style",
      "display: flex; justify-content: space-between;"
    );
    projectElement.textContent = `${project.code} - ${project.name}`;
    const small = document.createElement("small");
    small.classList.add("text-muted");
    small.textContent = `(${project.acquired}/${project.max})`;
    projectElement.appendChild(small);
    projectsDiv.appendChild(projectElement);
  });
  details.appendChild(projectsDiv);
  competenciesContent?.appendChild(details);

  modules.forEach((module) => {
    const chart = createModuleChart(module);
    if (!chart) return;
    competenciesContent?.appendChild(chart);
  });
};

const main = () => {
  createCompetenciesNavigation();

  setTimeout(() => {
    const { projects, modules } = extractProjectsAndModules();

    if (modules.length === 0 || projects.length === 0) return;

    createCharts(modules, projects);
  }, 500);
};

main();

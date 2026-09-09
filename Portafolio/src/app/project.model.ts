export interface ProjectTechnologies {
  frontend: string[];
  backend: string[];
  database: string[];
  mobile: string[];
  infrastructure: string[];
  tools: string[];
}

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  type: string[];
  technologies: ProjectTechnologies;
  features: string[];
  technicalHighlights: string[];
  architecture: string;
  role: string;
  repository: string;
  applications: ProjectLink[];
  coverImage?: string;
  screenshots: string[];
  status: 'documented' | string;
  generatedAt: string;
}

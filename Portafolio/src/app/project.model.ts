export interface ProjectTechnologies {
  frontend: string[];
  backend: string[];
  database: string[];
  mobile: string[];
  infrastructure: string[];
  tools: string[];
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
  coverImage?: string;
  screenshots: string[];
  status: 'documented' | string;
  generatedAt: string;
}

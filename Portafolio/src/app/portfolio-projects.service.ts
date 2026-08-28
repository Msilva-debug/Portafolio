import { Injectable } from '@angular/core';
import { EMPTY_PORTFOLIO_CONFIG, PORTFOLIO_CONFIG_URL, PortfolioConfig, ResolvedPortfolioConfig } from './portfolio.config';
import { Project, ProjectTechnologies } from './project.model';

type RawProject = Partial<Omit<Project, 'technologies' | 'screenshots'>> & {
  technologies?: Partial<ProjectTechnologies>;
  stack?: string[];
  screenshots?: ScreenshotManifest;
};
type ScreenshotManifest = string[] | {
  backend?: string[];
  frontend?: string[];
  screenshots?: string[];
};
@Injectable({ providedIn: 'root' })
export class PortfolioProjectsService {
  async loadProjects(): Promise<Project[]> {
    const config = await this.loadConfig();
    if (!config.projectsBaseUrl || config.projectSlugs.length === 0) {
      return [];
    }

    const projects = await Promise.all(config.projectSlugs.map((slug) => this.loadProject(slug, config.projectsBaseUrl)));

    return projects
      .filter((project): project is Project => Boolean(project))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async loadConfig(): Promise<ResolvedPortfolioConfig> {
    try {
      const response = await fetch(PORTFOLIO_CONFIG_URL, { cache: 'no-store' });

      if (!response.ok) {
        return EMPTY_PORTFOLIO_CONFIG;
      }

      const config = await response.json() as PortfolioConfig;

      return {
        projectsBaseUrl: config.projectsBaseUrl?.trim() || EMPTY_PORTFOLIO_CONFIG.projectsBaseUrl,
        projectSlugs: this.asStringArray(config.projectSlugs),
      };
    } catch (error) {
      console.warn('No se pudo cargar la configuracion publica del portafolio.', error);
      return EMPTY_PORTFOLIO_CONFIG;
    }
  }

  async resolvePortfolioAsset(path: string): Promise<string> {
    const config = await this.loadConfig();

    if (!config.projectsBaseUrl) {
      return path.replace(/^\/+/, '');
    }

    return this.assetUrl(config.projectsBaseUrl, path);
  }

  private async loadProject(slug: string, projectsBaseUrl: string): Promise<Project | null> {
    try {
      const response = await fetch(this.assetUrl(projectsBaseUrl, slug, 'project.json'));

      if (!response.ok) {
        throw new Error(`Project ${slug} failed: ${response.status}`);
      }

      return this.normalizeProject(await response.json() as RawProject, slug, projectsBaseUrl);
    } catch (error) {
      console.warn(`No se pudo cargar el proyecto ${slug}`, error);
      return null;
    }
  }

  private async normalizeProject(project: RawProject, slug: string, projectsBaseUrl: string): Promise<Project> {
    const screenshots = this.normalizeScreenshots(projectsBaseUrl, slug, project.screenshots);

    return {
      slug: project.slug || slug,
      name: project.name || slug,
      shortDescription: project.shortDescription || project.description || 'Proyecto sin descripcion corta.',
      description: project.description || project.shortDescription || 'Proyecto sin descripcion.',
      type: this.asStringArray(project.type),
      technologies: this.normalizeTechnologies(project),
      features: this.asStringArray(project.features),
      technicalHighlights: this.asStringArray(project.technicalHighlights),
      architecture: project.architecture || '',
      role: project.role || '',
      repository: project.repository || '',
      coverImage: this.resolveProjectPath(projectsBaseUrl, slug, project.coverImage || 'public/project.svg'),
      screenshots,
      status: project.status || 'documented',
      generatedAt: project.generatedAt || '',
    };
  }

  private normalizeTechnologies(project: RawProject): ProjectTechnologies {
    const source = project.technologies ?? {};

    return {
      frontend: this.asStringArray(source.frontend),
      backend: this.asStringArray(source.backend),
      database: this.asStringArray(source.database),
      mobile: this.asStringArray(source.mobile),
      infrastructure: this.asStringArray(source.infrastructure),
      tools: this.asStringArray(source.tools ?? project.stack),
    };
  }

  private normalizeScreenshots(projectsBaseUrl: string, slug: string, manifest: ScreenshotManifest | undefined): string[] {
    const screenshots = Array.isArray(manifest)
      ? manifest.map((path) => this.resolveScreenshotPath(projectsBaseUrl, slug, path))
      : [
          ...this.asStringArray(manifest?.backend).map((path) => this.resolveScreenshotPath(projectsBaseUrl, slug, `backend/${path}`)),
          ...this.asStringArray(manifest?.frontend).map((path) => this.resolveScreenshotPath(projectsBaseUrl, slug, `frontend/${path}`)),
          ...this.asStringArray(manifest?.screenshots).map((path) => this.resolveScreenshotPath(projectsBaseUrl, slug, path)),
        ];

    return screenshots.filter((path) => /\.(png|jpe?g|webp|gif|avif)$/i.test(path));
  }

  private resolveScreenshotPath(projectsBaseUrl: string, slug: string, path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const normalizedPath = path
      .replace(/^\/+/, '')
      .replace(/^\.portfolio\//, '')
      .replace(/^screenshots\//, '');

    return this.assetUrl(projectsBaseUrl, slug, 'screenshots', normalizedPath);
  }

  private resolveProjectPath(projectsBaseUrl: string, slug: string, path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const normalizedPath = path
      .replace(/^\/+/, '')
      .replace(/^\.portfolio\//, '')
      .replace(/^public\//, 'public/')
      .replace(/^screenshots\//, 'screenshots/');

    return this.assetUrl(projectsBaseUrl, slug, normalizedPath);
  }

  private assetUrl(baseUrl: string, ...parts: string[]): string {
    return [baseUrl.replace(/\/+$/g, ''), ...parts.map((part) => encodeURI(part.replace(/^\/+|\/+$/g, '')))].join('/');
  }

  private asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
  }
}

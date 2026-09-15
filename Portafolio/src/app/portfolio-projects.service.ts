import { Injectable } from '@angular/core';
import { EMPTY_PORTFOLIO_CONFIG, PORTFOLIO_CONFIG_URL, PortfolioConfig, PortfolioLink, ResolvedPortfolioConfig } from './portfolio.config';
import { Project, ProjectLink, ProjectTechnologies } from './project.model';
import { Certification } from './certification.model';
import { DEFAULT_GITHUB_STATS, GithubUserStats, LANGUAGE_COLORS, LanguagePercentage, RepoMetric } from './github-stats.model';

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
  private readonly certificationFilePattern = /\.(pdf|png|jpe?g|webp|gif|svg)$/i;
  private readonly certificationImagePattern = /\.(png|jpe?g|webp|gif|svg)$/i;

  async loadGithubStats(username = 'Msilva-debug'): Promise<GithubUserStats> {
    try {
      const [userRes, reposRes, commitsRes, eventsRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
        fetch(`https://api.github.com/search/commits?q=author:${username}`, {
          headers: { Accept: 'application/vnd.github.cloak-preview+json' },
        }).catch(() => null),
        fetch(`https://api.github.com/users/${username}/events`).catch(() => null),
      ]);

      if (!userRes.ok && !reposRes.ok) {
        return DEFAULT_GITHUB_STATS;
      }

      const userData = userRes.ok ? await userRes.json() : null;
      const reposData: any[] = reposRes.ok ? await reposRes.json() : [];
      const commitsData = commitsRes?.ok ? await commitsRes.json() : null;
      const eventsData: any[] = eventsRes?.ok ? await eventsRes.json() : [];

      let totalCommits = commitsData?.total_count ?? 0;
      let recentPushes = 0;

      if (Array.isArray(eventsData)) {
        for (const event of eventsData) {
          if (event.type === 'PushEvent') {
            recentPushes += event.payload?.size || event.payload?.commits?.length || 1;
          }
        }
      }

      if (totalCommits === 0) {
        totalCommits = DEFAULT_GITHUB_STATS.totalCommits;
      }

      if (recentPushes === 0) {
        recentPushes = DEFAULT_GITHUB_STATS.recentPushes;
      }

      if (!Array.isArray(reposData) || reposData.length === 0) {
        return {
          ...DEFAULT_GITHUB_STATS,
          totalCommits,
          totalRepos: userData?.public_repos ?? DEFAULT_GITHUB_STATS.totalRepos,
          recentPushes,
        };
      }

      const langCounts: Record<string, number> = {};
      const repoMetrics: Record<string, RepoMetric> = {};

      for (const repo of reposData) {
        if (repo.fork) continue;

        const lang = repo.language;
        if (lang) {
          langCounts[lang] = (langCounts[lang] || 0) + 1;
        }

        const repoNameKey = repo.name.toLowerCase();
        repoMetrics[repoNameKey] = {
          name: repo.name,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          language: repo.language || 'Código',
          updatedAt: repo.updated_at,
          url: repo.html_url,
        };
      }

      const totalLangRepos = Object.values(langCounts).reduce((acc, c) => acc + c, 0);
      let topLanguages: LanguagePercentage[] = [];

      if (totalLangRepos > 0) {
        const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
        const top = sortedLangs.slice(0, 4);
        const remaining = sortedLangs.slice(4);

        let topPercentageSum = 0;
        topLanguages = top.map(([name, count]) => {
          const pct = Math.round((count / totalLangRepos) * 100);
          topPercentageSum += pct;
          return {
            name,
            percentage: pct,
            color: LANGUAGE_COLORS[name] || '#6e7681',
          };
        });

        if (remaining.length > 0) {
          const remainingPct = Math.max(0, 100 - topPercentageSum);
          if (remainingPct > 0) {
            topLanguages.push({
              name: 'Otros',
              percentage: remainingPct,
              color: '#6e7681',
            });
          }
        }
      } else {
        topLanguages = DEFAULT_GITHUB_STATS.topLanguages;
      }

      return {
        username,
        totalCommits,
        totalRepos: userData?.public_repos ?? reposData.length,
        recentPushes,
        topLanguages: topLanguages.length > 0 ? topLanguages : DEFAULT_GITHUB_STATS.topLanguages,
        repoMetrics: Object.keys(repoMetrics).length > 0 ? repoMetrics : DEFAULT_GITHUB_STATS.repoMetrics,
      };
    } catch (error) {
      console.warn('No se pudieron obtener las estadísticas en vivo de GitHub, usando datos por defecto.', error);
      return DEFAULT_GITHUB_STATS;
    }
  }

  async loadProjects(): Promise<Project[]> {
    const config = await this.loadConfig();
    if (!config.projectsBaseUrl || config.projectSlugs.length === 0) {
      return [];
    }

    const projects = await Promise.all(config.projectSlugs.map((slug) => this.loadProject(slug, config.projectsBaseUrl, config.projectApplications[slug])));

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
        projectApplications: this.normalizeProjectApplications(config.projectApplications),
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

  async loadCertifications(): Promise<Certification[]> {
    const config = await this.loadConfig();

    if (!config.projectsBaseUrl) {
      return [];
    }

    const prefix = 'certificaciones/';
    const response = await fetch(this.s3ListUrl(config.projectsBaseUrl, prefix), { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Certification listing failed: ${response.status}`);
    }

    const files = this.parseCertificationFiles(await response.text(), prefix);

    return files.map((file, index) => this.createCertificationFromFile(file, index, config.projectsBaseUrl, prefix));
  }

  private async loadProject(slug: string, projectsBaseUrl: string, applications: PortfolioLink[] = []): Promise<Project | null> {
    try {
      const response = await fetch(this.assetUrl(projectsBaseUrl, slug, 'project.json'));

      if (!response.ok) {
        throw new Error(`Project ${slug} failed: ${response.status}`);
      }

      return this.normalizeProject(await response.json() as RawProject, slug, projectsBaseUrl, applications);
    } catch (error) {
      console.warn(`No se pudo cargar el proyecto ${slug}`, error);
      return null;
    }
  }

  private async normalizeProject(project: RawProject, slug: string, projectsBaseUrl: string, applications: PortfolioLink[]): Promise<Project> {
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
      applications: this.normalizeLinks(applications),
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

  private createCertificationFromFile(file: string, index: number, baseUrl: string, prefix: string): Certification {
    const fallbackTitle = file
      .split('/').pop()
      ?.replace(/\.[^.]+$/, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ') || `Certificación ${index + 1}`;
    const fileUrl = this.assetUrl(baseUrl, prefix, file);

    return {
      slug: file.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-'),
      title: fallbackTitle,
      issuer: 'Certificación profesional',
      issuedAt: '',
      description: 'Credencial y evidencia de formación profesional.',
      fileUrl,
      coverImageUrl: this.certificationImagePattern.test(file) ? fileUrl : '',
      credentialUrl: '',
    };
  }

  private parseCertificationFiles(contents: string, prefix: string): string[] {
    const document = new DOMParser().parseFromString(contents, 'application/xml');
    const keys = Array.from(document.getElementsByTagName('Key'))
      .map((key) => key.textContent?.trim() || '');

    return keys
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length))
      .filter((file) => file.length > 0 && !file.endsWith('/') && !file.includes('/') && this.certificationFilePattern.test(file))
      .sort((left, right) => left.localeCompare(right));
  }

  private s3ListUrl(baseUrl: string, prefix: string): string {
    const url = new URL(baseUrl);

    url.searchParams.set('list-type', '2');
    url.searchParams.set('prefix', prefix);

    return url.toString();
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

  private normalizeProjectApplications(value: unknown): Record<string, ProjectLink[]> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return Object.entries(value).reduce<Record<string, ProjectLink[]>>((applications, [slug, links]) => {
      const normalizedLinks = this.normalizeLinks(links);

      return normalizedLinks.length > 0 ? { ...applications, [slug]: normalizedLinks } : applications;
    }, {});
  }

  private normalizeLinks(value: unknown): ProjectLink[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((link, index) => {
        if (!link || typeof link !== 'object' || Array.isArray(link)) {
          return null;
        }

        const rawLink = link as Partial<ProjectLink>;
        const label = typeof rawLink.label === 'string' && rawLink.label.trim()
          ? rawLink.label.trim()
          : index === 0 ? 'Aplicación' : `Aplicación ${index + 1}`;
        const url = typeof rawLink.url === 'string' ? rawLink.url.trim() : '';

        return /^https?:\/\//i.test(url) ? { label, url } : null;
      })
      .filter((link): link is ProjectLink => Boolean(link));
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

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }
}

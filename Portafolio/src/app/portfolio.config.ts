export type PortfolioConfig = {
  projectsBaseUrl?: string;
  projectSlugs?: string[];
  projectApplications?: Record<string, PortfolioLink[]>;
};

export type ResolvedPortfolioConfig = Required<PortfolioConfig>;

export type PortfolioLink = {
  label: string;
  url: string;
};

export const PORTFOLIO_CONFIG_URL = 'portfolio-config.json';

export const EMPTY_PORTFOLIO_CONFIG: ResolvedPortfolioConfig = {
  projectsBaseUrl: '',
  projectSlugs: [],
  projectApplications: {},
};

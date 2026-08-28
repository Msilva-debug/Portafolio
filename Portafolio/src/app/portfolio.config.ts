export type PortfolioConfig = {
  projectsBaseUrl?: string;
  projectSlugs?: string[];
};

export type ResolvedPortfolioConfig = Required<PortfolioConfig>;

export const PORTFOLIO_CONFIG_URL = 'portfolio-config.json';

export const EMPTY_PORTFOLIO_CONFIG: ResolvedPortfolioConfig = {
  projectsBaseUrl: '',
  projectSlugs: [],
};

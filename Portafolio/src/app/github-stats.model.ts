export interface LanguagePercentage {
  name: string;
  percentage: number;
  color: string;
  bytes?: number;
}

export interface RepoMetric {
  name: string;
  stars: number;
  forks: number;
  language: string;
  updatedAt?: string;
  url?: string;
}

export interface GithubUserStats {
  username: string;
  totalCommits: number;
  totalRepos: number;
  recentPushes: number;
  topLanguages: LanguagePercentage[];
  repoMetrics: Record<string, RepoMetric>;
}

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Python: '#3572A5',
  'C#': '#178600',
  PHP: '#4F5D95',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Vue: '#41b883',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
};

export const DEFAULT_GITHUB_STATS: GithubUserStats = {
  username: 'Msilva-debug',
  totalCommits: 340,
  totalRepos: 18,
  recentPushes: 45,
  topLanguages: [
    { name: 'TypeScript', percentage: 42, color: '#3178c6' },
    { name: 'Java', percentage: 28, color: '#b07219' },
    { name: 'HTML / CSS', percentage: 16, color: '#e34c26' },
    { name: 'Python', percentage: 9, color: '#3572A5' },
    { name: 'Otros', percentage: 5, color: '#6e7681' },
  ],
  repoMetrics: {
    'portafolio': { name: 'Portafolio', stars: 3, forks: 1, language: 'TypeScript' },
    'inventario': { name: 'Inventario', stars: 2, forks: 1, language: 'Java' },
    'hotel': { name: 'Hotel', stars: 2, forks: 0, language: 'TypeScript' },
  },
};

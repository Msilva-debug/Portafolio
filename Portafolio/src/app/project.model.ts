export type PreviewKind = 'dashboard' | 'api' | 'web' | 'data';

export interface Project {
  slug: string;
  title: string;
  type: string[];
  description: string;
  stack: string[];
  decision: string;
  preview: PreviewKind;
  image: string;
  featured: boolean;
  url: string;
  status: string;
}

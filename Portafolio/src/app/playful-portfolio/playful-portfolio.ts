import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, computed, input, output, signal } from '@angular/core';
import { Certification } from '../certification.model';
import { DEFAULT_GITHUB_STATS, GithubUserStats, RepoMetric } from '../github-stats.model';
import { PortfolioCarouselComponent } from '../portfolio-carousel/portfolio-carousel';
import { Project, ProjectLink } from '../project.model';
import { ProjectDetailDialogComponent } from '../project-detail-dialog/project-detail-dialog';

@Component({
  selector: 'app-playful-portfolio',
  imports: [ProjectDetailDialogComponent, PortfolioCarouselComponent],
  templateUrl: './playful-portfolio.html',
})
export class PlayfulPortfolioComponent implements AfterViewInit, OnDestroy {
  private revealObserver?: IntersectionObserver;
  private contentObserver?: MutationObserver;
  private mixTimer?: number;
  private readonly registeredRevealItems = new WeakSet<Element>();

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  readonly projects = input<Project[]>([]);
  readonly certifications = input<Certification[]>([]);
  readonly githubStats = input<GithubUserStats>(DEFAULT_GITHUB_STATS);
  readonly profileImage = input('');
  readonly email = input('');
  readonly year = input(new Date().getFullYear());
  readonly copyStatus = input('');
  readonly isLoading = input(false);
  readonly copyRequested = output<void>();
  readonly downloadRequested = output<void>();

  protected getRepoMetrics(project: Project): RepoMetric | null {
    const metrics = this.githubStats().repoMetrics;
    if (!metrics) return null;
    const slugKey = project.slug.toLowerCase();
    for (const [key, val] of Object.entries(metrics)) {
      if (key === slugKey || slugKey.includes(key) || key.includes(slugKey) || (project.repository && project.repository.toLowerCase().includes(key))) {
        return val;
      }
    }
    return null;
  }

  protected readonly selectedFilter = signal('all');
  protected readonly ideaIndex = signal(0);
  protected readonly ideasMixed = signal(0);
  protected readonly isMixingIdea = signal(false);
  protected readonly ideaBurst = Array.from({ length: 16 }, (_, index) => index);
  protected readonly ideas = [
    'Una app que convierte tareas pendientes en pequeñas victorias.',
    'Un mapa donde cada lugar guarda una buena historia.',
    'Un jardín digital que crece con cada cosa que aprendes.',
    'Una API que te propone un pequeño reto creativo cada día.',
    'Un tablero para darle forma a esa idea que tienes por ahí.',
    'Un portafolio con dos personalidades. Este ya existe. :)',
  ];
  protected readonly currentIdea = computed(() => this.ideas[this.ideaIndex()]);
  protected readonly projectFilters = computed(() => [
    { value: 'all', label: 'Todo el parche' },
    ...[...new Set(this.projects().flatMap((project) => project.type))]
      .filter(Boolean)
      .map((type) => ({ value: type, label: this.typeLabel(type) })),
  ]);
  protected readonly visibleProjects = computed(() => {
    const filter = this.selectedFilter();

    return filter === 'all'
      ? this.projects()
      : this.projects().filter((project) => project.type.includes(filter));
  });

  protected mixIdea(): void {
    this.ideaIndex.update((index) => (index + 1) % this.ideas.length);
    this.ideasMixed.update((count) => count + 1);
    this.isMixingIdea.set(false);
    window.clearTimeout(this.mixTimer);
    requestAnimationFrame(() => {
      this.isMixingIdea.set(true);
      this.mixTimer = window.setTimeout(() => this.isMixingIdea.set(false), 720);
    });
  }

  ngAfterViewInit(): void {
    const root = this.host.nativeElement.querySelector('.playful-portfolio');
    if (!root) {
      return;
    }

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.revealItems(root, true);
      return;
    }

    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-play-visible');
          this.revealObserver?.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });

    this.revealItems(root);
    this.contentObserver = new MutationObserver(() => this.revealItems(root));
    this.contentObserver.observe(root, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    this.contentObserver?.disconnect();
    window.clearTimeout(this.mixTimer);
  }

  @HostListener('document:pointerdown', ['$event'])
  protected closeRepositoryMenus(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    this.host.nativeElement.querySelectorAll<HTMLDetailsElement>('.play-repo-menu[open]').forEach((menu) => {
      if (!menu.contains(target)) {
        menu.open = false;
      }
    });
  }

  protected moveCollage(event: PointerEvent): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || event.pointerType === 'touch') {
      return;
    }

    const collage = event.currentTarget as HTMLElement;
    const bounds = collage.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    collage.style.setProperty('--play-photo-x', `${x * -8}px`);
    collage.style.setProperty('--play-photo-y', `${y * -8}px`);
    collage.style.setProperty('--play-sticker-x', `${x * 13}px`);
    collage.style.setProperty('--play-sticker-y', `${y * 10}px`);
  }

  protected resetCollage(event: PointerEvent): void {
    const collage = event.currentTarget as HTMLElement;
    collage.style.setProperty('--play-photo-x', '0px');
    collage.style.setProperty('--play-photo-y', '0px');
    collage.style.setProperty('--play-sticker-x', '0px');
    collage.style.setProperty('--play-sticker-y', '0px');
  }

  protected selectFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }

  protected projectImage(project: Project): string {
    return project.coverImage || project.screenshots[0] || '';
  }

  protected isIconPreview(path: string): boolean {
    return /\.svg(?:[?#]|$)/i.test(path);
  }

  protected projectSummary(project: Project): string {
    return project.shortDescription || project.description || 'Una idea que tomó forma en código. Abre el proyecto para conocer los detalles.';
  }

  protected technologyTags(project: Project): string[] {
    return [...new Set(Object.values(project.technologies).flat())].filter(Boolean).slice(0, 6);
  }

  protected typeLabel(type: string): string {
    const labels: Record<string, string> = {
      fullstack: 'Full stack',
      frontend: 'Frontend',
      backend: 'Backend',
      web: 'Web',
      api: 'APIs',
      mobile: 'Móvil',
      android: 'Android',
      desktop: 'Escritorio',
      devops: 'Infraestructura',
    };

    return labels[type.toLowerCase()] || type.replace(/[-_]/g, ' ');
  }

  protected repositoryLinks(project: Project): ProjectLink[] {
    return (project.repository || '')
      .split(/;|\n/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .flatMap((entry, index) => {
        const markdown = entry.match(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/i);
        const url = (markdown?.[2] || entry.match(/https?:\/\/[^\s)\]]+/i)?.[0] || '')
          .replace(/[.,;]+$/, '');
        const prefix = /^https?:\/\//i.test(entry) ? '' : entry.match(/^([^:]+):/)?.[1]?.trim();
        const label = markdown?.[1] || prefix || (index === 0 ? 'Ver código' : `Repositorio ${index + 1}`);

        return url ? [{ label, url }] : [];
      });
  }

  protected applicationLink(project: Project): ProjectLink | null {
    return project.applications[0] ?? null;
  }

  private revealItems(root: Element, immediately = false): void {
    const selector = '.play-section-heading, .play-project-carousel, .play-certification-carousel, .play-empty, .play-about-heading, .play-about-copy, .play-journey-card, .play-toolbox, .play-contact-top, .play-contact h2, .play-contact-bottom';
    root.querySelectorAll(selector).forEach((element, index) => {
      if (this.registeredRevealItems.has(element)) {
        return;
      }

      this.registeredRevealItems.add(element);
      element.classList.add('play-reveal');
      (element as HTMLElement).style.setProperty('--play-reveal-delay', `${Math.min(index % 4, 3) * 80}ms`);
      if (immediately) {
        element.classList.add('is-play-visible');
      } else {
        this.revealObserver?.observe(element);
      }
    });
  }
}

import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  OnDestroy,
  ViewChild,
  input,
  output,
  signal,
} from '@angular/core';
import { Certification } from '../certification.model';
import { DEFAULT_GITHUB_STATS, GithubUserStats, RepoMetric } from '../github-stats.model';
import { PortfolioCarouselComponent } from '../portfolio-carousel/portfolio-carousel';
import { ProjectCardComponent } from '../project-card/project-card';
import { Project } from '../project.model';

@Component({
  selector: 'app-professional-portfolio',
  imports: [ProjectCardComponent, PortfolioCarouselComponent],
  templateUrl: './professional-portfolio.html',
  styles: [':host { display: contents; }'],
})
export class ProfessionalPortfolioComponent implements AfterViewInit, OnDestroy {
  private readonly orbitalRestTransform = '';
  private observer?: IntersectionObserver;
  private contentObserver?: MutationObserver;
  private readonly revealItems = new WeakSet<HTMLElement>();

  @HostBinding('class.motion-ready') protected readonly motionReady = true;
  @ViewChild('orbitalStage') private orbitalStage?: ElementRef<HTMLElement>;

  readonly projects = input<Project[]>([]);
  readonly certifications = input<Certification[]>([]);
  readonly githubStats = input<GithubUserStats>(DEFAULT_GITHUB_STATS);
  readonly profileImage = input('MateoCelis.jpeg');
  readonly email = input('mateocelis1550@gmail.com');
  readonly year = input(new Date().getFullYear());
  readonly copyStatus = input('');
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

  protected readonly isMotionPaused = signal(false);

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reducedMotion) {
      this.showAllMotionItems();
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          this.observer?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    this.registerMotionItems();
    this.contentObserver = new MutationObserver(() => this.registerMotionItems());
    this.contentObserver.observe(this.host.nativeElement, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.contentObserver?.disconnect();
  }

  protected onOrbitalMove(event: PointerEvent): void {
    if (this.isMotionPaused() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const bounds = target.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    this.setOrbitalTransform(`rotateX(${-y * 7}deg) rotateY(${x * 9}deg)`);
  }

  protected resetOrbital(): void {
    this.setOrbitalTransform(this.orbitalRestTransform);
  }

  protected toggleMotion(): void {
    const paused = !this.isMotionPaused();
    this.isMotionPaused.set(paused);
    if (paused) {
      this.resetOrbital();
    }
  }

  protected certificationIndex(index: number): number {
    return index + 1;
  }

  protected copyEmail(): void {
    this.copyRequested.emit();
  }

  protected downloadResume(): void {
    this.downloadRequested.emit();
  }

  private setOrbitalTransform(value: string): void {
    const stage = this.orbitalStage?.nativeElement;
    if (stage) {
      stage.style.transform = value;
    }
  }

  private registerMotionItems(): void {
    this.host.nativeElement.querySelectorAll<HTMLElement>('.reveal').forEach((element) => {
      this.registerRevealItem(element);
    });

    const selector = '.service, .timeline-item, .stack-group, .education-list li, app-portfolio-carousel, .contact-actions';
    this.host.nativeElement.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
      element.classList.add('motion-item');
      element.style.setProperty('--motion-delay', `${(index % 6) * 45}ms`);
      this.registerRevealItem(element);
    });
  }

  private registerRevealItem(element: HTMLElement): void {
    if (this.revealItems.has(element)) {
      return;
    }

    this.revealItems.add(element);
    element.classList.remove('visible');
    this.observer?.observe(element);
  }

  private showAllMotionItems(): void {
    this.host.nativeElement.querySelectorAll<HTMLElement>('.reveal, .motion-item').forEach((element) => {
      element.classList.add('visible');
    });
  }
}

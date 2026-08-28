import { AfterViewInit, Component, ElementRef, HostBinding, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { ProjectCardComponent } from './project-card/project-card';
import { Project } from './project.model';
import { PortfolioProjectsService } from './portfolio-projects.service';

@Component({
  selector: 'app-root',
  imports: [ProjectCardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy, OnInit {
  private readonly orbitalRestTransform = '';
  private projectAutoplayTimer?: number;
  private carouselScrollFrame?: number;
  private observer?: IntersectionObserver;

  @HostBinding('class.motion-ready') protected readonly motionReady = true;
  @ViewChild('orbitalStage') private orbitalStage?: ElementRef<HTMLElement>;
  @ViewChild('projectCarousel') private projectCarousel?: ElementRef<HTMLElement>;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly portfolioProjects: PortfolioProjectsService,
  ) {}

  protected readonly email = 'mateocelis1550@gmail.com';
  protected readonly year = new Date().getFullYear();
  protected readonly profileImage = 'MateoCelis.jpeg';
  protected readonly resumeUrl = signal('CV-Mateo.Celis.pdf');
  protected readonly isMotionPaused = signal(false);
  protected readonly isProjectAutoplayPaused = signal(false);
  protected readonly activeProjectIndex = signal(0);
  protected readonly copyStatus = signal('');

  protected readonly projects = signal<Project[]>([]);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadRemoteProjects(),
      this.loadResumeUrl(),
    ]);
  }

  ngAfterViewInit(): void {
    this.startProjectAutoplay();

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.host.nativeElement.querySelectorAll('.reveal, .motion-item').forEach((element) => {
        element.classList.add('visible');
      });
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('visible');
        this.observer?.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    this.registerRevealItems();
    this.registerMotionItems();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.stopProjectAutoplay();

    if (this.carouselScrollFrame) {
      cancelAnimationFrame(this.carouselScrollFrame);
    }
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

  protected projectPosition(): string {
    const total = this.projects().length;

    if (total === 0) {
      return '00 / 00';
    }

    return `${this.pad(this.activeProjectIndex() + 1)} / ${this.pad(total)}`;
  }

  protected previousProject(): void {
    this.scrollToProject(this.activeProjectIndex() - 1);
  }

  protected nextProject(): void {
    this.scrollToProject(this.activeProjectIndex() + 1);
  }

  protected toggleProjectAutoplay(): void {
    const paused = !this.isProjectAutoplayPaused();
    this.isProjectAutoplayPaused.set(paused);

    if (paused) {
      this.stopProjectAutoplay();
      return;
    }

    this.startProjectAutoplay();
  }

  protected onProjectCarouselScroll(): void {
    if (this.carouselScrollFrame) {
      cancelAnimationFrame(this.carouselScrollFrame);
    }

    this.carouselScrollFrame = requestAnimationFrame(() => this.updateActiveProjectFromScroll());
  }

  protected async copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.email);
      this.copyStatus.set('Correo copiado al portapapeles.');
    } catch {
      this.copyStatus.set('No se pudo copiar. Selecciona el correo manualmente.');
    }
  }

  protected async downloadResume(): Promise<void> {
    try {
      const response = await fetch(this.resumeUrl());

      if (!response.ok) {
        throw new Error(`Resume download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = objectUrl;
      link.download = 'CV-Mateo.Celis.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.warn('No se pudo descargar la hoja de vida.', error);
      window.open(this.resumeUrl(), '_blank', 'noopener,noreferrer');
    }
  }

  private setOrbitalTransform(value: string): void {
    const stage = this.orbitalStage?.nativeElement;

    if (stage) {
      stage.style.transform = value;
    }
  }

  private scrollToProject(index: number): void {
    const carousel = this.projectCarousel?.nativeElement;

    const projects = this.projects();

    if (!carousel || projects.length === 0) {
      return;
    }

    const nextIndex = (index + projects.length) % projects.length;
    const card = carousel.querySelectorAll<HTMLElement>('.project-card')[nextIndex];

    if (!card) {
      return;
    }

    this.activeProjectIndex.set(nextIndex);
    carousel.scrollTo({
      left: card.offsetLeft,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  private updateActiveProjectFromScroll(): void {
    const carousel = this.projectCarousel?.nativeElement;
    const cards = carousel ? Array.from(carousel.querySelectorAll<HTMLElement>('.project-card')) : [];

    if (!carousel || cards.length === 0) {
      return;
    }

    const activeIndex = cards.reduce((closest, card, index) => {
      const currentDistance = Math.abs(card.offsetLeft - carousel.scrollLeft);
      const closestDistance = Math.abs(cards[closest].offsetLeft - carousel.scrollLeft);
      return currentDistance < closestDistance ? index : closest;
    }, 0);

    this.activeProjectIndex.set(activeIndex);
  }

  private startProjectAutoplay(): void {
    this.stopProjectAutoplay();

    if (this.projects().length <= 1 || this.isProjectAutoplayPaused() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.projectAutoplayTimer = window.setInterval(() => this.nextProject(), 7000);
  }

  private stopProjectAutoplay(): void {
    if (this.projectAutoplayTimer) {
      window.clearInterval(this.projectAutoplayTimer);
      this.projectAutoplayTimer = undefined;
    }
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }

  private async loadRemoteProjects(): Promise<void> {
    try {
      const projects = await this.portfolioProjects.loadProjects();

      if (projects.length === 0) {
        return;
      }
      this.projects.set(projects);
      this.activeProjectIndex.set(0);
      this.startProjectAutoplay();
    } catch (error) {
      console.warn('No se pudieron cargar proyectos desde S3. Usando fallback local.', error);
    }
  }

  private async loadResumeUrl(): Promise<void> {
    try {
      this.resumeUrl.set(await this.portfolioProjects.resolvePortfolioAsset('/CV-Mateo.Celis.pdf'));
    } catch (error) {
      console.warn('No se pudo resolver la URL de la hoja de vida.', error);
    }
  }

  private registerRevealItems(): void {
    this.host.nativeElement.querySelectorAll<HTMLElement>('.reveal').forEach((element) => {
      element.classList.remove('visible');
      this.observer?.observe(element);
    });
  }

  private registerMotionItems(): void {
    const selector = '.service, .timeline-item, .stack-group, .education-list li, .project-card, .contact-actions';

    this.host.nativeElement.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
      element.classList.add('motion-item');
      element.classList.remove('visible');
      element.style.setProperty('--motion-delay', `${(index % 6) * 45}ms`);
      this.observer?.observe(element);
    });
  }
}

import { AfterViewInit, Component, ElementRef, HostBinding, HostListener, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { ProjectCardComponent } from './project-card/project-card';
import { Project } from './project.model';
import { PortfolioProjectsService } from './portfolio-projects.service';
import { Certification } from './certification.model';

@Component({
  selector: 'app-root',
  imports: [ProjectCardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy, OnInit {
  private readonly orbitalRestTransform = '';
  private readonly projectAutoplaySpeed = 48;
  private readonly certificationAutoplaySpeed = 42;
  private projectAutoplayFrame?: number;
  private projectAutoplayLastTime?: number;
  private projectTrackOffset = 0;
  private certificationAutoplayFrame?: number;
  private certificationAutoplayLastTime?: number;
  private certificationTrackOffset = 0;
  private readonly isProjectAutoplayContextPaused = signal(false);
  private carouselDrag?: {
    kind: 'project' | 'certification';
    pointerId: number;
    lastX: number;
    moved: boolean;
  };
  private selectedProjectCard?: HTMLElement;
  private selectedCertificationCard?: HTMLElement;
  private observer?: IntersectionObserver;

  @HostBinding('class.motion-ready') protected readonly motionReady = true;
  @ViewChild('orbitalStage') private orbitalStage?: ElementRef<HTMLElement>;
  @ViewChild('projectCarousel') private projectCarousel?: ElementRef<HTMLElement>;
  @ViewChild('projectTrack') private projectTrack?: ElementRef<HTMLElement>;
  @ViewChild('certificationCarousel') private certificationCarousel?: ElementRef<HTMLElement>;
  @ViewChild('certificationTrack') private certificationTrack?: ElementRef<HTMLElement>;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly portfolioProjects: PortfolioProjectsService,
  ) {}

  protected readonly email = 'mateocelis1550@gmail.com';
  protected readonly year = new Date().getFullYear();
  protected readonly profileImage = signal('MateoCelis.jpeg');
  protected readonly resumeUrl = signal('CV-Mateo.Celis.pdf');
  protected readonly isMotionPaused = signal(false);
  protected readonly copyStatus = signal('');

  protected readonly projects = signal<Project[]>([]);
  protected readonly certifications = signal<Certification[]>([]);
  protected readonly carouselProjects = computed(() => {
    const projects = this.projects();

    return projects.length > 1 ? [...projects, ...projects, ...projects] : projects;
  });
  protected readonly carouselCertifications = computed(() => {
    const certifications = this.certifications();

    return certifications.length > 1 ? [...certifications, ...certifications, ...certifications] : certifications;
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadRemoteProjects(),
      this.loadResumeUrl(),
      this.loadProfileImage(),
      this.loadCertifications(),
    ]);
  }

  ngAfterViewInit(): void {
    this.startProjectAutoplay();
    this.startCertificationAutoplay();

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
    this.stopCertificationAutoplay();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected resumeCarouselsOnOutsidePointer(event: PointerEvent): void {
    this.resumeProjectAutoplayOnOutsideTarget(event.target);
    this.resumeCertificationAutoplayOnOutsideTarget(event.target);
  }

  @HostListener('document:focusin', ['$event'])
  protected resumeCarouselsOnOutsideFocus(event: FocusEvent): void {
    this.resumeProjectAutoplayOnOutsideTarget(event.target);
    this.resumeCertificationAutoplayOnOutsideTarget(event.target);
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

  protected projectCarouselIndex(index: number): number {
    const total = this.projects().length;

    return total > 0 ? index % total : index;
  }

  protected certificationCarouselIndex(index: number): number {
    const total = this.certifications().length;

    return total > 0 ? (index % total) + 1 : index + 1;
  }

  protected pauseProjectAutoplayOnCard(card: HTMLElement): void {
    if (
      !card
      || this.projects().length <= 1
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    this.isProjectAutoplayContextPaused.set(true);
    this.selectedProjectCard = card;
    this.stopProjectAutoplay();
    this.centerElementInCarousel(
      this.projectCarousel?.nativeElement,
      this.projectTrack?.nativeElement,
      card,
      (offset) => this.projectTrackOffset = offset,
    );
  }

  protected resumeProjectAutoplay(): void {
    if (!this.selectedProjectCard && !this.isProjectAutoplayContextPaused()) {
      return;
    }

    this.selectedProjectCard = undefined;
    this.isProjectAutoplayContextPaused.set(false);
    this.startProjectAutoplay();
  }

  protected nudgeProjectCarousel(event: WheelEvent): void {
    this.nudgeCarousel('project', this.wheelCarouselDelta(event), event);
  }

  protected nudgeCertificationCarousel(event: WheelEvent): void {
    this.nudgeCarousel('certification', this.wheelCarouselDelta(event), event);
  }

  protected beginProjectCarouselDrag(event: PointerEvent): void {
    this.beginCarouselDrag('project', event);
  }

  protected beginCertificationCarouselDrag(event: PointerEvent): void {
    this.beginCarouselDrag('certification', event);
  }

  protected moveCarouselDrag(event: PointerEvent): void {
    if (!this.carouselDrag || this.carouselDrag.pointerId !== event.pointerId) {
      return;
    }

    const delta = this.carouselDrag.lastX - event.clientX;

    if (Math.abs(delta) < 1) {
      return;
    }

    this.carouselDrag.lastX = event.clientX;
    this.carouselDrag.moved = true;
    event.preventDefault();
    this.nudgeCarousel(this.carouselDrag.kind, delta, event, false);
  }

  protected endCarouselDrag(event: PointerEvent): void {
    if (!this.carouselDrag || this.carouselDrag.pointerId !== event.pointerId) {
      return;
    }

    const kind = this.carouselDrag.kind;
    const moved = this.carouselDrag.moved;
    this.carouselDrag = undefined;

    if (event.currentTarget instanceof HTMLElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (moved) {
      this.startCarouselAutoplay(kind);
    }
  }

  protected pauseCertificationAutoplayOnCard(event: Event): void {
    const card = event.currentTarget instanceof HTMLElement
      ? event.currentTarget
      : event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('.certification-card') : null;

    if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.selectedCertificationCard = card;
    this.stopCertificationAutoplay();
    this.centerElementInCarousel(
      this.certificationCarousel?.nativeElement,
      this.certificationTrack?.nativeElement,
      card,
      (offset) => this.certificationTrackOffset = offset,
    );
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

  private startProjectAutoplay(): void {
    this.stopProjectAutoplay();

    if (
      this.projects().length <= 1
      || this.isProjectAutoplayContextPaused()
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    this.projectAutoplayFrame = requestAnimationFrame((time) => this.runProjectAutoplay(time));
  }

  private stopProjectAutoplay(): void {
    if (this.projectAutoplayFrame !== undefined) {
      cancelAnimationFrame(this.projectAutoplayFrame);
      this.projectAutoplayFrame = undefined;
    }

    this.projectAutoplayLastTime = undefined;
  }

  private runProjectAutoplay(time: number): void {
    const track = this.projectTrack?.nativeElement;

    if (
      !track
      || this.projects().length <= 1
      || this.isProjectAutoplayContextPaused()
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.projectAutoplayFrame = undefined;
      this.projectAutoplayLastTime = undefined;
      return;
    }

    this.projectAutoplayLastTime ??= time;
    const elapsedSeconds = Math.min(time - this.projectAutoplayLastTime, 80) / 1000;
    this.projectAutoplayLastTime = time;
    this.projectTrackOffset = this.nextCarouselOffset(
      track,
      '.project-card',
      this.projects().length,
      this.projectTrackOffset,
      this.projectAutoplaySpeed,
      elapsedSeconds,
    );
    this.setTrackOffset(track, this.projectTrackOffset);
    this.projectAutoplayFrame = requestAnimationFrame((nextTime) => this.runProjectAutoplay(nextTime));
  }

  private startCertificationAutoplay(): void {
    this.stopCertificationAutoplay();

    if (
      this.certifications().length <= 1
      || this.selectedCertificationCard
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    this.certificationAutoplayFrame = requestAnimationFrame((time) => this.runCertificationAutoplay(time));
  }

  private stopCertificationAutoplay(): void {
    if (this.certificationAutoplayFrame !== undefined) {
      cancelAnimationFrame(this.certificationAutoplayFrame);
      this.certificationAutoplayFrame = undefined;
    }

    this.certificationAutoplayLastTime = undefined;
  }

  private runCertificationAutoplay(time: number): void {
    const track = this.certificationTrack?.nativeElement;

    if (
      !track
      || this.certifications().length <= 1
      || this.selectedCertificationCard
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.certificationAutoplayFrame = undefined;
      this.certificationAutoplayLastTime = undefined;
      return;
    }

    this.certificationAutoplayLastTime ??= time;
    const elapsedSeconds = Math.min(time - this.certificationAutoplayLastTime, 80) / 1000;
    this.certificationAutoplayLastTime = time;
    this.certificationTrackOffset = this.nextCarouselOffset(
      track,
      '.certification-card',
      this.certifications().length,
      this.certificationTrackOffset,
      this.certificationAutoplaySpeed,
      elapsedSeconds,
    );
    this.setTrackOffset(track, this.certificationTrackOffset);
    this.certificationAutoplayFrame = requestAnimationFrame((nextTime) => this.runCertificationAutoplay(nextTime));
  }

  private beginCarouselDrag(kind: 'project' | 'certification', event: PointerEvent): void {
    if (
      event.pointerType !== 'touch'
      || this.isInteractiveCarouselTarget(event.target)
      || !this.carouselConfig(kind)
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    this.carouselDrag = {
      kind,
      pointerId: event.pointerId,
      lastX: event.clientX,
      moved: false,
    };

    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  private isInteractiveCarouselTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement
      && Boolean(target.closest('a, button, details, summary, input, select, textarea, [role="button"]'));
  }

  private nudgeCarousel(kind: 'project' | 'certification', delta: number, event: Event, restartAutoplay = true): void {
    const config = this.carouselConfig(kind);

    if (!config || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    event.preventDefault();
    this.clearCarouselSelection(kind);
    config.resetLastTime();
    config.updateOffset(this.shiftCarouselOffset(
      config.track,
      config.itemSelector,
      config.total,
      config.currentOffset(),
      delta,
    ));
    this.setTrackOffset(config.track, config.currentOffset());

    if (restartAutoplay) {
      this.startCarouselAutoplay(kind);
    }
  }

  private carouselConfig(kind: 'project' | 'certification'): {
    track: HTMLElement;
    itemSelector: string;
    total: number;
    currentOffset: () => number;
    updateOffset: (offset: number) => void;
    resetLastTime: () => void;
  } | null {
    if (kind === 'project') {
      const track = this.projectTrack?.nativeElement;

      return track && this.projects().length > 1 ? {
        track,
        itemSelector: '.project-card',
        total: this.projects().length,
        currentOffset: () => this.projectTrackOffset,
        updateOffset: (offset) => this.projectTrackOffset = offset,
        resetLastTime: () => this.projectAutoplayLastTime = undefined,
      } : null;
    }

    const track = this.certificationTrack?.nativeElement;

    return track && this.certifications().length > 1 ? {
      track,
      itemSelector: '.certification-card',
      total: this.certifications().length,
      currentOffset: () => this.certificationTrackOffset,
      updateOffset: (offset) => this.certificationTrackOffset = offset,
      resetLastTime: () => this.certificationAutoplayLastTime = undefined,
    } : null;
  }

  private clearCarouselSelection(kind: 'project' | 'certification'): void {
    if (kind === 'project') {
      this.selectedProjectCard = undefined;
      this.isProjectAutoplayContextPaused.set(false);
      return;
    }

    this.selectedCertificationCard = undefined;
  }

  private startCarouselAutoplay(kind: 'project' | 'certification'): void {
    if (kind === 'project') {
      this.startProjectAutoplay();
      return;
    }

    this.startCertificationAutoplay();
  }

  private nextCarouselOffset(
    track: HTMLElement,
    itemSelector: string,
    originalLength: number,
    currentOffset: number,
    speed: number,
    elapsedSeconds: number,
  ): number {
    const loopDistance = this.carouselLoopDistance(track, itemSelector, originalLength);

    if (loopDistance <= 0) {
      return 0;
    }

    const normalizedOffset = currentOffset >= loopDistance && currentOffset < loopDistance * 2
      ? currentOffset
      : loopDistance + (((currentOffset % loopDistance) + loopDistance) % loopDistance);
    const nextOffset = normalizedOffset + speed * elapsedSeconds;

    return nextOffset >= loopDistance * 2 ? nextOffset - loopDistance : nextOffset;
  }

  private shiftCarouselOffset(
    track: HTMLElement,
    itemSelector: string,
    originalLength: number,
    currentOffset: number,
    delta: number,
  ): number {
    const loopDistance = this.carouselLoopDistance(track, itemSelector, originalLength);

    if (loopDistance <= 0) {
      return 0;
    }

    const nextOffset = currentOffset + delta;

    return loopDistance + (((nextOffset % loopDistance) + loopDistance) % loopDistance);
  }

  private wheelCarouselDelta(event: WheelEvent): number {
    const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const modeMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 18 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 240 : 1;

    return dominantDelta * modeMultiplier * 1.25;
  }

  private carouselLoopDistance(track: HTMLElement, itemSelector: string, originalLength: number): number {
    const duplicateStart = track.querySelectorAll<HTMLElement>(itemSelector)[originalLength];

    return duplicateStart?.offsetLeft || 0;
  }

  private setTrackOffset(track: HTMLElement, offset: number, animate = false): void {
    track.style.transition = animate ? 'transform .34s cubic-bezier(.2,0,0,1)' : '';
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;

    if (animate) {
      window.setTimeout(() => {
        track.style.transition = '';
      }, 360);
    }
  }

  private centerElementInCarousel(
    carousel: HTMLElement | undefined,
    track: HTMLElement | undefined,
    element: HTMLElement,
    updateOffset: (offset: number) => void,
  ): void {
    if (!carousel || !track) {
      return;
    }

    const carouselBounds = carousel.getBoundingClientRect();
    const elementBounds = element.getBoundingClientRect();
    const targetDelta = elementBounds.left - carouselBounds.left - ((carousel.clientWidth - elementBounds.width) / 2);
    const currentOffset = this.currentTrackOffset(track);
    const centeredOffset = currentOffset + targetDelta;

    updateOffset(centeredOffset);
    this.setTrackOffset(track, centeredOffset, true);
  }

  private currentTrackOffset(track: HTMLElement): number {
    const transform = new DOMMatrixReadOnly(getComputedStyle(track).transform);

    return Math.abs(transform.m41 || 0);
  }

  private resumeProjectAutoplayOnOutsideTarget(target: EventTarget | null): void {
    if (!this.selectedProjectCard || !(target instanceof Node) || this.selectedProjectCard.contains(target)) {
      return;
    }

    this.resumeProjectAutoplay();
  }

  private resumeCertificationAutoplayOnOutsideTarget(target: EventTarget | null): void {
    if (!this.selectedCertificationCard || !(target instanceof Node) || this.selectedCertificationCard.contains(target)) {
      return;
    }

    this.selectedCertificationCard = undefined;
    this.startCertificationAutoplay();
  }

  private async loadRemoteProjects(): Promise<void> {
    try {
      const projects = await this.portfolioProjects.loadProjects();

      if (projects.length === 0) {
        return;
      }
      this.projects.set(projects);
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

  private async loadProfileImage(): Promise<void> {
    try {
      this.profileImage.set(await this.portfolioProjects.resolvePortfolioAsset('/MateoCelis.jpeg'));
    } catch (error) {
      console.warn('No se pudo resolver la URL de la foto de perfil.', error);
    }
  }

  private async loadCertifications(): Promise<void> {
    try {
      this.certifications.set(await this.portfolioProjects.loadCertifications());
      this.startCertificationAutoplay();
    } catch (error) {
      console.warn('No se pudieron cargar las certificaciones desde S3.', error);
    }
  }

  private registerRevealItems(): void {
    this.host.nativeElement.querySelectorAll<HTMLElement>('.reveal').forEach((element) => {
      element.classList.remove('visible');
      this.observer?.observe(element);
    });
  }

  private registerMotionItems(): void {
    const selector = '.service, .timeline-item, .stack-group, .education-list li, .project-card, .certification-card, .contact-actions';

    this.host.nativeElement.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
      element.classList.add('motion-item');
      element.classList.remove('visible');
      element.style.setProperty('--motion-delay', `${(index % 6) * 45}ms`);
      this.observer?.observe(element);
    });
  }
}

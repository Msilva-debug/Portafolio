import { AfterViewInit, Component, ElementRef, HostBinding, OnDestroy, ViewChild, signal } from '@angular/core';
import { ProjectCardComponent } from './project-card/project-card';
import { Project } from './project.model';

@Component({
  selector: 'app-root',
  imports: [ProjectCardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy {
  private readonly orbitalRestTransform = '';
  private projectAutoplayTimer?: number;
  private carouselScrollFrame?: number;
  private observer?: IntersectionObserver;

  @HostBinding('class.motion-ready') protected readonly motionReady = true;
  @ViewChild('orbitalStage') private orbitalStage?: ElementRef<HTMLElement>;
  @ViewChild('projectCarousel') private projectCarousel?: ElementRef<HTMLElement>;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  protected readonly email = 'mateocelis1550@gmail.com';
  protected readonly year = new Date().getFullYear();
  protected readonly profileImage = 'MateoCelis.jpeg';
  protected readonly resumeUrl = 'CV-Mateo.Celis.pdf';
  protected readonly isMotionPaused = signal(false);
  protected readonly isProjectAutoplayPaused = signal(false);
  protected readonly activeProjectIndex = signal(0);
  protected readonly copyStatus = signal('');

  protected readonly projects: Project[] = [
    {
      slug: 'nutrisnap',
      name: 'NutriSnap',
      shortDescription: 'Aplicacion fullstack para seguimiento nutricional con registro de comidas, planes, preparaciones y recomendaciones.',
      description: 'NutriSnap es un proyecto fullstack compuesto por un backend NestJS y un frontend Angular. La aplicacion permite crear una cuenta, iniciar sesion, consultar un dashboard nutricional, registrar comidas, revisar historial diario con notas, administrar preparaciones reutilizables y consultar recomendaciones por periodo. El backend expone una API documentada con Swagger, persiste informacion en PostgreSQL mediante TypeORM y usa servicios de IA para analisis nutricional y recomendaciones cuando la integracion externa esta disponible.',
      type: ['fullstack', 'frontend', 'backend', 'api'],
      technologies: {
        frontend: ['Angular', 'TypeScript', 'RxJS', 'Tailwind CSS', 'Socket.IO Client'],
        backend: ['NestJS', 'Node.js', 'TypeScript', 'Socket.IO', 'Passport JWT', 'Swagger'],
        database: ['PostgreSQL', 'TypeORM'],
        mobile: [],
        infrastructure: ['Docker', 'Docker Compose', 'Nginx'],
        tools: ['Angular CLI', 'Nest CLI', 'Jest', 'Playwright', 'ESLint', 'Prettier', 'PostCSS', 'npm'],
      },
      features: [
        'Registro de usuario e inicio de sesion desde el frontend contra la API backend.',
        'Dashboard nutricional con metas diarias, consumo de calorias y resumen de macronutrientes.',
        'Gestion de comidas del dia con distribucion por desayuno, almuerzo, cena y merienda.',
        'Historial de comidas por fecha con totales nutricionales y nota diaria editable.',
        'Preparaciones reutilizables con detalle nutricional por porcion y registro como comida.',
        'Recomendaciones nutricionales por dia o rango de fechas.',
        'API REST documentada con Swagger y organizada por autenticacion, usuarios, comidas, planes, preparaciones y recomendaciones.',
        'Persistencia relacional de usuarios, planes nutricionales, comidas, notas diarias, preparaciones y embeddings.',
        'Eventos WebSocket para sincronizar comidas creadas por usuario.',
      ],
      technicalHighlights: [
        'Proyecto compuesto con frontend Angular y backend NestJS conectados por servicios HTTP tipados.',
        'Backend modular por dominio con controladores, servicios, entidades TypeORM y migraciones.',
        'Autenticacion basada en JWT con rutas protegidas y resolucion de usuario autenticado.',
        'Estado frontend compartido mediante Angular signals y store local.',
        'Documentacion OpenAPI expuesta en Swagger y capturada por secciones para facilitar revision.',
        'Strategy + Factory en el modulo de recomendaciones para separar periodo diario y rango.',
        'Tareas programadas con Nest Schedule para sincronizar embeddings de notas diarias.',
        'Frontend preparado para despliegue estatico con Docker multi-stage y Nginx.',
      ],
      architecture: 'NutriSnap esta organizado como dos subproyectos conectados: NutriSnap-Frontend implementa la experiencia Angular y consume la API configurada en environment.ts; NutriSnap-Backend implementa la API NestJS, documentacion Swagger, logica de dominio, WebSockets y persistencia PostgreSQL con TypeORM. El flujo verificado registra e inicia sesion desde el frontend, consulta datos autenticados en el backend y muestra dashboard, historial, preparaciones y recomendaciones.',
      role: '',
      repository: '',
      screenshots: [
        '.portfolio/public/project.svg',
        '.portfolio/screenshots/backend/01-swagger-auth-users.png',
        '.portfolio/screenshots/backend/02-swagger-meals-plans.png',
        '.portfolio/screenshots/backend/03-swagger-preparations-recommendations.png',
        '.portfolio/screenshots/frontend/01-dashboard-with-meals.png',
        '.portfolio/screenshots/frontend/02-history-with-note.png',
        '.portfolio/screenshots/frontend/03-food-preparations.png',
        '.portfolio/screenshots/frontend/04-add-meal-preparation-flow.png',
        '.portfolio/screenshots/frontend/05-recommendations.png',
        '.portfolio/screenshots/frontend/06-mobile-dashboard.png',
      ],
      status: 'documented',
      generatedAt: '2026-08-26T12:11:46-05:00',
    },
  ];

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
    const total = this.projects.length;

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

  private setOrbitalTransform(value: string): void {
    const stage = this.orbitalStage?.nativeElement;

    if (stage) {
      stage.style.transform = value;
    }
  }

  private scrollToProject(index: number): void {
    const carousel = this.projectCarousel?.nativeElement;

    if (!carousel || this.projects.length === 0) {
      return;
    }

    const nextIndex = (index + this.projects.length) % this.projects.length;
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

    if (this.projects.length <= 1 || this.isProjectAutoplayPaused() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

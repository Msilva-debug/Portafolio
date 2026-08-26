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
  private observer?: IntersectionObserver;

  @HostBinding('class.motion-ready') protected readonly motionReady = true;
  @ViewChild('orbitalStage') private orbitalStage?: ElementRef<HTMLElement>;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  protected readonly email = 'mateocelis1550@gmail.com';
  protected readonly year = new Date().getFullYear();
  protected readonly profileImage = 'MateoCelis.jpeg';
  protected readonly resumeUrl = 'CV-Mateo.Celis.pdf';
  protected readonly isMotionPaused = signal(false);
  protected readonly copyStatus = signal('');

  protected readonly projects: Project[] = [
    {
      slug: 'proyecto-01',
      name: 'Proyecto 01 · Por documentar',
      shortDescription: 'Caso full stack pendiente de completar con problema, participación y resultado.',
      description: 'Caso full stack pendiente de completar con problema, participación y resultado.',
      type: ['frontend', 'backend'],
      technologies: {
        frontend: ['Angular'],
        backend: ['Spring Boot'],
        database: ['PostgreSQL'],
        mobile: [],
        infrastructure: ['Docker'],
        tools: [],
      },
      features: [],
      technicalHighlights: ['Añade aquí la principal decisión técnica que tomaste.'],
      architecture: '',
      role: '',
      repository: '',
      screenshots: [],
      status: 'documented',
      generatedAt: '',
    },
    {
      slug: 'proyecto-02',
      name: 'Proyecto 02 · Por documentar',
      shortDescription: 'Caso pendiente de completar desde el desafío, la solución y tu responsabilidad.',
      description: 'Caso pendiente de completar desde el desafío, la solución y tu responsabilidad.',
      type: ['frontend'],
      technologies: {
        frontend: ['Añade', 'el stack', 'real'],
        backend: [],
        database: [],
        mobile: [],
        infrastructure: [],
        tools: [],
      },
      features: [],
      technicalHighlights: ['Describe aquí cómo abordaste el desafío.'],
      architecture: '',
      role: '',
      repository: '',
      screenshots: [],
      status: 'documented',
      generatedAt: '',
    },
  ];

  ngAfterViewInit(): void {
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

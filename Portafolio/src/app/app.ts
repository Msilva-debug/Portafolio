import { Component, ElementRef, HostBinding, ViewChild, signal } from '@angular/core';

type PreviewKind = 'dashboard' | 'api' | 'web' | 'data';

interface Project {
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

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly orbitalRestTransform = 'rotateX(-3.07552deg) rotateY(-3.16415deg)';

  @HostBinding('class.motion-ready') protected readonly motionReady = true;
  @ViewChild('orbitalStage') private orbitalStage?: ElementRef<HTMLElement>;

  protected readonly email = 'mateocelis1550@gmail.com';
  protected readonly year = new Date().getFullYear();
  protected readonly profileImage = '';
  protected readonly isMotionPaused = signal(false);
  protected readonly copyStatus = signal('');

  protected readonly projects: Project[] = [
    {
      slug: 'proyecto-01',
      title: 'Proyecto 01 · Por documentar',
      type: ['frontend', 'backend', 'datos'],
      description: 'Caso full stack pendiente de completar con problema, participación y resultado.',
      stack: ['Angular', 'Spring Boot', 'PostgreSQL', 'Docker'],
      decision: 'Añade aquí la principal decisión técnica que tomaste.',
      preview: 'dashboard',
      image: '',
      featured: true,
      url: '',
      status: 'POR DOCUMENTAR',
    },
    {
      slug: 'proyecto-02',
      title: 'Proyecto 02 · Por documentar',
      type: ['frontend', 'backend'],
      description: 'Caso pendiente de completar desde el desafío, la solución y tu responsabilidad.',
      stack: ['Añade', 'el stack', 'real'],
      decision: 'Describe aquí cómo abordaste el desafío.',
      preview: 'web',
      image: '',
      featured: false,
      url: '',
      status: 'POR DOCUMENTAR',
    },
  ];

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
}

import { Component, HostListener, OnInit, signal } from '@angular/core';
import { Certification } from './certification.model';
import { DEFAULT_GITHUB_STATS, GithubUserStats } from './github-stats.model';
import { PlayfulPortfolioComponent } from './playful-portfolio/playful-portfolio';
import { PortfolioProjectsService } from './portfolio-projects.service';
import { ProfessionalPortfolioComponent } from './professional-portfolio/professional-portfolio';
import { Project } from './project.model';

type PortfolioMode = 'professional' | 'playful';

@Component({
  selector: 'app-root',
  imports: [ProfessionalPortfolioComponent, PlayfulPortfolioComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly mode = signal<PortfolioMode>(this.readMode());
  protected readonly email = 'mateocelis1550@gmail.com';
  protected readonly year = new Date().getFullYear();
  protected readonly profileImage = signal('MateoCelis.jpeg');
  protected readonly resumeUrl = signal('CV-Mateo.Celis.pdf');
  protected readonly projects = signal<Project[]>([]);
  protected readonly certifications = signal<Certification[]>([]);
  protected readonly githubStats = signal<GithubUserStats>(DEFAULT_GITHUB_STATS);
  protected readonly copyStatus = signal('');
  protected readonly isLoading = signal(true);

  constructor(private readonly portfolioProjects: PortfolioProjectsService) {}

  async ngOnInit(): Promise<void> {
    await Promise.allSettled([
      this.portfolioProjects.loadProjects().then((projects) => this.projects.set(projects)),
      this.portfolioProjects.loadCertifications().then((certifications) => this.certifications.set(certifications)),
      this.portfolioProjects.loadGithubStats().then((stats) => this.githubStats.set(stats)),
      this.portfolioProjects.resolvePortfolioAsset('/MateoCelis.jpeg').then((url) => this.profileImage.set(url)),
      this.portfolioProjects.resolvePortfolioAsset('/CV-Mateo.Celis.pdf').then((url) => this.resumeUrl.set(url)),
    ]);
    this.isLoading.set(false);
  }

  protected selectMode(mode: PortfolioMode): void {
    if (this.mode() === mode) {
      return;
    }

    const url = new URL(window.location.href);
    const currentQuery = url.searchParams.get('modo');
    if (currentQuery !== 'profesional' && currentQuery !== 'divertido') {
      url.searchParams.set('modo', this.mode() === 'playful' ? 'divertido' : 'profesional');
      window.history.replaceState(window.history.state, '', url);
    }
    this.mode.set(mode);
    this.copyStatus.set('');
    this.saveMode(mode);
    url.searchParams.set('modo', mode === 'playful' ? 'divertido' : 'profesional');
    url.hash = '';
    window.history.pushState(null, '', url);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  @HostListener('window:popstate')
  protected restoreMode(): void {
    this.mode.set(this.readMode());
    this.saveMode(this.mode());
    this.copyStatus.set('');
  }

  private readMode(): PortfolioMode {
    const requestedMode = new URL(window.location.href).searchParams.get('modo');
    if (requestedMode === 'divertido') {
      return 'playful';
    }
    if (requestedMode === 'profesional') {
      return 'professional';
    }
    try {
      return localStorage.getItem('portfolio-mode') === 'playful' ? 'playful' : 'professional';
    } catch {
      return 'professional';
    }
  }

  private saveMode(mode: PortfolioMode): void {
    try {
      localStorage.setItem('portfolio-mode', mode);
    } catch {
      // The selected experience still works when browser storage is unavailable.
    }
  }

  protected async copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.email);
      this.copyStatus.set('Correo copiado al portapapeles.');
    } catch {
      this.copyStatus.set('No se pudo copiar. Puedes seleccionar el correo o abrirlo para escribirme.');
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
    } catch {
      window.open(this.resumeUrl(), '_blank', 'noopener,noreferrer');
    }
  }
}

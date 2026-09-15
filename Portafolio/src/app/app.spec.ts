import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { Certification } from './certification.model';
import { DEFAULT_GITHUB_STATS } from './github-stats.model';
import { PortfolioProjectsService } from './portfolio-projects.service';
import { Project } from './project.model';

describe('App portfolio experiences', () => {
  const storageKey = 'portfolio-mode';
  const assetBase = 'https://portfolio.example.test';
  const project: Project = {
    slug: 'inventario',
    name: 'Inventario conectado',
    shortDescription: 'Control de productos y movimientos en tiempo real.',
    description: 'Aplicación de inventario con una API y un panel de administración.',
    type: ['fullstack'],
    technologies: {
      frontend: ['Angular'],
      backend: ['Spring Boot'],
      database: ['PostgreSQL'],
      mobile: [],
      infrastructure: ['Docker'],
      tools: ['Git'],
    },
    features: ['Registro de movimientos'],
    technicalHighlights: ['Validación de existencias'],
    architecture: 'Cliente Angular y API REST.',
    role: 'Desarrollador full stack',
    repository: 'https://github.com/example/inventario',
    applications: [{ label: 'Aplicación', url: 'https://inventario.example.test' }],
    screenshots: [],
    status: 'documented',
    generatedAt: '2026-09-01T00:00:00Z',
  };
  const certification: Certification = {
    slug: 'desarrollo-web',
    title: 'Desarrollo de aplicaciones web',
    issuer: 'Certificación profesional',
    issuedAt: '',
    description: 'Credencial de formación en desarrollo web.',
    fileUrl: `${assetBase}/certificaciones/desarrollo-web.pdf`,
    coverImageUrl: '',
    credentialUrl: '',
  };

  let fixture: ComponentFixture<App> | undefined;
  let portfolio: jasmine.SpyObj<PortfolioProjectsService>;
  let originalUrl: string;
  let originalHistoryState: unknown;
  let originalMode: string | null;
  let storageGetSpy: jasmine.Spy | undefined;
  let storageSetSpy: jasmine.Spy | undefined;

  beforeEach(async () => {
    originalUrl = window.location.href;
    originalHistoryState = window.history.state;
    originalMode = localStorage.getItem(storageKey);
    localStorage.removeItem(storageKey);
    setQueryMode(null);
    spyOn(window, 'scrollTo');
    // Preserve the runner's query parameters and avoid adding history entries.
    spyOn(window.history, 'pushState').and.callFake((data, unused, url) => {
      window.history.replaceState(data, unused, url);
    });
    spyOn(window, 'matchMedia').and.callFake((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    }));

    portfolio = jasmine.createSpyObj<PortfolioProjectsService>('PortfolioProjectsService', [
      'loadProjects',
      'loadCertifications',
      'loadGithubStats',
      'resolvePortfolioAsset',
    ]);
    portfolio.loadProjects.and.resolveTo([project]);
    portfolio.loadCertifications.and.resolveTo([certification]);
    portfolio.loadGithubStats.and.resolveTo(DEFAULT_GITHUB_STATS);
    portfolio.resolvePortfolioAsset.and.callFake(async (path) => `${assetBase}${path}`);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        { provide: PortfolioProjectsService, useValue: portfolio },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    fixture = undefined;
    storageGetSpy?.and.callThrough();
    storageSetSpy?.and.callThrough();
    storageGetSpy = undefined;
    storageSetSpy = undefined;
    if (originalMode === null) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, originalMode);
    }
    window.history.replaceState(originalHistoryState, '', originalUrl);
  });

  function setQueryMode(mode: 'divertido' | 'profesional' | null): void {
    const url = new URL(window.location.href);
    if (mode) {
      url.searchParams.set('modo', mode);
    } else {
      url.searchParams.delete('modo');
    }
    window.history.replaceState(null, '', url);
  }

  async function render(): Promise<HTMLElement> {
    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    await settleAsyncWork();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  async function click(root: HTMLElement, selector: string): Promise<void> {
    const button = root.querySelector<HTMLButtonElement>(selector);
    expect(button).withContext(`Missing button: ${selector}`).not.toBeNull();
    button?.click();
    await fixture?.whenStable();
    await settleAsyncWork();
    fixture?.detectChanges();
  }

  async function settleAsyncWork(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise<void>((resolve) => window.setTimeout(resolve));
  }

  function expectExperience(root: HTMLElement, mode: 'professional' | 'playful'): void {
    const otherMode = mode === 'professional' ? 'playful' : 'professional';
    expect(root.querySelector(`app-${mode}-portfolio`)).not.toBeNull();
    expect(root.querySelector(`app-${otherMode}-portfolio`)).toBeNull();
    expect(root.querySelector(`[data-mode="${mode}"]`)?.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector(`[data-mode="${otherMode}"]`)?.getAttribute('aria-pressed')).toBe('false');
    expect(root.querySelectorAll('main').length).toBe(1);
  }

  it('starts with the professional portfolio and its existing content', async () => {
    const root = await render();

    expect(fixture?.componentInstance).toBeTruthy();
    expectExperience(root, 'professional');
    expect(root.querySelector('h1')?.textContent).toContain('Web, backend y móvil.');
    expect(root.querySelector('#certificaciones h2')?.textContent).toContain('Aprendizaje verificado.');
    expect(root.querySelector('nav a[href="#certificaciones"]')).not.toBeNull();
    expect(root.querySelector('#proyectos')?.textContent).toContain(project.name);
  });

  it('switches to a separate playful portfolio with the same remote content and contact links', async () => {
    const root = await render();

    await click(root, '[data-mode="playful"]');

    expectExperience(root, 'playful');
    const playful = root.querySelector('app-playful-portfolio') as HTMLElement;
    expect(playful.querySelector('#proyectos')?.textContent).toContain(project.name);
    expect(playful.querySelector('#certificaciones')?.textContent).toContain(certification.title);
    expect(playful.querySelector(`a[href="${project.applications[0].url}"]`)).not.toBeNull();
    expect(playful.querySelector(`a[href="${project.repository}"]`)).not.toBeNull();
    expect(playful.querySelector(`a[href="${certification.fileUrl}"]`)).not.toBeNull();
    expect(playful.querySelector(`img[src="${assetBase}/MateoCelis.jpeg"]`)).not.toBeNull();
    expect(playful.querySelector('a[href="mailto:mateocelis1550@gmail.com"]')).not.toBeNull();
    expect(playful.querySelector('a[href="https://www.linkedin.com/in/mateo-celis-silva"]')).not.toBeNull();
    expect(localStorage.getItem(storageKey)).toBe('playful');
    expect(new URL(window.location.href).searchParams.get('modo')).toBe('divertido');
  });

  it('keeps project, repository and technical-detail actions in both portfolio designs', async () => {
    const root = await render();
    const professional = root.querySelector('app-professional-portfolio') as HTMLElement;

    expect(professional.querySelector<HTMLAnchorElement>('[data-action="open-project"]')?.getAttribute('href')).toBe(project.applications[0].url);
    expect(professional.querySelector<HTMLAnchorElement>('[data-action="open-repository"]')?.getAttribute('href')).toBe(project.repository);
    expect(professional.querySelector<HTMLButtonElement>('[data-action="open-details"]')).not.toBeNull();

    await click(root, '[data-mode="playful"]');
    const playful = root.querySelector('app-playful-portfolio') as HTMLElement;
    expect(playful.querySelector<HTMLAnchorElement>('[data-action="open-project"]')?.getAttribute('href')).toBe(project.applications[0].url);
    expect(playful.querySelector<HTMLAnchorElement>('[data-action="open-repository"]')?.getAttribute('href')).toBe(project.repository);

    await click(root, 'app-playful-portfolio [data-action="open-details"]');
    expect(playful.querySelector<HTMLDialogElement>('.project-dialog')?.open).toBeTrue();
    expect(playful.querySelector('.project-dialog')?.textContent).toContain(project.name);
  });

  it('animates the idea machine while cycling through creative prompts', async () => {
    const root = await render();
    await click(root, '[data-mode="playful"]');
    const machine = root.querySelector('.play-idea-machine') as HTMLElement;
    const firstIdea = machine.querySelector('.play-idea-output')?.textContent;

    await click(root, '.play-idea-button');

    expect(machine.querySelector('.play-idea-output')?.textContent).not.toBe(firstIdea);
    expect(machine.textContent).toContain('1 IDEA MEZCLADA');
  });

  it('restores the professional content without loading the shared data again', async () => {
    const root = await render();
    await click(root, '[data-mode="playful"]');

    await click(root, '[data-mode="professional"]');

    expectExperience(root, 'professional');
    expect(root.querySelector('h1')?.textContent).toContain('Web, backend y móvil.');
    expect(root.querySelector('#proyectos')?.textContent).toContain(project.name);
    expect(root.querySelector('#certificaciones')?.textContent).toContain(certification.title);
    expect(localStorage.getItem(storageKey)).toBe('professional');
    expect(new URL(window.location.href).searchParams.get('modo')).toBe('profesional');
    expect(portfolio.loadProjects).toHaveBeenCalledTimes(1);
    expect(portfolio.loadCertifications).toHaveBeenCalledTimes(1);
  });

  it('copies the shared email from the playful contact action', async () => {
    const clipboard = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    const root = await render();
    await click(root, '[data-mode="playful"]');

    await click(root, 'app-playful-portfolio [data-action="copy-email"]');

    expect(clipboard).toHaveBeenCalledOnceWith('mateocelis1550@gmail.com');
    expect(root.querySelector('app-playful-portfolio')?.textContent).toContain('Correo copiado al portapapeles.');
  });

  it('downloads the shared resume from the playful CV action', async () => {
    const resume = new Blob(['Example resume'], { type: 'application/pdf' });
    const fetchResume = spyOn(window, 'fetch').and.resolveTo(new Response(resume));
    spyOn(URL, 'createObjectURL').and.returnValue('blob:portfolio-resume');
    const revokeUrl = spyOn(URL, 'revokeObjectURL');
    const download = spyOn(HTMLAnchorElement.prototype, 'click');
    const root = await render();
    await click(root, '[data-mode="playful"]');

    await click(root, 'app-playful-portfolio [data-action="download-resume"]');

    expect(fetchResume).toHaveBeenCalledOnceWith(`${assetBase}/CV-Mateo.Celis.pdf`);
    expect(download).toHaveBeenCalledTimes(1);
    const anchor = download.calls.mostRecent().object as HTMLAnchorElement;
    expect(anchor.download).toBe('CV-Mateo.Celis.pdf');
    expect(revokeUrl).toHaveBeenCalledOnceWith('blob:portfolio-resume');
  });

  it('remembers a saved playful preference when there is no mode in the URL', async () => {
    localStorage.setItem(storageKey, 'playful');

    expectExperience(await render(), 'playful');
  });

  it('prioritizes a playful URL over the saved professional preference', async () => {
    localStorage.setItem(storageKey, 'professional');
    setQueryMode('divertido');

    expectExperience(await render(), 'playful');
  });

  it('prioritizes a professional URL over the saved playful preference', async () => {
    localStorage.setItem(storageKey, 'playful');
    setQueryMode('profesional');

    expectExperience(await render(), 'professional');
  });

  it('keeps switching available when browser storage is blocked', async () => {
    storageGetSpy = spyOn(Storage.prototype, 'getItem').and.throwError('Storage is blocked');
    storageSetSpy = spyOn(Storage.prototype, 'setItem').and.throwError('Storage is blocked');
    const root = await render();
    expectExperience(root, 'professional');

    await click(root, '[data-mode="playful"]');
    expectExperience(root, 'playful');
    await click(root, '[data-mode="professional"]');
    expectExperience(root, 'professional');
  });

  it('preserves unrelated query parameters when selecting an experience', async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('portfolio-test-source', 'shared link');
    url.hash = 'proyectos';
    window.history.replaceState(null, '', url);
    const root = await render();

    await click(root, '[data-mode="playful"]');

    const updated = new URL(window.location.href);
    expect(updated.searchParams.get('portfolio-test-source')).toBe('shared link');
    expect(updated.searchParams.get('modo')).toBe('divertido');
    expect(updated.hash).toBe('');
    url.searchParams.forEach((value, key) => {
      if (key !== 'modo') {
        expect(updated.searchParams.get(key)).withContext(key).toBe(value);
      }
    });
  });

  it('restores the requested experience on browser navigation', async () => {
    const root = await render();
    await click(root, '[data-mode="playful"]');

    const previousUrl = new URL(window.location.href);
    previousUrl.searchParams.set('modo', 'profesional');
    expect(previousUrl.searchParams.get('modo')).toBe('profesional');
    window.history.replaceState(null, '', previousUrl);
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    await fixture?.whenStable();
    fixture?.detectChanges();

    expectExperience(root, 'professional');
  });
});

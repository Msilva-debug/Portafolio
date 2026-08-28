import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, input } from '@angular/core';
import { Project } from '../project.model';
import { ProjectDetailDialogComponent } from '../project-detail-dialog/project-detail-dialog';

@Component({
  selector: 'app-project-card',
  imports: [NgTemplateOutlet, ProjectDetailDialogComponent],
  templateUrl: './project-card.html',
  styles: [':host { display: contents; }'],
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  readonly index = input.required<number>();

  @ViewChild(ProjectDetailDialogComponent) private projectDialog?: ProjectDetailDialogComponent;
  @ViewChild('repoMenu') private repoMenu?: ElementRef<HTMLDetailsElement>;

  @HostListener('document:pointerdown', ['$event'])
  protected closeRepositoryMenuOnOutsideClick(event: PointerEvent): void {
    const menu = this.repoMenu?.nativeElement;
    const target = event.target;

    if (!menu?.open || !(target instanceof Node) || menu.contains(target)) {
      return;
    }

    menu.open = false;
  }

  protected screenshot(project: Project): string {
    return project.coverImage || project.screenshots[0] || '';
  }

  protected isIconPreview(path: string): boolean {
    return path.toLowerCase().endsWith('.svg');
  }

  protected description(project: Project): string {
    return project.shortDescription || project.description || 'Proyecto documentado pendiente de completar.';
  }

  protected previewKind(project: Project): string {
    if (project.type.includes('api') || project.type.includes('backend')) {
      return 'api';
    }

    if (project.technologies.database.length > 0) {
      return 'data';
    }

    if (project.type.includes('fullstack')) {
      return 'dashboard';
    }

    return 'web';
  }

  protected technologyTags(project: Project): string[] {
    const technologies = project.technologies;

    return [
      ...technologies.frontend,
      ...technologies.backend,
      ...technologies.database,
      ...technologies.mobile,
      ...technologies.infrastructure,
      ...technologies.tools,
    ].filter((item, index, values) => item && values.indexOf(item) === index).slice(0, 6);
  }

  protected typeLabel(project: Project): string {
    return project.type.map((item) => item.toUpperCase()).join(' / ');
  }

  protected generatedLabel(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return `Generado: ${value}`;
    }

    return `Generado: ${date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' })}`;
  }

  protected status(project: Project): string {
    return project.status === 'documented' ? 'DOCUMENTADO' : project.status.toUpperCase();
  }

  protected repositoryLinks(project: Project): { label: string; url: string }[] {
    const repository = project.repository?.trim();

    if (!repository) {
      return [];
    }

    const entries = repository
      .split(/;|\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    return entries
      .map((entry, index) => {
        const label = this.repositoryLabel(entry, index);
        const url = this.repositoryUrl(entry);

        return url ? { label, url } : null;
      })
      .filter((link): link is { label: string; url: string } => Boolean(link));
  }

  private repositoryLabel(entry: string, index: number): string {
    const label = entry.match(/^(?<label>[^:]+):/)?.groups?.['label']?.trim();

    return label || (index === 0 ? 'Repositorio' : `Repositorio ${index + 1}`);
  }

  private repositoryUrl(entry: string): string {
    const markdownUrl = entry.match(/\[[^\]]*]\((?<url>https?:\/\/[^)\s]+)\)/i)?.groups?.['url'];
    const plainUrl = entry.match(/https?:\/\/[^\s)\]]+/i)?.[0];

    return (markdownUrl || plainUrl || '').replace(/[.,;]+$/, '').trim();
  }

  protected openDialog(): void {
    this.projectDialog?.open();
  }
}

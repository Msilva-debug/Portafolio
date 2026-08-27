import { NgTemplateOutlet } from '@angular/common';
import { Component, ViewChild, input } from '@angular/core';
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

  protected screenshot(project: Project): string {
    return project.screenshots[0] ?? '';
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

  protected openDialog(): void {
    this.projectDialog?.open();
  }
}

import { Component, input } from '@angular/core';
import { Project } from '../project.model';

@Component({
  selector: 'app-project-card',
  imports: [],
  templateUrl: './project-card.html',
  styles: [':host { display: contents; }'],
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  readonly index = input.required<number>();

  protected screenshot(project: Project): string {
    return project.screenshots[0] ?? '';
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
    ].filter((item, index, values) => item && values.indexOf(item) === index);
  }

  protected detail(project: Project): string {
    return project.technicalHighlights[0]
      || project.architecture
      || project.features[0]
      || 'Información técnica pendiente de documentar.';
  }

  protected status(project: Project): string {
    return project.status === 'documented' ? 'DOCUMENTADO' : project.status.toUpperCase();
  }
}

import { Component, ElementRef, ViewChild, input } from '@angular/core';
import { Project, ProjectTechnologies } from '../project.model';

@Component({
  selector: 'app-project-detail-dialog',
  imports: [],
  templateUrl: './project-detail-dialog.html',
  styles: [':host { display: contents; }'],
})
export class ProjectDetailDialogComponent {
  readonly project = input.required<Project>();
  readonly summary = input.required<string>();

  @ViewChild('projectDialog') private projectDialog?: ElementRef<HTMLDialogElement>;

  open(): void {
    this.projectDialog?.nativeElement.showModal();
  }

  protected close(): void {
    this.projectDialog?.nativeElement.close();
  }

  protected technologyGroups(project: Project): { label: string; items: string[] }[] {
    const labels: Record<keyof ProjectTechnologies, string> = {
      frontend: 'Frontend',
      backend: 'Backend',
      database: 'Base de datos',
      mobile: 'Móvil',
      infrastructure: 'Infraestructura',
      tools: 'Herramientas',
    };

    return (Object.entries(project.technologies) as [keyof ProjectTechnologies, string[]][])
      .filter(([, items]) => items.length > 0)
      .map(([key, items]) => ({ label: labels[key], items }));
  }

  protected imageName(path: string): string {
    return path.split('/').pop() || path;
  }
}

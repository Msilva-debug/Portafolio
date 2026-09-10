import { Component, ElementRef, OnDestroy, ViewChild, input } from '@angular/core';
import { Project, ProjectTechnologies } from '../project.model';

@Component({
  selector: 'app-project-detail-dialog',
  imports: [],
  templateUrl: './project-detail-dialog.html',
  styles: [':host { display: contents; }'],
})
export class ProjectDetailDialogComponent implements OnDestroy {
  readonly project = input.required<Project>();
  readonly summary = input.required<string>();

  @ViewChild('projectDialog') private projectDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('dialogShell') private dialogShell?: ElementRef<HTMLElement>;

  open(): void {
    this.projectDialog?.nativeElement.showModal();
    this.dialogShell?.nativeElement.scrollTo({ top: 0 });
    document.documentElement.classList.add('dialog-open');
    document.body.classList.add('dialog-open');
  }

  ngOnDestroy(): void {
    document.documentElement.classList.remove('dialog-open');
    document.body.classList.remove('dialog-open');
  }

  protected close(): void {
    this.projectDialog?.nativeElement.close();
  }

  protected onDialogClose(): void {
    document.documentElement.classList.remove('dialog-open');
    document.body.classList.remove('dialog-open');
  }

  protected closeOnBackdropClick(event: MouseEvent): void {
    if (event.target === this.projectDialog?.nativeElement) {
      this.close();
    }
  }

  protected stopModalInteraction(event: Event): void {
    event.stopPropagation();
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

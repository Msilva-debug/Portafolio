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
}

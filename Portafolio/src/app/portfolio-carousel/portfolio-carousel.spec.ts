import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PortfolioCarouselComponent } from './portfolio-carousel';

@Component({
  imports: [PortfolioCarouselComponent],
  template: `
    <app-portfolio-carousel [items]="items" label="Carrusel de prueba">
      <ng-template #carouselItem let-item let-index="index">
        <span class="projected-item">{{ index }} · {{ item }}</span>
      </ng-template>
    </app-portfolio-carousel>
  `,
})
class CarouselTestHost {
  items = ['Uno', 'Dos'];
}

describe('PortfolioCarouselComponent', () => {
  let fixture: ComponentFixture<CarouselTestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselTestHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CarouselTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders three seamless copies while exposing only the central one to assistive technology', () => {
    const root = fixture.nativeElement as HTMLElement;
    const entries = Array.from(root.querySelectorAll<HTMLElement>('.portfolio-carousel-item'));

    expect(entries.length).toBe(6);
    expect(entries.slice(0, 2).every((entry) => entry.getAttribute('aria-hidden') === 'true')).toBeTrue();
    expect(entries.slice(2, 4).every((entry) => !entry.hasAttribute('aria-hidden'))).toBeTrue();
    expect(entries.slice(4).every((entry) => entry.getAttribute('aria-hidden') === 'true')).toBeTrue();
    expect(entries.map((entry) => entry.textContent?.trim())).toEqual([
      '0 · Uno', '1 · Dos', '0 · Uno', '1 · Dos', '0 · Uno', '1 · Dos',
    ]);
  });

  it('renders a single item once without hiding it', async () => {
    fixture.componentInstance.items = ['Único'];
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const entries = root.querySelectorAll<HTMLElement>('.portfolio-carousel-item');
    expect(entries.length).toBe(1);
    expect(entries[0].hasAttribute('aria-hidden')).toBeFalse();
    expect(entries[0].textContent).toContain('Único');
  });
});

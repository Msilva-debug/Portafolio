import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  TemplateRef,
  ViewChild,
  afterNextRender,
  computed,
  effect,
  input,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type PortfolioCarouselVariant =
  | 'professional-project'
  | 'professional-certification'
  | 'playful-project'
  | 'playful-certification';

type CarouselEntry<T> = {
  item: T;
  index: number;
  copy: number;
  key: string;
};

type CarouselItemContext<T> = {
  $implicit: T;
  index: number;
};

@Component({
  selector: 'app-portfolio-carousel',
  imports: [NgTemplateOutlet],
  templateUrl: './portfolio-carousel.html',
  styleUrl: './portfolio-carousel.css',
})
export class PortfolioCarouselComponent<T> implements AfterViewInit, OnDestroy {
  private autoplayFrame?: number;
  private autoplayLastTime?: number;
  private trackOffset = 0;
  private selectedItem?: HTMLElement;
  private transitionTimer?: number;
  private drag?: { pointerId: number; lastX: number; moved: boolean };

  @ContentChild('carouselItem', { read: TemplateRef })
  protected itemTemplate?: TemplateRef<CarouselItemContext<T>>;
  @ViewChild('viewport') private viewport?: ElementRef<HTMLElement>;
  @ViewChild('track') private track?: ElementRef<HTMLElement>;

  readonly items = input<readonly T[]>([]);
  readonly label = input('Carrusel');
  readonly speed = input(44);
  readonly variant = input<PortfolioCarouselVariant>('playful-project');

  protected readonly carouselItems = computed<CarouselEntry<T>[]>(() => {
    const items = this.items();
    const copies = items.length > 1 ? [0, 1, 2] : [1];

    return copies.flatMap((copy) => items.map((item, index) => ({
      item,
      index,
      copy,
      key: `${copy}-${index}`,
    })));
  });

  constructor(private readonly host: ElementRef<HTMLElement>, injector: Injector) {
    effect((onCleanup) => {
      this.items();
      this.stopAutoplay();
      this.trackOffset = 0;

      const render = afterNextRender(() => untracked(() => {
        const track = this.track?.nativeElement;
        if (track) {
          track.style.transform = '';
        }
        this.startAutoplay();
      }), { injector });

      onCleanup(() => render.destroy());
    });
  }

  ngAfterViewInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    window.clearTimeout(this.transitionTimer);
  }

  @HostListener('document:pointerdown', ['$event'])
  @HostListener('document:focusin', ['$event'])
  protected resumeFromOutside(event: Event): void {
    const target = event.target;
    if (this.selectedItem && target instanceof Node && !this.host.nativeElement.contains(target)) {
      this.resume();
    }
  }

  /** Lets a projected card resume autoplay after closing one of its own controls. */
  resume(): void {
    this.selectedItem = undefined;
    this.startAutoplay();
  }

  protected selectItem(event: Event): void {
    if (
      this.items().length <= 1
      || this.reducedMotion()
      || this.isInteractiveTarget(event.target)
      || !(event.currentTarget instanceof HTMLElement)
    ) {
      return;
    }

    this.selectedItem = event.currentTarget;
    this.stopAutoplay();
    this.centerItem(event.currentTarget);
  }

  protected nudge(event: WheelEvent): void {
    if (this.items().length <= 1 || this.reducedMotion()) {
      return;
    }

    const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 18
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 240 : 1;

    event.preventDefault();
    this.selectedItem = undefined;
    this.autoplayLastTime = undefined;
    this.trackOffset = this.shiftOffset(this.trackOffset, dominantDelta * multiplier * 1.25);
    this.setTrackOffset(this.trackOffset);
    this.startAutoplay();
  }

  protected beginDrag(event: PointerEvent): void {
    if (
      event.pointerType !== 'touch'
      || this.items().length <= 1
      || this.reducedMotion()
      || this.isInteractiveTarget(event.target)
    ) {
      return;
    }

    this.drag = { pointerId: event.pointerId, lastX: event.clientX, moved: false };
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  protected moveDrag(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) {
      return;
    }

    const delta = this.drag.lastX - event.clientX;
    if (Math.abs(delta) < 1) {
      return;
    }

    this.drag.lastX = event.clientX;
    this.drag.moved = true;
    event.preventDefault();
    this.stopAutoplay();
    this.trackOffset = this.shiftOffset(this.trackOffset, delta);
    this.setTrackOffset(this.trackOffset);
  }

  protected endDrag(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) {
      return;
    }

    const moved = this.drag.moved;
    this.drag = undefined;
    if (event.currentTarget instanceof HTMLElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (moved) {
      this.startAutoplay();
    }
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    if (this.items().length <= 1 || this.selectedItem || this.reducedMotion()) {
      return;
    }
    this.autoplayFrame = requestAnimationFrame((time) => this.runAutoplay(time));
  }

  private stopAutoplay(): void {
    if (this.autoplayFrame !== undefined) {
      cancelAnimationFrame(this.autoplayFrame);
      this.autoplayFrame = undefined;
    }
    this.autoplayLastTime = undefined;
  }

  private runAutoplay(time: number): void {
    const track = this.track?.nativeElement;
    if (!track || this.items().length <= 1 || this.selectedItem || this.reducedMotion()) {
      this.autoplayFrame = undefined;
      this.autoplayLastTime = undefined;
      return;
    }

    this.autoplayLastTime ??= time;
    const elapsedSeconds = Math.min(time - this.autoplayLastTime, 80) / 1000;
    this.autoplayLastTime = time;
    this.trackOffset = this.nextOffset(this.trackOffset, this.speed() * elapsedSeconds);
    this.setTrackOffset(this.trackOffset);
    this.autoplayFrame = requestAnimationFrame((nextTime) => this.runAutoplay(nextTime));
  }

  private nextOffset(currentOffset: number, distance: number): number {
    const loopDistance = this.loopDistance();
    if (loopDistance <= 0) {
      return 0;
    }

    const normalized = currentOffset >= loopDistance && currentOffset < loopDistance * 2
      ? currentOffset
      : loopDistance + (((currentOffset % loopDistance) + loopDistance) % loopDistance);
    const next = normalized + distance;
    return next >= loopDistance * 2 ? next - loopDistance : next;
  }

  private shiftOffset(currentOffset: number, distance: number): number {
    const loopDistance = this.loopDistance();
    return loopDistance <= 0
      ? 0
      : loopDistance + ((((currentOffset + distance) % loopDistance) + loopDistance) % loopDistance);
  }

  private loopDistance(): number {
    const duplicateStart = this.track?.nativeElement.querySelectorAll<HTMLElement>('.portfolio-carousel-item')[this.items().length];
    return duplicateStart?.offsetLeft || 0;
  }

  private centerItem(item: HTMLElement): void {
    const viewport = this.viewport?.nativeElement;
    const track = this.track?.nativeElement;
    if (!viewport || !track) {
      return;
    }

    const viewportBounds = viewport.getBoundingClientRect();
    const itemBounds = item.getBoundingClientRect();
    const delta = itemBounds.left - viewportBounds.left - ((viewport.clientWidth - itemBounds.width) / 2);
    const transform = new DOMMatrixReadOnly(getComputedStyle(track).transform);
    this.trackOffset = Math.abs(transform.m41 || 0) + delta;
    this.setTrackOffset(this.trackOffset, true);
  }

  private setTrackOffset(offset: number, animate = false): void {
    const track = this.track?.nativeElement;
    if (!track) {
      return;
    }

    window.clearTimeout(this.transitionTimer);
    track.style.transition = animate ? 'transform .34s cubic-bezier(.2,0,0,1)' : '';
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    if (animate) {
      this.transitionTimer = window.setTimeout(() => track.style.transition = '', 360);
    }
  }

  private reducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement
      && Boolean(target.closest('a, button, details, summary, input, select, textarea, [role="button"]'));
  }
}

import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  ElementRef,
  Renderer2,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'xont-ventura-collapsible',
  template: `
    <button
      id="{{ id }}"
      class="linkButton Linkboldtext"
      (click)="onClick()"
      style="text-decoration: none; border: none; background: none; cursor: pointer; padding: 0;"
      [attr.aria-expanded]="!_collapsed"
      [attr.aria-controls]="targetElementID"
      type="button"
    >
      <img [src]="imgSrc" style="border-width:0px; vertical-align: middle;" />
      &nbsp;
      <span>{{ text }}</span>
    </button>
  `,
  styles: [
    `
      .linkButton {
        color: inherit;
        font: inherit;
      }

      .linkButton:hover {
        opacity: 0.8;
      }

      .linkButton:focus {
        outline: 2px solid #007bff;
        outline-offset: 2px;
      }
    `,
  ],
})
export class XontVenturaCollapsibleComponent
  implements AfterViewInit, OnInit, OnChanges
{
  text = 'Selection criteria';
  imgSrc = '../images/imgup.png';

  @Input() id!: string;
  @Input() targetElementID!: string;
  @Input() collapsedText = '';
  @Input() expandedText = '';

  public _collapsed = true;

  @Input()
  set collapsed(val: boolean) {
    this._collapsed = val;
    this.updateState();
  }

  get collapsed(): boolean {
    return this._collapsed;
  }

  @Output() onChange = new EventEmitter<boolean>();

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.updateText();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['collapsedText'] || changes['expandedText']) {
      this.updateText();
    }
  }

  ngAfterViewInit(): void {
    this.updateState();
  }

  private updateState(): void {
    if (this._collapsed) {
      this.hide();
    } else {
      this.show();
    }
  }

  private updateText(): void {
    if (this._collapsed) {
      this.text = this.collapsedText || 'Selection Criteria';
    } else {
      this.text = this.expandedText || 'Hide';
    }
  }

  show(): void {
    this.text = this.expandedText || 'Hide';
    this.imgSrc = '../images/imgdown.png';
    this.toggleTargetElement(true);
  }

  hide(): void {
    this.text = this.collapsedText || 'Selection Criteria';
    this.imgSrc = '../images/imgup.png';
    this.toggleTargetElement(false);
  }

  private toggleTargetElement(show: boolean): void {
    const targetElement = document.getElementById(this.targetElementID);
    if (targetElement) {
      if (show) {
        this.renderer.removeClass(targetElement, 'collapsed');
        this.renderer.addClass(targetElement, 'expanded');
        this.renderer.setStyle(targetElement, 'display', 'block');
      } else {
        this.renderer.addClass(targetElement, 'collapsed');
        this.renderer.removeClass(targetElement, 'expanded');
        this.renderer.setStyle(targetElement, 'display', 'none');
      }
    }
  }

  onClick(): void {
    this._collapsed = !this._collapsed;
    this.updateState();
    this.updateText();
    this.onChange.emit(this._collapsed);
  }

  // Public methods for programmatic control
  public toggle(): void {
    this.onClick();
  }

  public expand(): void {
    if (this._collapsed) {
      this.onClick();
    }
  }

  public collapse(): void {
    if (!this._collapsed) {
      this.onClick();
    }
  }

  // Method to handle image loading errors
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Fallback to CSS-based arrows if images fail to load
    this.renderer.setStyle(img, 'display', 'none');
    const button = this.elementRef.nativeElement.querySelector('button');
    const pseudoElement = this._collapsed ? '▶' : '▼';
    this.renderer.setStyle(button, 'position', 'relative');
    this.renderer.setStyle(button, 'paddingLeft', '20px');

    const arrow =
      this.elementRef.nativeElement.querySelector('.arrow-indicator');
    if (!arrow) {
      const arrowSpan = this.renderer.createElement('span');
      this.renderer.addClass(arrowSpan, 'arrow-indicator');
      this.renderer.setStyle(arrowSpan, 'position', 'absolute');
      this.renderer.setStyle(arrowSpan, 'left', '0');
      this.renderer.setStyle(arrowSpan, 'top', '50%');
      this.renderer.setStyle(arrowSpan, 'transform', 'translateY(-50%)');
      this.renderer.setProperty(arrowSpan, 'textContent', pseudoElement);
      this.renderer.insertBefore(button, arrowSpan, button.firstChild);
    } else {
      this.renderer.setProperty(arrow, 'textContent', pseudoElement);
    }
  }
}

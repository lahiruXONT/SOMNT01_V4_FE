import {
  Component,
  Input,
  Output,
  EventEmitter,
  Renderer2,
  ElementRef,
  AfterViewInit,
  ViewChild,
  HostBinding,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; // Import CommonModule for common directives if needed later

// --- Component Definition ---
@Component({
  selector: 'xont-ventura-collapsible',
  // 1. Use standalone: true
  standalone: true,
  // 2. Import necessary modules (CommonModule for common directives like *ngIf, though not used here directly in this template)
  imports: [CommonModule],
  // 3. Template - Updated to use property bindings and potentially prepare for animation/CSS-based toggle
  template: `
    <span
      class="linkButton Linkboldtext"
      style="text-decoration: none; cursor: pointer;"
      (click)="onClick()"
    >
      <img [src]="imgSrc" style="border-width:0px;" alt="Toggle" /> &nbsp;
      {{ displayText }}
    </span>
  `,
  // 4. Styles - Add basic styles or rely on global styles
  styles: [
    `
      /* Add component-specific styles here if needed */
      .linkButton {
        /* Example base styles */
        /* color: blue; */
        /* text-decoration: underline; */
      }
    `,
  ],
})
export class XontVenturaCollapsibleComponent implements AfterViewInit {
  // --- Inputs and Outputs ---
  @Input() id?: string; // Make optional
  @Input() targetElementID?: string; // Make optional
  @Input() collapsedText?: string = '';
  @Input() expandedText?: string = '';

  // Internal state for collapsed
  private _collapsed: boolean = true;

  @Input('collapsed')
  set collapsed(val: boolean) {
    if (this._collapsed !== val) {
      // Only update if value changes
      this._collapsed = val;
      this.updateUI(); // Update UI based on new state
      // Consider emitting only on change if needed, or emit every time
      // this.onChange.emit(this._collapsed);
    }
  }
  get collapsed(): boolean {
    return this._collapsed;
  }

  @Output() onChange = new EventEmitter<boolean>();

  // --- Component State ---
  imgSrc: string = '../images/imgup.png'; // Default to 'up' (collapsed)
  displayText: string = 'Selection Criteria'; // Default text

  // --- Constructor ---
  constructor(
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Inject Renderer2 for safer DOM manipulation
    // Initialization logic if needed
  }

  // --- Lifecycle Hooks ---
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      console.log('Collapsible view init, collapsed:', this._collapsed);
      this.updateUI();
    }
  }

  // --- Public Methods ---
  // The onClick method is the primary interaction point
  onClick(): void {
    // Toggle the collapsed state
    this._collapsed = !this._collapsed;

    // Update the UI based on the new state
    this.updateUI();

    // Emit the change event with the new state
    this.onChange.emit(this._collapsed);
  }

  // --- Private Helper Methods ---
  private updateUI(): void {
    // --- Determine Image Source ---
    this.imgSrc = this._collapsed
      ? '../images/imgup.png'
      : '../images/imgdown.png';

    // --- Determine Display Text ---
    if (this._collapsed) {
      // Use collapsedText if provided, otherwise default
      this.displayText =
        this.collapsedText && this.collapsedText.trim() !== ''
          ? this.collapsedText
          : 'Selection Criteria';
    } else {
      // Use expandedText if provided, otherwise default
      this.displayText =
        this.expandedText && this.expandedText.trim() !== ''
          ? this.expandedText
          : 'Hide';
    }

    // --- Update Target Element Visibility ---
    // Attempt to find and manipulate the target element
    if (this.targetElementID) {
      const targetElement = document.getElementById(this.targetElementID);
      if (targetElement) {
        // --- Option 1: Rely on CSS Classes (Recommended) ---
        // Assumes your global CSS or the target element's CSS handles
        // the 'show'/'hide' or 'collapse' classes correctly.
        // For Bootstrap collapse, you would typically add/remove 'show' class.
        // This is the cleanest Angular way if your CSS framework supports it.
        //
        // Example for Bootstrap 4/5 collapse (requires Bootstrap JS or manual handling):
        // if (this._collapsed) {
        //   this.renderer.removeClass(targetElement, 'show');
        //   // Or add 'collapse' class if needed for animation setup
        // } else {
        //   this.renderer.addClass(targetElement, 'show');
        //   // Or remove 'collapse' class if needed
        // }

        // --- Option 2: Direct Style Manipulation (Less preferred, but works without CSS framework JS) ---
        // This mimics the basic show/hide behavior.
        if (this._collapsed) {
          this.renderer.setStyle(targetElement, 'display', 'none');
        } else {
          this.renderer.setStyle(targetElement, 'display', 'block'); // Or 'initial', 'flex', etc., depending on original style
        }

        // --- Option 3: Using jQuery (NOT RECOMMENDED for Angular 19) ---
        // This is what the original component did, but we are trying to remove jQuery.
        // if (typeof $ !== 'undefined') {
        //   if (this._collapsed) {
        //     $(`#${this.targetElementID}`).collapse('hide');
        //   } else {
        //     $(`#${this.targetElementID}`).collapse('show');
        //   }
        // }
        // If you *must* use jQuery for complex animations not easily replicated,
        // ensure jQuery is loaded globally and handle potential SSR issues.
      } else {
        console.warn(
          `Target element with ID '${this.targetElementID}' not found for collapsible component.`
        );
      }
    } else {
      // console.warn('targetElementID input is not set for collapsible component.');
    }
  }
}

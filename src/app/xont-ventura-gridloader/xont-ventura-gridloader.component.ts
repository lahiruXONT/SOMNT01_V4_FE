import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
// 1. Import necessary modules for standalone component and Reactive Forms
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms'; // Import ReactiveFormsModule and FormControl

// --- Component Definition ---
@Component({
  selector: 'xont-ventura-gridloader',
  standalone: true, // 2. Mark as standalone
  // 3. Import necessary modules
  imports: [
    CommonModule, // For directives like *ngIf (though not used here, good practice)
    ReactiveFormsModule, // For formControl
  ],
  // 4. Template - Updated to use formControl and Angular event bindings
  template: `
    <span
      id="lblTotalAmount"
      style="padding-right:5px;font-size: 11px;border-width: 0px;"
      class="Textboxstyle"
      >{{ recordsCountSummary }}</span
    >
    <button
      type="button"
      name="btnFirst"
      id="btnFirst"
      (click)="btnFirst_OnClick()"
      class="skipfwrdleft"
      [disabled]="currentPageControl.value ?? 0 <= 1"
    ></button>
    <button
      type="button"
      name="btnPrev"
      id="btnPrev"
      (click)="btnPrev_OnClick()"
      class="fwrdleft"
      [disabled]="currentPageControl.value ?? 0 <= 1"
    ></button>
    <!-- 5. Replace [(ngModel)] with [formControl] -->
    <input
      name="txtCurrentPage"
      type="text"
      [formControl]="currentPageControl"
      (keypress)="currentPage_OnKeypress($event)"
      (blur)="currentPage_OnBlur()"
      [maxlength]="MaxLen"
      class="Textboxstyle"
      id="txtCurrentPage"
      style="width:40px;height:22px"
    />
    <span class="Captionstyle">&nbsp;OF</span>
    <input
      name="txtTotalPages"
      type="text"
      [value]="TotalPage"
      disabled
      id="txtTotalPages"
      tabindex="-1"
      class="Textboxstyle"
      style="width:40px;height:22px"
    />
    <button
      type="button"
      name="btnNext"
      id="btnNext"
      (click)="btnNext_OnClick()"
      class="fwrdright"
      [disabled]="currentPageControl.value ?? 0 >= TotalPage"
    ></button>
    <button
      type="button"
      name="btnLast"
      id="btnLast"
      (click)="btnLast_OnClick()"
      class="skipfwrdright"
      [disabled]="currentPageControl.value ?? 0 >= TotalPage"
    ></button>
  `,
  styles: [
    // Add component-specific styles here if needed, or rely on global styles
    // Example:
    // `
    // .Textboxstyle {
    //   /* Your styles */
    // }
    // .Captionstyle {
    //   /* Your styles */
    // }
    // .skipfwrdleft, .fwrdleft, .fwrdright, .skipfwrdright {
    //   /* Your button styles */
    // }
    // `
  ],
})
export class XontVenturaGridLoaderComponent implements OnInit {
  // Implement OnInit if needed for initialization logic

  // --- Properties ---
  public RowStart: number = 0;
  public RowEnd: number = 0;
  // 6. Use FormControl for the current page input
  public currentPageControl = new FormControl<number>(1); // Initialize with 1
  public TotalPage: number = 0;
  public TaskCode: string = '';
  public MaxLen: number = 1; // Make public if accessed in template
  public LastCurrentPage: number = 1;
  public recordsCountSummary: string = '';

  // --- Outputs ---
  @Output()
  onChange: EventEmitter<any> = new EventEmitter();

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    // If you need initialization logic, put it here
    // For example, subscribing to value changes of the FormControl
    // this.currentPageControl.valueChanges.subscribe(value => {
    //   console.log('Current page changed:', value);
    // });
  }

  // --- Public Methods ---
  public init(taskCode: string): void {
    this.TaskCode = taskCode;
    // Reset state on init if needed
    this.currentPageControl.setValue(1);
    this.LastCurrentPage = 1;
    this.TotalPage = 0;
    this.MaxLen = 1;
    this.recordsCountSummary = '';
    this.RowStart = 0;
    this.RowEnd = 0;
  }

  public getPageSize(): number {
    try {
      const dataStr = localStorage.getItem(
        this.TaskCode + '_MasterControlData'
      );
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data) {
          if (data.AllowPaging === '1') {
            return data.PageSize;
          } else {
            return data.ExtendedPageSize;
          }
        }
      }
    } catch (e) {
      console.error(`Error parsing MasterControlData for ${this.TaskCode}:`, e);
    }
    return 10; // Default page size
  }

  public getRowStart(): number {
    if (this.RowStart < 1) {
      this.RowStart = 1;
    }
    return this.RowStart;
  }

  public getRowEnd(): number {
    if (this.RowEnd < 1) {
      if (this.RowStart < 1) {
        this.RowStart = 1;
      }
      const loadSize = this.getLoadSize();
      this.RowEnd = this.RowStart + loadSize - 1;
    }
    return this.RowEnd;
  }

  public setRowCount(rowTotal: number): void {
    const loadSize = this.getLoadSize();
    this.TotalPage = Math.ceil(rowTotal / loadSize);
    this.MaxLen = this.TotalPage.toString().length;
    this.showCurrentRowCount(rowTotal);
    // Update the TotalPage input display (though it's disabled, binding [value] is fine)
    // The TotalPage property itself is updated above.
  }

  public setCurrentPage(num: number): void {
    // Update the FormControl value
    this.currentPageControl.setValue(num, { emitEvent: false }); // Don't emit event if setting programmatically
    this.LastCurrentPage = num;
    // Optionally emit if needed when setting programmatically
    // this.emit();
  }

  // --- Private Helper Methods ---
  private showCurrentRowCount(rowTotal: number): void {
    const loadSize: number = this.getLoadSize();
    let currentTotalRecords: number = 0;
    // Use the value from the FormControl
    const currentPageValue = this.currentPageControl.value ?? 1;
    if (this.TotalPage === currentPageValue) {
      currentTotalRecords = rowTotal;
    } else {
      currentTotalRecords = loadSize * currentPageValue;
    }
    this.recordsCountSummary = `${currentTotalRecords}/${rowTotal}`;
  }

  public getLoadSize(): number {
    try {
      const dataStr = localStorage.getItem(
        this.TaskCode + '_MasterControlData'
      );
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data) {
          if (data.AllowPaging === '1') {
            return data.LoadSize;
          } else {
            return data.ExtendedPageSize;
          }
        }
      }
    } catch (e) {
      console.error(`Error parsing MasterControlData for ${this.TaskCode}:`, e);
    }
    return 10; // Default load size
  }

  private emit(): void {
    const loadSize = this.getLoadSize();
    // Use the value from the FormControl
    const currentPageValue = this.currentPageControl.value ?? 1;
    this.RowStart = (currentPageValue - 1) * loadSize + 1;
    this.RowEnd = this.RowStart + loadSize - 1;
    this.onChange.emit();
  }

  // --- Event Handlers ---
  public btnFirst_OnClick() {
    // Use the value from the FormControl
    const currentPageValue = this.currentPageControl.value ?? 1;
    if (currentPageValue > 1) {
      this.currentPageControl.setValue(1);
      this.LastCurrentPage = 1;
      this.emit();
    }
  }

  public btnPrev_OnClick() {
    // Use the value from the FormControl
    const currentPageValue = this.currentPageControl.value ?? 1;
    if (currentPageValue > 1) {
      this.currentPageControl.setValue(currentPageValue - 1);
      this.LastCurrentPage = currentPageValue - 1;
      this.emit();
    }
  }

  public btnNext_OnClick() {
    // Use the value from the FormControl
    const currentPageValue = this.currentPageControl.value ?? 1;
    if (currentPageValue < this.TotalPage) {
      this.currentPageControl.setValue(currentPageValue + 1);
      this.LastCurrentPage = currentPageValue + 1;
      this.emit();
    }
  }

  public btnLast_OnClick() {
    // Use the value from the FormControl
    const currentPageValue = this.currentPageControl.value ?? 1;
    if (currentPageValue < this.TotalPage) {
      this.currentPageControl.setValue(this.TotalPage);
      this.LastCurrentPage = this.TotalPage;
      this.emit();
    }
  }

  public currentPage_OnKeypress(event: KeyboardEvent) {
    // Allow numbers (0-9) and control keys (Backspace, Delete, Tab, Escape, Enter, Arrow keys)
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
    ];
    const isNumber = event.key >= '0' && event.key <= '9';
    const isAllowedKey = allowedKeys.includes(event.key);

    if (!isNumber && !isAllowedKey) {
      event.preventDefault(); // Prevent non-numeric and non-allowed keys
    }
  }

  public currentPage_OnBlur() {
    // Use the value from the FormControl
    const currentPageValue = this.currentPageControl.value;
    if (
      currentPageValue !== null &&
      currentPageValue !== undefined &&
      currentPageValue !== this.LastCurrentPage
    ) {
      if (currentPageValue > 0 && currentPageValue <= this.TotalPage) {
        this.LastCurrentPage = currentPageValue;
        this.emit();
      } else {
        // Revert to the last valid page if input is invalid
        this.currentPageControl.setValue(this.LastCurrentPage, {
          emitEvent: false,
        });
      }
    }
  }
}

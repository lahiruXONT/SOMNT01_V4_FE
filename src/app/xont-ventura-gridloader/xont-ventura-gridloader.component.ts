import { Component, Output, EventEmitter, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'xont-ventura-gridloader',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <span
      id="lblTotalAmount"
      style="padding-right:5px;font-size: 11px;border-width: 0px;"
      class="Textboxstyle"
    >
      {{ recordsCountSummary }}
    </span>

    <button
      type="button"
      name="btnFirst"
      id="btnFirst"
      (click)="btnFirst_OnClick()"
      class="skipfwrdleft"
      [disabled]="CurrentPage <= 1"
    ></button>

    <button
      type="button"
      name="btnPrev"
      id="btnPrev"
      (click)="btnPrev_OnClick()"
      class="fwrdleft"
      [disabled]="CurrentPage <= 1"
    ></button>

    <input
      name="txtCurrentPage"
      type="text"
      [(ngModel)]="CurrentPage"
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
      [ngModel]="TotalPage"
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
      [disabled]="CurrentPage >= TotalPage"
    ></button>

    <button
      type="button"
      name="btnLast"
      id="btnLast"
      (click)="btnLast_OnClick()"
      class="skipfwrdright"
      [disabled]="CurrentPage >= TotalPage"
    ></button>
  `,
})
export class XontVenturaGridLoaderComponent {
  private storage = inject(Storage);

  public RowStart: number = 0;
  public RowEnd: number = 0;
  public CurrentPage: number = 1;
  public TotalPage: number = 0;
  private TaskCode: string = '';
  public MaxLen: number = 1;
  private LastCurrentPage: number = 1;
  public recordsCountSummary: string = '';

  @Output()
  onChange: EventEmitter<void> = new EventEmitter<void>();

  public init(taskCode: string): void {
    this.TaskCode = taskCode;
  }

  public getPageSize(): number {
    const data = this.getMasterControlData();
    return data?.AllowPaging === '1'
      ? data.PageSize
      : data?.ExtendedPageSize || 0;
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
  }

  private showCurrentRowCount(rowTotal: number): void {
    const loadSize = this.getLoadSize();

    let currentTotalRecords: number;
    if (this.TotalPage === this.CurrentPage) {
      currentTotalRecords = rowTotal;
    } else {
      currentTotalRecords = loadSize * this.CurrentPage;
    }

    this.recordsCountSummary = `${currentTotalRecords}/${rowTotal}`;
  }

  public getLoadSize(): number {
    const data = this.getMasterControlData();
    return data?.AllowPaging === '1'
      ? data.LoadSize
      : data?.ExtendedPageSize || 0;
  }

  private getMasterControlData(): any {
    try {
      const storedData = this.storage.getItem(
        `${this.TaskCode}_MasterControlData`
      );
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error('Error parsing MasterControlData:', error);
      return null;
    }
  }

  private emit(): void {
    const loadSize = this.getLoadSize();
    this.RowStart = (this.CurrentPage - 1) * loadSize + 1;
    this.RowEnd = this.RowStart + loadSize - 1;
    this.onChange.emit();
  }

  btnFirst_OnClick(): void {
    if (this.CurrentPage > 1) {
      this.CurrentPage = 1;
      this.LastCurrentPage = 1;
      this.emit();
    }
  }

  btnPrev_OnClick(): void {
    if (this.CurrentPage > 1) {
      this.CurrentPage--;
      this.LastCurrentPage = this.CurrentPage;
      this.emit();
    }
  }

  btnNext_OnClick(): void {
    if (this.CurrentPage < this.TotalPage) {
      this.CurrentPage++;
      this.LastCurrentPage = this.CurrentPage;
      this.emit();
    }
  }

  btnLast_OnClick(): void {
    if (this.CurrentPage < this.TotalPage) {
      this.CurrentPage = this.TotalPage;
      this.LastCurrentPage = this.TotalPage;
      this.emit();
    }
  }

  currentPage_OnKeypress(event: KeyboardEvent): boolean {
    const keyCode = event.keyCode || event.which;
    return (
      (keyCode >= 48 && keyCode <= 57) ||
      keyCode === 8 || // backspace
      keyCode === 46 || // delete
      keyCode === 37 || // left arrow
      keyCode === 39
    ); // right arrow
  }

  currentPage_OnBlur(): void {
    if (this.CurrentPage !== this.LastCurrentPage) {
      if (this.CurrentPage > 0 && this.CurrentPage <= this.TotalPage) {
        this.LastCurrentPage = this.CurrentPage;
        this.emit();
      } else {
        this.CurrentPage = this.LastCurrentPage;
      }
    }
  }

  public setCurrentPage(num: number): void {
    if (num > 0 && num <= this.TotalPage) {
      this.CurrentPage = num;
      this.LastCurrentPage = num;
    }
  }

  public reset(): void {
    this.CurrentPage = 1;
    this.LastCurrentPage = 1;
    this.TotalPage = 0;
    this.RowStart = 0;
    this.RowEnd = 0;
    this.recordsCountSummary = '';
  }
}

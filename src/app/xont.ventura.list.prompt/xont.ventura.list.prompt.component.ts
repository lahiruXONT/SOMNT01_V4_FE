import {
  Component,
  QueryList,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  ViewChildren,
  forwardRef,
} from '@angular/core';
import {
  FormsModule,
  FormGroup,
  ReactiveFormsModule,
  FormControl,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
} from '@angular/forms';
import { ElementRef } from '@angular/core';
import { XontVenturaListPromptService } from '../xont.ventura.list.prompt.service';
import { CommonModule } from '@angular/common';
import { Observable, of, defer } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface PromptData {
  [key: string]: any;
}

interface PromptEntityDefaults {
  dataFields: string[];
  gridFields: string[];
  gridHeaders: string[];
}

type PromptEntityType = 'product' | 'territory' | 'executive' | 'retailer';

@Component({
  selector: 'xont-ventura-list-prompt',
  templateUrl: './xont.ventura.list.prompt.component.html',
  styleUrls: ['./xont.ventura.list.prompt.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ListPromptComponent),
      multi: true,
    },
  ],
})
export class ListPromptComponent implements ControlValueAccessor {
  private _originalDataSet: PromptData[] = [];
  public _dataSet: PromptData[] = [];
  public _minWidth: number = 500;
  public _dataSliderStatus = 'none';
  public _stillDataLoading: boolean = true;
  public _pageSize: number = 10;
  private _lastEmptiedInputIndex = -1;
  public _currentCursorInputIndex = -1;
  pageIndex: number = 0;
  pagedData: PromptData[] = [];
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // Inputs
  @Input() maxLengths: number[] = [];
  @Input() inputWidths: number[] = [120];
  @Input() fields: string[] = [];
  @Input() dataFields: string[] = [];
  @Input() gridFields: string[] = [];
  @Input() gridHeaders: string[] = [];
  @Input() modelProps: string[] = [];
  @Input() headers: string[] = [];
  @Input() mandatory: boolean = false;
  @Input() strict: boolean = false;
  @Input() disabled: boolean = false;
  @Input() control!: FormGroup;
  @Input() type: string = '';
  @Input() status: string = 'All';
  @Input() predefinedPromptArgs: string[] = [];
  @Input() masterGroup: string | null = null;
  @Input() clsGeo: string | null = null;
  @Input() clsRetailer: string | null = null;
  @Input() clsProduct: string | null = null;
  @Input() clsExecutive: string | null = null;
  @Input() territory: string | null = null;

  // Outputs
  @Output() controlChange = new EventEmitter<FormGroup>();
  @Output() onChanged = new EventEmitter<PromptData | null>();
  @Output() onDataBind = new EventEmitter();

  // DOM Refs
  @ViewChild('element') element: ElementRef | undefined;
  @ViewChild('scrollDiv') scrollDiv: ElementRef | undefined;
  @ViewChildren('inputElement') inputElements:
    | QueryList<ElementRef>
    | undefined;
  public dataSourceObservable: Observable<PromptData[]> | null = null;
  filter: string = '';

  private readonly entityDefaults: Record<
    PromptEntityType,
    PromptEntityDefaults
  > = {
    product: {
      dataFields: ['ProductCode', 'Description'],
      gridFields: ['ProductCode', 'Description'],
      gridHeaders: ['Product Code', 'Description'],
    },
    territory: {
      dataFields: ['MasterGroupValue', 'MasterGroupValueDescription'],
      gridFields: ['MasterGroupValue', 'MasterGroupValueDescription'],
      gridHeaders: ['Territory Code', 'Description'],
    },
    executive: {
      dataFields: ['ExecutiveCode', 'ExecutiveName'],
      gridFields: ['ExecutiveCode', 'ExecutiveName'],
      gridHeaders: ['Executive Code', 'Executive Name'],
    },
    retailer: {
      dataFields: ['RetailerCode', 'RetailerName', 'TOWN'],
      gridFields: ['RetailerCode', 'RetailerName', 'TOWN'],
      gridHeaders: ['Retailer Code', 'Retailer Name', 'Town'],
    },
  };

  constructor(private listPromptService: XontVenturaListPromptService) {}

  ngOnInit(): void {
    this.controlChange.emit(this.control);
    this._minWidth = this.inputWidths.reduce((a, b) => a + b, 0) + 15;

    this.gridFields = this.gridFields.length ? this.gridFields : this.fields;
    this.gridHeaders = this.gridHeaders.length
      ? this.gridHeaders
      : this.headers;
    this.dataFields = this.dataFields.length ? this.dataFields : this.fields;
    this.modelProps = this.modelProps || this.dataFields;
  }

  onTouched: any = () => {};
  onChange: any = () => {};

  writeValue(obj: any): void {
    if (obj) {
      const patch: Record<string, string> = {};
      this.modelProps.forEach((prop, index) => {
        const val = obj?.[this.dataFields[index]]?.toString()?.trim() || '';
        patch[prop] = val;
      });
      this.control.patchValue(patch);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  getFormControl(prop: string): FormControl {
    const control = this.control.get([prop]);
    if (!control) throw new Error(`FormControl for "${prop}" does not exist`);
    return control as FormControl;
  }

  get value(): any {
    return this.control.value || {};
  }

  get valid(): boolean {
    if (this._dataSliderStatus === 'block') return false;
    return !this.mandatory || !this.isEmpty;
  }

  get isEmpty(): boolean {
    return this.inputWidths.every((_, i) => !this.value[this.modelProps[i]]);
  }

  get isCurrentFieldEmpty(): boolean {
    return (
      !!this._currentCursorInputIndex &&
      !this.value[this.modelProps[this._currentCursorInputIndex]]
    );
  }

  // Public Methods
  public loadTopOne(): Promise<Observable<any>> {
    return this.loadDefaultData();
  }

  public loadWhenOnlyOne(): Promise<Observable<any>> {
    return this.loadDefaultData(true);
  }

  public loadDefaults(): Promise<Observable<any>> {
    return this.loadDefaultData();
  }

  public focus(): void {
    const tryFocus = () => {
      const firstInput = this.inputElements?.first?.nativeElement;
      if (firstInput) {
        firstInput.focus();
      } else {
        setTimeout(tryFocus, 100);
      }
    };
    tryFocus();
  }

  ClickedOn(e: Event) {
    if ((e.target as HTMLElement).hasAttribute('disabled')) return;
    if (this._dataSliderStatus === 'block') {
      this.focusAndFilter();
    } else {
      if (this._dataSliderStatus === 'none') this._dataSliderStatus = 'block';
      this.PopulateDataSet(() => this.focusAndFilter());
    }
  }

  private focusAndFilter(): void {
    this.focus();
    this._currentCursorInputIndex = 0;

    setTimeout(() => this.FilterSource(false));
  }

  InputMousedIn(_: Event, inputIndex: number): void {
    this._currentCursorInputIndex = inputIndex;
    if (this._dataSliderStatus === 'block') {
      this.FilterSource(false);
    } else {
      this._dataSliderStatus = 'block';
      this.PopulateDataSet(() => this.FilterSource(false));
    }
  }

  InputKeyDown(e: KeyboardEvent, isLast: boolean, inputIndex: number): void {
    if (e.keyCode !== 9) this._currentCursorInputIndex = inputIndex;
    if (e.keyCode === 32 && !this._dataSet) {
      e.preventDefault();
      return;
    }

    if (isLast && e.keyCode === 9 && this._dataSliderStatus === 'block') {
      let item = null;
      if (this.strict && !this.isCurrentFieldEmpty) {
        this.FilterSource(true);
        item = this._dataSet?.[0] ?? null;
      }
      this.SetModel(item);
      this.ResetProps();
    }
  }

  InputKeyUp(_: KeyboardEvent, inputIndex: number): void {
    const target = _.target as HTMLInputElement;
    if (_.keyCode !== 9) {
      this._dataSliderStatus = 'block';
      if (!this._originalDataSet && !this._stillDataLoading) {
        this.PopulateDataSet(() => this.FilterSource(true));
      } else {
        this.FilterSource(true);
      }
    }
    // Handle backspace for focus navigation
    if (_.keyCode == 8 && target.value == '') {
      if (this._lastEmptiedInputIndex < 0) {
        this._lastEmptiedInputIndex = inputIndex;
      } else {
        const focusIndex =
          inputIndex - 1 >= 0 ? inputIndex - 1 : this.inputWidths.length - 1;
        this.inputElements?.toArray()[focusIndex]?.nativeElement.focus();
        this._lastEmptiedInputIndex = -1;
        this._currentCursorInputIndex = focusIndex;
        this.FilterSource(true);
      }
    }
  }

  ItemSelected(item: PromptData): void {
    this.SetModel(item);
    this.ResetProps();
  }

  ClearModel(): void {
    this.SetModel(null);
    this.FilterSource(false);
    this.focus();
  }

  private getCommaSepratedList(columns: string[], prefix: string): string {
    return columns.map((col) => `${prefix}${col}`).join(',');
  }

  private async getObservableReady(): Promise<void> {
    this._stillDataLoading = true;
    await this.onDataBind.emit();

    if (this.type) {
      const handler =
        this.handlers[this.type.toLowerCase() as PromptEntityType];
      if (handler) {
        await handler();
      }
    }

    this.FilterSource(false);
  }

  private handlers: Record<PromptEntityType, () => void> = {
    product: () => {
      const combinedFields = [
        ...new Set([...(this.dataFields || []), ...(this.gridFields || [])]),
      ];
      const selectQueryColumnsArray = combinedFields.filter(
        (col) => !['ProductCode', 'Description', 'Status'].includes(col)
      );
      const selectQueryColumns = this.getCommaSepratedList(
        selectQueryColumnsArray,
        'p.'
      );
      const apiArgs = {
        strict: this.strict,
        clsProduct: this.clsProduct ? this.value[this.clsProduct] : undefined,
        status: this.status,
        filter: this.filter,
        selectQueryColumns,
      };
      this.dataSourceObservable =
        this.listPromptService.GetListPromptProductData(apiArgs);
      if (!this.dataFields.length)
        this.dataFields = ['ProductCode', 'Description'];
      this.dataSourceObservable.subscribe({
        next: (data) => {
          this._dataSet = data;
          this._originalDataSet = data;
          this.setEntityDefaults('product');
          this.FilterSource(false);
        },
        error: () => (this._stillDataLoading = false),
      });
    },
    territory: () => {
      const combinedFields = [
        ...new Set([...(this.dataFields || []), ...(this.gridFields || [])]),
      ];
      const selectQueryColumnsArray = combinedFields.filter(
        (col) =>
          !['MasterGroupValue', 'MasterGroupValueDescription'].includes(col)
      );
      const apiArgs = {
        strict: this.strict,
        status: this.status,
        filter: this.filter,
        selectQueryColumns: selectQueryColumnsArray.join(','),
      };
      this.dataSourceObservable =
        this.listPromptService.GetListPromptTerritoryData(apiArgs);
      if (!this.dataFields.length)
        this.dataFields = ['MasterGroupValue', 'MasterGroupValueDescription'];
      this.dataSourceObservable.subscribe({
        next: (data) => {
          this._dataSet = data;
          this._originalDataSet = data;
          this.setEntityDefaults('territory');
          this.FilterSource(false);
        },
        error: () => (this._stillDataLoading = false),
      });
    },
    executive: () => {
      const combinedFields = [
        ...new Set([...(this.dataFields || []), ...(this.gridFields || [])]),
      ];
      const selectQueryColumnsArray = combinedFields.filter(
        (col) => !['ExecutiveCode', 'ExecutiveName', 'Status'].includes(col)
      );
      const selectQueryColumns = this.getCommaSepratedList(
        selectQueryColumnsArray,
        'e.'
      );
      const apiArgs = {
        strict: this.strict,
        clsGeo: this.clsGeo ? this.value[this.clsGeo] : undefined,
        clsExecutive: this.clsExecutive
          ? this.value[this.clsExecutive]
          : undefined,
        territory: this.territory ? this.value[this.territory] : undefined,
        status: this.status,
        filter: this.filter,
        selectQueryColumns,
      };
      this.dataSourceObservable =
        this.listPromptService.GetListPromptExecutiveData(apiArgs);
      if (!this.dataFields.length)
        this.dataFields = ['ExecutiveCode', 'ExecutiveName'];
      this.dataSourceObservable.subscribe({
        next: (data) => {
          this._dataSet = data;
          this._originalDataSet = data;
          this.setEntityDefaults('executive');
          this.FilterSource(false);
        },
        error: () => (this._stillDataLoading = false),
      });
    },
    retailer: () => {
      const combinedFields = [
        ...new Set([...(this.dataFields || []), ...(this.gridFields || [])]),
      ];
      const selectQueryColumnsArray = combinedFields.filter(
        (col) =>
          !['RetailerCode', 'RetailerName', 'Status', 'TOWN'].includes(col)
      );
      const selectQueryColumns = this.getCommaSepratedList(
        selectQueryColumnsArray,
        'r.'
      );
      const apiArgs = {
        strict: this.strict,
        clsGeo: this.clsGeo ? this.value[this.clsGeo] : undefined,
        clsRetailer: this.clsRetailer
          ? this.value[this.clsRetailer]
          : undefined,
        territory: this.territory ? this.value[this.territory] : undefined,
        status: this.status,
        filter: this.filter,
        selectQueryColumns,
      };
      this.dataSourceObservable =
        this.listPromptService.GetListPromptRetailerData(apiArgs);
      if (!this.dataFields.length)
        this.dataFields = ['RetailerCode', 'RetailerName', 'TOWN'];
      this.dataSourceObservable.subscribe({
        next: (data) => {
          this._dataSet = data;
          this._originalDataSet = data;
          this.setEntityDefaults('retailer');
          this.FilterSource(false);
        },
        error: () => (this._stillDataLoading = false),
      });
    },
  };

  private FilterSource(shouldFilter: boolean): void {
    if (!this._originalDataSet) {
      this._stillDataLoading = false;
      return;
    }
    if (shouldFilter) {
      this.pageIndex = 0;
      const filterCol = this.dataFields[this._currentCursorInputIndex];
      const filterVal = this.value[
        this.modelProps[this._currentCursorInputIndex]
      ]
        ?.toString()
        .toUpperCase();

      this._dataSet = this._originalDataSet.filter((row) => {
        if (!filterCol || !filterVal) return true;
        return row[filterCol]?.toString().toUpperCase().includes(filterVal);
      });
    }
    this.updatePagedData();
    this.scrollDiv?.nativeElement.scrollTo({ top: 0 });
  }

  private ResetProps(): void {
    this._dataSliderStatus = 'none';
    this._dataSet = [];
    this._originalDataSet = [];
    this.pagedData = [];
    this.pageIndex = 0;
    this._lastEmptiedInputIndex = -1;
    this._currentCursorInputIndex = -1;
  }

  private SetModel(item: PromptData | null): void {
    const patch: Record<string, string> = {};
    this.modelProps.forEach((prop, index) => {
      const val = item?.[this.dataFields[index]]?.toString()?.trim() || '';
      patch[prop] = val;
    });
    this.control.patchValue(patch);
    this.onChanged.emit(item);
    this.onChange(this.control.value);
  }

  private AddEvent(): void {
    const handleClick = (e: Event) => {
      setTimeout(() => {
        const el = this.element?.nativeElement;
        if (el && !el.contains(e.target)) {
          if (this._dataSliderStatus === 'block') {
            const item =
              (this.strict &&
                !this.isCurrentFieldEmpty &&
                this._dataSet?.[0]) ||
              null;
            this.SetModel(item);
          }
          this.ResetProps();
          window.removeEventListener('click', handleClick);
        }
      }, 0);
    };

    window.addEventListener('click', handleClick);
  }

  private async PopulateDataSet(onComplete?: () => void): Promise<void> {
    this._stillDataLoading = true;

    const masterControlDataStr = localStorage.getItem(
      'PROMPT_MasterControlData'
    );
    const masterControlData = masterControlDataStr
      ? JSON.parse(masterControlDataStr)
      : null;

    if (masterControlData) {
      this._pageSize =
        masterControlData.AllowPaging === '1'
          ? masterControlData.PageSize
          : masterControlData.ExtendedPageSize;
    }

    await this.onDataBind.emit();
    try {
      if (this.dataSourceObservable) {
        await this.handleCustomDataSource();
      } else if (this.masterGroup) {
        await this.handleMasterGroupPrompt();
      } else if (this.predefinedPromptArgs.length > 0) {
        await this.handlePredefinedPrompt();
      } else if (this.type) {
        const handler =
          this.handlers[this.type.toLowerCase() as PromptEntityType];
        if (handler) await handler();
      }
    } catch (err) {
      console.error('Unexpected error during populate dataset', err);
      this._stillDataLoading = false;
    } finally {
      this.AddEvent();
      onComplete?.();
    }
  }

  private handleCustomDataSource(): Promise<void> {
    return new Promise((resolve) => {
      this.dataSourceObservable?.subscribe({
        next: (data: PromptData[]) => {
          if (data?.length > 0) {
            const keys = Object.keys(data[0]);
            this.dataFields = this.dataFields.length
              ? this.dataFields
              : [keys[0], keys[1]];
            this.gridFields = this.gridFields.length
              ? this.gridFields
              : [...this.dataFields];
          }
          this._dataSet = data;
          this._originalDataSet = data;
          this.FilterSource(false);
        },
        error: (err: any) => {
          console.error('Error in custom observable', err);
          this._stillDataLoading = false;
        },
        complete: () => {
          this._stillDataLoading = false;
          resolve();
        },
      });
    });
  }

  private handleMasterGroupPrompt(): void {
    const groupStatus = ['active', 'inactive'].includes(
      this.status.toLowerCase()
    )
      ? this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase()
      : 'All';

    const apiArgs = {
      selector: [{ MasterGroup: this.masterGroup, HierarchyRequired: '0' }],
      activeStatus: groupStatus,
      selectedIndex: 0,
    };

    this.listPromptService.GetMasterDefinitionValues(apiArgs).subscribe({
      next: (data: PromptData[]) => {
        this._dataSet = data;
        this._originalDataSet = data;
        this.dataFields = this.dataFields.length
          ? this.dataFields
          : ['MasterGroupValue', 'MasterGroupValueDescription'];
        this.gridFields = this.gridFields.length
          ? this.gridFields
          : [...this.dataFields];
        this.gridHeaders = this.gridHeaders.length
          ? this.gridHeaders
          : ['Code', 'Description'];
        this.FilterSource(false);
      },
      error: (err) => {
        console.error('Error loading MasterGroup prompt', err);
        this._stillDataLoading = false;
      },
    });
  }

  private handlePredefinedPrompt(): void {
    const apiArgs = {
      ListFromID: this.predefinedPromptArgs[0],
      ExternalParameters: this.predefinedPromptArgs[1] || '',
    };

    this.listPromptService.GetPredefinedPromptData(apiArgs).subscribe({
      next: (data: PromptData[]) => {
        this._dataSet = data;
        this._originalDataSet = data;
        const keys = Object.keys(data[0]);
        this.dataFields = this.dataFields.length
          ? this.dataFields
          : [keys[0], keys[1]];
        this.gridFields = this.gridFields.length
          ? this.gridFields
          : [...this.dataFields];
        this.FilterSource(false);
      },
      error: (err) => {
        console.error('Error loading predefined prompt', err);
        this._stillDataLoading = false;
      },
    });
  }

  private setEntityDefaults(type: PromptEntityType): void {
    const defaults = this.entityDefaults[type];
    if (!this.dataFields.length) this.dataFields = defaults.dataFields;
    if (!this.gridFields.length) this.gridFields = [...this.dataFields];
    if (!this.gridHeaders.length) this.gridHeaders = defaults.gridHeaders;
  }

  // Pagination & Sorting
  private updatePagedData(): void {
    let data = [...(this._dataSet || [])];

    if (this.sortColumn !== null) {
      data.sort((a, b) => {
        const valA = a[this.sortColumn ?? ''];
        const valB = b[this.sortColumn ?? ''];
        if (!isNaN(valA) && !isNaN(valB)) {
          return this.sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return this.sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    const start = this.pageIndex * this._pageSize;
    this.pagedData = data.slice(start, start + this._pageSize);
    this._stillDataLoading = false;
  }

  onSort(header: string): void {
    const index = this.gridHeaders.indexOf(header);
    if (index >= 0 && this.dataFields[index]) {
      const field = this.dataFields[index];
      this.sortColumn = field;
      this.sortDirection =
        this.sortColumn === field && this.sortDirection === 'asc'
          ? 'desc'
          : 'asc';
      this.updatePagedData();
    }
  }

  get totalPages(): number {
    return Math.ceil((this._dataSet?.length || 0) / this._pageSize);
  }

  goToPage(pageNumber: number): void {
    const maxPageIndex = this.totalPages - 1;
    this.pageIndex = Math.max(0, Math.min(pageNumber, maxPageIndex));
    this.updatePagedData();
  }

  get pageArray(): number[] {
    const delta = 2;
    const range = [];
    const min = Math.max(0, this.pageIndex - delta);
    const max = Math.min(this.totalPages - 1, this.pageIndex + delta);

    for (let i = min; i <= max; i++) {
      range.push(i);
    }

    return range;
  }

  private async loadDefaultData(
    loadSingle = false
  ): Promise<Observable<PromptData[]>> {
    await this.getObservableReady();

    return defer(() => {
      if (!this.dataSourceObservable) {
        console.warn('No observable source provided');
        return of([]);
      }

      return this.dataSourceObservable.pipe(
        tap((data: PromptData[]) => {
          if (data.length > 0 && (!loadSingle || data.length === 1)) {
            const keys = Object.keys(data[0]);
            if (!this.dataFields.length) this.dataFields = [keys[0], keys[1]];
            this.SetModel(data[0]);
          } else {
            this.SetModel(null);
          }
        }),
        catchError((err) => {
          console.error('Error loading prompt data', err);
          this.SetModel(null);
          return of([]);
        }),
        tap(() => (this.dataSourceObservable = null))
      );
    });
  }
}

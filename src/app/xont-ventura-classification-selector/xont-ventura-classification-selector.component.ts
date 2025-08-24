import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
  ViewChildren,
  QueryList,
  OnInit,
  AfterViewInit,
} from '@angular/core';
// 1. Import necessary modules for standalone component
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // For [(ngModel)]
// 2. Import HttpClient and HttpErrorResponse
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Location } from '@angular/common';
import { CommonService } from '../Service/common.service'; // Ensure this path is correct and the service is Angular 19 compatible
// 3. Import RxJS operators and types
import { catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs'; // Import Observable and error handling utilities

// --- Material Modules for replacing angular2-datatable ---
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

// --- Define interfaces for better type safety ---
interface MasterCode {
  GroupDescription: string;
  HierarchyRequired: string;
  MasterGroup: string;
  GroupType: string; // Assuming this exists based on getSelectedClassifications
  // Add other properties if present in the API response
}

interface SelectorRow {
  index: number;
  txtCode: string;
  txtDesc: string;
  GroupDescription: string;
  HierarchyRequired: string;
  MasterGroup: string;
  ErrorMessage: string | undefined;
  LatestText: string;
}

export interface SelectedClassification {
  Index: number;
  GroupCode: string;
  GroupDescription: string;
  GroupType: string;
  GroupTypeDescription: string;
  HasHirarchy: string; // Typo in original, keeping for compatibility
  ValueCode: string;
  ValueDescription: string;
}

// Assuming the structure of data returned by GetMasterValues API
interface MasterValue {
  MasterGroup: string;
  MasterGroupValue: string;
  MasterGroupValueDescription: string;
  // Add other properties if present
}

// --- Component Definition ---
@Component({
  selector: 'xont-ventura-classification-selector',
  // 4. Use standalone: true
  standalone: true,
  // 5. Import necessary modules
  imports: [
    CommonModule,
    FormsModule,
    // Material Modules for the table replacement
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  styles: [
    // Keep existing styles
    `
      .selectedRow {
        background-color: rgb(102, 153, 153);
      }
    `,
    `
      .dataSlider {
        position: absolute;
        min-height: 307px;
        border-radius: 0 7px 7px 7px;
        background-color: white;
        margin-top: 3px;
        margin-bottom: 15px;
        z-index: 1000;
        border: 1.5px #5399d6 solid;
        padding-left: 5px;
        color: #01539d;
        font-family: Trebuchet MS;
        background-color: ghostwhite;
      }
    `,
    '.dtRow { cursor:pointer; }',
    '.dtRow > td {padding-right:10px;}',
    '.dtRow:hover {color:red;}',
    '.pmtPaginator { position:absolute; bottom:4px; border:2px solid #006699; border-radius:6px;}',
    '.sliderLoader {height: 80px; margin: auto; display: block; margin-top: 80px;}',
    '.clickButton {padding-left:8.75px;font-size:16px;padding-right:8.75px;cursor:pointer;display:inline-block;}',
    '.scrollDiv { overflow: auto; overflow-x: hidden; padding-left:10px; margin:8px 5px 5px 0;}',
    '.closeI {font-size:18px;cursor:pointer;color:#006699;vertical-align:middle;}',
    '.disabledInput {background-color: rgba(170, 170, 170, 0.19);}',
    '.Textboxstyle[disabled] {background-color: rgba(170, 170, 170, 0.19);}',
    '.clickButtonDisabled {padding-left:8.75px;font-size:16px;padding-right:8.75px;display:inline-block;}',
    '.tableStyles tbody td { padding: 2.5px 0 2.5px 3.5px;border: 1px solid #AAAAAA;background:white;font-size:small;font-family:Trebuchet MS;font-size:13px;}',
    '.tableStyles th {padding: 2.5px 0 2.5px 3.5px;font-family:Trebuchet MS; font-size:13px;margin-left:10px;margin-top:4px; background-color: #006699;color: #ffffff;}',
    '.tableStyles th:hover {text-decoration:underline;cursor:pointer;}',
    '.sortIcon {padding-left:7px;}',
    '.pmtPaginator > span {padding-left:5px;padding-right:5px;}',
    '#element {position:relative;display:inline-block;margin-bottom:-5px;}',
    '.Textboxstyle  { padding-left:2px;}',
    '.clsTable td {padding: 0 0 2px 0;}',
    '.clsErrormessagetextstyle {position:absolute;margin-left:1px;top:-14px;left:1px;color:#e50505;font-family:Trebuchet MS;font-size:20px;font-style:normal;}',
    '.clsMandatoryCurrent {top:-14px;left:22px;}',
  ],
  // 6. Template - Updated to use Material Table
  template: `
    <div #element id="element">
      <table class="clsTable">
        <tr *ngFor="let row of selector; let i = index">
          <td>
            <div [style.width]="labelWidth" class="Captionstyle">
              {{ row.GroupDescription }}
            </div>
          </td>
          <td>
            <input
              #codeInput
              attr.id="{{ id }}txtCode{{ row.index }}"
              [disabled]="enabled === 'false'"
              autocomplete="off"
              [(ngModel)]="row.txtCode"
              [style.width]="codeTextWidth"
              type="text"
              class="Textboxstyle"
              (mousedown)="InputMousedIn($event, false, row.index)"
              (keyup)="InputKeyUp($event, false, row.index)"
              (keydown)="InputKeyDown($event, false, row.index)"
            />
          </td>
          <td>
            <span>
              <span
                type="button"
                title="Master Group - {{ row.MasterGroup }}"
                (click)="ClickedOn($event, row.index)"
                *ngIf="enabled === 'true'"
                class="fa fa-angle-double-down clickButton"
                aria-hidden="true"
              ></span>
              <span
                type="button"
                title="Master Group - {{ row.MasterGroup }}"
                class="fa fa-angle-double-down clickButtonDisabled"
                *ngIf="enabled === 'false'"
                aria-hidden="true"
              ></span>
            </span>
          </td>
          <td>
            <input
              #descInput
              attr.id="{{ id }}txtDesc{{ row.index }}"
              [(ngModel)]="row.txtDesc"
              type="text"
              autocomplete="off"
              [style.width]="descriptionTextWidth"
              class="Textboxstyle"
              [disabled]="enabled === 'false'"
              (mousedown)="InputMousedIn($event, true, row.index)"
              (keyup)="InputKeyUp($event, true, row.index)"
              (keydown)="InputKeyDown($event, true, row.index)"
            />
          </td>
          <td style="padding-left:2px;">
            <span style="position:relative;display:inline-block;">
              <span
                *ngIf="row.ErrorMessage"
                [class.clsMandatoryCurrent]="row.index == _currentClsGroupIndex"
                class="clsErrormessagetextstyle"
                >{{ row.ErrorMessage }}</span
              >
            </span>
            <i
              class="fa fa-times-circle closeI"
              *ngIf="
                _dataSliderStatus == 'block' &&
                row.index == _currentClsGroupIndex
              "
              title="clear code/description"
              (click)="ClearModel(row.index)"
            ></i>
          </td>
        </tr>
      </table>

      <div
        class="dataSlider"
        [style.left]="labelWidth"
        [style.top]="24 * _currentClsGroupIndex + 21 + 'px'"
        [style.display]="_dataSliderStatus"
        [style.minWidth]="_minWidth + 60 + 'px'"
      >
        <div *ngIf="_stillDataLoading">
          <img
            class="sliderLoader"
            src="../App_Themes_V3/Blue/images/load_pmt.gif"
            alt="Loading..."
          />
        </div>

        <div
          #scrollDiv
          [style.height]="_dataSet.length > _pageSize ? '260px' : '275px'"
          class="scrollDiv"
          *ngIf="!_stillDataLoading && _dataSet !== null"
        >
          <!-- ****** ANGULAR 2 DATATABLE REPLACED WITH ANGULAR MATERIAL TABLE ****** -->
          <table
            mat-table
            [dataSource]="dataSource"
            matSort
            class="tableStyles"
            [style.minWidth]="_minWidth + 20 + 'px'"
          >
            <!-- Column Definitions -->
            <ng-container
              *ngFor="let header of _gridHeaders; let gridHeaderIndex = index"
              [matColumnDef]="_gridFields[gridHeaderIndex]"
            >
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                {{ header }}
              </th>
              <td mat-cell *matCellDef="let element">
                {{ element[_gridFields[gridHeaderIndex]]?.toString().trim() }}
              </td>
            </ng-container>

            <!-- Header and Row Definitions -->
            <tr mat-header-row *matHeaderRowDef="_gridFields"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: _gridFields"
              class="dtRow"
              (click)="ItemSelected(row)"
            ></tr>

            <!-- Row for No Data Message -->
            <tr class="mat-footer-row" *matNoDataRow>
              <td [attr.colspan]="_gridHeaders.length" class="pmtPaginator">
                No Data Found to Display
              </td>
            </tr>
          </table>

          <!-- Material Paginator -->
          <mat-paginator
            #paginator
            [pageSizeOptions]="[5, 10, 20]"
            [pageSize]="_pageSize"
            showFirstLastButtons
            [length]="dataSource.data.length"
          >
          </mat-paginator>
          <!-- ****** END MATERIAL TABLE REPLACEMENT ****** -->
        </div>
      </div>
    </div>
  `,
})
export class XontVenturaClassificationSelectorComponent
  implements OnInit, AfterViewInit
{
  // --- Properties ---
  clsBusy: any; // Subscription type might change based on HttpClient return

  selector: SelectorRow[] = [];
  private selectedClassifications: SelectedClassification[] = [];
  list: MasterCode[] = [];
  promptIndex: number = 0;

  // V3001 Adding Start
  public _valid: boolean = true;
  public _originalDataSet: MasterValue[] | null = null;
  public _dataSet: MasterValue[] | null = null;
  public _minWidth: number = 500;
  public _dataSliderStatus: 'none' | 'block' = 'none';
  public _stillDataLoading: boolean = false;
  public _pageSize: number = 10;
  public _gridHeaders: string[] = ['Code', 'Description'];
  public _gridFields: string[] = [
    'MasterGroupValue',
    'MasterGroupValueDescription',
  ];
  public _currentClsGroupIndex: number = -1;
  private _codeEmptied: boolean = false;
  private _descEmptied: boolean = true;
  private _cursorInCorD: string = '';

  // Material Table DataSource
  public dataSource = new MatTableDataSource<MasterValue>();

  @ViewChild('element') element!: ElementRef;
  @ViewChild('scrollDiv') scrollDiv!: ElementRef;
  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;
  @ViewChildren('descInput') descInputs!: QueryList<ElementRef>;
  // V3001 Adding End

  // --- Inputs ---
  @Input() id?: string;
  @Input() classificationType!: string; // Required input
  @Input() taskCode: string = '';
  @Input() codeTextWidth: string = '100px';
  @Input() enableUserInput: string = 'true';
  @Input() descriptionTextWidth: string = '200px';
  @Input() labelWidth: string = '100px';
  @Input() activeStatus: string = 'Active';

  // V3005 add (with getter/setter)
  private _allMandatory: string = 'false';
  @Input() set allMandatory(value: string) {
    this._allMandatory = value;
    this.validate();
  }
  get allMandatory(): string {
    return this._allMandatory;
  }

  @Input() lastLevelRequired: string = 'false';
  @Input() enabled: string = 'true';

  // --- Outputs ---
  @Output() onChange: EventEmitter<void> = new EventEmitter();

  // --- Constructor ---
  constructor(
    private http: HttpClient,
    private location: Location,
    private commanService: CommonService // Renamed service reference
  ) {}

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.clsBusy = this.http
      .get<any[]>(
        `${this.siteName()}/api/Prompt/GetMasterCodes?ClassificationType=${
          this.classificationType
        }`
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching master codes:', error);
          return of([]);
        })
      )
      .subscribe(
        (data: any[]) => {
          this.list = data || [];
          this.selector = this.list.map((item, index) => ({
            index: index,
            txtCode: '',
            txtDesc: '',
            GroupDescription: item.GroupDescription?.trim() || '',
            HierarchyRequired: item.HierarchyRequired?.trim() || '',
            MasterGroup: item.MasterGroup?.trim() || '',
            ErrorMessage: undefined,
            LatestText: '',
          }));

          if (this.selectedClassifications.length > 0) {
            this.applySelectedClassifications(this.selectedClassifications);
          }
          this.validate();
        },
        () => console.log('Master codes observable complete')
      );

    let codeWidth = parseInt(this.codeTextWidth.replace('px', ''), 10) || 0;
    let descWidth =
      parseInt(this.descriptionTextWidth.replace('px', ''), 10) || 0;
    this._minWidth = codeWidth + descWidth;
  }

  ngAfterViewInit(): void {
    // Initialization logic that requires view children can go here if needed
  }

  // --- Public Methods ---
  public focus(): void {
    let self = this;
    let timeTook = 0;

    function setFocus() {
      if (
        self.codeInputs &&
        self.codeInputs.length > 0 &&
        self.codeInputs.first
      ) {
        self.codeInputs.first.nativeElement.focus();
      } else {
        setTimeout(setFocus, 100);
        timeTook += 100;
      }
    }
    setFocus();
  }

  // --- Event Handlers ---
  InputMousedIn(e: Event, isLast: boolean, clsGroupIndex: number) {
    this._cursorInCorD = isLast ? 'D' : 'C';

    if (
      this._currentClsGroupIndex != -1 &&
      this._currentClsGroupIndex != clsGroupIndex
    ) {
      this.ResetProps();
    }

    if (this._dataSliderStatus == 'block') {
      this.FilterSource();
    }

    if (this._dataSliderStatus == 'none') {
      this._dataSliderStatus = 'block';
      this.PopulateDataSet(clsGroupIndex);
    }
  }

  InputKeyDown(e: KeyboardEvent, isLast: boolean, clsGroupIndex: number) {
    if (e.key === ' ' && this._dataSet == null) {
      e.preventDefault();
      e.stopPropagation();
      return;
    } else if (isLast && e.key === 'Tab' && this._dataSliderStatus == 'block') {
      if (!this.isEmpty) {
        this.FilterSource();
        let item =
          this._dataSet && this._dataSet.length > 0 ? this._dataSet[0] : null;
        this.SetModel(item);
      } else {
        this.SetModel(null);
      }
      this.ResetProps();
    }

    this._cursorInCorD = isLast ? 'D' : 'C';

    let currentGroupObj = this.selector[clsGroupIndex];
    let codeValue = currentGroupObj.txtCode;
    let descValue = currentGroupObj.txtDesc;

    if (!codeValue && !isLast && e.key === 'Backspace' && this._codeEmptied) {
      e.preventDefault();
      if (this.descInputs.toArray()[clsGroupIndex]) {
        this.descInputs.toArray()[clsGroupIndex].nativeElement.focus();
      }
      this._cursorInCorD = 'D';
      this.FilterSource();
      this._codeEmptied = false;
    } else if (
      !descValue &&
      isLast &&
      e.key === 'Backspace' &&
      this._descEmptied
    ) {
      e.preventDefault();
      if (this.codeInputs.toArray()[clsGroupIndex]) {
        this.codeInputs.toArray()[clsGroupIndex].nativeElement.focus();
      }
      this._cursorInCorD = 'C';
      this.FilterSource();
      this._descEmptied = false;
    }
  }

  InputKeyUp(e: KeyboardEvent, isLast: boolean, clsGroupIndex: number) {
    if (
      this._currentClsGroupIndex != -1 &&
      this._currentClsGroupIndex != clsGroupIndex
    ) {
      this.ResetProps();
    }

    if (e.key !== 'Tab') {
      if (this._dataSliderStatus != 'block') {
        this._dataSliderStatus = 'block';
      }
      if (this._originalDataSet == null && !this._stillDataLoading) {
        this.PopulateDataSet(clsGroupIndex);
      }

      this.FilterSource();
    }

    let currentGroupObj = this.selector[clsGroupIndex];
    let codeValue = currentGroupObj.txtCode;
    let descValue = currentGroupObj.txtDesc;

    if (!codeValue && !isLast && !this._codeEmptied) {
      this._codeEmptied = true;
    } else {
      this._codeEmptied = false;
    }

    if (!descValue && isLast && !this._descEmptied) {
      this._descEmptied = true;
    } else {
      this._descEmptied = false;
    }
  }

  ClickedOn(e: Event, clsGroupIndex: number) {
    if (
      this.element &&
      this.element.nativeElement &&
      this.element.nativeElement.hasAttribute('disabled')
    ) {
      console.log('Classification selector is disabled.');
      return;
    }

    if (
      this._currentClsGroupIndex != -1 &&
      this._currentClsGroupIndex != clsGroupIndex
    ) {
      this.ResetProps();
    }

    if (this._dataSliderStatus == 'none') {
      this._dataSliderStatus = 'block';
      this.PopulateDataSet(clsGroupIndex);
    }
    this._cursorInCorD = 'C';
    const codeInputsArray = this.codeInputs.toArray();
    if (codeInputsArray[clsGroupIndex]) {
      codeInputsArray[clsGroupIndex].nativeElement.focus();
    }
  }

  pagerClickCapture(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  ItemSelected(item: MasterValue | null) {
    this.SetModel(item);
    this.ResetProps();
  }

  ClearModel(clsGroupIndex?: number) {
    const indexToUse =
      clsGroupIndex !== undefined ? clsGroupIndex : this._currentClsGroupIndex;
    this.SetModel(null);
    this.FilterSource();
    const codeInputsArray = this.codeInputs.toArray();
    if (codeInputsArray[indexToUse]) {
      codeInputsArray[indexToUse].nativeElement.focus();
    }
  }

  // --- Getters ---
  public get valid() {
    if (this._dataSliderStatus == 'block') {
      return false;
    } else {
      return this._valid;
    }
  }

  private get isEmpty(): boolean {
    if (
      this._currentClsGroupIndex < 0 ||
      this._currentClsGroupIndex >= this.selector.length
    ) {
      return true;
    }
    let currentFilteration = this.selector[this._currentClsGroupIndex];
    let FirstfilterValue = currentFilteration.txtCode;
    let SecondfilterValue = currentFilteration.txtDesc;

    if (this._cursorInCorD == 'C') {
      return !FirstfilterValue;
    } else if (this._cursorInCorD == 'D') {
      return !SecondfilterValue;
    } else {
      return true;
    }
  }

  // --- Private Helper Methods ---
  siteName(): string {
    return this.commanService.getAPIPrefix(this.taskCode);
  }

  private PopulateDataSet(clsGroupIndex: number) {
    let masterControlData: any = null;
    try {
      const dataStr = localStorage.getItem('PROMPT_MasterControlData');
      if (dataStr) {
        masterControlData = JSON.parse(dataStr);
      }
    } catch (e) {
      console.error(
        'Error parsing PROMPT_MasterControlData from localStorage:',
        e
      );
    }

    if (masterControlData) {
      this._pageSize =
        masterControlData.AllowPaging === '1'
          ? masterControlData.PageSize
          : masterControlData.ExtendedPageSize;
    }

    this._stillDataLoading = true;
    this._dataSet = null;
    this.dataSource.data = []; // Clear Material table data

    const APIArgs = {
      selectedIndex: clsGroupIndex,
      selector: this.selector.map((s) => ({
        index: s.index,
        txtCode: s.txtCode,
        txtDesc: s.txtDesc,
        GroupDescription: s.GroupDescription,
        HierarchyRequired: s.HierarchyRequired,
        MasterGroup: s.MasterGroup,
        ErrorMessage: s.ErrorMessage,
        LatestText: s.LatestText,
      })),
      activeStatus: this.activeStatus,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    this.http
      .post<MasterValue[]>(
        `${this.siteName()}/api/Prompt/GetMasterValues`,
        APIArgs,
        { headers }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching master values:', error, APIArgs);
          this._stillDataLoading = false;
          return of([]);
        })
      )
      .subscribe(
        (data: MasterValue[]) => {
          this._dataSet = data || [];
          this.dataSource.data = this._dataSet; // Set data for Material table
          this._originalDataSet = [...this._dataSet];
        },
        () => {
          this._stillDataLoading = false;
          console.log('Master values observable complete');
        }
      );

    this._currentClsGroupIndex = clsGroupIndex;
    this.AddEvent();
  }

  private FilterSource() {
    if (
      this._currentClsGroupIndex < 0 ||
      this._currentClsGroupIndex >= this.selector.length ||
      !this._originalDataSet
    ) {
      return;
    }
    let currentFilteration = this.selector[this._currentClsGroupIndex];

    let FilterColumn = '';
    let FilterValue = '';

    if (this._cursorInCorD == 'C') {
      FilterColumn = 'MasterGroupValue';
      FilterValue = (currentFilteration.txtCode || '').toString().toUpperCase();
    } else {
      FilterColumn = 'MasterGroupValueDescription';
      FilterValue = (currentFilteration.txtDesc || '').toString().toUpperCase();
    }

    if (this._originalDataSet) {
      // Use native JavaScript filter instead of Lodash
      this.dataSource.data = this._originalDataSet.filter((row: any) => {
        if (FilterColumn && FilterValue) {
          const rowValue = (row[FilterColumn] || '').toString().toUpperCase();
          return rowValue.indexOf(FilterValue) > -1;
        } else {
          return true;
        }
      });
      if (this.scrollDiv && this.scrollDiv.nativeElement) {
        this.scrollDiv.nativeElement.scrollTop = 0;
      }
    }
  }

  private ResetProps() {
    this._dataSet = null;
    this.dataSource.data = []; // Clear Material table data
    this._dataSliderStatus = 'none';
    this._originalDataSet = null;
    this._currentClsGroupIndex = -1;
    this._codeEmptied = false;
    this._descEmptied = false;
  }

  private SetModel(item: MasterValue | null) {
    if (
      this._currentClsGroupIndex < 0 ||
      this._currentClsGroupIndex >= this.selector.length
    ) {
      console.warn('Invalid _currentClsGroupIndex for SetModel');
      return;
    }
    this.promptIndex = this._currentClsGroupIndex;
    if (item) {
      if (
        (this.selector[this._currentClsGroupIndex].txtCode || '').trim() !=
        (item['MasterGroupValue'] || '').trim()
      ) {
        this.clearChildValues();
      }

      this.selector[this._currentClsGroupIndex].txtCode = (
        item['MasterGroupValue'] || ''
      ).trim();
      this.selector[this._currentClsGroupIndex].txtDesc = (
        item['MasterGroupValueDescription'] || ''
      ).trim();
      this.selector[this._currentClsGroupIndex].LatestText = (
        item['MasterGroupValue'] || ''
      ).trim();

      this.selector[this._currentClsGroupIndex].ErrorMessage = undefined;

      if (this.selector[this._currentClsGroupIndex].HierarchyRequired == '1') {
        this.autoFillHirarchy('withActiveStatus');
      }
    } else {
      this.selector[this._currentClsGroupIndex].txtCode = '';
      this.selector[this._currentClsGroupIndex].txtDesc = '';
      this.clearChildValues();
    }
    this.onValueChange(this._currentClsGroupIndex);
    this.onChange.emit();
  }

  private AddEvent() {
    const self = this;

    function handleClick(e: Event) {
      if (
        e.target instanceof Node &&
        self.element &&
        self.element.nativeElement &&
        !self.element.nativeElement.contains(e.target)
      ) {
        if (self._dataSliderStatus == 'block') {
          if (!self.isEmpty) {
            self.FilterSource();
            let item =
              self.dataSource.data && self.dataSource.data.length > 0
                ? self.dataSource.data[0]
                : null; // Use dataSource
            self.SetModel(item);
          } else {
            self.SetModel(null);
          }
        }
        self.ResetProps();
        window.removeEventListener('click', handleClick);
      }
    }

    window.removeEventListener('click', handleClick);
    window.addEventListener('click', handleClick);
  }

  // --- Other Public Methods ---
  public clearChildValues(): void {
    if (
      this.promptIndex < this.selector.length - 1 &&
      this.selector[this.promptIndex + 1].HierarchyRequired == '1'
    ) {
      for (let i = this.promptIndex + 1; i < this.selector.length; i++) {
        if (this.selector[i].HierarchyRequired == '1') {
          this.selector[i].txtCode = '';
          this.selector[i].txtDesc = '';
          this.selector[i].LatestText = '';
        }
      }
    }
  }

  public autoFillHirarchy(type: string): void {
    let apiUrl = `${this.siteName()}/api/Prompt/GetMasterGroupValuesHirarchy?MasterGroup=${
      this.selector[this.promptIndex].MasterGroup
    }&Code=${encodeURIComponent(
      this.selector[this.promptIndex].txtCode.trim()
    )}`;
    if (type == 'withActiveStatus') {
      apiUrl = `${apiUrl}&ActiveStatus=${this.activeStatus}`;
    }

    this.clsBusy = this.http
      .get<any[]>(apiUrl)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error auto-filling hierarchy:', error);
          return of([]);
        })
      )
      .subscribe(
        (data: any[]) => {
          const groupValuesHirarchy = data || [];

          for (let i = 0; i < this.selector.length; i++) {
            const obj1 = this.getMasterGroupObj(
              groupValuesHirarchy,
              this.selector[i].MasterGroup
            );
            if (obj1 != null) {
              this.selector[i].txtCode = (
                obj1['MasterGroupValue'] || ''
              ).trim();
              this.selector[i].txtDesc = (
                obj1['MasterGroupValueDescription'] || ''
              ).trim();
              this.selector[i].ErrorMessage = undefined;
              this.selector[i].LatestText = (
                obj1['MasterGroupValue'] || ''
              ).trim();
            } else {
              this.selector[i].txtCode = '';
              this.selector[i].txtDesc = '';
              this.selector[i].LatestText = '';
            }
          }
          this.validate();
        },
        () => console.log('Auto-fill hierarchy observable complete')
      );
  }

  public getMasterGroupObj(array: any[], masterGroup: string): any | null {
    for (let i = 0; i < array.length; i++) {
      if (
        (array[i].MasterGroup || '').toString().trim() == masterGroup.trim()
      ) {
        return array[i];
      }
    }
    return null;
  }

  public onValueChange(index: number): void {
    if (index < 0 || index >= this.selector.length) return;

    if (this.allMandatory == 'true') {
      if ((this.selector[index].txtCode || '').trim() == '') {
        this.selector[index].ErrorMessage = '*';
      } else {
        this.selector[index].ErrorMessage = undefined;
      }
    }

    if (this.lastLevelRequired == 'true') {
      if (index == this.selector.length - 1) {
        if ((this.selector[index].txtCode || '').trim() == '') {
          this.selector[index].ErrorMessage = '*';
        } else {
          this.selector[index].ErrorMessage = undefined;
        }
      }
    }
    this.validate();
  }

  public validate(): void {
    for (let i = 0; i < this.selector.length; i++) {
      if (this.allMandatory == 'true') {
        if ((this.selector[i].txtCode || '').trim() == '') {
          this.selector[i].ErrorMessage = '*';
        } else {
          this.selector[i].ErrorMessage = undefined;
        }
      } else {
        if ((this.selector[i].txtCode || '').trim() == '') {
          this.selector[i].ErrorMessage = undefined;
        }
      }
    }

    if (this.lastLevelRequired == 'true' && this.selector.length > 0) {
      const last = this.selector.length - 1;
      if ((this.selector[last].txtCode || '').trim() == '') {
        this.selector[last].ErrorMessage = '*';
      } else if (
        (this.selector[last].txtCode || '').trim() != '' &&
        this.selector[last].ErrorMessage != undefined
      ) {
      } else {
        this.selector[last].ErrorMessage = undefined;
      }
    }

    for (let j = 0; j < this.selector.length; j++) {
      if (this.selector[j].ErrorMessage != undefined) {
        this._valid = false;
        return;
      }
    }

    this._valid = true;
  }

  public getSelectedClassifications(): SelectedClassification[] {
    const result: SelectedClassification[] = [];

    for (let i = 0; i < this.selector.length; i++) {
      if ((this.selector[i].txtCode || '').trim() != '') {
        if (i < this.list.length) {
          result.push({
            Index: i,
            GroupCode: (this.list[i].MasterGroup || '').trim(),
            GroupDescription: (this.list[i].GroupDescription || '').trim(),
            GroupType: (this.list[i].GroupType || '').trim(),
            GroupTypeDescription: (this.list[i].GroupType || '').trim(),
            HasHirarchy: (this.list[i].HierarchyRequired || '').trim(),
            ValueCode: (this.selector[i].txtCode || '').trim(),
            ValueDescription: (this.selector[i].txtDesc || '').trim(),
          });
        } else {
          console.warn(
            `Index ${i} out of bounds for 'list' array in getSelectedClassifications`
          );
        }
      }
    }

    if (result.length == 0 && this.selectedClassifications.length > 0) {
      return [...this.selectedClassifications];
    }

    return result;
  }

  public setSelectedClassifications(array: SelectedClassification[]): void {
    if (array) {
      this.selectedClassifications = array.map((item) => ({ ...item }));
      this.applySelectedClassifications(array);
    }
  }

  public applySelectedClassifications(array: SelectedClassification[]): void {
    this.cleanSelector();

    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < this.selector.length; j++) {
        if (
          (this.selector[j].MasterGroup || '').trim() ==
          (array[i].GroupCode || '').trim()
        ) {
          this.selector[j].txtCode = (array[i].ValueCode || '').trim();
          this.selector[j].txtDesc = (array[i].ValueDescription || '').trim();
          this.selector[j].LatestText = '';
        }
      }
    }
    this.validate();
  }

  public cleanSelector() {
    for (let i = 0; i < this.selector.length; i++) {
      this.selector[i].txtCode = '';
      this.selector[i].txtDesc = '';
      this.selector[i].ErrorMessage = undefined;
      this.selector[i].LatestText = '';
    }
  }
}

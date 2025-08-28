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
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, Location } from '@angular/common';
import { CommonService } from '../common.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'xont-ventura-classification-selector',
  styles: [
    '.selectedRow {background-color: rgb(102, 153, 153);}',
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
  template: `
    <div #element id="element">
      <form [formGroup]="classificationForm">
        <table class="clsTable">
          <tr *ngFor="let row of selector; let i = index">
            <td class="col-sm-2">
              <div [style.width]="labelWidth" class="Captionstyle">
                {{ row.groupDescription }}
              </div>
            </td>
            <td>
              <input
                #codeInput
                [id]="id + 'txtCode' + i"
                [disabled]="enabled === 'false'"
                autocomplete="off"
                [formControlName]="'code_' + i"
                [style.width]="codeTextWidth"
                type="text"
                class="Textboxstyle"
                (mousedown)="InputMousedIn($event, false, i)"
                (keyup)="InputKeyUp($event, false, i)"
                (keydown)="InputKeyDown($event, false, i)"
              />
            </td>
            <td>
              <span>
                <span
                  type="button"
                  title="Master Group - {{ row.masterGroup }}"
                  (click)="ClickedOn($event, i)"
                  *ngIf="enabled === 'true'"
                  class="fa fa-angle-double-down clickButton m-2"
                  aria-hidden="true"
                >
                </span>
                <span
                  type="button"
                  title="Master Group - {{ row.masterGroup }}"
                  class="fa fa-angle-double-down clickButtonDisabled m-2"
                  *ngIf="enabled === 'false'"
                  aria-hidden="true"
                >
                </span>
              </span>
            </td>
            <td>
              <input
                #descInput
                [id]="id + 'txtDesc' + i"
                [formControlName]="'desc_' + i"
                type="text"
                autocomplete="off"
                [style.width]="descriptionTextWidth"
                class="Textboxstyle"
                [disabled]="enabled === 'false'"
                (mousedown)="InputMousedIn($event, true, i)"
                (keyup)="InputKeyUp($event, true, i)"
                (keydown)="InputKeyDown($event, true, i)"
              />
            </td>
            <td style="padding-left:2px;">
              <span style="position:relative;display:inline-block;">
                <span
                  *ngIf="row.errorMessage"
                  [class.clsMandatoryCurrent]="i === _currentClsGroupIndex"
                  class="clsErrormessagetextstyle"
                >
                  {{ row.errorMessage }}
                </span>
              </span>
              <i
                class="fa fa-times-circle closeI"
                *ngIf="
                  _dataSliderStatus === 'block' && i === _currentClsGroupIndex
                "
                title="clear code/description"
                (click)="ClearModel(i)"
              >
              </i>
            </td>
          </tr>
        </table>
      </form>

      <div
        class="dataSlider"
        [style.left]="labelWidth"
        [style.top]="24 * _currentClsGroupIndex + 21 + 'px'"
        [style.display]="_dataSliderStatus"
        [style.minWidth]="_minWidth + 60 + 'px'"
      >
        <div *ngIf="_dataSet === null">
          <img
            *ngIf="_dataSet === null"
            class="sliderLoader"
            src="../App_Themes_V3/Blue/images/load_pmt.gif"
          />
        </div>

        <div
          #scrollDiv
          [style.height]="_dataSet?.length > _pageSize ? '260px' : '275px'"
          class="scrollDiv"
          *ngIf="!_stillDataLoading"
        >
          <table [style.minWidth]="_minWidth + 20 + 'px'" class="tableStyles">
            <thead>
              <tr>
                <th
                  *ngFor="
                    let header of _gridHeaders;
                    let gridHeaderIndex = index
                  "
                >
                  {{ header }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                *ngFor="
                  let item of _dataSet
                    | slice
                      : (currentPage - 1) * _pageSize
                      : currentPage * _pageSize
                "
                class="dtRow"
                (click)="ItemSelected(item)"
              >
                <ng-container
                  *ngFor="let field of _gridFields; let fieldIndex = index"
                >
                  <td *ngIf="isFieldValid(item, field)">
                    {{ getFieldValue(item, field) }}
                  </td>
                </ng-container>
              </tr>
            </tbody>

            <tfoot>
              <div
                *ngIf="_dataSet?.length > _pageSize || _dataSet?.length === 0"
              >
                <div
                  class="pmtPaginator"
                  (click)="pagerClickCapture($event)"
                  *ngIf="_dataSet?.length > _pageSize"
                >
                  <button
                    (click)="previousPage()"
                    [disabled]="currentPage === 1"
                  >
                    Previous
                  </button>
                  <span>Page {{ currentPage }} of {{ totalPages }}</span>
                  <button
                    (click)="nextPage()"
                    [disabled]="currentPage === totalPages"
                  >
                    Next
                  </button>
                </div>
                <div class="pmtPaginator" *ngIf="_dataSet?.length === 0">
                  <span>No Data Found to Display</span>
                </div>
              </div>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  `,
  imports: [CommonModule, ReactiveFormsModule],
})
export class XontVenturaClassificationSelectorComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  classificationForm: FormGroup;
  clsBusy: Subscription | undefined;

  public selector: any[] = [];
  private selectedClassifications: any[] = [];
  private list: any[] = [];
  private promptIndex: number = 0;

  // Form state properties
  private _valid: boolean = true;
  private _originalDataSet: any = null;
  public _dataSet: any = null;
  public _minWidth: number = 500;
  public _dataSliderStatus = 'none';
  public _stillDataLoading: boolean = false;
  public _pageSize: number = 10;
  public _gridHeaders: string[] = ['Code', 'Description'];
  public _gridFields: string[] = [
    'masterGroupValue',
    'masterGroupValueDescription',
  ];
  public _currentClsGroupIndex: number = -1;
  private _codeEmptied: boolean = false;
  private _descEmptied: boolean = true;
  private _cursorInCorD: string = '';
  private _allMandatory: string = 'false';

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;

  @ViewChild('element') element!: ElementRef;
  @ViewChild('scrollDiv') scrollDiv!: ElementRef;

  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;
  @ViewChildren('descInput') descInputs!: QueryList<ElementRef>;

  @Input() id: string = 'classification-selector';
  @Input() classificationType: string = '';
  @Input() taskCode: string = '';
  @Input() codeTextWidth: string = '100px';
  @Input() enableUserInput: string = 'true';
  @Input() descriptionTextWidth: string = '200px';
  @Input() labelWidth: string = '100px';
  @Input() activeStatus: string = 'Active';
  @Input() lastLevelRequired: string = 'false';
  @Input() enabled: string = 'true';

  @Input()
  set allMandatory(value: string) {
    this._allMandatory = value;
    this.validate();
  }

  get allMandatory(): string {
    return this._allMandatory;
  }

  @Output() onChange: EventEmitter<string> = new EventEmitter();

  constructor(
    private http: HttpClient,
    private location: Location,
    private commonService: CommonService,
    private fb: FormBuilder
  ) {
    this.classificationForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadMasterCodes();

    const codeWidth = parseInt(this.codeTextWidth.replace('px', ''));
    const descWidth = parseInt(this.descriptionTextWidth.replace('px', ''));
    this._minWidth = codeWidth + descWidth;
  }

  private initializeForm(): void {
    const formControls: any = {};

    // Create form controls for each selector item
    for (let i = 0; i < 10; i++) {
      // Assuming max 10 items
      formControls[`code_${i}`] = [''];
      formControls[`desc_${i}`] = [''];
    }

    this.classificationForm = this.fb.group(formControls);
  }
  isFieldValid(item: unknown, field: string): boolean {
    return typeof item === 'object' && item !== null && field in item;
  }

  getFieldValue(item: unknown, field: string): string {
    if (typeof item === 'object' && item !== null && field in item) {
      return String((item as any)[field]).trim();
    }
    return '';
  }

  private loadMasterCodes(): void {
    this.clsBusy = this.http
      .get<any[]>(
        this.siteName() +
          '/api/Prompt/GetMasterCodes?ClassificationType=' +
          this.classificationType
      )
      .subscribe({
        next: (data) => {
          this.list = data;
          this.selector = [];

          for (let i = 0; i < this.list.length; i++) {
            const obj = {
              index: i,
              txtCode: '',
              txtDesc: '',
              groupDescription: this.list[i].groupDescription.trim(),
              hierarchyRequired: this.list[i].hierarchyRequired.trim(),
              masterGroup: this.list[i].masterGroup.trim(),
              errorMessage: undefined,
              latestText: '',
            };
            this.selector.push(obj);

            // Set form values
            this.classificationForm.get(`code_${i}`)?.setValue('');
            this.classificationForm.get(`desc_${i}`)?.setValue('');
          }

          if (this.selectedClassifications.length > 0) {
            this.applySelectedClassifications(this.selectedClassifications);
            this.selectedClassifications = [];
          }
          this.validate();
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  siteName(): string {
    return this.commonService.getAPIPrefix(this.taskCode);
  }

  // Rest of the methods with lodash replacement and reactive forms integration

  private filterArray(array: any[], predicate: (item: any) => boolean): any[] {
    return array.filter(predicate);
  }

  private findArray(array: any[], predicate: (item: any) => boolean): any {
    return array.find(predicate);
  }

  InputMousedIn(e: MouseEvent, isLast: boolean, clsGroupIndex: number) {
    this._cursorInCorD = isLast ? 'D' : 'C';

    if (
      this._currentClsGroupIndex !== -1 &&
      this._currentClsGroupIndex !== clsGroupIndex
    ) {
      this.ResetProps();
    }

    if (this._dataSliderStatus === 'block') {
      this.FilterSource();
    }

    if (this._dataSliderStatus === 'none') {
      this._dataSliderStatus = 'block';
      this.PopulateDataSet(clsGroupIndex);
    }
  }

  InputKeyDown(e: KeyboardEvent, isLast: boolean, clsGroupIndex: number) {
    if (e.key === ' ' && this._dataSet === null) {
      e.preventDefault();
      e.stopPropagation();
      return;
    } else if (
      isLast &&
      e.key === 'Tab' &&
      this._dataSliderStatus === 'block'
    ) {
      if (!this.isEmpty) {
        this.FilterSource();
        const item =
          this._dataSet && this._dataSet.length > 0 ? this._dataSet[0] : null;
        this.SetModel(item);
      } else {
        this.SetModel(null);
      }
      this.ResetProps();
    }

    this._cursorInCorD = isLast ? 'D' : 'C';

    const currentGroupObj = this.selector[clsGroupIndex];
    const codeValue = currentGroupObj.txtCode;
    const descValue = currentGroupObj.txtDesc;

    if (!codeValue && !isLast && e.key === 'Backspace' && this._codeEmptied) {
      e.preventDefault();
      this.descInputs.toArray()[clsGroupIndex].nativeElement.focus();
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
      this.codeInputs.toArray()[clsGroupIndex].nativeElement.focus();
      this._cursorInCorD = 'C';
      this.FilterSource();
      this._descEmptied = false;
    }
  }

  InputKeyUp(e: KeyboardEvent, isLast: boolean, clsGroupIndex: number) {
    if (
      this._currentClsGroupIndex !== -1 &&
      this._currentClsGroupIndex !== clsGroupIndex
    ) {
      this.ResetProps();
    }

    // Update form values from selector
    const codeControl = this.classificationForm.get(`code_${clsGroupIndex}`);
    const descControl = this.classificationForm.get(`desc_${clsGroupIndex}`);

    if (codeControl && descControl) {
      codeControl.setValue(this.selector[clsGroupIndex].txtCode);
      descControl.setValue(this.selector[clsGroupIndex].txtDesc);
    }

    if (e.key !== 'Tab') {
      if (this._dataSliderStatus !== 'block') {
        this._dataSliderStatus = 'block';
      }
      if (this._originalDataSet === null && !this._stillDataLoading)
        this.PopulateDataSet(clsGroupIndex);

      this.FilterSource();
    }

    const currentGroupObj = this.selector[clsGroupIndex];
    const codeValue = currentGroupObj.txtCode;
    const descValue = currentGroupObj.txtDesc;

    this._codeEmptied = !codeValue && !isLast;
    this._descEmptied = !descValue && isLast;
  }

  ClickedOn(e: MouseEvent, clsGroupIndex: number) {
    if (this.element.nativeElement.attributes['disabled']) {
      return;
    }

    if (
      this._currentClsGroupIndex !== -1 &&
      this._currentClsGroupIndex !== clsGroupIndex
    ) {
      this.ResetProps();
    }

    if (this._dataSliderStatus === 'none') {
      this._dataSliderStatus = 'block';
      this.PopulateDataSet(clsGroupIndex);
    }
    this._cursorInCorD = 'C';
    this.codeInputs.toArray()[this._currentClsGroupIndex].nativeElement.focus();
  }

  pagerClickCapture(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  private PopulateDataSet(clsGroupIndex: number) {
    const masterControlData = JSON.parse(
      localStorage.getItem('PROMPT_MasterControlData') || '{}'
    );

    if (masterControlData) {
      this._pageSize =
        masterControlData.allowPaging === '1'
          ? masterControlData?.pageSize ?? 10
          : masterControlData?.extendedPageSize ?? 10;
    }

    this._stillDataLoading = true;

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const APIArgs = {
      selectedIndex: clsGroupIndex,
      selector: this.selector,
      activeStatus: this.activeStatus,
    };

    this.clsBusy = this.http
      .post<any[]>(this.siteName() + '/api/Prompt/GetMasterValues', APIArgs, {
        headers,
      })
      .subscribe({
        next: (data) => {
          this._dataSet = data;
          this._originalDataSet = data;
          this.calculatePagination();
        },
        error: (error) => {
          console.error(
            'Error from classification selector list prompts',
            error,
            APIArgs
          );
        },
        complete: () => {
          this._stillDataLoading = false;
        },
      });
    this._currentClsGroupIndex = clsGroupIndex;
    this.AddEvent();
  }

  private FilterSource() {
    const currentFilteration = this.selector[this._currentClsGroupIndex];

    let FilterColumn = '';
    let FilterValue = '';

    if (this._cursorInCorD === 'C') {
      FilterColumn = 'masterGroupValue';
      FilterValue = currentFilteration.txtCode.toString().toUpperCase();
    } else {
      FilterColumn = 'masterGroupValueDescription';
      FilterValue = currentFilteration.txtDesc.toString().toUpperCase();
    }

    if (this._originalDataSet != null) {
      this._dataSet = this.filterArray(this._originalDataSet, (row: any) => {
        if (FilterColumn && FilterValue) {
          return row[FilterColumn].toString()
            .toUpperCase()
            .includes(FilterValue);
        } else {
          return true;
        }
      });
      this.calculatePagination();
      if (this.scrollDiv) {
        this.scrollDiv.nativeElement.scrollTop = 0;
      }
    }
  }

  private ResetProps() {
    this._dataSet = null;
    this._dataSliderStatus = 'none';
    this._dataSet = null;
    this._originalDataSet = null;
    this._currentClsGroupIndex = -1;
    this._codeEmptied = false;
    this._descEmptied = false;
    this.currentPage = 1;
  }

  private SetModel(item: any) {
    this.promptIndex = this._currentClsGroupIndex;
    if (item) {
      if (
        this.selector[this._currentClsGroupIndex].txtCode.trim() !==
        item['masterGroupValue'].trim()
      ) {
        this.clearChildValues();
      }

      this.selector[this._currentClsGroupIndex].txtCode =
        item['masterGroupValue'].trim();
      this.selector[this._currentClsGroupIndex].txtDesc =
        item['masterGroupValueDescription'].trim();
      this.selector[this._currentClsGroupIndex].latestText =
        item['masterGroupValue'].trim();
      this.selector[this._currentClsGroupIndex].errorMessage = undefined;

      // Update form values
      this.classificationForm
        .get(`code_${this._currentClsGroupIndex}`)
        ?.setValue(item['masterGroupValue'].trim());
      this.classificationForm
        .get(`desc_${this._currentClsGroupIndex}`)
        ?.setValue(item['masterGroupValueDescription'].trim());

      if (this.selector[this._currentClsGroupIndex].hierarchyRequired === '1') {
        this.autoFillHirarchy('withActiveStatus');
      }
    } else {
      this.selector[this._currentClsGroupIndex].txtCode = '';
      this.selector[this._currentClsGroupIndex].txtDesc = '';

      // Update form values
      this.classificationForm
        .get(`code_${this._currentClsGroupIndex}`)
        ?.setValue('');
      this.classificationForm
        .get(`desc_${this._currentClsGroupIndex}`)
        ?.setValue('');

      this.clearChildValues();
    }
    this.onValueChange(this._currentClsGroupIndex);
    this.onChange.emit();
  }

  private get isEmpty(): boolean {
    const currentFilteration = this.selector[this._currentClsGroupIndex];
    const FirstfilterValue = currentFilteration.txtCode;
    const SecondfilterValue = currentFilteration.txtDesc;

    if (this._cursorInCorD === 'C') return !FirstfilterValue;
    else if (this._cursorInCorD === 'D') return !SecondfilterValue;
    else return true;
  }

  private AddEvent() {
    const self = this;

    function handleClick(e: MouseEvent) {
      setTimeout(() => {
        if (!self.element.nativeElement.contains(e.target)) {
          if (self._dataSliderStatus === 'block') {
            if (!self.isEmpty) {
              self.FilterSource();
              const item =
                self._dataSet && self._dataSet.length > 0
                  ? self._dataSet[0]
                  : null;
              self.SetModel(item);
            } else {
              self.SetModel(null);
            }
          }
          self.ResetProps();
          window.removeEventListener('click', handleClick);
        }
      }, 0);
    }
    window.removeEventListener('click', handleClick);
    window.addEventListener('click', handleClick);
  }

  ItemSelected(item: any) {
    this.SetModel(item);
    this.ResetProps();
  }

  ClearModel(index: number) {
    this._currentClsGroupIndex = index;
    this.SetModel(null);
    this.FilterSource();
    this.codeInputs.toArray()[this._currentClsGroupIndex].nativeElement.focus();
  }

  public get valid() {
    if (this._dataSliderStatus === 'block') return false;
    else return this._valid;
  }

  // Pagination methods
  private calculatePagination() {
    if (this._dataSet) {
      this.totalPages = Math.ceil(this._dataSet.length / this._pageSize);
      this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Rest of the existing methods with reactive forms integration

  public clearChildValues(): void {
    if (
      this.promptIndex < this.selector.length - 1 &&
      this.selector[this.promptIndex + 1].hierarchyRequired === '1'
    ) {
      for (let i = this.promptIndex + 1; i < this.selector.length; i++) {
        if (this.selector[i].hierarchyRequired === '1') {
          this.selector[i].txtCode = '';
          this.selector[i].txtDesc = '';
          this.selector[i].latestText = '';

          // Update form values
          this.classificationForm.get(`code_${i}`)?.setValue('');
          this.classificationForm.get(`desc_${i}`)?.setValue('');
        }
      }
    }
  }

  public autoFillHirarchy(type: string): void {
    let apiUrl =
      this.siteName() +
      '/api/Prompt/GetMasterGroupValuesHirarchy?masterGroup=' +
      this.selector[this.promptIndex].masterGroup +
      '&Code=' +
      this.selector[this.promptIndex].txtCode.trim();

    if (type === 'withActiveStatus') {
      apiUrl = apiUrl + '&ActiveStatus=' + this.activeStatus;
    }

    this.clsBusy = this.http.get<any[]>(apiUrl).subscribe({
      next: (data) => {
        const groupValuesHirarchy = data;

        for (let i = 0; i < this.selector.length; i++) {
          const obj1 = this.getMasterGroupObj(
            groupValuesHirarchy,
            this.selector[i].masterGroup.toString()
          );
          if (obj1 != null) {
            this.selector[i].txtCode = obj1['masterGroupValue'].trim();
            this.selector[i].txtDesc =
              obj1['masterGroupValueDescription'].trim();
            this.selector[i].errorMessage = undefined;
            this.selector[i].latestText = obj1['masterGroupValue'].trim();

            // Update form values
            this.classificationForm
              .get(`code_${i}`)
              ?.setValue(obj1['masterGroupValue'].trim());
            this.classificationForm
              .get(`desc_${i}`)
              ?.setValue(obj1['masterGroupValueDescription'].trim());
          } else {
            this.selector[i].txtCode = '';
            this.selector[i].txtDesc = '';
            this.selector[i].latestText = '';

            // Update form values
            this.classificationForm.get(`code_${i}`)?.setValue('');
            this.classificationForm.get(`desc_${i}`)?.setValue('');
          }
        }
        this.validate();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  public getMasterGroupObj(array: any[], masterGroup: string): any {
    return this.findArray(
      array,
      (item: any) => item.masterGroup.trim() === masterGroup.trim()
    );
  }

  public onValueChange(index: number): void {
    if (this.allMandatory === 'true') {
      if (this.selector[index].txtCode === '') {
        this.selector[index].errorMessage = '*';
      } else {
        this.selector[index].errorMessage = undefined;
      }
    }

    if (this.lastLevelRequired === 'true') {
      if (index === this.selector.length - 1) {
        if (this.selector[index].txtCode === '') {
          this.selector[index].errorMessage = '*';
        } else {
          this.selector[index].errorMessage = undefined;
        }
      }
    }
    this.validate();
  }

  public validate(): void {
    for (let i = 0; i < this.selector.length; i++) {
      if (this.allMandatory === 'true') {
        if (this.selector[i].txtCode.trim() === '') {
          this.selector[i].errorMessage = '*';
        } else {
          this.selector[i].errorMessage = undefined;
        }
      } else {
        if (this.selector[i].txtCode.trim() === '') {
          this.selector[i].errorMessage = undefined;
        }
      }
    }

    if (this.lastLevelRequired === 'true') {
      const last = this.selector.length - 1;
      if (this.selector[last].txtCode === '') {
        this.selector[last].errorMessage = '*';
      } else {
        this.selector[last].errorMessage = undefined;
      }
    }

    for (let j = 0; j < this.selector.length; j++) {
      if (this.selector[j].errorMessage !== undefined) {
        this._valid = false;
        return;
      }
    }

    this._valid = true;
  }

  public getSelectedClassifications(): any[] {
    const result: any[] = [];

    for (let i = 0; i < this.selector.length; i++) {
      if (this.selector[i].txtCode.trim() !== '') {
        result.push({
          Index: i,
          groupCode: this.list[i].masterGroup.trim(),
          groupDescription: this.list[i].groupDescription.trim(),
          groupType: this.list[i].groupType.trim(),
          groupTypeDescription: this.list[i].groupType.trim(),
          hasHirarchy: this.list[i].hierarchyRequired.trim(),
          valueCode: this.selector[i].txtCode.trim(),
          valueDescription: this.selector[i].txtDesc.trim(),
        });
      }
    }

    if (result.length === 0) {
      if (this.selectedClassifications.length > 0) {
        return [...this.selectedClassifications];
      }
    }

    return result;
  }

  public setSelectedClassifications(array: any[]): void {
    if (array) {
      this.selectedClassifications = array;
      this.applySelectedClassifications(array);
    }
  }

  public applySelectedClassifications(array: any[]): void {
    this.cleanSelector();

    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < this.selector.length; j++) {
        if (this.selector[j].masterGroup.trim() === array[i].groupCode.trim()) {
          this.selector[j].txtCode = array[i].valueCode.trim();
          this.selector[j].txtDesc = array[i].valueDescription.trim();
          this.selector[j].latestText = '';

          // Update form values
          this.classificationForm
            .get(`code_${j}`)
            ?.setValue(array[i].valueCode.trim());
          this.classificationForm
            .get(`desc_${j}`)
            ?.setValue(array[i].valueDescription.trim());
        }
      }
    }
    this.validate();
  }

  public cleanSelector() {
    for (let i = 0; i < this.selector.length; i++) {
      this.selector[i].txtCode = '';
      this.selector[i].txtDesc = '';
      this.selector[i].errorMessage = undefined;
      this.selector[i].latestText = '';

      // Update form values
      this.classificationForm.get(`code_${i}`)?.setValue('');
      this.classificationForm.get(`desc_${i}`)?.setValue('');
    }
  }

  ngAfterViewInit() {
    // Additional initialization if needed
  }

  ngOnDestroy() {
    if (this.clsBusy) {
      this.clsBusy.unsubscribe();
    }
  }

  public focus(): void {
    const self = this;
    let timeTook = 0;

    function setFocus() {
      if (self.codeInputs && self.codeInputs.toArray()[0]) {
        self.codeInputs.toArray()[0].nativeElement.focus();
      } else if (timeTook < 1000) {
        setTimeout(setFocus, 100);
        timeTook += 100;
      }
    }
    setFocus();
  }
}

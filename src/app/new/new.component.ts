import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  inject,
  signal,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormArray,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Subscription, Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { DatetimeService } from '../datetime.service';
import { CommonService } from '../common.service';
import { ExecutiveService } from '../executive.service';

// Components
import { XontVenturaMessagePromptComponent } from '../xont-ventura-message-prompt/xont-ventura-message-prompt.component';
import { ListPromptComponent } from 'xont-ventura-list-prompt';
import { XontVenturaClassificationSelectorComponent } from '../xont-ventura-classification-selector/xont-ventura-classification-selector.component';
import { XontVenturaDatepickerComponent } from '../xont-ventura-datepicker/xont-ventura-datepicker.component';

import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

// Interfaces
interface SaveAllRequest {
  mode: string;
  executiveProfile: any;
  stock: any;
  hierarchy: any;
  other: any;
  merchandizing: any;
  executiveClassificationList: any[];
  marketingHierarchyClassificationList: any[];
  geoClassificationList: any[];
  returnLocationList: any[];
}

interface SelectedClassification {
  groupCode: string;
  groupDescription?: string;
  valueCode: string;
  valueDescription: string;
}

interface ExecutiveData {
  businessUnit: string;
  executiveCode: string;
  executiveName: string;
  executiveGroup: string;
  operationType: string;
  operationTypeDesc: string;
  userName: string;
  password: string;
  passwordExpiry: string;
  passwordReset: string;
  userLocked: number;
  authorityLevel: string;
  newRetailerType: string;
  imeiNumber: string;
  validateIMEI: number;
  mobileNumbers: string;
  emailAddress: string;
  status: string;
  timeStamp: string;
  isValidateOperationType: boolean;
  creditLimitValidation: string;
  allowPriceChange: string;
  cashCustomerOnly: string;
  gisExecutive: string;
  creditLimit: number;
  commissionPercentage: string;
  mappingExecutiveCode: string;
  surveyRecurrence: string;
  lastSurveyDate: string;
  surveyActiveDate: string;
  cashLimit: number;
  lastGRNNo: number;
  lastOrderNo: number;
  lastRetailerNo: number;
  autoTMRouteCode: string;
  tmpsaCodePrefix: string;
  nextTMPSANo: number;
  executiveType: string;
  parentExecutiveCode: string;
  parentExecutiveName: string;
  parentExecutiveType: string;
  applicationUserName: string;
  hierarchyGroup: string;
  hierarchyGroupDesc: string;
  costCenterCode: string;
  costCenterDesc: string;
  onlineExecutive: string;
  hierarchyTimeStamp: string;
  defaultTerritory: string;
  defaultSalesCategoryCode: string;
  defaultSalesCategoryDesc: string;
  defaultSalesLocationCode: string;
  defaultSalesWarehouseCode: string;
  defaultStockWarehouse: string;
  defaultStockLocation: string;
  defaultReturnWarehouse: string;
  defaultReturnLocation: string;
  defaultInspectionWarehouse: string;
  defaultInspectionLocation: string;
  defaultSpecialWarehouse: string;
  defaultSpecialLocation: string;
  defaultUnloadingWarehouse: string;
  defaultUnloadingLocation: string;
  stockTerritory: string;
  stockTerritoryDesc: string;
  defEmpCatCode: string;
  defEmpCatDesc: string;
  applicationType: string;
  recID: number;
  orderPrefix: null;
  bankingFrequency: number;
  distributorPath: string;
  downloadUplloadExist: number;
  dsnName: string;
  encryptedPassword: null;
  hierarchyType: string;
  hhuCode: string;
  intermedeatePath: string;
  path: string;
  lockedBy: string;
  lockedOn: string;
  updatedBy: null;
  userFullName: null;
  userID: string;
  incenScheme: string;
  incenSchemeDesc: string;
}

// Custom Validators
function passwordMatchValidator(
  control: AbstractControl
): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ mismatch: true });
    return { mismatch: true };
  } else {
    if (confirmPassword?.hasError('mismatch')) {
      confirmPassword.setErrors(null);
    }
  }
  return null;
}

function imeiValidator(control: AbstractControl): ValidationErrors | null {
  const chkValIMEI = control.get('chkValIMEI')?.value;
  const imei = control.get('imeiNo')?.value;

  if (chkValIMEI && (!imei || imei.trim() === '')) {
    const imeiControl = control.get('imeiNo');
    if (imeiControl) {
      imeiControl.setErrors({ required: true });
    }
    return { imeiRequired: true };
  } else {
    const imeiControl = control.get('imeiNo');
    if (imeiControl?.hasError('required') && !chkValIMEI) {
      imeiControl.setErrors(null);
    }
  }
  return null;
}

@Component({
  selector: 'app-executive-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    XontVenturaMessagePromptComponent,
    ListPromptComponent,
    XontVenturaClassificationSelectorComponent,
    XontVenturaDatepickerComponent,
    NgxSpinnerModule,
  ],
})
export class NewComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly commonService = inject(CommonService);
  private readonly executiveService = inject(ExecutiveService);
  private readonly cdr = inject(ChangeDetectorRef);
  private spinner = inject(NgxSpinnerService);

  // Form
  executiveForm!: FormGroup;

  // ViewChild references
  @ViewChild('msgPrompt') msgPrompt!: XontVenturaMessagePromptComponent;
  @ViewChild('clsExecutive')
  clsExecutive!: XontVenturaClassificationSelectorComponent;
  @ViewChild('clsMarketingHierarchy')
  clsMarketingHierarchy!: XontVenturaClassificationSelectorComponent;
  @ViewChild('clsGeo') clsGeo!: XontVenturaClassificationSelectorComponent;
  @ViewChild('lpmtOptType') lpmtOptType!: ListPromptComponent;
  @ViewChild('lpmtIncentiveGroup')
  lpmtIncentiveGroup!: ListPromptComponent;
  @ViewChild('lpmtUserProfile')
  lpmtUserProfile!: ListPromptComponent;
  @ViewChild('lpmtCostCenter') lpmtCostCenter!: ListPromptComponent;
  @ViewChild('lpmtParameterGroup')
  lpmtParameterGroup!: ListPromptComponent;
  @ViewChild('lpmtLoginUser') lpmtLoginUser!: ListPromptComponent;
  @ViewChild('lpmtUnloadingLocation')
  lpmtUnloadingLocation!: ListPromptComponent;
  @ViewChild('lpmtSalesLocation') lpmtSalesLocation!: ListPromptComponent;
  @ViewChild('lpmtStockLocation') lpmtStockLocation!: ListPromptComponent;
  @ViewChild('lpmtDamageLocation') lpmtDamageLocation!: ListPromptComponent;
  @ViewChild('lpmtInceptionLocation')
  lpmtInceptionLocation!: ListPromptComponent;
  @ViewChild('lpmtSpecialLocation') lpmtSpecialLocation!: ListPromptComponent;
  @ViewChild('lpmtDefSaleCategory') lpmtDefSaleCategory!: ListPromptComponent;
  @ViewChild('lpmtDefEmptyCategory') lpmtDefEmptyCategory!: ListPromptComponent;
  @ViewChild('lpmtStockTerritory') lpmtStockTerritory!: ListPromptComponent;
  @ViewChild('lpmtHierarchyGroup') lpmtHierarchyGroup!: ListPromptComponent;
  @ViewChild('lpmtParentHierarchy') lpmtParentHierarchy!: ListPromptComponent;
  @ViewChild('lpmtParentExecutive') lpmtParentExecutive!: ListPromptComponent;
  @ViewChild('lpmtExecutiveHierarchy')
  lpmtExecutiveHierarchy!: ListPromptComponent;

  // Classification configurations
  readonly cls1 = {
    ID: 'clsExecutive',
    Type: '03',
    TaskCode: 'SOMNT01',
    LabelWidth: '140px',
    EnableUserInput: 'false',
    CodeTextWidth: '120px',
    DescriptionTextWidth: '320px',
    ActiveStatus: 'Active',
    AllMandatory: 'true',
    LastLevelRequired: 'false',
    Enabled: 'true',
  };

  readonly cls2 = {
    ID: 'clsMarketingHierarchy',
    Type: '29',
    TaskCode: 'SOMNT01',
    LabelWidth: '140px',
    EnableUserInput: 'false',
    CodeTextWidth: '120px',
    DescriptionTextWidth: '320px',
    ActiveStatus: 'Active',
    AllMandatory: 'false',
    LastLevelRequired: 'false',
    Enabled: 'true',
  };

  readonly cls3 = {
    ID: 'clsGeo',
    Type: '00',
    TaskCode: 'SOMNT01',
    LabelWidth: '140px',
    EnableUserInput: 'false',
    CodeTextWidth: '120px',
    DescriptionTextWidth: '320px',
    ActiveStatus: 'Active',
    AllMandatory: 'true',
    LastLevelRequired: 'false',
    Enabled: 'true',
  };

  // Signals
  readonly isLoading = signal(false);
  readonly isEditMode = signal(false);
  readonly isNewBasedOnMode = signal(false);
  readonly hierarchyType = signal('');
  readonly returnTypes = signal<any[]>([]);
  readonly executiveGroups = signal<any[]>([]);

  // Data
  private pageInit: any = undefined;
  private executiveData: ExecutiveData | undefined = undefined;
  private subscriptions = new Set<Subscription>();

  public pnlReturn = { Visible: true };
  public pnlUserProfile = { Visible: true };
  public pnlStockDetails = { Visible: true };
  public pnlStockTerritory = { Visible: true };
  public parentexedisable = false;
  public validForm = true;
  public lblUserNameError = '';
  public lblMsg = '';
  public lblPasswordExpiryCompareError = '';
  public lblValidatePassword = '';
  public lblIMEIReq = '';

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadPageInitialization();
  }

  ngAfterViewInit(): void {
    this.loadStoredData();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
  }

  // Form getters
  get profile(): FormGroup {
    return this.executiveForm.get('profile') as FormGroup;
  }

  get stock(): FormGroup {
    return this.executiveForm.get('stock') as FormGroup;
  }

  get other(): FormGroup {
    return this.executiveForm.get('other') as FormGroup;
  }

  get merchandizing(): FormGroup {
    return this.executiveForm.get('merchandizing') as FormGroup;
  }

  get returnLocations(): FormArray {
    return this.executiveForm.get('returnLocations') as FormArray;
  }

  get ExecutiveCode(): FormControl {
    return this.profile.get('executiveCode') as FormControl;
  }

  get ExecutiveName(): FormControl {
    return this.profile.get('executiveName') as FormControl;
  }

  get CommissionPercentage(): FormControl {
    return this.other.get('commissionPercentage') as FormControl;
  }

  private initializeForm(): void {
    this.executiveForm = this.fb.group({
      profile: this.fb.group(
        {
          executiveCode: [
            '',
            [Validators.required, Validators.pattern('^[A-Za-z0-9_-]+$')],
          ],
          executiveName: [
            '',
            [Validators.required, Validators.pattern('^[^&#"\';]*$')],
          ],
          executiveGroup: ['1'],
          operationType: ['', Validators.required],
          operationTypeDesc: [''],
          incentiveGroup: [''],
          incentiveGroupDesc: [''],
          userName: ['', Validators.pattern('^[a-zA-Z0-9]*$')],
          password: [''],
          confirmPassword: [''],
          passwordExpiry: [''],
          chkPasswordReset: [false],
          chkUserLocked: [false],
          authorityLevel: ['1'],
          retailerType: ['0'],
          imeiNo: [''],
          chkValIMEI: [false],
          mobileNumbers: ['', Validators.pattern('^[0-9;\\d]*$')],
          emailAddress: [
            '',
            Validators.pattern(
              '^(([a-zA-Z0-9_\\-\\.]+)@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.)|(([a-zA-Z0-9\\-]+\\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\\]?)(\\s*;\\s*|\\s*$))*$'
            ),
          ],
          chkActive: [true],
          userProfile: [''],
          userProfileName: [''],
          joiningDate: [''],
          terminationDate: [''],
          timeStamp: [''],
          isValidateOperationType: [true],
        },
        { validators: [passwordMatchValidator, imeiValidator] }
      ),
      stock: this.fb.group({
        stockTerritory: [''],
        stockTerritoryDesc: [''],
        defSalesWarehouse: [''],
        defSalesLocation: [''],
        defSalesLocationDes: [''],
        defStockWarehouse: [''],
        defStockLocation: [''],
        defStockLocationDes: [''],
        defReturnWarehouse: [''],
        defReturnLocation: [''],
        defReturnLocationDes: [''],
        defInspectionWarehouse: [''],
        defInspectionLocation: [''],
        defInspectionLocationDes: [''],
        defSpecialWarehouse: [''],
        defSpecialLocation: [''],
        defSpecialLocationDes: [''],
        defUnloadingWarehouse: [''],
        defUnloadingLocation: [''],
        defUnloadingLocationDes: [''],
        salesCategoryCode: [''],
        salesCategoryCodeDes: [''],
        defEmptyTransactionCategory: [''],
        defEmptyTransactionCategoryDesc: [''],
      }),
      other: this.fb.group({
        chkCreditLimitValidation: [false],
        creditLimit: ['0.00', Validators.pattern('^[0-9.,]*$')],
        commissionPercentage: [null],
        lastGRNNo: ['0', Validators.pattern('^[0-9]*$')],
        cashLimit: ['0.00', Validators.pattern('^[0-9.,]*$')],
        lastRetailerNo: ['0', Validators.pattern('^[0-9]*$')],
        lastOrderNo: ['0', Validators.pattern('^[0-9]*$')],
        surveyRecurrence: [''],
        lastSurveyDate: [''],
        surveyActiveDate: [''],
        chkAllowPriceChange: [false],
        chkCashCustomerOnly: [false],
        chkGISExecutive: [false],
        parentExecutiveCode: [''],
        parentExecutiveName: [''],
        parentExecutiveType: [''],
        executiveType: [''],
        executiveTypeHierarchyLevel: [0],
        hierarchyTimeStamp: [''],
        commissionPercentagevalid: [true],
        mappingExecutiveCode: [''],
        applicationType: [''],
        executiveclsType: [''],
        chkOnlineExecutive: [false],
        appUserName: [''],
        userFullName: [''],
        parameter: [''],
        parameterDescription: [''],
        costCenterCode: [''],
        costCenterDesc: [''],
      }),
      merchandizing: this.fb.group({
        chkAutoTMRouteCode: [false],
        tmRouteCodePrefix: ['', Validators.pattern('^[A-Za-z0-9_-]*$')],
        nextTMRouteNo: [''],
      }),
      returnLocations: this.fb.array([]),
    });
  }

  private loadPageInitialization(): void {
    const storedPageInit = localStorage.getItem('SOMNT01_PageInit');
    if (!storedPageInit) {
      this.router.navigate(['list']);
      return;
    }

    try {
      this.pageInit = JSON.parse(storedPageInit);
      this.setFormMode(this.pageInit.mode);
      this.loadExecutiveGroups();

      this.GetHierarchyType();
      if (this.isEditMode() || this.isNewBasedOnMode()) {
        this.loadExecutiveData();
      } else {
        this.initializeNewMode();
      }
    } catch (error) {
      console.error('Failed to parse page initialization data:', error);
      this.router.navigate(['list']);
    }
  }

  private setFormMode(mode: string): void {
    this.isEditMode.set(mode === 'edit');
    this.isNewBasedOnMode.set(mode === 'newBasedOn');
    if (mode === 'edit') {
      this.ExecutiveCode.disable();
      this.pnlUserProfile.Visible = false;
      //this.lpmtCostCenter.mandatory = false;
    } else {
      this.ExecutiveCode.enable();
      this.setRequired('userProfile');
      this.setRequired('joiningDate');
    }
  }
  setRequired(controlName: string) {
    const control = this.profile.get(controlName);
    if (control) {
      control.setValidators([Validators.required]);
      control.updateValueAndValidity();
    }
  }

  private initializeNewMode(): void {
    this.profile.patchValue({ chkActive: true, isValidateOperationType: true });
    this.other.get('lastGRNNo')?.disable();
    this.other.get('lastSurveyDate')?.disable();
    this.other.get('lastRetailerNo')?.disable();
    this.other.get('lastOrderNo')?.disable();

    this.LoadReturnLocations();
  }

  private loadStoredData(): void {
    // Load any additional stored data if needed
  }

  private loadExecutiveGroups(): void {
    const sub = this.executiveService.getExecutiveGroups().subscribe({
      next: (data) => {
        this.executiveGroups.set(data);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showError(err);
      },
    });
    this.subscriptions.add(sub);
  }

  private loadExecutiveData(): void {
    this.isLoading.set(true);
    const sub = this.executiveService
      .getExecutiveData(this.pageInit.executiveCode.trim())
      .subscribe({
        next: (data: any) => {
          this.executiveData = data;
          this.populateFormData();
          this.isLoading.set(false);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.showError(err);
          this.isLoading.set(false);
        },
      });
    this.subscriptions.add(sub);
  }

  private populateFormData(): void {
    if (!this.executiveData) return;

    const formatDateForUI = (dateStr: string | null | undefined): string => {
      if (!dateStr || dateStr === '1900-01-01T00:00:00') return '';
      try {
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return '';
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${month}/${day}/${year}`;
      } catch (e) {
        console.error('Error formatting date:', dateStr, e);
        return '';
      }
    };

    let surveyRecurrenceDisplay = '';
    switch (this.executiveData.surveyRecurrence?.trim()) {
      case 'Y':
        surveyRecurrenceDisplay = 'Year';
        break;
      case 'M':
        surveyRecurrenceDisplay = 'Month';
        break;
      case 'W':
        surveyRecurrenceDisplay = 'Week';
        break;
      case 'D':
        surveyRecurrenceDisplay = 'Date';
        break;
      default:
        surveyRecurrenceDisplay = '';
    }

    // Populate Profile Tab
    this.profile.patchValue({
      executiveCode: this.isEditMode()
        ? this.executiveData.executiveCode?.trim() || ''
        : '',
      executiveName: this.executiveData.executiveName?.trim() || '',
      executiveGroup: this.executiveData.executiveGroup?.trim() || '1',
      operationType: this.executiveData.operationType?.trim() || '',
      operationTypeDesc: this.executiveData.operationTypeDesc?.trim() || '',
      incentiveGroup: this.executiveData.incenScheme?.trim() || '',
      incentiveGroupDesc: this.executiveData.incenSchemeDesc?.trim() || '',
      userName: this.executiveData.userName?.trim() || '',
      passwordExpiry: formatDateForUI(this.executiveData.passwordExpiry),
      chkPasswordReset: this.executiveData.passwordReset === '1',
      chkUserLocked: this.executiveData.userLocked === 1,
      authorityLevel: this.executiveData.authorityLevel?.trim() || '1',
      retailerType: this.executiveData.newRetailerType?.trim() || '0',
      imeiNo: this.executiveData.imeiNumber?.trim() || '',
      chkValIMEI: this.executiveData.validateIMEI === 1,
      mobileNumbers: this.executiveData.mobileNumbers?.trim() || '',
      emailAddress: this.executiveData.emailAddress?.trim() || '',
      chkActive: this.executiveData.status === '1',
      timeStamp: this.executiveData.timeStamp?.trim() || '',
      isValidateOperationType:
        this.executiveData.isValidateOperationType ?? true,
    });

    // Populate Stock Tab
    this.stock.patchValue({
      stockTerritory:
        this.executiveData.defaultTerritory?.trim() ||
        this.executiveData.stockTerritory?.trim() ||
        '',
      defSalesWarehouse:
        this.executiveData.defaultSalesWarehouseCode?.trim() || '',
      defSalesLocation:
        this.executiveData.defaultSalesLocationCode?.trim() || '',
      defStockWarehouse: this.executiveData.defaultStockWarehouse?.trim() || '',
      defStockLocation: this.executiveData.defaultStockLocation?.trim() || '',
      defReturnWarehouse:
        this.executiveData.defaultReturnWarehouse?.trim() || '',
      defReturnLocation: this.executiveData.defaultReturnLocation?.trim() || '',
      defInspectionWarehouse:
        this.executiveData.defaultInspectionWarehouse?.trim() || '',
      defInspectionLocation:
        this.executiveData.defaultInspectionLocation?.trim() || '',
      defSpecialWarehouse:
        this.executiveData.defaultSpecialWarehouse?.trim() || '',
      defSpecialLocation:
        this.executiveData.defaultSpecialLocation?.trim() || '',
      defUnloadingWarehouse:
        this.executiveData.defaultUnloadingWarehouse?.trim() || '',
      defUnloadingLocation:
        this.executiveData.defaultUnloadingLocation?.trim() || '',
      salesCategoryCode:
        this.executiveData.defaultSalesCategoryCode?.trim() || '',
      salesCategoryCodeDes:
        this.executiveData.defaultSalesCategoryDesc?.trim() || '',
      defEmptyTransactionCategory:
        this.executiveData.defEmpCatCode?.trim() || '',
      defEmptyTransactionCategoryDesc:
        this.executiveData.defEmpCatDesc?.trim() || '',
    });

    // Populate Other Tab
    this.other.patchValue({
      chkCreditLimitValidation:
        this.executiveData.creditLimitValidation === '1',
      creditLimit: this.executiveData.creditLimit?.toString() || '0.00',
      commissionPercentage:
        this.executiveData.commissionPercentage !== null &&
        this.executiveData.commissionPercentage !== undefined
          ? parseFloat(this.executiveData.commissionPercentage)
          : null,
      lastGRNNo: this.executiveData.lastGRNNo?.toString() || '0',
      cashLimit: this.executiveData.cashLimit?.toString() || '0.00',
      lastRetailerNo: this.executiveData.lastRetailerNo?.toString() || '0',
      lastOrderNo: this.executiveData.lastOrderNo?.toString() || '0',
      surveyRecurrence: surveyRecurrenceDisplay,
      lastSurveyDate: formatDateForUI(this.executiveData.lastSurveyDate),
      surveyActiveDate: formatDateForUI(this.executiveData.surveyActiveDate),
      chkAllowPriceChange: this.executiveData.allowPriceChange === '1',
      chkCashCustomerOnly: this.executiveData.cashCustomerOnly === '1',
      chkGISExecutive: this.executiveData.gisExecutive === '1',
      chkOnlineExecutive: this.executiveData.onlineExecutive === '1',
      parentExecutiveCode: this.executiveData.parentExecutiveCode?.trim() || '',
      parentExecutiveName: this.executiveData.parentExecutiveName?.trim() || '',
      parentExecutiveType: this.executiveData.parentExecutiveType?.trim() || '',
      executiveType: this.executiveData.executiveType?.trim() || '',
      commissionPercentagevalid: true,
      mappingExecutiveCode:
        this.executiveData.mappingExecutiveCode?.trim() || '',
      applicationType: this.executiveData.applicationType?.trim() || '',
      appUserName: this.executiveData.applicationUserName?.trim() || '',
      parameter: this.executiveData.hierarchyGroup?.trim() || '',
      parameterDescription: this.executiveData.hierarchyGroupDesc?.trim() || '',
      costCenterCode: this.executiveData.costCenterCode?.trim() || '',
      costCenterDesc: this.executiveData.costCenterDesc?.trim() || '',
    });

    // Populate Merchandizing Tab
    this.merchandizing.patchValue({
      chkAutoTMRouteCode: this.executiveData.autoTMRouteCode === '1',
      tmRouteCodePrefix: this.executiveData.tmpsaCodePrefix?.trim() || '',
      nextTMRouteNo: this.executiveData.nextTMPSANo?.toString() || '',
    });
    let opType = this.profile.get('operationType')?.value;
    if (
      !(opType.trim() == 'OR' || opType.trim() == 'SL' || opType.trim() == 'BT')
    ) {
      //V3008
      this.pnlReturn.Visible = false;
      this.pnlStockDetails.Visible = false;
      this.pnlStockTerritory.Visible = false;
      this.profile.patchValue({
        isValidateOperationType: false,
      });
    } else {
      this.pnlReturn.Visible = true;
      this.pnlStockDetails.Visible = true;
      this.pnlStockTerritory.Visible = true;
      this.profile.patchValue({
        isValidateOperationType: false,
      });
    }
    this.hierarchyType.set(this.executiveData.hierarchyType?.trim() || '');
    this.loadClassificationData();
    this.LoadReturnLocations();
  }

  private loadClassificationData(): void {
    if (this.pageInit?.executiveCode) {
      this.loadExecutiveClassification();
      this.loadMarketingHierarchyClassification();
      this.loadGeoClassification();
    }
  }

  private loadExecutiveClassification(): void {
    const sub = this.executiveService
      .getExecutiveClassificationData(this.pageInit.executiveCode.trim(), '03')
      .subscribe({
        next: (data) => {
          if (data && Array.isArray(data)) {
            this.setClassificationSelections(this.clsExecutive, data);
          }
        },
        error: (err: any) => {
          this.showError(err);
        },
      });
    this.subscriptions.add(sub);
  }

  private loadMarketingHierarchyClassification(): void {
    const sub = this.executiveService
      .getExecutiveClassificationData(this.pageInit.executiveCode.trim(), '29')
      .subscribe({
        next: (data) => {
          if (data && Array.isArray(data)) {
            this.setClassificationSelections(this.clsMarketingHierarchy, data);
          }
        },
        error: (err: any) => {
          this.showError(err);
        },
      });
    this.subscriptions.add(sub);
  }

  private loadGeoClassification(): void {
    const sub = this.executiveService
      .getExecutiveClassificationData(this.pageInit.executiveCode.trim(), '00')
      .subscribe({
        next: (data) => {
          if (data && Array.isArray(data)) {
            this.setClassificationSelections(this.clsGeo, data);
            this.clsGeo_SelectionChange();
          }
        },
        error: (err: any) => {
          this.showError(err);
        },
      });
    this.subscriptions.add(sub);
  }

  private setClassificationSelections(
    component: XontVenturaClassificationSelectorComponent,
    data: any[]
  ): void {
    if (component) {
      const clsArray = data.map((item) => ({
        groupCode: item.masterGroup?.trim() || '',
        valueCode: item.masterGroupValue?.trim() || '',
        valueDescription: item.masterGroupValueDescription?.trim() || '',
      }));
      component.setSelectedClassifications(clsArray);
    }
  }

  // Public Methods
  clsGeo_SelectionChange(): void {
    const selectedcls = this.clsGeo?.getSelectedClassifications() || [];
    let foundTerritory = false;

    for (const item of selectedcls) {
      if (item.groupCode?.trim() === 'TETY' && item.valueCode?.trim() !== '') {
        this.stock.patchValue({
          stockTerritory: item.valueCode.trim(),
          stockTerritoryDesc: item.valueDescription.trim(),
        });
        foundTerritory = true;
        break;
      }
    }
    if (!foundTerritory) {
      this.stock.patchValue({
        stockTerritory: '',
        stockTerritoryDesc: '',
      });
    }
    this.LoadReturnLocations();
  }

  LoadReturnLocations(): void {
    const stockTerritory = this.stock.get('stockTerritory')?.value || '';
    let returnLocationObservable: Observable<any>;

    if (stockTerritory && this.pageInit?.executiveCode) {
      returnLocationObservable = this.executiveService.getReturnLocations(
        stockTerritory,
        this.pageInit.executiveCode.trim()
      );
    } else {
      returnLocationObservable = of([]);
    }

    const sub = returnLocationObservable.subscribe({
      next: (data: any[]) => {
        this.returnTypes.set(data || []);
        this.updateReturnLocationsFormArray(data || []);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.showError(err);
        this.returnTypes.set([]);
        this.updateReturnLocationsFormArray([]);
      },
    });
    this.subscriptions.add(sub);
  }

  private updateReturnLocationsFormArray(locations: any[]): void {
    const returnLocationsFormArray = this.executiveForm.get(
      'returnLocations'
    ) as FormArray;
    returnLocationsFormArray.clear();
    locations.forEach((location) => {
      returnLocationsFormArray.push(
        this.fb.group({
          returnTypeCode: [location.returnTypeCode || ''],
          returnTypeDescription: [location.returnTypeDescription || ''],
          locationCode: [location.locationCode || ''],
          warehouseName: [location.warehouseName || ''],
          locationName: [location.locationName || ''],
          warehouseCode: [location.warehouseCode || ''],
          status: [location.status !== undefined ? location.status : 1],
          dropDownData: [location.dropDownData || []],
        })
      );
    });
  }

  ddlReturnType_SelectedIndexChanged(index: number, event: any): void {
    const selectedLocationCode = event?.target?.value;
    if (!selectedLocationCode) {
      const locationGroup = this.returnLocations.at(index) as FormGroup;
      if (locationGroup) {
        locationGroup.patchValue({
          warehouseName: '',
          locationName: '',
          warehouseCode: '',
        });
      }
      return;
    }

    const locationGroup = this.returnLocations.at(index) as FormGroup;
    if (!locationGroup) return;

    const dropDownData = locationGroup.get('dropDownData')?.value;
    if (Array.isArray(dropDownData)) {
      const selectedOption = dropDownData.find(
        (opt: any) => opt.locationCode === selectedLocationCode
      );
      if (selectedOption) {
        locationGroup.patchValue({
          warehouseName: selectedOption.warehouseDesc || '',
          locationName: selectedOption.locationDesc || '',
          warehouseCode: selectedOption.warehouseCode || '',
        });
      }
    }
  }

  GetHierarchyType(): void {
    const sub = this.executiveService.GetHierarchyType().subscribe({
      next: (data) => {
        this.hierarchyType.set(data || '');
        if (data === '1') {
          this.lpmtParameterGroup_DataBind();
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error getting hierarchy type:', error);
      },
    });
    this.subscriptions.add(sub);
  }

  lpmtParameterGroup_DataBind(): void {
    if (this.lpmtParameterGroup) {
      this.lpmtParameterGroup.dataSourceObservable =
        this.executiveService.GetParameterGroup();
    }
  }

  lpmtLoginUser_Databind(): void {
    if (this.lpmtLoginUser) {
      this.lpmtLoginUser.dataSourceObservable =
        this.executiveService.GetAppLoginUser();
    }
  }

  validateCommissionPercentage(): void {
    const commissionControl = this.CommissionPercentage;
    const commissionValue = commissionControl.value;

    let isValid = true;
    if (
      commissionValue !== null &&
      commissionValue !== '' &&
      !isNaN(Number(commissionValue))
    ) {
      const commissionNum = Number(commissionValue);
      isValid = commissionNum >= 0 && commissionNum <= 100;
    } else if (commissionValue !== null && commissionValue !== '') {
      isValid = false;
    }
    this.other.patchValue({ commissionPercentagevalid: isValid });

    if (!isValid && commissionValue !== null && commissionValue !== '') {
      commissionControl.setErrors({ invalidCommission: true });
    } else {
      if (commissionControl.hasError('invalidCommission')) {
        commissionControl.setErrors(null);
      }
    }
    this.other.updateValueAndValidity();
  }

  chkAutoTMRouteCode_CheckedChanged(): void {
    const isChecked = this.merchandizing.get('chkAutoTMRouteCode')?.value;
    const prefixControl = this.merchandizing.get('tmRouteCodePrefix');

    if (isChecked) {
      prefixControl?.enable();
      if (this.isEditMode() && this.pageInit?.executiveCode) {
        this.loadNextTMRouteNo();
      } else {
        this.merchandizing.patchValue({ nextTMRouteNo: '' });
      }
    } else {
      prefixControl?.disable();
      this.merchandizing.patchValue({
        tmRouteCodePrefix: '',
        nextTMRouteNo: '',
      });
    }
  }

  private loadNextTMRouteNo(): void {
    if (!this.pageInit?.executiveCode) return;
    const sub = this.executiveService
      .getNextTMRouteNo(this.pageInit.executiveCode.trim())
      .subscribe({
        next: (data: any) => {
          this.merchandizing.patchValue({
            nextTMRouteNo: data?.toString() || '',
          });
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.showError(err);
        },
      });
    this.subscriptions.add(sub);
  }

  onSubmit(): void {
    if (this.executiveForm.invalid) {
      this.markFormGroupTouched(this.executiveForm);
      console.log('Form is invalid');
      return;
    }
    this.spinner.show();
    this.isLoading.set(true);
    const requestData = this.prepareSubmitData();
    console.log('Submitting Data:', JSON.stringify(requestData, null, 2));

    const sub = this.executiveService.saveExecutiveData(requestData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        console.log('Save Response:', response);
        if (response === true || response?.success === true) {
          this.router.navigate(['list']);
        } else {
          this.handleSaveError({
            message: response?.message || response?.toString() || 'Save failed',
          });
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error('Save Error:', err);
        this.showError(err);
      },
    });
    this.spinner.hide();
    this.subscriptions.add(sub);
  }

  private prepareSubmitData(): SaveAllRequest {
    const execClassifications: SelectedClassification[] =
      this.clsExecutive?.getSelectedClassifications() || [];
    const marketingHierarchyClassifications: SelectedClassification[] =
      this.clsMarketingHierarchy?.getSelectedClassifications() || [];
    const geoClassifications: SelectedClassification[] =
      this.clsGeo?.getSelectedClassifications() || [];

    const profileValue = this.profile.getRawValue();
    const stockValue = this.stock.getRawValue();
    const otherValue = this.other.getRawValue();
    const merchValue = this.merchandizing.getRawValue();

    let surveyRecurrenceCode = '';
    switch (otherValue.surveyRecurrence?.trim()) {
      case 'Year':
        surveyRecurrenceCode = 'Y';
        break;
      case 'Month':
        surveyRecurrenceCode = 'M';
        break;
      case 'Week':
        surveyRecurrenceCode = 'W';
        break;
      case 'Date':
        surveyRecurrenceCode = 'D';
        break;
      default:
        surveyRecurrenceCode = '';
    }

    const request: SaveAllRequest = {
      mode: this.pageInit?.mode || 'new',
      executiveProfile: {
        executiveCode: profileValue.executiveCode,
        executiveName: profileValue.executiveName,
        executiveGroup: profileValue.executiveGroup,
        operationType: profileValue.operationType,
        operationTypeDesc: profileValue.operationTypeDesc,
        incentiveGroup: profileValue.incentiveGroup,
        incentiveGroupDesc: profileValue.incentiveGroupDesc,
        userName: profileValue.userName,
        password: profileValue.password,
        confirmPassword: profileValue.confirmPassword,
        passwordExpiry: profileValue.passwordExpiry || '',
        chkPasswordReset: profileValue.chkPasswordReset,
        chkUserLocked: profileValue.chkUserLocked,
        authorityLevel: profileValue.authorityLevel,
        retailerType: profileValue.retailerType,
        imeiNo: profileValue.imeiNo,
        chkValIMEI: profileValue.chkValIMEI,
        mobileNumbers: profileValue.mobileNumbers,
        emailAddress: profileValue.emailAddress,
        chkActive: profileValue.chkActive,
        userProfile: profileValue.userProfile,
        userProfileName: profileValue.userProfileName,
        joiningDate: profileValue.joiningDate || '',
        terminationDate: profileValue.terminationDate || '',
        timeStamp: profileValue.timeStamp,
        isValidateOperationType: profileValue.isValidateOperationType,
      },
      stock: {
        stockTerritory: stockValue.stockTerritory,
        stockTerritoryDesc: stockValue.stockTerritoryDesc,
        defSalesWarehouse: stockValue.defSalesWarehouse,
        defSalesLocation: stockValue.defSalesLocation,
        defSalesLocationDes: stockValue.defSalesLocationDes,
        defStockWarehouse: stockValue.defStockWarehouse,
        defStockLocation: stockValue.defStockLocation,
        defStockLocationDes: stockValue.defStockLocationDes,
        defReturnWarehouse: stockValue.defReturnWarehouse,
        defReturnLocation: stockValue.defReturnLocation,
        defReturnLocationDes: stockValue.defReturnLocationDes,
        defInspectionWarehouse: stockValue.defInspectionWarehouse,
        defInspectionLocation: stockValue.defInspectionLocation,
        defInspectionLocationDes: stockValue.defInspectionLocationDes,
        defSpecialWarehouse: stockValue.defSpecialWarehouse,
        defSpecialLocation: stockValue.defSpecialLocation,
        defSpecialLocationDes: stockValue.defSpecialLocationDes,
        defUnloadingWarehouse: stockValue.defUnloadingWarehouse,
        defUnloadingLocation: stockValue.defUnloadingLocation,
        defUnloadingLocationDes: stockValue.defUnloadingLocationDes,
        salesCategoryCode: stockValue.salesCategoryCode,
        salesCategoryCodeDes: stockValue.salesCategoryCodeDes,
        defEmptyTransactionCategory: stockValue.defEmptyTransactionCategory,
        defEmptyTransactionCategoryDesc:
          stockValue.defEmptyTransactionCategoryDesc,
      },
      hierarchy: {
        hierarchyGroup: '',
      },
      other: {
        chkCreditLimitValidation: otherValue.chkCreditLimitValidation,
        creditLimit: parseFloat(otherValue.creditLimit) || 0,
        commissionPercentage:
          otherValue.commissionPercentage !== null
            ? otherValue.commissionPercentage.toString()
            : '',
        lastGRNNo: parseInt(otherValue.lastGRNNo) || 0,
        cashLimit: parseFloat(otherValue.cashLimit) || 0,
        lastRetailerNo: parseInt(otherValue.lastRetailerNo) || 0,
        lastOrderNo: parseInt(otherValue.lastOrderNo) || 0,
        surveyRecurrence: surveyRecurrenceCode,
        lastSurveyDate: otherValue.lastSurveyDate || '',
        surveyActiveDate: otherValue.surveyActiveDate || '',
        chkAllowPriceChange: otherValue.chkAllowPriceChange,
        chkCashCustomerOnly: otherValue.chkCashCustomerOnly,
        chkGISExecutive: otherValue.chkGISExecutive,
        parentExecutiveCode: otherValue.parentExecutiveCode,
        parentExecutiveName: otherValue.parentExecutiveName,
        parentExecutiveType: otherValue.parentExecutiveType,
        executiveType: otherValue.executiveType,
        executiveTypeHierarchyLevel:
          otherValue.executiveTypeHierarchyLevel || 0,
        hierarchyTimeStamp: otherValue.hierarchyTimeStamp || '',
        mappingExecutiveCode: otherValue.mappingExecutiveCode,
        applicationType: otherValue.applicationType,
        executiveclsType: otherValue.executiveclsType,
        chkOnlineExecutive: otherValue.chkOnlineExecutive,
        appUserName: otherValue.appUserName,
        userFullName: otherValue.userFullName,
        parameter: otherValue.parameter,
        parameterDescription: otherValue.parameterDescription,
        costCenterCode: otherValue.costCenterCode,
        costCenterDesc: otherValue.costCenterDesc,
      },
      merchandizing: {
        chkAutoTMRouteCode: merchValue.chkAutoTMRouteCode,
        tmRouteCodePrefix: merchValue.tmRouteCodePrefix,
        nextTMRouteNo: merchValue.nextTMRouteNo
          ? parseInt(merchValue.nextTMRouteNo)
          : 0,
      },
      executiveClassificationList:
        this.mapClassificationsForBackend(execClassifications),
      marketingHierarchyClassificationList: this.mapClassificationsForBackend(
        marketingHierarchyClassifications
      ),
      geoClassificationList:
        this.mapClassificationsForBackend(geoClassifications),
      returnLocationList: this.returnLocations.value.map((loc: any) => ({
        executiveCode: profileValue.executiveCode,
        returnTypeCode: loc.returnTypeCode,
        warehouseCode: loc.warehouseCode,
        locationCode: loc.locationCode,
      })),
    };

    return request;
  }

  private mapClassificationsForBackend(
    classifications: SelectedClassification[]
  ): any[] {
    return classifications.map((cls) => ({
      executiveCode: this.profile.get('executiveCode')?.value || '',
      masterGroup: cls.groupCode || '',
      masterGroupDescription: cls.groupDescription || '',
      masterGroupValue: cls.valueCode || '',
      masterGroupValueDescription: cls.valueDescription || '',
      status: '1',
    }));
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control) {
        if (control instanceof FormGroup || control instanceof FormArray) {
          this.markFormGroupTouched(control);
        } else {
          control.markAsTouched();
        }
      }
    });
  }

  private handleSaveError(response: any): void {
    if (typeof response?.message === 'string') {
      this.showError({ message: response.message });
    } else if (response?.message) {
      this.showError(response);
    } else {
      this.showError({ message: 'An error occurred during save.' });
    }
  }

  btnCancel_Click(): void {
    this.router.navigate(['list']);
  }

  siteName(): string {
    return this.commonService.getAPIPrefix();
  }

  showError(err: any): void {
    if (this.msgPrompt) {
      let message = 'An error occurred';
      if (err?.error?.message) {
        message = err.error.message;
      } else if (err?.message) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      this.msgPrompt.show(message, 'SOMNT01');
    } else {
      console.error('Message prompt not available:', err);
    }
  }

  // Event Handlers
  lpmtOptType_Changed(event: any): void {
    const operationType = this.profile.get('operationType')?.value;
    const validTypes = ['OR', 'SL', 'BT'];
    const isVisible = operationType && validTypes.includes(operationType);
    this.profile.patchValue({ isValidateOperationType: !!isVisible });
    if (!isVisible) {
      this.pnlReturn.Visible = false;
      this.pnlStockDetails.Visible = false;
      this.pnlStockTerritory.Visible = false;
    } else {
      this.pnlReturn.Visible = true;
      this.pnlStockDetails.Visible = true;
      this.pnlStockTerritory.Visible = true;
    }
  }

  onPasswordExpirySelect(date: string | null): void {
    this.profile.patchValue({ passwordExpiry: date || '' });
  }

  onJoiningDateSelect(date: string | null): void {
    this.profile.patchValue({ joiningDate: date || '' });
  }

  onTerminationDateSelect(date: string | null): void {
    this.profile.patchValue({ terminationDate: date || '' });
  }

  onLastSurveyDateSelect(date: string | null): void {
    this.other.patchValue({ lastSurveyDate: date || '' });
  }

  onSurveyActiveDateSelect(date: string | null): void {
    this.other.patchValue({ surveyActiveDate: date || '' });
  }

  lpmtOptType_DataBind(): void {
    if (this.lpmtOptType) {
      this.lpmtOptType.dataSourceObservable =
        this.executiveService.getNewOptTypePrompt();
    }
  }

  lpmtIncentiveGroup_DataBind(): void {
    if (this.lpmtIncentiveGroup) {
      this.lpmtIncentiveGroup.dataSourceObservable =
        this.executiveService.getIncentiveGroupPrompt();
    }
  }

  lpmtUserProfile_DataBind(): void {
    if (this.lpmtUserProfile) {
      this.lpmtUserProfile.dataSourceObservable =
        this.executiveService.getUserProfilePrompt();
    }
  }

  lpmtUnloadingLocation_DataBind(): void {
    const stockTerritory = this.stock.get('stockTerritory')?.value || '';
    if (this.lpmtUnloadingLocation) {
      this.lpmtUnloadingLocation.dataSourceObservable =
        this.executiveService.getUnloadingLocation(stockTerritory.trim());
    }
  }

  lpmtSalesLocation_DataBind(): void {
    const stockTerritory = this.stock.get('stockTerritory')?.value || '';
    if (this.lpmtSalesLocation) {
      this.lpmtSalesLocation.dataSourceObservable =
        this.executiveService.getSalesLocation(stockTerritory.trim());
    }
  }

  lpmtStockLocation_DataBind(): void {
    const stockTerritory = this.stock.get('stockTerritory')?.value || '';
    if (this.lpmtStockLocation) {
      this.lpmtStockLocation.dataSourceObservable =
        this.executiveService.getStockLocation(stockTerritory.trim());
    }
  }

  lpmtDamageLocation_DataBind(): void {
    const stockTerritory = this.stock.get('stockTerritory')?.value || '';
    if (this.lpmtDamageLocation) {
      this.lpmtDamageLocation.dataSourceObservable =
        this.executiveService.getDamageLocation(stockTerritory.trim());
    }
  }

  lpmtInceptionLocation_DataBind(): void {
    const stockTerritory = this.stock.get('stockTerritory')?.value || '';
    if (this.lpmtInceptionLocation) {
      this.lpmtInceptionLocation.dataSourceObservable =
        this.executiveService.getInceptionLocation(stockTerritory.trim());
    }
  }

  lpmtSpecialLocation_DataBind(): void {
    const stockTerritory = this.stock.get('stockTerritory')?.value || '';
    if (this.lpmtSpecialLocation) {
      this.lpmtSpecialLocation.dataSourceObservable =
        this.executiveService.getSpecialLocation(stockTerritory.trim());
    }
  }

  lpmtDefSaleCategory_DataBind(): void {
    const selectedcls = this.clsGeo.getSelectedClassifications();
    const operationType = this.profile.get('operationType')?.value || '';
    let territoryCode = '';

    if (operationType.trim() !== 'MK') {
      if (selectedcls.length > 0) {
        for (let i = 0; i < selectedcls.length; i++) {
          if (selectedcls[i].groupCode?.trim() === 'TETY') {
            if (selectedcls[i].valueCode?.trim() !== '') {
              territoryCode = selectedcls[i].valueCode.trim();
              break;
            }
          }
        }

        if (territoryCode === '') {
          this.showError({
            message: 'Territory Code in Stock tab is required',
          });
          return;
        }
      } else {
        this.showError({ message: 'Territory Code in Stock tab is required' });
        return;
      }
    }

    if (this.lpmtDefSaleCategory) {
      this.lpmtDefSaleCategory.dataSourceObservable =
        this.executiveService.getDefSaleCategory(
          operationType.trim(),
          territoryCode.trim()
        );
    }
  }

  lpmtDefEmptyCategory_DataBind(): void {
    const selectedcls = this.clsGeo.getSelectedClassifications();
    const operationType = this.profile.get('operationType')?.value || '';
    let territoryCode = '';

    if (operationType.trim() !== 'MK') {
      if (selectedcls.length > 0) {
        for (let i = 0; i < selectedcls.length; i++) {
          if (selectedcls[i].groupCode?.trim() === 'TETY') {
            if (selectedcls[i].valueCode?.trim() !== '') {
              territoryCode = selectedcls[i].valueCode.trim();
              break;
            }
          }
        }

        if (territoryCode === '') {
          this.showError({
            message: 'Territory Code in Stock tab is required',
          });
          return;
        }
      } else {
        this.showError({ message: 'Territory Code in Stock tab is required' });
        return;
      }
    }

    if (this.lpmtDefEmptyCategory) {
      this.lpmtDefEmptyCategory.dataSourceObservable =
        this.executiveService.getDefEmptyCategory(
          operationType.trim(),
          territoryCode.trim()
        );
    }
  }

  lpmtHierarchyGroup_DataBind(): void {
    if (this.lpmtHierarchyGroup) {
      this.lpmtHierarchyGroup.dataSourceObservable =
        this.executiveService.getHierarchyGroup();
    }
  }

  lpmtParentHierarchy_DataBind(): void {
    const hierarchyGroup = this.other.get('parameter')?.value || '';
    if (this.lpmtParentHierarchy && hierarchyGroup) {
      this.lpmtParentHierarchy.dataSourceObservable =
        this.executiveService.getParentHierarchy(hierarchyGroup.trim());
    }
  }

  lpmtParentExecutive_DataBind(): void {
    const parentGroup = this.other.get('parameter')?.value || '';
    const executiveCode = this.profile.get('executiveCode')?.value || '';
    if (this.lpmtParentExecutive && parentGroup) {
      this.lpmtParentExecutive.dataSourceObservable =
        this.executiveService.getParentExecutive(
          parentGroup.trim(),
          executiveCode.trim()
        );
    }
  }

  lpmtExecutiveHierarchy_DataBind(): void {
    const executiveType = this.getCurrentExecutiveType();
    const executiveclsType = this.getCurrentExecutiveclsType();
    if (this.lpmtExecutiveHierarchy && executiveType) {
      this.lpmtExecutiveHierarchy.dataSourceObservable =
        this.executiveService.getParentTypeExecutive(
          executiveType,
          executiveclsType
        );
    }
  }

  getCurrentExecutiveType(): string {
    const exeCls = this.clsExecutive.getSelectedClassifications();
    let executiveType = '';
    for (let i = 0; i < exeCls.length; i++) {
      if (exeCls[i].groupCode?.trim() === 'EXETYPE') {
        executiveType = exeCls[i].valueCode?.trim() || '';
        break;
      }
    }
    return executiveType;
  }

  getCurrentExecutiveclsType(): string {
    const exeCls = this.clsExecutive.getSelectedClassifications();
    let executiveclsType = '';
    for (let i = 0; i < exeCls.length; i++) {
      if (exeCls[i].groupCode?.trim() === 'EXECLAS') {
        executiveclsType = exeCls[i].valueCode?.trim() || '';
        break;
      }
    }
    return executiveclsType;
  }

  clsExecutive_OnChange(): void {
    const newExecutiveType = this.getCurrentExecutiveType();
    const newExecutiveclsType = this.getCurrentExecutiveclsType();

    if (newExecutiveType !== this.other.get('executiveType')?.value) {
      this.other.patchValue({
        parentExecutiveType: '',
        parentExecutiveCode: '',
        parentExecutiveName: '',
      });
    }

    this.other.patchValue({
      executiveType: newExecutiveType,
      executiveclsType: newExecutiveclsType,
    });

    if (newExecutiveType.trim() !== '' && newExecutiveclsType.trim() !== '') {
      this.parentexedisable = false;
    } else {
      this.parentexedisable = true;
    }
  }

  validatePassword(): void {
    const password = this.profile.get('password')?.value;
    const confirmPassword = this.profile.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      this.lblValidatePassword = 'Passwords does not match';
      this.profile.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      this.lblValidatePassword = '';
      if (this.profile.get('confirmPassword')?.hasError('mismatch')) {
        this.profile.get('confirmPassword')?.setErrors(null);
      }
    }
  }
}

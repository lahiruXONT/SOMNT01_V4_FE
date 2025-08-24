import {
  Component,
  ViewChild,
  AfterViewInit,
  OnInit,
  OnDestroy,
  signal,
  computed,
  WritableSignal,
  CUSTOM_ELEMENTS_SCHEMA,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription, Observable, Subject, catchError, of } from 'rxjs';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';

import { XontVenturaMessagePromptComponent } from '../xont-ventura-message-prompt/xont-ventura-message-prompt.component';
import { XontVenturaCollapsibleComponent } from '../xont-ventura-collapsible/xont-ventura-collapsible.component';
import { ListPromptComponent } from 'xont-ventura-list-prompt';
import {
  SelectedClassification,
  XontVenturaClassificationSelectorComponent,
} from '../xont-ventura-classification-selector/xont-ventura-classification-selector.component';
import { XontVenturaGridExportComponent } from '../xont-ventura-gridexport/xont-ventura-gridexport.component';
import { XontVenturaGridLoaderComponent } from '../xont-ventura-gridloader/xont-ventura-gridloader.component';

import { MediRepFMBDMhierarchy } from '../model/MediRepFMBDMhierarchy.model';
import { ExecutiveService } from '../Service/executive.service';
import { CommonService } from '../Service/common.service';

export interface SelectionCriteria {
  ExecutiveCode: string;
  ExecutiveName: string;
  TerritoryCode: string;
  TerritoryDesc: string;
  OperationType: string;
  OperationTypeDesc: string;
  Executive1: string;
  Executive1Name: string;
  Executive2: string;
  Executive2Name: string;
  Executive3: string;
  Executive3Name: string;
  Executive4: string;
  Executive4Name: string;
  Executive5: string;
  Executive5Name: string;
  SearchType: 'startWith' | 'anyWhere';
  ActiveOnly: boolean;
  FirstRow: number;
  LastRow: number;
  Collapsed: boolean;
}

interface ApiResponse {
  // Define the structure of your API response if known
  // e.g., [data: any[], count: number]
  [key: number]: any; // Or a more specific type
}

@Component({
  selector: 'app-list', // Updated selector
  templateUrl: './list.component.html', // Remove version query param, handle caching differently if needed
  styleUrls: ['./list.component.css'], // Use styleUrls instead of styles array
  standalone: true, // Mark as standalone
  imports: [
    // Angular Core
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    MatIconModule,
    XontVenturaMessagePromptComponent,
    XontVenturaClassificationSelectorComponent,
    ListPromptComponent,
    XontVenturaCollapsibleComponent,
    XontVenturaGridExportComponent,
    CommonModule,
    ReactiveFormsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ListComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- Properties ---
  cls1 = {
    ID: 'clsExecutive',
    Type: '03',
    TaskCode: 'SOMNT01',
    LabelWidth: '120px',
    EnableUserInput: false, // Boolean
    CodeTextWidth: '120px',
    DescriptionTextWidth: '320px',
    ActiveStatus: 'All', // 'Active' or 'All'
    AllMandatory: false, // Boolean
    LastLevelRequired: false, // Boolean
    Enabled: true, // Boolean
  };

  // --- ViewChilds ---
  @ViewChild('msgPrompt') msgPrompt!: XontVenturaMessagePromptComponent; // Use definite assignment assertion
  @ViewChild('gridLoader') gridLoader!: XontVenturaGridLoaderComponent;
  @ViewChild('clsExecutive')
  clsExecutive!: XontVenturaClassificationSelectorComponent;
  @ViewChild('lpmtOptType') lpmtOptType!: ListPromptComponent;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchForm: FormGroup;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [
    'ExecutiveCode',
    'ExecutiveName',
    'UserProfileName',
    'TerritoryName',
    'OperationTypeDesc',
    'options',
  ];

  isLoading = signal(false);
  isDataFound = computed(() => this.dataSource.data.length > 0);

  rowsOnPage = 10;
  sortBy = 'ExecutiveCode';
  sortOrder: 'asc' | 'desc' = 'asc';

  private errorSubscription: Subscription = new Subscription();
  window: any;
  totalRecords: unknown;
  pageSize: unknown;

  constructor(
    private router: Router,
    private executiveService: ExecutiveService,
    private commonService: CommonService,
    private fb: FormBuilder, // Inject FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize the Reactive Form
    this.searchForm = this.fb.group({
      ExecutiveCode: [''],
      ExecutiveName: [''],
      TerritoryCode: [''],
      TerritoryDesc: [''],
      OperationType: [''],
      OperationTypeDesc: [''],
      SearchType: ['startWith'], // Default value
      ActiveOnly: [true], // Default value
      // Note: Executive1-5, FirstRow, LastRow, Collapsed are managed internally or via other controls
      // Collapsed is managed by the collapsible component state
    });
  }

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    // Subscribe to service errors
    this.errorSubscription.add(
      this.executiveService.componentMethodCalled$.subscribe((error) => {
        this.showError(error); // Handle error display
      })
    );

    // Load saved criteria if needed (moved to ngAfterViewInit for ViewChild access)
    // this.loadSavedState();
  }

  ngAfterViewInit(): void {
    // Set up Material Table features
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (isPlatformBrowser(this.platformId)) {
      this.loadSavedState();
    }

    // Set timeout for list call only if in browser
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.list(true);
      }, 0);
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.errorSubscription.unsubscribe();
  }

  // --- Methods ---

  siteName(): string {
    return this.commonService.getAPIPrefix(); // Renamed service reference
  }

  // --- Form Handling ---
  get formControls() {
    return this.searchForm.controls;
  }

  // --- Data Loading ---
  list(isInit: boolean): void {
    this.isLoading.set(true); // Set loading state using signal

    // Initialize grid loader
    this.gridLoader.init('SOMNT01');
    this.rowsOnPage = this.gridLoader.getPageSize();

    // Get form values
    const formValue = this.searchForm.value;

    // Save selection criteria to localStorage
    localStorage.setItem(
      'SOMNT01_SelectionCriteria',
      JSON.stringify(formValue)
    );

    // Handle pagination
    if (isInit) {
      this.gridLoader.setCurrentPage(1);
      formValue.FirstRow = 1;
      formValue.LastRow = this.gridLoader.getLoadSize();
    } else {
      formValue.FirstRow = this.gridLoader.getRowStart();
      formValue.LastRow = this.gridLoader.getRowEnd();
    }

    // Handle classification selector data
    const clsExeArr: SelectedClassification[] =
      this.clsExecutive.getSelectedClassifications();
    localStorage.setItem('SOMNT01_ExecutiveLevels', JSON.stringify(clsExeArr));

    const selectedClassifications = clsExeArr.map((item) => ({
      ParameterCode: item.GroupCode,
      ParameterValue: item.ValueCode,
    }));

    // Map classification values to selection criteria
    formValue.Executive1 = '';
    formValue.Executive2 = '';
    formValue.Executive3 = '';
    formValue.Executive4 = '';
    formValue.Executive5 = '';

    clsExeArr.forEach((item) => {
      switch (item.Index) {
        case 0:
          formValue.Executive1 = item.ValueCode ?? '';
          break;
        case 1:
          formValue.Executive2 = item.ValueCode ?? '';
          break;
        case 2:
          formValue.Executive3 = item.ValueCode ?? '';
          break;
        case 3:
          formValue.Executive4 = item.ValueCode ?? '';
          break;
        case 4:
          formValue.Executive5 = item.ValueCode ?? '';
          break;
      }
    });

    console.log('Selection Criteria:', formValue);
    console.log('Selected Classifications:', selectedClassifications);

    // Call the service method using HttpClient
    this.executiveService
      .getAllExecutive({
        SelectionCriteria: formValue,
        SelectedClassifications: selectedClassifications,
      })
      .subscribe({
        next: (response: ApiResponse) => {
          // Use ApiResponse type or specific type
          console.log('API Response:', response);
          // Assuming response is [data, count]
          const data = response[0] || [];
          const count = response[1] || 0;
          this.dataSource.data = data;
          this.gridLoader.setRowCount(count);
          this.isLoading.set(false); // Stop loading
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false); // Stop loading on error
          this.showError(err); // Handle error display
        },
      });
  }

  // --- Prompt Data Binding ---
  lpmtOptType_DataBind() {
    // Assign the observable from the service to the prompt component's input
    // Make sure the xont-ventura-list-prompt component expects an Observable for dataSourceObservable
    if (this.lpmtOptType) {
      this.lpmtOptType.dataSourceObservable =
        this.executiveService.getOptTypePrompt();
    }
  }

  // --- UI Event Handlers ---
  ChangeSearchType(entry: 'startWith' | 'anyWhere'): void {
    this.searchForm.patchValue({ SearchType: entry }); // Update form control
  }

  gridLoader_OnChange(data: any) {
    this.list(false); // Load next page
  }

  // --- Navigation Actions ---
  newBasedOn_OnClick(item: any): void {
    localStorage.setItem(
      'SOMNT01_PageInit',
      JSON.stringify({
        Mode: 'newBasedOn',
        ExecutiveCode: item.ExecutiveCode?.trim(),
        ExecutiveName: item.ExecutiveName?.trim(),
      })
    );
    this.router.navigate(['new']); // Assumes 'new' route exists
  }

  edit_OnClick(item: any): void {
    localStorage.setItem(
      'SOMNT01_PageInit',
      JSON.stringify({
        Mode: 'edit',
        ExecutiveCode: item.ExecutiveCode?.trim(),
        ExecutiveName: item.ExecutiveName?.trim(),
      })
    );
    this.router.navigate(['new']); // Assumes 'new' route exists
  }

  btnNew_OnClick(): void {
    localStorage.setItem(
      'SOMNT01_PageInit',
      JSON.stringify({ Mode: 'new', ExecutiveCode: '', ExecutiveName: '' })
    );
    this.router.navigate(['new']); // Assumes 'new' route exists
  }

  // --- Helper Methods ---
  private loadSavedState(): void {
    const storedCriteria = localStorage.getItem('SOMNT01_SelectionCriteria');
    if (storedCriteria) {
      try {
        const parsedCriteria: Partial<SelectionCriteria> =
          JSON.parse(storedCriteria);
        if (parsedCriteria) {
          // Patch the form with saved values
          this.searchForm.patchValue(parsedCriteria);
          // Set collapsed state if needed (depends on how xont-ventura-collapsible manages state)
          // this.selectionCriteria.Collapsed = parsedCriteria.Collapsed ?? true;
        }
      } catch (e) {
        console.warn('Failed to parse stored selection criteria.', e);
        localStorage.removeItem('SOMNT01_SelectionCriteria');
      }
    }

    const storedExecutiveLevels = localStorage.getItem(
      'SOMNT01_ExecutiveLevels'
    );
    if (storedExecutiveLevels) {
      try {
        const clsExeArr: SelectedClassification[] = JSON.parse(
          storedExecutiveLevels
        );
        if (clsExeArr && clsExeArr.length > 0 && this.clsExecutive) {
          // Ensure setSelectedClassifications exists and works correctly
          this.clsExecutive.setSelectedClassifications(clsExeArr);
        }
      } catch (e) {
        console.warn('Failed to parse stored executive levels.', e);
        localStorage.removeItem('SOMNT01_ExecutiveLevels');
      }
    }
  }

  private showError(err: any): void {
    console.error('ListComponent Error:', err);
    // Assuming msgPrompt.show method signature is (message: string, title: string)
    // Adjust based on actual component API
    let errorMessage = 'An unknown error occurred.';
    if (err && typeof err === 'object') {
      if (err.error && typeof err.error === 'string') {
        errorMessage = err.error; // Handle common API error structure
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = JSON.stringify(err); // Fallback to stringified object
      }
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    if (this.msgPrompt && typeof this.msgPrompt.show === 'function') {
      this.msgPrompt.show(errorMessage, 'SOMNT01'); // Show error using prompt
    } else {
      alert(`Error (SOMNT01): ${errorMessage}`); // Fallback alert
    }
  }
}

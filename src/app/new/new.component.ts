import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  WritableSignal,
} from '@angular/core';
// --- Core & Routing ---
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Use HttpClient
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';

// --- Reactive Forms ---
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
} from '@angular/forms';

// --- RxJS ---
import { Observable, Subscription, Subject, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';

// --- Services & Models ---
import { CommonService } from '../Service/common.service';
import { DatetimeService } from '../Service/datetime.service';
import { MediRepFMBDMhierarchy } from '../model/MediRepFMBDMhierarchy.model';
import { ExecutiveService } from '../Service/executive.service'; // Updated service

import { XontVenturaMessagePromptComponent } from '../xont-ventura-message-prompt/xont-ventura-message-prompt.component';
import { ListPromptComponent } from 'xont-ventura-list-prompt';
import { XontVenturaClassificationSelectorComponent } from '../xont-ventura-classification-selector/xont-ventura-classification-selector.component';
import { XontVenturaGridExportComponent } from '../xont-ventura-gridexport/xont-ventura-gridexport.component';
import { XontVenturaDatepickerComponent } from '../xont-ventura-datepicker/xont-ventura-datepicker.component';

// --- Material Components (Import necessary ones) ---
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
// --- Interfaces for Data Models (Define based on your API and needs) ---
interface PageInitData {
  Mode: 'new' | 'edit' | 'newBasedOn';
  ExecutiveCode: string;
  ExecutiveName: string;
}

interface ExecutiveProfile {
  ExecutiveCode: string;
  ExecutiveName: string;
  ExecutiveGroup: string; // Or specific type if known
  chkActive: boolean;
  OperationType: string;
  OperationTypeDesc: string;
  Executive1: string; // ... up to Executive5 if needed directly
  Executive1Name: string;
  // ... Add other properties from the original this.ExecutiveProfile object
  // Consider if these should be part of the main form or derived/managed separately
}

interface StockDetails {
  // Define properties for Stock tab data
  SalesLocation: string;
  SalesLocationDesc: string;
  StockLocation: string;
  StockLocationDesc: string;
  // ... Add other Stock related fields
}

interface HierarchyItem {
  // Define properties for a single Hierarchy item
  BusinessUnit: string;
  ExecutiveCode: string;
  ExecutiveGroup: string;
  ParentGroup: string;
  ParentExecutive: string;
  FromDate: string | null; // Date string or null
  Todate: string | null; // Date string or null
  EndDate: string | null; // Date string or null
  Active: string; // Or boolean if API returns boolean
  HiddenVal: string;
}

// Add interfaces for Return, Other, Merchandizing if needed for complex nested forms

// --- Component Definition ---
@Component({
  selector: 'app-new-executive', // Updated selector
  templateUrl: './new.component.html', // Remove version query param
  styleUrls: ['./new.component.css'], // Use styleUrls
  standalone: true, // Mark as standalone
  imports: [
    // --- Angular Core ---
    // ReactiveFormsModule is usually provided at a higher level

    // --- Material ---
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatSnackBarModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,

    XontVenturaMessagePromptComponent,
    ListPromptComponent,
    XontVenturaGridExportComponent,
    ReactiveFormsModule,
    CommonModule,
  ],
})
export class NewComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- ViewChilds ---
  @ViewChild('msgPrompt') msgPrompt!: XontVenturaMessagePromptComponent;
  @ViewChild('clsExecutive')
  clsExecutive!: XontVenturaClassificationSelectorComponent;
  @ViewChild('clsMarketingHierarchy')
  clsMarketingHierarchy!: XontVenturaClassificationSelectorComponent;
  @ViewChild('clsGeo') clsGeo!: XontVenturaClassificationSelectorComponent;
  @ViewChild('cls3') cls3!: XontVenturaClassificationSelectorComponent;
  @ViewChild('lpmtTerritory') lpmtTerritory!: ListPromptComponent;
  @ViewChild('lpmtOperationType')
  lpmtOperationType!: ListPromptComponent;
  @ViewChild('lpmtIncentiveGroup')
  lpmtIncentiveGroup!: ListPromptComponent;
  @ViewChild('lpmtUserProfile')
  lpmtUserProfile!: ListPromptComponent;
  @ViewChild('lpmtParameterGroup')
  lpmtParameterGroup!: ListPromptComponent;
  @ViewChild('lpmtLoginUser') lpmtLoginUser!: ListPromptComponent;
  @ViewChild('dpPasswordExpiry')
  dpPasswordExpiry!: XontVenturaDatepickerComponent;
  @ViewChild('dpJoiningDate') dpJoiningDate!: XontVenturaDatepickerComponent;
  @ViewChild('dpTerminationDate')
  dpTerminationDate!: XontVenturaDatepickerComponent;
  @ViewChild('dpFromDate') dpFromDate!: XontVenturaDatepickerComponent;
  @ViewChild('dpToDate') dpToDate!: XontVenturaDatepickerComponent;

  // --- Reactive Forms ---
  mainForm: FormGroup;

  // --- Data Sources for Tables ---
  hierarchyDataSource = new MatTableDataSource<HierarchyItem>([]);
  displayedHierarchyColumns: string[] = [
    'BusinessUnit',
    'ExecutiveCode' /* ... other columns ... */,
    'actions',
  ]; // Define columns

  // --- Signals for State Management ---
  isLoading = signal(false);
  isSubmitting = signal(false);
  currentMode = signal<'new' | 'edit' | 'newBasedOn'>('new');
  hierarchyType = signal<string>(''); // Example state

  // --- Component Properties (adapted from original) ---
  cls1 = {
    /* ... */
  }; // Classification selector config 1
  cls2 = {
    /* ... */
  }; // Classification selector config 2
  cls3Config = {
    /* ... */
  }; // Classification selector config 3
  executivegroup: any[] = []; // Data for executive group dropdown
  pageInitData: PageInitData | null = null;
  executiveData: any = null; // Data loaded for edit/newBasedOn

  // --- Error Messages (Consider using Validators and Angular's built-in error display) ---
  // Instead of separate error message strings, use form control errors.
  // Example:
  // get executiveCodeError() { return this.mainForm.get('ExecutiveCode')?.errors; }

  // --- Subscriptions ---
  private destroy$ = new Subject<void>(); // For managing subscriptions

  // --- Constructor ---
  constructor(
    private location: Location,
    private http: HttpClient, // Use HttpClient
    private router: Router,
    private route: ActivatedRoute, // Might be needed if passing data via route
    private datetimeService: DatetimeService,
    private commonService: CommonService,
    private executiveService: ExecutiveService, // Updated service
    private fb: FormBuilder // Inject FormBuilder
  ) {
    // Initialize the main Reactive Form structure
    this.mainForm = this.fb.group({
      // --- Profile Tab ---
      profile: this.fb.group({
        ExecutiveCode: ['', [Validators.required, Validators.maxLength(10)]],
        ExecutiveName: ['', [Validators.required, Validators.maxLength(50)]],
        ExecutiveGroup: ['', Validators.required],
        chkActive: [true], // Default checked
        OperationType: ['', Validators.required],
        OperationTypeDesc: [''],
        // Add controls for other Profile fields...
        // Example for nested classifications if needed directly:
        // Executive1: [''],
        // Executive1Name: [''],
        // ... up to Executive5
      }),
      // --- Stock Tab ---
      stock: this.fb.group({
        SalesLocation: [''],
        SalesLocationDesc: [''],
        StockLocation: [''],
        StockLocationDesc: [''],
        // Add controls for other Stock fields...
      }),
      // --- Hierarchy Tab ---
      // Hierarchy data is often managed in a separate table/array, not directly in the main form.
      // But you could have controls for *adding* new hierarchy items here:
      // newHierarchyItem: this.fb.group({
      //   BusinessUnit: [''],
      //   ParentGroup: [''],
      //   ParentExecutive: [''],
      //   FromDate: [null],
      //   Todate: [null],
      //   Active: [''],
      // }),
      // --- Return Tab ---
      return: this.fb.group({
        // Add controls for Return fields...
      }),
      // --- Other Tab ---
      other: this.fb.group({
        // Add controls for Other fields...
      }),
      // --- Merchandizing Tab ---
      merchandizing: this.fb.group({
        // Add controls for Merchandizing fields...
      }),
      // --- Controls not tied to specific tabs but part of the form ---
      // Example: A general comment field
      // generalComment: ['']
    });

    // Subscribe to service errors
    if (
      this.executiveService.componentMethodCalled$ &&
      typeof (this.executiveService.componentMethodCalled$ as any).pipe ===
        'function'
    ) {
      (this.executiveService.componentMethodCalled$ as Observable<any>)
        .pipe(takeUntil(this.destroy$))
        .subscribe((error) => {
          this.showError(error);
        });
    }
  }

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.loadInitialData();
  }

  ngAfterViewInit(): void {
    // Perform actions that require ViewChilds to be initialized
    // Example: Set up data binding for list prompts after view init
    // this.lpmtOperationType_DataBind(); // If needed and ViewChild is ready
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Initialization ---
  private loadInitialData(): void {
    this.isLoading.set(true);
    try {
      const pageInitStr = localStorage.getItem('SOMNT01_PageInit');
      if (pageInitStr) {
        this.pageInitData = JSON.parse(pageInitStr);
        if (this.pageInitData) {
          this.currentMode.set(this.pageInitData.Mode);
        }
      }
    } catch (e) {
      console.error('Error parsing page init data:', e);
    }

    if (!this.pageInitData) {
      this.router.navigate(['list']); // Navigate back if no init data
      return;
    }

    // Load necessary data (e.g., executive groups) in parallel
    this.executiveService
      .getExecutiveGroups()
      .pipe(
        catchError((error) => {
          console.error('Error loading executive groups:', error);
          this.showError('Failed to load executive groups.');
          return of([]); // Return empty array on error to continue
        }),
        switchMap((groups) => {
          this.executivegroup = groups;
          // If editing or newBasedOn, load the specific executive data
          if (
            this.pageInitData!.Mode === 'edit' ||
            this.pageInitData!.Mode === 'newBasedOn'
          ) {
            return this.http
              .get<any>(
                `${this.siteName()}/api/SOMNT01/GetExecutiveData?ExecutiveCode=${encodeURIComponent(
                  this.pageInitData!.ExecutiveCode.trim()
                )}`
              )
              .pipe(
                catchError((error) => {
                  console.error('Error loading executive data:', error);
                  this.showError('Failed to load executive data.');
                  return of(null); // Return null on error
                })
              );
          } else {
            return of(null); // For 'new' mode, no specific data to load initially
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (executiveDataResponse) => {
          if (executiveDataResponse) {
            this.executiveData = executiveDataResponse;
            this.populateFormFromData(this.executiveData); // Populate form if data was loaded
          }
          this.setupModeSpecificUI(); // Configure UI based on mode
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Unexpected error during initialization:', err);
          this.showError('An unexpected error occurred during initialization.');
          this.isLoading.set(false);
        },
      });
  }

  private setupModeSpecificUI(): void {
    const mode = this.currentMode();
    // Example logic based on mode (adapt based on original component logic)
    if (mode === 'new') {
      // Enable/disable fields, set defaults
      this.mainForm.get('profile.ExecutiveCode')?.enable();
      this.mainForm.get('profile.chkActive')?.setValue(true);
      // ... other 'new' mode setup
    } else if (mode === 'edit' || mode === 'newBasedOn') {
      // Enable/disable fields, populate from this.executiveData
      this.mainForm.get('profile.ExecutiveCode')?.disable(); // Usually disable code on edit
      // ... other 'edit'/'newBasedOn' mode setup
      // Populate classifications if data was loaded
      // this.populateClassifications(this.executiveData?.classifications); // Hypothetical
    }
    // Trigger any data binding for prompts that depend on initial state
    // this.lpmtLoginUser_Databind();
  }

  private populateFormFromData(data: any): void {
    // Map the loaded executive data to the form controls
    // This requires knowing the structure of `data` and matching it to your form.
    // Example (you'll need to adapt this significantly):
    if (data && data.profile) {
      this.mainForm.patchValue({ profile: data.profile });
    }
    if (data && data.stock) {
      this.mainForm.patchValue({ stock: data.stock });
    }
    // ... populate other sections
    // Populate hierarchy table data source
    if (data?.hierarchyDetails) {
      this.hierarchyDataSource.data = data.hierarchyDetails;
    }
    // Handle classifications separately if needed
  }

  // --- Form Handling ---
  get profileForm(): FormGroup {
    return this.mainForm.get('profile') as FormGroup;
  }
  get stockForm(): FormGroup {
    return this.mainForm.get('stock') as FormGroup;
  }
  get returnForm(): FormGroup {
    return this.mainForm.get('return') as FormGroup;
  }
  get otherForm(): FormGroup {
    return this.mainForm.get('other') as FormGroup;
  }
  get merchandizingForm(): FormGroup {
    return this.mainForm.get('merchandizing') as FormGroup;
  }
  // Add getters for other nested form groups if used

  // --- UI Event Handlers ---
  onUpdate(): void {
    if (this.mainForm.valid) {
      // Implement update logic if separate from submit
      console.log('Update logic triggered');
    } else {
      this.markFormAsTouched(); // Trigger validation display
      // Optionally show a snackbar message
    }
  }

  onRefresh(): void {
    // Implement refresh logic (e.g., reload data, reset form parts)
    console.log('Refresh logic triggered');
    // Example: Reload executive groups
    // this.executiveService.getExecutiveGroups().subscribe(...)
  }

  onSubmit(): void {
    if (this.mainForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      console.log('Form Data:', this.mainForm.value);

      // Gather data for submission
      const submissionData: any = {
        Mode: this.currentMode(),
        ExecutiveProfile: this.mainForm.get('profile')?.value,
        Stock: this.mainForm.get('stock')?.value,
        // Hierarchy: this.hierarchyDataSource.data, // Or gather from a form array if adding items
        Return: this.mainForm.get('return')?.value,
        Other: this.mainForm.get('other')?.value,
        Merchandizing: this.mainForm.get('merchandizing')?.value,
        // Gather classifications
        executiveClassificationList: this.getClassificationRecords(
          this.clsExecutive?.getSelectedClassifications() ?? []
        ),
        marketingHierarchyClassificationList: this.getClassificationRecords(
          this.clsMarketingHierarchy?.getSelectedClassifications() ?? []
        ),
        geoClassificationList: this.getClassificationRecords(
          this.clsGeo?.getSelectedClassifications() ?? []
        ),
        // ReturnLocationList: this.returnTypesDataset, // Adjust based on how this is managed
      };

      console.log('Submission Object:', submissionData);

      // Call the service method (assuming it's updated to use HttpClient)
      this.executiveService
        .saveAll(submissionData) // You'll need to implement saveAll in ExecutiveService
        .pipe(
          catchError((error) => {
            console.error('Submission error:', error);
            this.showError('Failed to save data.');
            this.isSubmitting.set(false);
            return of(null); // Return null on error
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response: any) => {
            // Define response type
            console.log('Submission successful:', response);
            if (response?.success) {
              // Check API response structure
              // Show success message
              // Navigate back to list or show confirmation
              this.router.navigate(['list']);
            } else {
              // Handle API error response
              this.showError(response?.message || 'Save operation failed.');
            }
            this.isSubmitting.set(false);
          },
          error: (err: any) => {
            // This handles errors not caught by catchError above
            console.error('Unexpected error during submission:', err);
            this.isSubmitting.set(false);
            // showError might already be called by catchError in the pipe
          },
        });
    } else {
      this.markFormAsTouched(); // Trigger validation display
      // Optionally show a snackbar message indicating validation errors
      this.isSubmitting.set(false); // Ensure submitting state is reset if invalid
    }
  }

  private markFormAsTouched(): void {
    // Recursively mark all controls as touched to trigger validation display
    const markFormGroupTouched = (formGroup: FormGroup | FormArray) => {
      Object.keys(formGroup.controls).forEach((key) => {
        const control = formGroup.get(key);
        if (control) {
          if (control instanceof FormGroup || control instanceof FormArray) {
            markFormGroupTouched(control);
          } else {
            control.markAsTouched(); // or markAsDirty
          }
        }
      });
    };
    markFormGroupTouched(this.mainForm);
  }

  // --- Helper Methods ---
  siteName(): string {
    return this.commonService.getAPIPrefix();
  }

  getClassificationRecords(selectedClassifications: any[]): any[] {
    // Implement logic to format classification data for submission
    // Similar to the original logic, but adapt to the structure needed by your API
    return selectedClassifications.map((cls) => ({
      // Map properties as required by the API
      GroupCode: cls.GroupCode,
      ValueCode: cls.ValueCode,
      Index: cls.Index,
      // ... other properties
    }));
  }

  // --- Prompt Data Binding (Examples) ---
  lpmtOperationType_DataBind() {
    if (this.lpmtOperationType) {
      this.lpmtOperationType.dataSourceObservable =
        this.executiveService.getNewOptTypePrompt();
    }
  }

  lpmtLoginUser_Databind() {
    if (this.lpmtLoginUser) {
      this.lpmtLoginUser.dataSourceObservable =
        this.executiveService.GetAppLoginUser();
    }
  }

  lpmtParameterGroup_DataBind() {
    if (this.lpmtParameterGroup) {
      this.lpmtParameterGroup.dataSourceObservable =
        this.executiveService.GetParameterGroup();
    }
  }

  // --- Hierarchy Table Methods ---
  addHierarchyItem(): void {
    // Logic to add a new item to the hierarchy table/data source
    // Could involve adding to a FormArray or directly to the MatTableDataSource
    const newItem: HierarchyItem = {
      BusinessUnit: '',
      ExecutiveCode: this.pageInitData?.ExecutiveCode || '',
      ExecutiveGroup: '',
      ParentGroup: '',
      ParentExecutive: '',
      FromDate: null,
      Todate: null,
      EndDate: null,
      Active: '1', // Default active
      HiddenVal: '',
    };
    // If using MatTableDataSource directly:
    const currentData = this.hierarchyDataSource.data;
    this.hierarchyDataSource.data = [...currentData, newItem];
    // If using a FormArray, push a new FormGroup to it
  }

  removeHierarchyItem(index: number): void {
    // Logic to remove an item from the hierarchy table/data source
    const currentData = this.hierarchyDataSource.data;
    if (index >= 0 && index < currentData.length) {
      this.hierarchyDataSource.data = currentData.filter((_, i) => i !== index);
    }
    // If using FormArray, removeAt(index)
  }

  // --- Error Handling ---
  private showError(err: any): void {
    console.error('NewComponent Error:', err);
    let errorMessage = 'An unknown error occurred.';
    if (err && typeof err === 'object') {
      if (err.error && typeof err.error === 'string') {
        errorMessage = err.error;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = JSON.stringify(err);
      }
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    if (this.msgPrompt && typeof this.msgPrompt.show === 'function') {
      this.msgPrompt.show(errorMessage, 'SOMNT01');
    } else {
      alert(`Error (SOMNT01): ${errorMessage}`); // Fallback
    }
  }
  // Inside new.component.ts class
  onEditHierachyType() {
    // Or the correct spelling: onEditHierarchyType()
    console.log('Edit Hierarchy Type button clicked');
    // Add your logic here for what should happen when the button is clicked
    // This might involve opening a dialog, changing a state, etc.
  }
}

import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { catchError, finalize, of, tap } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

// Services
import { CommonService } from '../common.service';
import { AllExecutives, ExecutiveService } from '../executive.service';

// Custom Ventura components
import { XontVenturaMessagePromptComponent } from '../xont-ventura-message-prompt/xont-ventura-message-prompt.component';
import { XontVenturaCollapsibleComponent } from '../xont-ventura-collapsible/xont-ventura-collapsible.component';
import { ListPromptComponent } from 'xont-ventura-list-prompt';
import { XontVenturaClassificationSelectorComponent } from '../xont-ventura-classification-selector/xont-ventura-classification-selector.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface Executive {
  executiveCode: string;
  executiveName: string;
  userProfileName: string;
  territoryName: string;
  operationTypeDesc: string;
  status: number;
}

@Component({
  selector: 'my-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgxSpinnerModule,
    CommonModule,
    XontVenturaMessagePromptComponent,
    XontVenturaCollapsibleComponent,
    ListPromptComponent,
    XontVenturaClassificationSelectorComponent,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class ListComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private commonService = inject(CommonService);
  private executiveService = inject(ExecutiveService);
  private spinner = inject(NgxSpinnerService);

  // Form
  searchForm: FormGroup = this.fb.group({
    ExecutiveCode: [''],
    ExecutiveName: [''],
    TerritoryCode: [''],
    TerritoryDesc: [''],
    OperationType: [''],
    OperationTypeDesc: [''],
    SearchType: ['startWith'],
    ActiveOnly: [true],
    Collapsed: [true],
    FirstRow: [0],
    LastRow: [0],
  });

  // Ventura references
  @ViewChild('msgPrompt') msgPrompt!: XontVenturaMessagePromptComponent;
  @ViewChild('clsExecutive')
  clsExecutive!: XontVenturaClassificationSelectorComponent;
  @ViewChild('lpmtOptType') lpmtOptType!: ListPromptComponent;
  @ViewChild('lpmtTerritory') lpmtTerritory!: ListPromptComponent;

  // Angular Material Table
  displayedColumns: string[] = [
    'Executive',
    'ExecutiveName',
    'UserProfileName',
    'Territory',
    'OperationType',
    'Options',
  ];
  dataSource = new MatTableDataSource<Executive>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // State signals
  executiveDataset = signal<Executive[]>([]);
  totalRows = signal<number>(0);
  isLoading = signal(false);

  rowsOnPage = 10;
  sortBy: string = 'ExecutiveCode';
  sortOrder: 'asc' | 'desc' = 'asc';

  cls1 = {
    ID: 'clsExecutive',
    Type: '03',
    TaskCode: 'SOMNT01',
    LabelWidth: '120px',
    EnableUserInput: 'false',
    CodeTextWidth: '120px',
    DescriptionTextWidth: '320px',
    ActiveStatus: 'All',
    AllMandatory: 'false',
    LastLevelRequired: 'false',
    Enabled: 'true',
  };

  ngOnInit(): void {
    this.restoreState();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.sort.sortChange.subscribe((sort: Sort) => this.onSortChange(sort));
  }
  private isInitialLoad = true;

  ngAfterViewChecked(): void {
    if (this.isInitialLoad && this.clsExecutive) {
      this.list(true);
      this.isInitialLoad = false;
    }
  }

  private restoreState(): void {
    const storedCriteria = localStorage.getItem('SOMNT01_SelectionCriteria');
    if (storedCriteria) {
      try {
        this.searchForm.patchValue(JSON.parse(storedCriteria));
      } catch {
        localStorage.removeItem('SOMNT01_SelectionCriteria');
      }
    }
    const storedLevels = localStorage.getItem('SOMNT01_ExecutiveLevels');
    if (storedLevels) {
      try {
        const levels = JSON.parse(storedLevels);
        if (levels?.length > 0) {
          this.clsExecutive.setSelectedClassifications(levels);
        }
      } catch {
        localStorage.removeItem('SOMNT01_ExecutiveLevels');
      }
    }
  }

  ChangeSearchType(entry: 'startWith' | 'anyWhere') {
    this.searchForm.patchValue({ SearchType: entry });
  }

  lpmtOptType_DataBind() {
    this.lpmtOptType.dataSourceObservable =
      this.executiveService.getOptTypePrompt();
  }

  list(isInit: boolean): void {
    this.isLoading.set(true);
    this.spinner.show();
    const criteria = { ...this.searchForm.value };
    criteria.SortBy = this.sortBy;
    criteria.SortOrder = this.sortOrder;

    if (isInit) {
      this.paginator?.firstPage();
      criteria.FirstRow = 1;
      criteria.LastRow = this.rowsOnPage;
    } else {
      const start = this.paginator.pageIndex * this.paginator.pageSize + 1;
      const end = start + this.paginator.pageSize - 1;
      criteria.FirstRow = start;
      criteria.LastRow = end;
    }

    localStorage.setItem('SOMNT01_SelectionCriteria', JSON.stringify(criteria));
    const clsExeArr = this.clsExecutive
      ? this.clsExecutive.getSelectedClassifications()
      : [];

    localStorage.setItem('SOMNT01_ExecutiveLevels', JSON.stringify(clsExeArr));

    const selectedClassifications = clsExeArr.map((c: any) => ({
      ParameterCode: c.groupCode,
      ParameterValue: c.valueCode,
    }));

    this.executiveService
      .getAllExecutive(criteria, selectedClassifications)
      .pipe(
        tap((res: AllExecutives) => {
          this.executiveDataset.set(res.executives || []);
          this.dataSource.data = res.executives || [];
          this.totalRows.set(res.totalCount || 0);
        }),
        catchError((err) => {
          this.showError(err);
          this.executiveDataset.set([]);
          this.dataSource.data = [];
          return of([]);
        }),
        finalize(() => {
          this.isLoading.set(false);

          this.spinner.hide();
        })
      )
      .subscribe();
  }

  onPageChange(event: PageEvent) {
    this.rowsOnPage = event.pageSize;
    this.list(false);
  }

  onSortChange(sort: Sort) {
    this.sortBy = sort.active;
    this.sortOrder = sort.direction || 'asc';
    this.list(false);
  }

  newBasedOn_OnClick(item: Executive) {
    this.saveAndNavigate('newBasedOn', item);
  }

  edit_OnClick(item: Executive) {
    this.saveAndNavigate('edit', item);
  }

  btnNew_OnClick() {
    this.saveAndNavigate('new');
  }

  private saveAndNavigate(mode: string, item?: Executive) {
    localStorage.setItem(
      'SOMNT01_PageInit',
      JSON.stringify({
        mode: mode,
        executiveCode: item?.executiveCode?.trim() || '',
        executiveName: item?.executiveName?.trim() || '',
      })
    );
    this.router.navigate(['new']);
  }

  siteName() {
    return this.commonService.getAPIPrefix();
  }

  showError(err: any) {
    this.msgPrompt.show(err.error || err.message || err, 'SOMNT01');
  }

  trackByExecutiveCode(index: number, item: Executive) {
    return item.executiveCode;
  }

  closeTab() {
    window.parent.postMessage({ action: 'closeTab' }, '*');
  }
}

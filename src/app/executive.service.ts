import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { CommonService } from './common.service';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
interface ApiResponse<T> {
  data: T;
  // ... other potential fields like message, status, count etc.
}

interface ExecutiveListResponse {
  [key: number]: any;
}

interface SelectionData {
  SelectionCriteria: any;
  SelectedClassifications: Array<{
    ParameterCode: string;
    ParameterValue: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class ExecutiveService {
  saveAll(data: any): Observable<any> {
    throw new Error('Method not implemented.');
  }

  constructor(private http: HttpClient, private commonService: CommonService) {}

  private componentMethodCallSource = new Subject<any>();
  componentMethodCalled$ = this.componentMethodCallSource.asObservable();

  private getApiUrl(endpoint: string): string {
    return `${this.commonService.getAPIPrefix()}/api/SOMNT01/${endpoint}`;
  }

  private getHttpOptions(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('ExecutiveService Error:', errorMessage, error);
    this.componentMethodCallSource.next(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  public getAllExecutive(
    SelectionData: any
  ): Observable<ExecutiveListResponse> {
    const url = this.getApiUrl('GetAllExecutive');
    const options = this.getHttpOptions();

    return this.http
      .post<ExecutiveListResponse>(url, SelectionData, options)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getOptTypePrompt(): Observable<any> {
    const url = this.getApiUrl('GetOperationTypePrompt');
    return this.http
      .get<any>(url)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getNewOptTypePrompt(): Observable<any> {
    const url = this.getApiUrl('GetOperationTypePromptForEdit');
    return this.http
      .get<any>(url)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // V3038
  public GetAppLoginUser(): Observable<any> {
    const url = this.getApiUrl('GetAppLoginUser');
    return this.http
      .get<any>(url)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // V3038
  public GetParameterGroup(): Observable<any> {
    const url = this.getApiUrl('GetParameterGroup');
    return this.http
      .get<any>(url)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getIncentiveGroupPrompt(): Observable<any> {
    const url = this.getApiUrl('GetIncentiveGroupPromptForEdit');
    return this.http
      .get<any>(url)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getUserProfilePrompt(): Observable<any> {
    const url = this.getApiUrl('GetUserProfilePromptForEdit');
    return this.http
      .get<any>(url)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getSalesLocation(stockTerritoryCode: string): Observable<any> {
    const url = this.getApiUrl('GetDefSalesLocation');
    const params = new HttpParams().set(
      'StockTerritoryCode',
      stockTerritoryCode
    );
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getStockLocation(stockTerritoryCode: string): Observable<any> {
    const url = this.getApiUrl('GetDefStockLocation');
    const params = new HttpParams().set(
      'StockTerritoryCode',
      stockTerritoryCode
    );
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getDamageLocation(stockTerritoryCode: string): Observable<any> {
    const url = this.getApiUrl('GetDefReturnLocation');
    const params = new HttpParams().set(
      'StockTerritoryCode',
      stockTerritoryCode
    );
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getInceptionLocation(stockTerritoryCode: string): Observable<any> {
    const url = this.getApiUrl('GetDefInspectionLocation');
    const params = new HttpParams().set(
      'StockTerritoryCode',
      stockTerritoryCode
    );
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getSpecialLocation(stockTerritoryCode: string): Observable<any> {
    const url = this.getApiUrl('GetDefSpecialLocation');
    const params = new HttpParams().set(
      'StockTerritoryCode',
      stockTerritoryCode
    );
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // V3012
  public getUnloadingLocation(stockTerritoryCode: string): Observable<any> {
    const url = this.getApiUrl('GetDefUnloadingLocation');
    const params = new HttpParams().set(
      'StockTerritoryCode',
      stockTerritoryCode
    );
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getDefSaleCategory(
    operationType: string,
    territoryCode: string
  ): Observable<any> {
    const url = this.getApiUrl('GetDefSalesCategoryCode');
    const params = new HttpParams()
      .set('OperationType', operationType.trim())
      .set('TerritoryCode', territoryCode.trim());
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getDefEmptyCategory(
    operationType: string,
    territoryCode: string
  ): Observable<any> {
    const url = this.getApiUrl('GetDefEmptyCategoryCode');
    const params = new HttpParams()
      .set('OperationType', operationType.trim())
      .set('TerritoryCode', territoryCode.trim());
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getHierarchyGroup(): Observable<any> {
    const url = this.getApiUrl('GetHierarchyGroup');
    return this.http
      .get<any>(url)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public GetHierarchyType(): Observable<any> {
    const url = this.getApiUrl('GetHierarchyType');
    return this.http
      .get<any>(url)
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getParentHierarchy(hierarchyGroup: string): Observable<any> {
    const url = this.getApiUrl('GetParentGroup');
    const params = new HttpParams().set('HierarchyGroup', hierarchyGroup);
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getParentExecutive(
    parentGroup: string,
    executiveCode: string
  ): Observable<any> {
    const url = this.getApiUrl('GetParentExecutive');
    const params = new HttpParams()
      .set('ParentGroup', parentGroup.trim())
      .set('ExecutiveCode', executiveCode.trim());
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // V3010
  public getParentTypeExecutive(
    executiveType: string,
    executiveClsType: string
  ): Observable<any> {
    const url = this.getApiUrl('GetParentTypeExecutive');
    const params = new HttpParams()
      .set('executiveType', executiveType.trim())
      .set('Executiveclstype', executiveClsType.trim());
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getExecutiveTypeHierarchyLevel(
    executiveType: string
  ): Observable<any> {
    const url = this.getApiUrl('GetExecutiveTypeHierarchyLevel');
    const params = new HttpParams().set('executiveType', executiveType);
    return this.http
      .get<any>(url, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }
  // V3010

  public getExecutiveGroups(): Observable<any> {
    const url = this.getApiUrl('GetExecutiveGroups');
    return this.http
      .get<any>(url)
      .pipe(catchError((error) => this.handleError(error)));
  }
}

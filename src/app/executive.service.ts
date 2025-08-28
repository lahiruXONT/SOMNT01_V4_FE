import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { CommonService } from './common.service';
import { Observable, of, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AllExecutives {
  executives: any[];
  totalCount: number;
}
@Injectable({
  providedIn: 'root',
})
export class ExecutiveService {
  constructor(private http: HttpClient, private commanService: CommonService) {}

  private componentMethodCallSource = new Subject<any>();
  componentMethodCalled$ = this.componentMethodCallSource.asObservable();

  getAllExecutive(
    criteria: any,
    selectedClassifications: any
  ): Observable<AllExecutives> {
    return this.http
      .post<AllExecutives>(this.siteName() + '/api/SOMNT01/GetAllExecutive', {
        SelectionCriteria: criteria,
        SelectedClassifications: selectedClassifications,
      })
      .pipe(
        catchError((error) => {
          this.handleError(error);
          return of({ executives: [], totalCount: 0 });
        })
      );
  }

  public getOptTypePrompt(): Observable<any> {
    return this.http
      .get(this.siteName() + '/api/SOMNT01/GetOperationTypePrompt')
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getNewOptTypePrompt(): Observable<any> {
    return this.http
      .get(this.siteName() + '/api/SOMNT01/GetOperationTypePromptForEdit')
      .pipe(catchError((error) => this.handleError(error)));
  }

  //V3038
  public GetAppLoginUser(): Observable<any> {
    return this.http
      .get(this.siteName() + '/api/SOMNT01/GetAppLoginUser')
      .pipe(catchError((error) => this.handleError(error)));
  }

  //V3038
  public GetParameterGroup(): Observable<any> {
    return this.http
      .get(this.siteName() + '/api/SOMNT01/GetParameterGroup')
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getIncentiveGroupPrompt(): Observable<any> {
    return this.http
      .get(this.siteName() + '/api/SOMNT01/GetIncentiveGroupPromptForEdit')
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getUserProfilePrompt(): Observable<any> {
    return this.http
      .get(this.siteName() + '/api/SOMNT01/GetUserProfilePromptForEdit')
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getSalesLocation(data: string): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetDefSalesLocation?StockTerritoryCode=' +
          data
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getStockLocation(data: string): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetDefStockLocation?StockTerritoryCode=' +
          data
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getDamageLocation(data: string): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetDefReturnLocation?StockTerritoryCode=' +
          data
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getInceptionLocation(data: string): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetDefInspectionLocation?StockTerritoryCode=' +
          data
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getSpecialLocation(data: string): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetDefSpecialLocation?StockTerritoryCode=' +
          data
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  //V3012 S api call to get data from
  public getUnloadingLocation(data: string): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetDefUnloadingLocation?StockTerritoryCode=' +
          data
      )
      .pipe(catchError((error) => this.handleError(error)));
  }
  //V3012 E

  public getDefSaleCategory(
    data: string,
    TerritoryCode: string
  ): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetDefSalesCategoryCode?OperationType=' +
          data.trim() +
          '&TerritoryCode=' +
          TerritoryCode.trim()
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getDefEmptyCategory(
    data: string,
    TerritoryCode: string
  ): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetDefEmptyCategoryCode?OperationType=' +
          data.trim() +
          '&TerritoryCode=' +
          TerritoryCode.trim()
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getHierarchyGroup(): Observable<any> {
    return this.http
      .get(this.siteName() + '/api/SOMNT01/GetHierarchyGroup')
      .pipe(catchError((error) => this.handleError(error)));
  }

  public GetHierarchyType(): Observable<any> {
    return this.http
      .get(this.siteName() + '/api/SOMNT01/GetHierarchyType')
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getParentHierarchy(data: string): Observable<any> {
    return this.http
      .get(
        this.siteName() + '/api/SOMNT01/GetParentGroup?HierarchyGroup=' + data
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getParentExecutive(
    data: string,
    ExecutiveCode: string
  ): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetParentExecutive?ParentGroup=' +
          data.trim() +
          '&ExecutiveCode=' +
          ExecutiveCode.trim()
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  //V3010
  public getParentTypeExecutive(
    ExecutiveType: string,
    ExecutiveClsType: string
  ): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetParentTypeExecutive?executiveType=' +
          ExecutiveType.trim() +
          '&Executiveclstype=' +
          ExecutiveClsType.trim()
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  public getExecutiveTypeHierarchyLevel(
    executiveType: string
  ): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetExecutiveTypeHierarchyLevel?executiveType=' +
          executiveType
      )
      .pipe(catchError((error) => this.handleError(error)));
  }
  //V3010

  public getExecutiveGroups(): Observable<any> {
    return this.http
      .get(this.siteName() + '/api/SOMNT01/GetExecutiveGroups')
      .pipe(catchError((error) => this.handleError(error)));
  }
  public getExecutiveData(ExecutiveCode: any) {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetExecutiveData?ExecutiveCode=' +
          ExecutiveCode
      )
      .pipe(catchError((error) => this.handleError(error)));
  }
  public getNextTMRouteNo(ExecutiveCode: any) {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetNextTMRouteNo?ExecutiveCode=' +
          ExecutiveCode
      )
      .pipe(catchError((error) => this.handleError(error)));
  }
  public getExecutiveClassificationData(ExecutiveCode: any, groupType: any) {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/GetExecutiveClassificationData?ExecutiveCode=' +
          ExecutiveCode.trim() +
          '&GroupType=' +
          groupType.trim()
      )
      .pipe(catchError((error) => this.handleError(error)));
  }
  public getReturnLocations(
    ExecutiveCode: any,
    StockTerritory: any
  ): Observable<any> {
    return this.http
      .get(
        this.siteName() +
          '/api/SOMNT01/getAllReturnLocationList?StockTerritory=' +
          StockTerritory.trim() +
          '&ExecutiveCode=' +
          ExecutiveCode.trim()
      )

      .pipe(catchError((error) => this.handleError(error)));
  }
  public saveExecutiveData(ExecutiveData: any) {
    return this.http
      .post(this.siteName() + '/api/SOMNT01/SaveAll', ExecutiveData)

      .pipe(catchError((error) => this.handleError(error)));
  }
  private handleError(error: any): Observable<never> {
    this.componentMethodCallSource.next(error);
    return throwError(() => error);
  }

  private siteName(): string {
    return this.commanService.getAPIPrefix();
  }
}

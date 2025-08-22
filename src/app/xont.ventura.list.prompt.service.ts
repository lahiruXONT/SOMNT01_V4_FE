import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class XontVenturaListPromptService {
  private apiPrefix: string | null = null;
  public constructor(private http: HttpClient) {}

  private GetApiPrefix(): string {
    if (!this.apiPrefix) {
      this.apiPrefix = this.getRootURL();
    }
    return this.apiPrefix;
  }
  private getRootURL = (): string => {
    const { hostname, origin, pathname } = window.location;

    if (hostname === 'localhost') {
      return origin;
    }
    const pathSegments = window.location.pathname
      .split('/')
      .filter((s) => s && s.trim().length > 0);

    const appSegment = pathSegments.length > 0 ? pathSegments[0] : '';

    return appSegment
      ? `${window.location.origin}/${appSegment}`
      : window.location.origin;
  };

  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  public GetMasterDefinitionValues(masterDefValueArgs: any): Observable<any> {
    const url = `${this.GetApiPrefix()}/api/SOMNT01/GetMasterValues`;
    const headers = this.createHeaders();

    return this.http.post(url, masterDefValueArgs, { headers }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }
  public GetPredefinedPromptData(predefinedPromptArgs: any): Observable<any> {
    const url = `${this.GetApiPrefix()}/api/SOMNT01/GetPredefinedPrompt`;
    const headers = this.createHeaders();

    return this.http
      .post(
        url,
        {
          listFromID: predefinedPromptArgs.ListFromID,
          externalParameters: predefinedPromptArgs.ExternalParameters,
        },
        { headers }
      )
      .pipe(
        map((response: any) => response),
        catchError(this.handleError)
      );
  }

  public GetListPromptProductData(listPromptProductArgs: any): Observable<any> {
    const url = `${this.GetApiPrefix()}/api/SOMNT01/GetListPromptProductData`;
    const headers = this.createHeaders();

    return this.http.post(url, listPromptProductArgs, { headers }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  public GetListPromptTerritoryData(promptTerritoryArgs: any) {
    const url = `${this.GetApiPrefix()}/api/SOMNT01/GetListPromptTerritoryData`;
    const headers = this.createHeaders();
    return this.http.post(url, promptTerritoryArgs, { headers }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  public GetListPromptExecutiveData(listPromptExecutiveArgs: any) {
    const url = `${this.GetApiPrefix()}/api/SOMNT01/GetListPromptExecutiveData`;
    const headers = this.createHeaders();
    return this.http.post(url, listPromptExecutiveArgs, { headers }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  public GetListPromptRetailerData(listPromptRetailerArgs: any) {
    const url = `${this.GetApiPrefix()}/api/SOMNT01/GetListPromptRetailerData`;
    const headers = this.createHeaders();
    return this.http.post(url, listPromptRetailerArgs, { headers }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => {
      try {
        return JSON.parse(error.error);
      } catch {
        return { error: 'Unknown error', raw: error };
      }
    });
  }
}

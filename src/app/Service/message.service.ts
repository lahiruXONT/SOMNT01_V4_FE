import { Injectable } from '@angular/core';
// 1. Import HttpClient and HttpErrorResponse
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// 2. Import CommonService (ensure it's Angular 19 compatible)
import { CommonService } from './common.service';
// 3. Import RxJS operators and types for Angular 19 (RxJS 7+)
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators'; // map might be needed if transforming response

// 4. Define interfaces for better type safety (optional but recommended)
interface MessageResponse {
  MessageText: string;
  // Add other potential fields from the API response if known
}

interface UserNameResponse {
  UserName: string; // Or whatever structure the API returns
  // Add other potential fields
}

// --- Service Definition ---
@Injectable({
  providedIn: 'root', // 5. Makes the service available application-wide
})
export class MessageService {
  // 6. Inject HttpClient instead of Http
  constructor(
    private http: HttpClient,
    private commonService: CommonService // Renamed for clarity
  ) {}

  // --- Private Helper Methods ---
  private getApiUrl(endpoint: string): string {
    return `${this.commonService.getAPIPrefix()}/api/Message/${endpoint}`;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred in MessageService!';
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred.
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.message}`;
      // Optionally, pass the raw error object or a parsed error message from the backend
    }
    console.error('MessageService Error:', errorMessage, error); // Log for debugging
    // Return an observable error using throwError
    return throwError(() => new Error(errorMessage));
  }

  // --- Public Service Methods ---

  // Example: getMessage with type safety
  public getMessage(msgID: number): Observable<MessageResponse[]> {
    // Assuming API returns an array
    const url = this.getApiUrl(`GetMessage?msgID=${msgID}`);
    // HttpClient.get<T> automatically parses JSON
    return this.http.get<MessageResponse[]>(url).pipe(
      catchError((error) => this.handleError(error)) // 7. Use catchError operator
    );
  }

  // Example: getUserName
  public getUserName(): Observable<UserNameResponse> {
    // Assuming API returns an object with UserName
    const url = this.getApiUrl('GetUserName');
    return this.http
      .get<UserNameResponse>(url)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // Note: getSiteName was private, so it's handled internally in getApiUrl now.
  // If other services need it, make it public in CommonService or create a helper.
}

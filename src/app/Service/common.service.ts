import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Safer for SSR
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // 1. Import HttpClient
import { Observable, throwError } from 'rxjs'; // 2. Import RxJS types
import { map, catchError } from 'rxjs/operators'; // 3. Import operators

// 4. Define interfaces for better type safety (especially for API responses)
interface MasterControlData {
  AllowPaging: string; // "1" or "0"
  PageSize: number;
  ExtendedPageSize: number;
  // Add other properties if needed
}

interface FieldAuthData {
  ControlName: string;
  Flag: number; // 1 for disable, 2 for hide
  // Add other properties if needed
}

// 5. Define a type for the restrictSpecificControls return if needed (it's void now)
// type RestrictionResult = { message: string; count: number }; // Example

// --- Service Definition ---
@Injectable({
  providedIn: 'root', // 6. Makes the service available application-wide
})
export class CommonService {
  // 7. Inject HttpClient instead of Http
  constructor(
    private http: HttpClient, // Use HttpClient
    @Inject(PLATFORM_ID) private platformId: Object // For checking browser environment
  ) {}

  // --- Public Methods ---

  // 8. Method Overloads for getAPIPrefix (kept as is, logic updated)
  public getAPIPrefix(): string;
  public getAPIPrefix(taskCode: string): string;
  public getAPIPrefix(taskCode?: string): string {
    // Delegate to getRootURL
    return this.getRootURL();
    // The commented logic for taskCode comparison is kept in getRootURL if needed
  }

  // 9. convertAmountToNumber (logic remains largely the same)
  public convertAmountToNumber(amount: string): number {
    const text: string = amount.trim().replace(/,/g, '');
    if (text === '') {
      return 0;
    } else {
      const result = parseFloat(text);
      return isNaN(result) ? 0 : result; // Handle potential NaN
    }
  }

  // 10. convertNumberToAmount (logic remains largely the same)
  public convertNumberToAmount(
    num: any,
    noOfMinimumDecimalPlaces: number
  ): string {
    // Handle null/undefined/invalid input
    if (num === null || num === undefined || num === '') {
      num = 0;
    }

    const numStr = num.toString();
    const array = numStr.split('.');

    let prefix = '';
    let suffix = '';

    if (array.length > 0) {
      prefix = array[0];
    }
    if (array.length > 1) {
      suffix = array[1];
    }

    // Add commas to prefix
    prefix = prefix.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    let result = prefix;

    if (array.length > 1) {
      let suffixLen: number = suffix.length;
      if (suffixLen < noOfMinimumDecimalPlaces) {
        suffix =
          suffix + this.getDecimalOffset(noOfMinimumDecimalPlaces - suffixLen);
      }
      result = prefix + '.' + suffix;
    } else {
      if (noOfMinimumDecimalPlaces > 0) {
        result = prefix + '.' + this.getDecimalOffset(noOfMinimumDecimalPlaces);
      }
      // else, just the prefix (integer part) is returned
    }
    return result;
  }

  // 11. getDecimalOffset (helper, logic remains the same)
  private getDecimalOffset(noOfRemainingDecimalPoints: number): string {
    return '0'.repeat(noOfRemainingDecimalPoints); // More concise way
    // Original loop logic:
    // let offset: string = '';
    // for (let i = 0; i < noOfRemainingDecimalPoints; i++) {
    //   offset = offset + '0';
    // }
    // return offset;
  }

  // 12. isInternetExplorer (logic updated slightly for clarity)
  public isInternetExplorer(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false; // Not applicable on server
    }
    const ua = window.navigator.userAgent;

    // IE 10 or older
    const msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      return true;
    }

    // IE 11
    const trident = ua.indexOf('Trident/');
    if (trident > 0) {
      return true;
    }

    // Edge (Legacy Edge based on EdgeHTML)
    const edge = ua.indexOf('Edge/');
    if (edge > 0) {
      return true;
    }

    // Other browsers (including Chromium-based Edge, Chrome, Firefox, Safari)
    return false;
  }

  // 13. generateExcel (logic updated for modern Blob handling)
  public generateExcel(htmlCode: string, filename: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('generateExcel called outside browser environment.');
      return;
    }

    filename += '.xls'; // Ensure .xls extension

    if (this.isInternetExplorer()) {
      // Handle older IE/Edge download
      if ((window as any).navigator.msSaveBlob) {
        const blob = new Blob(['\ufeff', htmlCode], {
          type: 'application/vnd.ms-excel',
        });
        (navigator as any).msSaveBlob(blob, filename);
      } else {
        console.warn('msSaveBlob not supported in this IE/Edge version.');
      }
    } else {
      // Modern browser download using Blob and URL.createObjectURL
      const myBlob = new Blob(['\ufeff', htmlCode], {
        type: 'application/vnd.ms-excel',
      });
      const url = window.URL.createObjectURL(myBlob);
      const a = document.createElement('a');
      document.body.appendChild(a); // Append to body temporarily
      a.href = url;
      a.download = filename;
      a.click();

      // Clean up: remove the anchor and revoke the object URL
      document.body.removeChild(a);
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 0); // Revoke URL after a short delay
    }
  }

  // 14. getRootURL (logic updated)
  public getRootURL(/*taskCode?: string*/): string {
    if (!isPlatformBrowser(this.platformId)) {
      return ''; // Return empty string on server
    }

    try {
      const { hostname, origin, pathname } = window.location;

      const pathSegments = pathname
        .split('/')
        .filter((s) => s && s.trim().length > 0);

      const ashxIndex = pathSegments.findIndex((segment) =>
        segment.toLowerCase().endsWith('.ashx')
      );

      // V3002 logic adapted
      const navbarElements = (parent as any).document?.getElementsByClassName(
        'navbar'
      );

      // Check if we are likely in a development environment (simplified check)
      // Or if navbar elements are not found
      // if (document.location.hostname === "localhost") { // Original V3002

      if (
        !navbarElements ||
        navbarElements.length === 0 ||
        (hostname === 'localhost' && ashxIndex < 0)
      ) {
        // Dev check
        return origin;
      } else {
        const basePath =
          ashxIndex >= 0 ? pathSegments.slice(0, ashxIndex + 1).join('/') : '';

        return basePath ? `${origin}/${basePath}` : origin;
      }
    } catch (e) {
      console.warn('Error determining root URL, falling back to origin:', e);
      return document.location?.origin || ''; // Safest fallback
    }
  }

  // 15. getPageSize (logic remains largely the same, improved error handling)
  public getPageSize(taskCode: string): number {
    try {
      const dataStr = localStorage.getItem(taskCode + '_MasterControlData');
      if (dataStr) {
        const data: MasterControlData = JSON.parse(dataStr);
        if (data) {
          if (data.AllowPaging === '1') {
            return data.PageSize;
          } else {
            return data.ExtendedPageSize;
          }
        }
      }
    } catch (e) {
      console.error(`Error parsing MasterControlData for ${taskCode}:`, e);
    }
    return 10; // Default page size if not found or error
  }

  // 16. fieldLevelAuthentication (updated to use HttpClient and modern RxJS)
  public fieldLevelAuthentication(
    componentName: string,
    taskCode: string
  ): Observable<void> {
    const url = `${this.getAPIPrefix(
      taskCode
    )}/api/FieldLevelAuthentication/GetAuthenticationData?formName=${encodeURIComponent(
      componentName
    )}&taskCode=${encodeURIComponent(taskCode)}`;
    // HttpClient.get<T> automatically parses JSON
    return this.http.get<FieldAuthData[]>(url).pipe(
      map((responseData) => {
        // 17. Call the refactored/replaced restrictSpecificControls logic
        // Note: Direct DOM manipulation is discouraged. This needs careful handling.
        // Option 1: Pass data to components to handle UI changes.
        // Option 2: Use a shared state/service to manage disabled/hidden controls.
        // For now, calling the refactored method (see below).
        this.restrictSpecificControls(responseData);
        // Return void or perhaps the processed data if needed by the subscriber
        return undefined; // or return responseData; if the caller needs it
      }),
      catchError((error) => this.handleError(error)) // 18. Use catchError
    );
  }

  // --- Private Helper Methods ---

  // 19. Refactored restrictSpecificControls (Handles data, avoids direct DOM)
  // IMPORTANT: This is a conceptual refactor. Direct DOM manipulation like
  // disabling/hiding elements by ID is not the Angular way.
  // Consider:
  // - Passing the `FieldAuthData[]` to components and using *ngIf or [disabled] bindings.
  // - Using a shared service to hold the auth state for controls.
  // - Dynamically applying CSS classes.
  // This method logs the intended actions but doesn't perform them directly on the DOM.
  private restrictSpecificControls(list: FieldAuthData[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Don't run on server
    }

    let message: string = 'Field Level Authentication was applied for ';
    let count: number = 0;
    const controlNames: string[] = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const controlName = item.ControlName;
      const flag = item.Flag;

      // In Angular, you typically wouldn't get the element by ID here.
      // Instead, you might emit an event, update a service, or pass data.
      // Logging the intention:
      if (flag === 1) {
        console.log(
          `[CommonService] Intend to DISABLE control: ${controlName}`
        );
        controlNames.push(controlName);
        count++;
        // Example of problematic direct DOM access (avoid):
        // const control: HTMLElement | null = document.getElementById(controlName);
        // if (control) {
        //   (control as any).disabled = true; // Problematic casting and direct property setting
        //   // $(control).find('*').attr('disabled', true); // jQuery usage - avoid
        // }
      } else if (flag === 2) {
        console.log(`[CommonService] Intend to HIDE control: ${controlName}`);
        controlNames.push(controlName);
        count++;
        // Example of problematic direct DOM access (avoid):
        // const control: HTMLElement | null = document.getElementById(controlName);
        // if (control) {
        //    control.style.display = "none"; // Direct style manipulation - avoid
        // }
      }
    }

    if (count > 0) {
      message += controlNames.join(', ') + '.';
      console.log(message);
      // TODO: Implement proper Angular way to apply restrictions
      // e.g., broadcast via a service, update component state bound to [disabled]/[style.display]
    }
  }

  // 20. handleError (updated for HttpErrorResponse)
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred in CommonService!';
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred.
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.message}`;
      // Log the raw error object for debugging
      console.error('CommonService Server Error Details:', error);
    }
    console.error('CommonService Error:', errorMessage);
    // Return an observable error using throwError
    return throwError(() => new Error(errorMessage));
  }

  // 21. showLoadingIcon (refactored to avoid direct DOM manipulation)
  // This is highly discouraged in Angular. Use *ngIf with a boolean in your
  // component template or a dedicated loading service/component.
  // Example of what NOT to do (commented out):
  /*
  public showLoadingIcon(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Direct DOM manipulation - AVOID
    const form = document.getElementsByTagName('body')[0];
    if (form) {
      const divOuter = document.createElement('div');
      divOuter.id = 'divProgressBack';
      const divInner = document.createElement('div');
      divInner.id = 'dvProgress';
      divInner.setAttribute('class', 'loading'); // Or better, use classList.add()
      divOuter.appendChild(divInner);
      form.appendChild(divOuter);
    }
  }
  */
  // --- RECOMMENDED APPROACH for showLoadingIcon ---
  // Instead of this method, use a boolean flag in your component:
  // isLoading = false;
  // In your component template:
  // <div *ngIf="isLoading" class="loading-overlay">
  //   <div class="loading-spinner"></div>
  // </div>
  // In your component logic:
  // this.isLoading = true; // When starting async operation
  // ... (async operation)
  // this.isLoading = false; // When operation completes (in subscribe/finally)
  // Or use a global loading service that components can subscribe to.
}

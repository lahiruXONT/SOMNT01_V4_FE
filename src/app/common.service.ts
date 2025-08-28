import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  constructor(private http: HttpClient, private location: Location) {}

  public getAPIPrefix(): string;
  public getAPIPrefix(taskCode: string): string;

  public getAPIPrefix(taskCode?: string): string {
    return this.getRootURL();
  }

  public convertAmountToNumber(amount: string): number {
    const text: string = amount.trim().replace(/,/g, '');
    if (text === '') {
      return 0;
    } else {
      return parseFloat(text);
    }
  }

  public convertNumberToAmount(
    num: any,
    noOfMinimumDecimalPlaces: number
  ): string {
    const array = num.toString().split('.');

    let prefix = '';
    let suffix = '';
    if (array.length > 1) {
      suffix = array[1];
    }
    prefix = array[0];
    let result = '';

    prefix = prefix.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (array.length > 1) {
      const suffixLen: number = suffix.length;
      if (suffixLen < noOfMinimumDecimalPlaces) {
        suffix =
          suffix + this.getDecimalOffset(noOfMinimumDecimalPlaces - suffixLen);
      }
      result = prefix + '.' + suffix;
    } else {
      if (noOfMinimumDecimalPlaces > 0) {
        result = prefix + '.' + this.getDecimalOffset(noOfMinimumDecimalPlaces);
      } else {
        result = prefix;
      }
    }
    return result;
  }

  private getDecimalOffset(noOfRemainingDecimalPoints: number): string {
    let offset = '';
    for (let i = 0; i < noOfRemainingDecimalPoints; i++) {
      offset = offset + '0';
    }
    return offset;
  }

  public isInternetExplorer(): boolean {
    const ua = window.navigator.userAgent;

    const msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      return true;
    }

    const trident = ua.indexOf('Trident/');
    if (trident > 0) {
      return true;
    }

    const edge = ua.indexOf('Edge/');
    if (edge > 0) {
      return true;
    }

    return false;
  }

  public generateExcel(htmlCode: string, filename: string): void {
    filename += '.xls';

    if (this.isInternetExplorer()) {
      if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
        const blob = new Blob(['\ufeff', htmlCode], { type: 'text/html' });
        (navigator as any).msSaveBlob(blob, filename);
      }
    } else {
      const myBlob = new Blob(['\ufeff', htmlCode], { type: 'text/html' });
      const url = window.URL.createObjectURL(myBlob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.href = url;
      a.download = filename;
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }

  public getRootURL(): string {
    const navbarElements = parent.document.getElementsByClassName('navbar');

    if (navbarElements.length === 0) {
      return document.location.origin;
    } else {
      const array: string[] = document.location.pathname.split('/');
      return document.location.origin + '/' + array[1];
    }
  }

  public getPageSize(taskCode: string): number {
    const data = JSON.parse(
      localStorage.getItem(taskCode + '_MasterControlData') || '{}'
    );
    if (data.AllowPaging == '1') {
      return data.PageSize;
    } else {
      return data.ExtendedPageSize;
    }
  }

  public fieldLevelAuthentication(
    componentName: string,
    taskCode: string
  ): Observable<void> {
    const url = `${this.getAPIPrefix(
      taskCode
    )}/api/FieldLevelAuthentication/GetAuthenticationData?formName=${componentName}&taskCode=${taskCode}`;

    return this.http.get<any[]>(url).pipe(
      map((response) => this.restrictSpecificControls(response)),
      catchError((error) => throwError(() => error))
    );
  }

  private restrictSpecificControls(list: any[]): void {
    let message = 'Field Level Authentication was applied for ';
    let count = 0;

    for (let i = 0; i < list.length; i++) {
      const control: any = document.getElementById(list[i].ControlName);
      if (control) {
        if (list[i].Flag == 1) {
          control.disabled = true;
          control
            .querySelectorAll('*')
            .forEach((el: any) => (el.disabled = true));
          count++;
          message += list[i].ControlName;
          if (i < list.length - 1) message += ',';
        } else if (list[i].Flag == 2) {
          control.style.display = 'none';
          count++;
          message += list[i].ControlName;
          if (i < list.length - 1) message += ',';
        }
      }

      if (i == list.length - 1) message += '.';
    }

    if (count > 0) console.log(message);
  }

  public showLoadingIcon(): void {
    const form = document.getElementsByTagName('body')[0];
    const divOuter = document.createElement('div');
    divOuter.id = 'divProgressBack';
    const divInner = document.createElement('div');
    divInner.id = 'dvProgress';
    divInner.className = 'loading';
    divOuter.appendChild(divInner);
    form.appendChild(divOuter);
  }
}

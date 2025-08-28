import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor(private http: HttpClient, private commonService: CommonService) {}

  public getMessage(msgID: number): Observable<any> {
    const url = `${this.getSiteName()}/api/Message/GetMessage?msgID=${msgID}`;

    return this.http.get(url).pipe(
      map((response) => response),
      catchError((error) => throwError(() => error))
    );
  }

  public getUserName(): Observable<any> {
    const url = `${this.getSiteName()}/api/Message/GetUserName`;

    return this.http.get(url).pipe(
      map((response) => response),
      catchError((error) => throwError(() => error))
    );
  }

  private getSiteName(): string {
    return this.commonService.getAPIPrefix();
  }
}

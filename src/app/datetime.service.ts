import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DateFormatConfig {
  format: string;
  separator: string;
  order: string[];
}

@Injectable({
  providedIn: 'root',
})
export class DatetimeService {
  private format: string = '';
  private dateFormats: Map<string, DateFormatConfig> = new Map();

  constructor(private http: HttpClient) {
    this.format = localStorage.getItem('ClientDateFormat') || '';
    this.initializeDateFormats();
  }

  private initializeDateFormats(): void {
    // Define all supported date formats with their configurations
    this.dateFormats.set('yyyy/mm/dd', {
      format: 'yyyy/mm/dd',
      separator: '/',
      order: ['year', 'month', 'day'],
    });
    this.dateFormats.set('yyyy/dd/mm', {
      format: 'yyyy/dd/mm',
      separator: '/',
      order: ['year', 'day', 'month'],
    });
    this.dateFormats.set('mm/yyyy/dd', {
      format: 'mm/yyyy/dd',
      separator: '/',
      order: ['month', 'year', 'day'],
    });
    this.dateFormats.set('mm/dd/yyyy', {
      format: 'mm/dd/yyyy',
      separator: '/',
      order: ['month', 'day', 'year'],
    });
    this.dateFormats.set('dd/yyyy/mm', {
      format: 'dd/yyyy/mm',
      separator: '/',
      order: ['day', 'year', 'month'],
    });
    this.dateFormats.set('dd/mm/yyyy', {
      format: 'dd/mm/yyyy',
      separator: '/',
      order: ['day', 'month', 'year'],
    });

    this.dateFormats.set('yyyy.mm.dd', {
      format: 'yyyy.mm.dd',
      separator: '.',
      order: ['year', 'month', 'day'],
    });
    this.dateFormats.set('yyyy.dd.mm', {
      format: 'yyyy.dd.mm',
      separator: '.',
      order: ['year', 'day', 'month'],
    });
    this.dateFormats.set('mm.yyyy.dd', {
      format: 'mm.yyyy.dd',
      separator: '.',
      order: ['month', 'year', 'day'],
    });
    this.dateFormats.set('mm.dd.yyyy', {
      format: 'mm.dd.yyyy',
      separator: '.',
      order: ['month', 'day', 'year'],
    });
    this.dateFormats.set('dd.yyyy.mm', {
      format: 'dd.yyyy.mm',
      separator: '.',
      order: ['day', 'year', 'month'],
    });
    this.dateFormats.set('dd.mm.yyyy', {
      format: 'dd.mm.yyyy',
      separator: '.',
      order: ['day', 'month', 'year'],
    });

    this.dateFormats.set('yyyy-mm-dd', {
      format: 'yyyy-mm-dd',
      separator: '-',
      order: ['year', 'month', 'day'],
    });
    this.dateFormats.set('yyyy-dd-mm', {
      format: 'yyyy-dd-mm',
      separator: '-',
      order: ['year', 'day', 'month'],
    });
    this.dateFormats.set('mm-yyyy-dd', {
      format: 'mm-yyyy-dd',
      separator: '-',
      order: ['month', 'year', 'day'],
    });
    this.dateFormats.set('mm-dd-yyyy', {
      format: 'mm-dd-yyyy',
      separator: '-',
      order: ['month', 'day', 'year'],
    });
    this.dateFormats.set('dd-yyyy-mm', {
      format: 'dd-yyyy-mm',
      separator: '-',
      order: ['day', 'year', 'month'],
    });
    this.dateFormats.set('dd-mm-yyyy', {
      format: 'dd-mm-yyyy',
      separator: '-',
      order: ['day', 'month', 'year'],
    });
  }

  public getDisplayDate(date: Date): string {
    if (!this.format || !this.dateFormats.has(this.format)) {
      console.error('Invalid date format in configuration');
      return date.toISOString().split('T')[0];
    }

    const year = date.getFullYear().toString().padStart(4, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const config = this.dateFormats.get(this.format)!;
    const parts: { [key: string]: string } = {
      year,
      month,
      day,
    };

    return config.order.map((part) => parts[part]).join(config.separator);
  }

  public isValidDateString(text: string): boolean {
    if (!text.trim()) {
      return false;
    }

    if (!this.format || !this.dateFormats.has(this.format)) {
      console.error('Invalid date format in configuration');
      return false;
    }

    const config = this.dateFormats.get(this.format)!;
    const parts = text.split(config.separator);

    if (parts.length !== 3) {
      return false;
    }

    // Map parts to year, month, day based on format order
    const dateParts: { [key: string]: string } = {};
    config.order.forEach((part, index) => {
      dateParts[part] = parts[index];
    });

    return this.validateYearMonthDate(
      dateParts['year'],
      dateParts['month'],
      dateParts['day']
    );
  }

  private validateYearMonthDate(
    year: string,
    month: string,
    day: string
  ): boolean {
    // Trim whitespace
    if (year.trim() !== year || month.trim() !== month || day.trim() !== day) {
      return false;
    }

    // Validate year
    if (!/^\d{4}$/.test(year) || parseInt(year) < 1753) {
      return false;
    }

    // Validate month
    if (!/^\d{1,2}$/.test(month)) {
      return false;
    }

    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > 12) {
      return false;
    }

    // Validate day
    if (!/^\d{1,2}$/.test(day)) {
      return false;
    }

    const dayNum = parseInt(day);
    const maxDays = new Date(parseInt(year), monthNum, 0).getDate();

    return dayNum >= 1 && dayNum <= maxDays;
  }

  public getDateTimeForString(text: string): Date | null {
    if (text.includes('T')) {
      const date = new Date(text);
      return isNaN(date.getTime()) ? null : this.adjustForTimezone(date);
    }

    if (!this.format || !this.dateFormats.has(this.format)) {
      console.error('Invalid date format in configuration');
      return null;
    }

    const config = this.dateFormats.get(this.format)!;
    const parts = text.split(config.separator);

    if (parts.length !== 3) {
      return null;
    }

    // Map parts to year, month, day based on format order
    const dateParts: { [key: string]: number } = {};
    config.order.forEach((part, index) => {
      dateParts[part] = parseInt(parts[index]);
    });

    // Adjust month (JavaScript months are 0-based)
    const date = new Date(
      dateParts['year'],
      dateParts['month'] - 1,
      dateParts['day']
    );

    return isNaN(date.getTime()) ? null : this.adjustForTimezone(date);
  }

  private adjustForTimezone(date: Date): Date {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  }

  public getClientDateFormat(): string {
    return this.format;
  }

  public get12HourTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours || 12; // Convert 0 to 12

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')} ${ampm}`;
  }

  public get24HourTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }

  public validateFromToDates(fromDate: string, toDate: string): boolean {
    const from = this.getDateTimeForString(fromDate);
    const to = this.getDateTimeForString(toDate);

    if (!from || !to) {
      return false;
    }

    return from.getTime() <= to.getTime();
  }

  // Additional utility methods
  public setDateFormat(format: string): void {
    if (this.dateFormats.has(format)) {
      this.format = format;
      localStorage.setItem('ClientDateFormat', format);
    } else {
      console.error('Invalid date format:', format);
    }
  }

  public getAvailableDateFormats(): string[] {
    return Array.from(this.dateFormats.keys());
  }

  public isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }
}

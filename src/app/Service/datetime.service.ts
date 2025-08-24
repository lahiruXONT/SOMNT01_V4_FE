import { Injectable } from '@angular/core';

// Note: Http import removed as it's not used in this service.
// import { HttpClient } from '@angular/common/http'; // Not needed for this service's current logic

// --- Service Definition ---
@Injectable({
  providedIn: 'root', // Makes the service available application-wide
})
export class DatetimeService {
  public format: string = '';

  // Constructor: Removed Http injection as it's not used.
  // If other services were injected and used, they would go here.
  constructor() {
    // constructor(private http: HttpClient) { // Removed Http/HttpClient
    try {
      // Retrieve date format from localStorage with a fallback
      this.format = localStorage.getItem('ClientDateFormat') || 'yyyy/mm/dd'; // Provide a default format
    } catch (e) {
      console.warn(
        'Error accessing localStorage for ClientDateFormat, using default.',
        e
      );
      this.format = 'yyyy/mm/dd'; // Default fallback
    }
  }

  /**
   * Converts a JavaScript Date object into a display string based on the configured format.
   * @param date The Date object to format.
   * @returns The formatted date string.
   */
  public getDisplayDate(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Invalid Date object passed to getDisplayDate:', date);
      return ''; // Or throw an error
    }

    const year = date.getFullYear().toString().padStart(4, '0'); // Ensure 4 digits with padding
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth is 0-indexed
    const day = date.getDate().toString().padStart(2, '0');

    let output = '';

    // Helper function to build output based on component order
    const buildOutput = (
      part1: string,
      part2: string,
      part3: string,
      separator: string
    ) => {
      const parts: { [key: string]: string } = {
        yyyy: year,
        mm: month,
        dd: day,
      };
      return `${parts[part1]}${separator}${parts[part2]}${separator}${parts[part3]}`;
    };

    // Determine separator and component order based on format
    if (this.format.includes('/')) {
      const parts = this.format.split('/');
      output = buildOutput(parts[0], parts[1], parts[2], '/');
    } else if (this.format.includes('.')) {
      const parts = this.format.split('.');
      output = buildOutput(parts[0], parts[1], parts[2], '.');
    } else if (this.format.includes('-')) {
      const parts = this.format.split('-');
      output = buildOutput(parts[0], parts[1], parts[2], '-');
    } else {
      console.error(
        'Invalid or unsupported date format in localStorage "ClientDateFormat":',
        this.format
      );
      // alert('Invalid date format in "ventura.config.json"'); // Avoid alerts in services if possible
      // Provide a fallback or throw error
      output = `${year}/${month}/${day}`; // Fallback format
    }

    return output;
  }

  /**
   * Checks if a given string is a valid date according to the configured format.
   * @param text The date string to validate.
   * @returns True if the string is a valid date, false otherwise.
   */
  public isValidDateString(text: string): boolean {
    if (!text || text.trim() === '') {
      return false;
    }

    let year = '';
    let month = '';
    let day = '';
    let array: string[] = [];
    let separator = '';

    // Determine separator and split the string
    if (text.includes('/')) {
      separator = '/';
    } else if (text.includes('.')) {
      separator = '.';
    } else if (text.includes('-')) {
      separator = '-';
    } else {
      console.warn(
        'Date string does not contain a recognized separator (/, ., -):',
        text
      );
      return false;
    }

    array = text.split(separator);

    if (array.length !== 3) {
      return false;
    }

    // Map parts based on format
    try {
      if (
        this.format === 'yyyy/mm/dd' ||
        this.format === 'yyyy.mm.dd' ||
        this.format === 'yyyy-mm-dd'
      ) {
        [year, month, day] = array;
      } else if (
        this.format === 'yyyy/dd/mm' ||
        this.format === 'yyyy.dd.mm' ||
        this.format === 'yyyy-dd-mm'
      ) {
        [year, day, month] = array; // Swap day/month
      } else if (
        this.format === 'mm/yyyy/dd' ||
        this.format === 'mm.yyyy.dd' ||
        this.format === 'mm-yyyy-dd'
      ) {
        [month, year, day] = array; // Swap month/year
      } else if (
        this.format === 'mm/dd/yyyy' ||
        this.format === 'mm.dd.yyyy' ||
        this.format === 'mm-dd-yyyy'
      ) {
        [month, day, year] = array; // Swap month/day/year
      } else if (
        this.format === 'dd/yyyy/mm' ||
        this.format === 'dd.yyyy.mm' ||
        this.format === 'dd-yyyy-mm'
      ) {
        [day, year, month] = array; // Swap day/year/month
      } else if (
        this.format === 'dd/mm/yyyy' ||
        this.format === 'dd.mm.yyyy' ||
        this.format === 'dd-mm-yyyy'
      ) {
        [day, month, year] = array; // Swap day/month/year
      } else {
        console.error(
          'Unsupported or invalid date format configured:',
          this.format
        );
        // alert('Invalid date format in "ventura.config.json"'); // Avoid alerts
        return false; // Cannot validate with unknown format
      }
    } catch (e) {
      console.error('Error parsing date string parts:', text, e);
      return false;
    }

    return this.validateYearMonthDay(year, month, day);
  }

  /**
   * Validates individual year, month, and day components.
   * @param year The year string.
   * @param month The month string (1-12).
   * @param day The day string.
   * @returns True if the components form a valid date, false otherwise.
   */
  private validateYearMonthDay(
    year: string,
    month: string,
    day: string
  ): boolean {
    // Check for whitespace within parts
    if (year.trim() !== year || month.trim() !== month || day.trim() !== day) {
      return false;
    }

    // Validate year format (4 digits)
    if (!/^\d{4}$/.test(year)) {
      return false;
    }
    const yearNum = parseInt(year, 10);
    if (yearNum < 1753) {
      // Assuming this is still a business rule
      return false;
    }

    // Validate month format (2 digits) and range
    if (!/^\d{2}$/.test(month)) {
      return false;
    }
    const monthNum = parseInt(month, 10);
    if (monthNum < 1 || monthNum > 12) {
      return false;
    }

    // Validate day format (2 digits)
    if (!/^\d{2}$/.test(day)) {
      return false;
    }
    const dayNum = parseInt(day, 10);

    // Check if day is valid for the month/year (including leap years)
    const maxDay = new Date(yearNum, monthNum, 0).getDate(); // Get last day of the month
    if (dayNum < 1 || dayNum > maxDay) {
      return false;
    }

    return true;
  }

  /**
   * Parses a date string (formatted according to the config or ISO) into a JavaScript Date object.
   * Attempts to handle timezone offset.
   * @param text The date string to parse.
   * @returns A JavaScript Date object, or null if parsing fails.
   */
  public getDateTimeForString(text: string): Date | null {
    if (!text) {
      console.warn('Empty or null string passed to getDateTimeForString');
      return null;
    }

    // Handle ISO-like strings with 'T'
    if (text.includes('T')) {
      const fakeDate = new Date(text);
      if (isNaN(fakeDate.getTime())) {
        console.error('Invalid ISO date string:', text);
        return null;
      }
      // Apply GMT time offset adjustment (this logic might need review based on actual requirements)
      // This attempts to adjust for the local timezone offset.
      return new Date(
        fakeDate.getTime() + 60 * 1000 * -1 * fakeDate.getTimezoneOffset()
      );
    } else {
      // Handle custom formatted strings
      if (!this.isValidDateString(text)) {
        console.warn(
          'Date string is not valid according to configured format:',
          text
        );
        return null;
      }

      let year = '';
      let month = '';
      let day = '';
      let array: string[] = [];
      let separator = '';

      // Determine separator and split (repeating logic for clarity within method)
      if (text.includes('/')) {
        separator = '/';
      } else if (text.includes('.')) {
        separator = '.';
      } else if (text.includes('-')) {
        separator = '-';
      } else {
        console.error(
          'Unexpected separator issue in getDateTimeForString for non-ISO string:',
          text
        );
        return null;
      }
      array = text.split(separator);

      // Map parts based on format (repeating logic for clarity within method)
      try {
        if (
          this.format === 'yyyy/mm/dd' ||
          this.format === 'yyyy.mm.dd' ||
          this.format === 'yyyy-mm-dd'
        ) {
          [year, month, day] = array;
        } else if (
          this.format === 'yyyy/dd/mm' ||
          this.format === 'yyyy.dd.mm' ||
          this.format === 'yyyy-dd-mm'
        ) {
          [year, day, month] = array;
        } else if (
          this.format === 'mm/yyyy/dd' ||
          this.format === 'mm.yyyy.dd' ||
          this.format === 'mm-yyyy-dd'
        ) {
          [month, year, day] = array;
        } else if (
          this.format === 'mm/dd/yyyy' ||
          this.format === 'mm.dd.yyyy' ||
          this.format === 'mm-dd-yyyy'
        ) {
          [month, day, year] = array;
        } else if (
          this.format === 'dd/yyyy/mm' ||
          this.format === 'dd.yyyy.mm' ||
          this.format === 'dd-yyyy-mm'
        ) {
          [day, year, month] = array;
        } else if (
          this.format === 'dd/mm/yyyy' ||
          this.format === 'dd.mm.yyyy' ||
          this.format === 'dd-mm-yyyy'
        ) {
          [day, month, year] = array;
        } else {
          console.error(
            'Unsupported format in getDateTimeForString:',
            this.format
          );
          return null;
        }
      } catch (e) {
        console.error(
          'Error extracting date parts in getDateTimeForString:',
          text,
          e
        );
        return null;
      }

      // Create Date object (month is 0-indexed in Date constructor)
      // Note: This creates the date in the local timezone.
      // The timezone offset adjustment logic below might not be standard.
      const fakeDate = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10)
      );
      if (isNaN(fakeDate.getTime())) {
        console.error(
          'Failed to create valid Date object from parts:',
          year,
          month,
          day
        );
        return null;
      }
      // Apply GMT time offset adjustment (this logic might need review)
      return new Date(
        fakeDate.getTime() + 60 * 1000 * -1 * fakeDate.getTimezoneOffset()
      );
    }
  }

  /**
   * Retrieves the client date format string from localStorage.
   * @returns The format string, or null if not found or error occurs.
   */
  public getClientDateFormat(): string | null {
    try {
      return localStorage.getItem('ClientDateFormat');
    } catch (e) {
      console.error('Error retrieving ClientDateFormat from localStorage:', e);
      return null;
    }
  }

  /**
   * Formats a Date object into a 12-hour time string (e.g., 02:30 PM).
   * @param date The Date object.
   * @returns The formatted time string.
   */
  public get12HourTime(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Invalid Date object passed to get12HourTime:', date);
      return '';
    }
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const newHour = hours.toString().padStart(2, '0');
    const newMinutes = minutes.toString().padStart(2, '0');
    return `${newHour}:${newMinutes} ${ampm}`;
  }

  /**
   * Formats a Date object into a 24-hour time string (e.g., 14:30).
   * @param date The Date object.
   * @returns The formatted time string.
   */
  public get24HourTime(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Invalid Date object passed to get24HourTime:', date);
      return '';
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Validates that a 'from' date string is less than or equal to a 'to' date string.
   * @param fromDate The 'from' date string.
   * @param toDate The 'to' date string.
   * @returns True if 'from' date is <= 'to' date, false otherwise.
   */
  public validateFromToDates(fromDate: string, toDate: string): boolean {
    const fromDateObj = this.getDateTimeForString(fromDate);
    const toDateObj = this.getDateTimeForString(toDate);

    // Check if parsing was successful
    if (!fromDateObj || !toDateObj) {
      console.warn(
        'validateFromToDates: One or both dates could not be parsed.',
        fromDate,
        toDate
      );
      return false; // Or handle error as appropriate
    }

    // Compare Date objects directly
    return fromDateObj <= toDateObj; // This correctly compares dates
    // Original logic was overly complex for simple date comparison.
    // The direct comparison (<=) handles year, month, and day correctly.
  }
}

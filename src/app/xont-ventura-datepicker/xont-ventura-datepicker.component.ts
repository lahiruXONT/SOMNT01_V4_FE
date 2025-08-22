import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
// Import Material Datepicker modules
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core'; // Or your preferred date adapter (e.g., MomentDateModule)
import { DatetimeService } from '../datetime.service'; // Assuming this service is updated and provides formatting

// We are removing direct Http usage as it's not shown in the component logic
// import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'xont-ventura-datepicker',
  standalone: true,
  imports: [
    CommonModule,
    // Material Datepicker related modules
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule, // Provides native Date object support
  ],
  template: `
    <!-- Hidden input to maintain the ID if needed for external references -->
    <input type="hidden" [attr.id]="id" />

    <!-- Material Datepicker -->
    <mat-form-field appearance="fill" style="width: 100%;">
      <!-- Adjust width as needed -->
      <!-- The actual input associated with the datepicker -->
      <input
        matInput
        [matDatepicker]="picker"
        (dateChange)="onDateChange($event)"
        [disabled]="_disabled"
        [placeholder]="'Choose a date'"
      />

      <!-- The datepicker toggle button -->
      <mat-datepicker-toggle
        matIconSuffix
        [for]="picker"
        [disabled]="_disabled"
      ></mat-datepicker-toggle>
      <!-- The datepicker instance -->
      <mat-datepicker #picker></mat-datepicker>
    </mat-form-field>
  `,
  styles: [
    `
      /* Add component-specific styles here if needed */
      :host {
        display: inline-block; /* Or block, depending on desired layout */
        /* width: 150px; */ /* Example width */
      }
      .mat-mdc-form-field {
        /* Adjust Material form field styles if necessary */
      }
    `,
  ],
})
export class XontVenturaDatepickerComponent implements OnInit {
  @Input() id?: string; // Make ID optional if primarily for external reference

  // Use booleanAttribute transform for cleaner boolean binding
  @Input({ transform: booleanAttribute }) _disabled: boolean = false;

  @Output() onDateSelect: EventEmitter<string> = new EventEmitter<string>();

  // If you need a reference to the input element for specific interactions (less common with Material)
  // @ViewChild('dateInput', { static: false }) dateInput!: ElementRef<HTMLInputElement>;

  // Store the format locally or fetch from DatetimeService
  private format: string = 'yyyy/MM/dd'; // Default format

  constructor(
    // private http: HttpClient, // Removed as not used in current logic
    private datetimeService: DatetimeService // Inject DatetimeService for formatting
  ) {}

  ngOnInit(): void {
    // Fetch the client date format from DatetimeService or localStorage
    try {
      // Prefer DatetimeService if it's reliable and updated
      const serviceFormat = this.datetimeService.getClientDateFormat();
      if (serviceFormat) {
        this.format = serviceFormat;
      } else {
        // Fallback to localStorage
        const storageFormat = localStorage.getItem('ClientDateFormat');
        if (storageFormat) {
          this.format = storageFormat;
        }
        // Else, keep default 'yyyy/MM/dd'
      }
    } catch (e) {
      console.warn('Error retrieving date format, using default.', e);
    }
  }

  // Handle date selection from Material Datepicker
  onDateChange(
    event: any /* Use MatDatepickerInputEvent<Date> if importing MatDatepickerInputEvent */
  ): void {
    const selectedDate: Date | null = event.value; // event.value is the selected Date object

    if (selectedDate) {
      try {
        // Use DatetimeService to format the date according to the client format
        const formattedDate: string =
          this.datetimeService.getDisplayDate(selectedDate);
        this.onDateSelect.emit(formattedDate);
      } catch (error) {
        console.error('Error formatting date:', error);
        // Emit the date in ISO format or a default format as fallback
        this.onDateSelect.emit(selectedDate.toISOString().split('T')[0]); // YYYY-MM-DD
      }
    } else {
      // Handle case where date is cleared (if your use case allows it)
      this.onDateSelect.emit(''); // Or null if your parent component expects null
    }
  }

  // Note: destroy() and reset() methods from the original jQuery component
  // are not needed as Material Datepicker handles its lifecycle.
  // If you need to programmatically open/close, you can use @ViewChild('picker') and call picker.open()/close()
}

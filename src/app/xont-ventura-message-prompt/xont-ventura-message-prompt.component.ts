import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../Service/message.service'; // Adjust path if necessary
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { CommonService } from '../Service/common.service'; // Ensure Angular 19 compatibility

// Declare jQuery if it's still a dependency (NOT RECOMMENDED for Angular 19)
// It's better to migrate away from jQuery for modals.
declare var $: any; // Consider removing this dependency

// --- Component Definition ---
@Component({
  selector: 'xont-ventura-message-prompt',
  standalone: true,
  imports: [
    CommonModule,
    // Add Material modules here if replacing Bootstrap modals
  ],
  templateUrl: './xont-ventura-message-prompt.component.html', // Or use inline template
  styleUrls: ['./xont-ventura-message-prompt.component.css'], // Or use inline styles
})
export class XontVenturaMessagePromptComponent {
  // --- Inputs and Outputs ---
  @Input() id: string = 'errorMessagePromptID';
  @Input() messageType: string = 'error'; // 'error', 'confirm', 'alert'
  @Output() onOK: EventEmitter<any> = new EventEmitter();
  @Output() onCancel: EventEmitter<any> = new EventEmitter();

  // --- Component State (using Signals) ---
  message = signal<any>({});
  backgroundColor = signal<string>('');
  title = signal<string>('');
  messageText = signal<string>('');
  okButtonText = signal<string>('Yes');
  cancelButtonText = signal<string>('No');

  // Signal for loading/busy state
  isLoading = signal<boolean>(false);

  // --- Constructor ---
  constructor(
    private location: Location,
    private messageService: MessageService // Inject the updated service // private http: HttpClient, // Not directly needed if using MessageService // private commonService: CommonService, // Not directly needed if MessageService handles API prefix
  ) {
    // Initialization logic if needed
  }

  // --- Public Methods ---

  public show(object: any, taskCode: string): void {
    // Format date if present in object
    if (object && object.ErrorTime) {
      const date = new Date(object.ErrorTime);
      const month = (1 + date.getMonth()).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      let hour = date.getHours();
      const isPM = hour >= 12;
      hour = hour % 12 || 12;
      const formattedHour = hour.toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      const ampm = isPM ? 'PM' : 'AM';

      object.ErrorTime = `${date.getFullYear()}/${month}/${day}   ${formattedHour}:${minutes}:${seconds} ${ampm}`;
    }

    if (object && object.ErrorType == 1) {
      this.isLoading.set(true);
      this.messageService.getUserName().subscribe({
        next: (userData: any) => {
          // Use specific type if MessageService is updated
          object.UserName = userData?.UserName || userData || 'Unknown User';
          this.message.set(object);
          this.isLoading.set(false);
          this.showModal();
        },
        error: (err: HttpErrorResponse) => {
          // Type the error
          console.error('Error fetching username:', err);
          object.UserName = 'Error fetching user';
          this.message.set(object);
          this.isLoading.set(false);
          this.showModal();
        },
      });
    } else {
      this.message.set(object);
      this.showModal();
    }
  }

  public showConfirm(
    messageText: string,
    okButtonText: string,
    cancelButtonText: string
  ): void {
    this.messageText.set(messageText);
    this.okButtonText.set(okButtonText);
    this.cancelButtonText.set(cancelButtonText);
    this.messageType = 'confirm';
    this.showModal();
  }

  public showAlert(messageText: string, okButtonText: string = 'OK'): void {
    this.messageText.set(messageText);
    this.okButtonText.set(okButtonText);
    this.messageType = 'alert';
    this.showModal();
  }

  // --- V3001/V3003 Methods ---
  // Corrected method overloads and implementation
  public confirmation(
    msgID: number,
    para1?: string,
    para2?: string,
    para3?: string,
    para4?: string,
    para5?: string,
    para6?: string,
    yesButtonText?: string,
    noButtonText?: string
  ): void {
    if (yesButtonText) this.okButtonText.set(yesButtonText.trim());
    if (noButtonText) this.cancelButtonText.set(noButtonText.trim());

    this.messageType = 'confirm';

    let defaultMsg = `Message ${msgID} does not exist in the Message Database`;

    this.isLoading.set(true);
    this.messageService.getMessage(msgID).subscribe({
      next: (data: any[]) => {
        // Use specific type if MessageService is updated
        let msg = defaultMsg;
        if (data && data.length > 0 && data[0]?.MessageText) {
          msg = data[0].MessageText.trim();
          // V3003: Replace placeholders safely
          const params = [para1, para2, para3, para4, para5, para6];
          params.forEach((param, index) => {
            if (param != null && param.trim() !== '') {
              // Use global flag 'g' to replace all instances
              msg = msg.replace(new RegExp(`&${index + 1}`, 'g'), param.trim());
            }
          });
        }
        this.messageText.set(msg);
        this.isLoading.set(false);
        this.showModal();
      },
      error: (err: HttpErrorResponse) => {
        // Type the error
        console.error('Error fetching confirmation message:', err);
        this.messageText.set(defaultMsg);
        this.isLoading.set(false);
        this.showModal();
      },
    });
  }

  public alert(
    msgID: number,
    para1: string = '',
    para2: string = '',
    para3: string = '',
    para4: string = '',
    para5: string = '',
    para6: string = ''
  ): void {
    this.okButtonText.set('OK');
    this.messageType = 'alert';

    let defaultMsg = `Message ${msgID} does not exist in the Message Database`;

    this.isLoading.set(true);
    this.messageService.getMessage(msgID).subscribe({
      next: (data: any[]) => {
        // Use specific type if MessageService is updated
        let msg = defaultMsg;
        if (data && data.length > 0 && data[0]?.MessageText) {
          msg = data[0].MessageText.trim();
          // Replace placeholders safely
          const params = [para1, para2, para3, para4, para5, para6];
          params.forEach((param, index) => {
            if (param != null && param.trim() !== '') {
              msg = msg.replace(new RegExp(`&${index + 1}`, 'g'), param.trim());
            }
          });
        }
        this.messageText.set(msg);
        this.isLoading.set(false);
        this.showModal();
      },
      error: (err: HttpErrorResponse) => {
        // Type the error
        console.error('Error fetching alert message:', err);
        this.messageText.set(defaultMsg);
        this.isLoading.set(false);
        this.showModal();
      },
    });
  }

  // --- Private Helper Methods ---

  private showModal(): void {
    // Use jQuery/Bootstrap to show the modal if still used
    // STRONGLY RECOMMEND migrating to Angular Material Dialog
    if (typeof $ !== 'undefined' && $(`#${this.id}`).length) {
      $(`#${this.id}`).modal({ backdrop: 'static' });
    } else {
      console.warn(`Modal with ID ${this.id} not found or jQuery not loaded.`);
    }
  }

  private hideModal(): void {
    if (typeof $ !== 'undefined' && $(`#${this.id}`).length) {
      $(`#${this.id}`).modal('hide');
    }
  }

  // --- Event Handlers for Modal Actions ---
  public confirm_ok(): void {
    this.hideModal();
    this.onOK.emit();
  }

  public confirm_cancel(): void {
    this.hideModal();
    this.onCancel.emit();
  }

  public alert_ok(): void {
    this.hideModal();
    this.onOK.emit();
  }
}

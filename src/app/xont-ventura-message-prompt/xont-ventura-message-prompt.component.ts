import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnDestroy,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MessageService } from '../message.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

declare var $: any;

@Component({
  selector: 'xont-ventura-message-prompt',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  template: `
    <!-- Loading indicator (simple implementation without ng-busy) -->

    <!-- Confirm Modal -->
    <div
      *ngIf="messageType === 'confirm'"
      class="modal fade"
      [id]="id"
      role="dialog"
    >
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-body Captionstyle text-center">
            <p>{{ messageText }}</p>
          </div>
          <div class="text-center">
            <button
              type="button"
              class="MainButtonStyle"
              (click)="confirm_ok()"
            >
              {{ okButtonText }}
            </button>
            <button
              type="button"
              class="MainButtonStyle"
              (click)="confirm_cancel()"
            >
              {{ cancelButtonText }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Modal -->
    <div
      *ngIf="messageType === 'alert'"
      class="modal fade"
      [id]="id"
      role="dialog"
    >
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-body Captionstyle text-center">
            <p>{{ messageText }}</p>
          </div>
          <div class="text-center">
            <button type="button" class="MainButtonStyle" (click)="alert_ok()">
              {{ okButtonText }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Modal -->
    <div
      *ngIf="messageType === 'error'"
      class="modal fade"
      [id]="id"
      role="dialog"
    >
      <div
        class="modal-dialog"
        [ngClass]="{ 'modal-sm': message?.ErrorType === 2 }"
      >
        <div class="modal-content">
          <!-- Detailed Error (Type 1) -->
          <ng-container *ngIf="message?.ErrorType === 1">
            <div
              class="modal-header"
              style="padding:10px 10px 10px 20px;background-color:crimson !important;"
            >
              <h5 class="modal-title" style="font-size: 12px;">
                Error Message
              </h5>
            </div>
            <div
              class="modal-body"
              style="background-color: #383838;color:white;font-size: 12px;"
            >
              <table>
                <tr>
                  <td style="padding-right:50px">Error Log Number</td>
                  <td>: {{ message.ErrorLog }}</td>
                </tr>
                <tr>
                  <td>Error Time</td>
                  <td>: {{ message.ErrorTime }}</td>
                </tr>
                <tr>
                  <td>WorkStation</td>
                  <td>: {{ message.WorkstationId }}</td>
                </tr>
                <tr>
                  <td>User Name</td>
                  <td>: {{ message.UserName }}</td>
                </tr>
                <tr>
                  <td>IP Address</td>
                  <td>: {{ message.IpAddress }}</td>
                </tr>
                <tr>
                  <td>Message Number</td>
                  <td>: {{ message.MsgNumber }}</td>
                </tr>
                <tr>
                  <td>Error Description</td>
                  <td>: {{ message.Desc }}</td>
                </tr>
                <tr>
                  <td>Error Source</td>
                  <td>: {{ message.ErrorSource }}</td>
                </tr>
                <tr>
                  <td>DLL Name</td>
                  <td>: {{ message.DllName }}</td>
                </tr>
                <tr>
                  <td>Version</td>
                  <td>: {{ message.Version }}</td>
                </tr>
                <tr>
                  <td>Routine</td>
                  <td>: {{ message.Routine }}</td>
                </tr>
                <tr>
                  <td>Error Line Number</td>
                  <td>: {{ message.LineNumber }}</td>
                </tr>
              </table>
            </div>
            <div
              class="modal-footer"
              style="padding:5px 20px 5px 5px;background-color: crimson;"
            >
              <button
                type="button"
                class="btn btn-default btn-sm"
                (click)="hideModal()"
              >
                OK
              </button>
            </div>
          </ng-container>

          <!-- Simple Error (Type 2) -->
          <ng-container *ngIf="message?.ErrorType === 2">
            <div class="modal-body Captionstyle text-center">
              <p>{{ message.MsgNumber }} : {{ message.Desc }}</p>
            </div>
            <div class="text-center">
              <button
                type="button"
                class="MainButtonStyle"
                (click)="hideModal()"
              >
                OK
              </button>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .loading-indicator {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 9999;
      }
    `,
  ],
})
export class XontVenturaMessagePromptComponent implements OnDestroy {
  private http = inject(HttpClient);
  private location = inject(Location);
  private messageService = inject(MessageService);

  message: any = {};
  messageText = '';
  okButtonText = 'Yes';
  cancelButtonText = 'No';
  isLoading = false;

  @Input() id: string = 'errorMessagePromptID';
  @Input() messageType: string = 'error';

  @Output() onOK = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  busy?: Subscription;

  ngOnDestroy(): void {
    this.busy?.unsubscribe();
  }

  public show(object: any, taskCode: string): void {
    this.isLoading = true;
    const date = new Date(object.ErrorTime);
    const month = (1 + date.getMonth()).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    let hour = date.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // Convert to 12-hour format

    object.ErrorTime = `${date.getFullYear()}/${month}/${day}   ${hour
      .toString()
      .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date
      .getSeconds()
      .toString()
      .padStart(2, '0')} ${ampm}`;

    if (object.ErrorType === 1) {
      this.busy = this.messageService.getUserName().subscribe({
        next: (data) => {
          object.UserName = data;
        },
        error: (err) => {
          console.error('Error fetching user name:', err);
          object.UserName = 'Unknown';
        },
        complete: () => {
          this.message = object;
          this.isLoading = false;
          this.showModal();
        },
      });
    } else {
      this.message = object;
      this.isLoading = false;
      this.showModal();
    }
  }

  public showConfirm(
    messageText: string,
    okButtonText: string,
    cancelButtonText: string
  ): void {
    this.messageType = 'confirm';
    this.messageText = messageText;
    this.okButtonText = okButtonText;
    this.cancelButtonText = cancelButtonText;
    this.showModal();
  }

  public showAlert(messageText: string, okButtonText: string): void {
    this.messageType = 'alert';
    this.messageText = messageText;
    this.okButtonText = okButtonText;
    this.showModal();
  }

  private showModal(): void {
    setTimeout(() => {
      $(`#${this.id}`).modal({ backdrop: 'static' });
    });
  }

  confirm_ok(): void {
    this.hideModal();
    this.onOK.emit();
  }

  confirm_cancel(): void {
    this.hideModal();
    this.onCancel.emit();
  }

  alert_ok(): void {
    this.hideModal();
    this.onOK.emit();
  }

  hideModal(): void {
    $(`#${this.id}`).modal('hide');
  }

  // Overload signatures
  public confirmation(msgID: number): void;
  public confirmation(
    msgID: number,
    para1: string,
    para2: string,
    para3: string,
    para4: string,
    para5: string,
    para6: string
  ): void;
  public confirmation(
    msgID: number,
    para1: string,
    para2: string,
    para3: string,
    para4: string,
    para5: string,
    para6: string,
    yesButtonText: string,
    noButtonText: string
  ): void;

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
    this.messageType = 'confirm';
    this.isLoading = true;

    if (yesButtonText) this.okButtonText = yesButtonText.trim();
    if (noButtonText) this.cancelButtonText = noButtonText.trim();

    let msg = `Message ${msgID} Does not contain in Message DataBase`;

    this.busy = this.messageService.getMessage(msgID).subscribe({
      next: (data) => {
        if (data?.[0]) {
          msg = data[0].MessageText.trim();
          msg = this.replacePlaceholders(
            msg,
            para1,
            para2,
            para3,
            para4,
            para5,
            para6
          );
        }
        this.messageText = msg;
        this.isLoading = false;
        this.showModal();
      },
      error: (err) => {
        console.error('Error fetching message:', err);
        this.messageText = msg;
        this.isLoading = false;
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
    this.messageType = 'alert';
    this.okButtonText = 'OK';
    this.isLoading = true;

    let msg = `Message ${msgID} Does not contain in Message DataBase`;

    this.busy = this.messageService.getMessage(msgID).subscribe({
      next: (data) => {
        if (data?.[0]) {
          msg = data[0].MessageText.trim();
          msg = this.replacePlaceholders(
            msg,
            para1,
            para2,
            para3,
            para4,
            para5,
            para6
          );
        }
        this.messageText = msg;
        this.isLoading = false;
        this.showModal();
      },
      error: (err) => {
        console.error('Error fetching message:', err);
        this.messageText = msg;
        this.isLoading = false;
        this.showModal();
      },
    });
  }

  private replacePlaceholders(
    msg: string,
    ...params: (string | undefined)[]
  ): string {
    params.forEach((param, index) => {
      if (param?.trim()) {
        msg = msg.replace(`&${index + 1}`, param.trim());
      }
    });
    return msg;
  }
}

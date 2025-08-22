import { Component, Input, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common'; // Import CommonModule and DOCUMENT

// --- Component Definition ---
@Component({
  selector: 'xont-ventura-gridexport',
  standalone: true, // Mark as standalone
  imports: [
    CommonModule, // Import CommonModule for directives like *ngIf (though not used here, good practice)
  ],
  // Use backticks for multi-line template strings
  template: `
    <span class="Linkboldtext">{{ gridName }}&nbsp;&nbsp;</span>
    <button
      title="Excel"
      class="btn btn-xs"
      style="color: white; background-color:#20744b; padding: 0px 4px; font-size: 14px;"
      (click)="btnExcelExport_OnClick(gridId, gridName)"
    >
      <i class="fa fa-file-excel-o" aria-hidden="true"></i>
    </button>
    <button
      title="PDF"
      class="btn btn-xs"
      style="color: white; background-color:#bb0706; padding: 0px 4px; font-size: 14px;"
      (click)="btnPDFExport_OnClick(gridId, gridName)"
    >
      <i class="fa fa-file-pdf-o" aria-hidden="true"></i>
    </button>
    <button
      title="Word"
      class="btn btn-xs"
      style="color: white; background-color:#2d5fa2; padding: 0px 4px; font-size: 14px;"
      (click)="btnWordExport_OnClick(gridId, gridName)"
    >
      <i class="fa fa-file-word-o" aria-hidden="true"></i>
    </button>
  `,
  styles: [
    // Add component-specific styles here if needed, or rely on global styles
    // Example:
    // `
    // .Linkboldtext {
    //   font-weight: bold;
    // }
    // .btn.btn-xs {
    //    /* Adjust button styles if needed */
    // }
    // `
  ],
})
export class XontVenturaGridExportComponent {
  @Input() id?: string; // Make optional if not strictly required by parent logic
  @Input() gridName: string = 'Grid'; // Provide default value
  @Input() gridId: string = ''; // Input for the target table's ID

  // Inject DOCUMENT for safer DOM access and PLATFORM_ID for SSR safety
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // --- Excel Export ---
  btnExcelExport_OnClick(tableID: string, tableName: string): void {
    // Check if running in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('Excel export is only available in the browser.');
      return;
    }

    if (!tableID) {
      console.error('Table ID is required for Excel export.');
      return;
    }

    try {
      const xml = this.htmlTableToXML(tableID.trim(), tableName.trim());
      if (!xml) {
        console.error('Failed to generate Excel XML data.');
        return;
      }

      if (this.isIE()) {
        // Handle older IE/Edge download
        if ((window as any).navigator.msSaveBlob) {
          const blob = new Blob([xml], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          (navigator as any).msSaveBlob(blob, tableName + '.xls');
        } else {
          console.warn('msSaveBlob not supported for Excel export.');
        }
      } else {
        // Modern browser download
        const uri = 'data:application/vnd.ms-excel,' + encodeURIComponent(xml);
        const downloadLink = this.document.createElement('a');
        downloadLink.href = uri;
        downloadLink.download = tableName + '.xls';
        // Append to document body temporarily
        this.document.body.appendChild(downloadLink);
        downloadLink.click();
        // Clean up
        this.document.body.removeChild(downloadLink);
      }
    } catch (error) {
      console.error('Error during Excel export:', error);
    }
  }

  // --- PDF Export ---
  btnPDFExport_OnClick(tableID: string, tableName: string): void {
    // Check if running in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('PDF export is only available in the browser.');
      return;
    }

    if (!tableID) {
      console.error('Table ID is required for PDF export.');
      return;
    }

    // Check if jsPDF is available
    // Using 'any' to access global jsPDF variable
    if (
      typeof (window as any).jsPDF === 'undefined' ||
      typeof (window as any).jspdf === 'undefined' ||
      !(window as any).jspdf.autoTable
    ) {
      console.error('jsPDF or jsPDF autoTable plugin is not loaded.');
      // alert('PDF export library (jsPDF) is not available.'); // Avoid alerts in components
      return;
    }

    try {
      // Use 'any' for jsPDF types as we are assuming global availability
      const doc: any = new (window as any).jsPDF('p', 'pt', 'a4');

      const options: any = {
        theme: 'grid',
        styles: { overflow: 'linebreak', fontSize: 8, lineColor: '#AAAAAA' },
        headerStyles: { fillColor: '#006699' },
      };

      const data: any = this.getJSONColumnRows(tableID);

      // Check if data was generated successfully
      if (!data || !data.Columns || !data.Rows) {
        console.error('Failed to generate data for PDF export.');
        return;
      }

      // Call autoTable plugin
      if (doc.autoTable) {
        doc.autoTable(data.Columns, data.Rows, options);
        doc.save(tableName + '.pdf');
      } else {
        console.error('jsPDF autoTable function is not available.');
      }
    } catch (error) {
      console.error('Error during PDF export:', error);
    }
  }

  // --- Word Export ---
  btnWordExport_OnClick(tableID: string, tableName: string): void {
    // Check if running in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('Word export is only available in the browser.');
      return;
    }

    if (!tableID) {
      console.error('Table ID is required for Word export.');
      return;
    }

    try {
      const htmlContent = this.getHTMLTable(tableID);
      if (!htmlContent) {
        console.error('Failed to generate HTML content for Word export.');
        return;
      }

      const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword',
      });

      if (this.isIE()) {
        if ((window as any).navigator.msSaveOrOpenBlob) {
          (navigator as any).msSaveOrOpenBlob(blob, tableName + '.doc');
        } else {
          console.warn('msSaveOrOpenBlob not supported for Word export.');
        }
      } else {
        const url = URL.createObjectURL(blob);
        const link = this.document.createElement('a');
        link.href = url;
        link.download = tableName + '.doc'; // Correct extension for Word
        this.document.body.appendChild(link);
        link.click();
        this.document.body.removeChild(link);
        // Revoke the object URL to free memory
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error during Word export:', error);
    }
  }

  // --- Helper Methods (Logic largely kept, adapted for DOCUMENT access) ---

  private emitXmlHeader(tableName: string): string {
    return (
      '<?xml version="1.0"?>\n' +
      '<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n' +
      '<ss:Styles>\n' +
      '<ss:Style ss:ID="columnheaders">\n' +
      '<ss:Font ss:Bold="1" />\n' +
      '</ss:Style>\n' +
      '</ss:Styles>\n' +
      '<ss:Worksheet ss:Name="' +
      tableName +
      '">\n' +
      '<ss:Table >\n\n'
    );
  }

  private emitXmlFooter(): string {
    return '\n</ss:Table>\n' + '</ss:Worksheet>\n' + '</ss:Workbook>\n';
  }

  private isIE(): boolean {
    // Improved IE detection (though IE is largely obsolete)
    if (!isPlatformBrowser(this.platformId)) return false;
    const ua = window.navigator.userAgent;
    return (
      ua.includes('MSIE ') || ua.includes('Trident/') || ua.includes('Edge/')
    ); // Simplified check
  }

  private htmlTableToXML(tableID: string, tableName: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const tableElement = this.document.getElementById(tableID);
    if (!tableElement) {
      console.error(`Table with ID '${tableID}' not found for Excel export.`);
      return null;
    }

    try {
      // Use native DOM methods instead of jQuery
      const headerRowElements =
        tableElement.querySelectorAll('thead > tr > th');
      let xml = '';
      xml += this.emitXmlHeader(tableName);

      // Set column widths
      headerRowElements.forEach((th) => {
        const width = (th as HTMLElement).offsetWidth; // Use offsetWidth
        if (width > 0) {
          // Check if width is valid
          xml += `<ss:Column ss:AutoFitWidth="0" ss:Width="${width}"/>\n`;
        } else {
          xml += '<ss:Column ss:AutoFitWidth="0" />\n'; // No column width
        }
      });

      // Add header row data
      xml += '<ss:Row>\n';
      headerRowElements.forEach((th) => {
        // Try to get text from an <a> tag first, otherwise use textContent
        const anchor = th.querySelector('a');
        const headerText = anchor
          ? anchor.textContent?.trim() || ''
          : th.textContent?.trim() || '';

        xml += '  <ss:Cell ss:StyleID="columnheaders">\n';
        xml += `    <ss:Data ss:Type="String">${this.escapeXml(
          headerText
        )}</ss:Data>\n`; // Escape XML
        xml += '  </ss:Cell>\n';
      });
      xml += '</ss:Row>\n';

      // Add body rows data
      const bodyRowElements = tableElement.querySelectorAll('tbody > tr');
      bodyRowElements.forEach((tr) => {
        xml += '<ss:Row>\n';
        const cellElements = tr.querySelectorAll('td');

        cellElements.forEach((td) => {
          this.cellText = '';
          this.getDeepText(td); // Pass native element

          const trimmedCellText = this.cellText.trim();
          let dataType = 'String';
          if (trimmedCellText !== '' && !isNaN(Number(trimmedCellText))) {
            dataType = 'Number';
          }

          xml += '  <ss:Cell>\n';
          xml += `    <ss:Data ss:Type="${dataType}">${this.escapeXml(
            trimmedCellText
          )}</ss:Data>\n`; // Escape XML
          xml += '  </ss:Cell>\n';
        });
        xml += '</ss:Row>\n';
      });

      xml += this.emitXmlFooter();
      return xml;
    } catch (error) {
      console.error('Error generating Excel XML:', error);
      return null;
    }
  }

  // Helper to escape XML special characters
  private escapeXml(unsafe: string): string {
    if (typeof unsafe !== 'string') return String(unsafe);
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '<';
        case '>':
          return '>';
        case '&':
          return '&amp;';
        case "'":
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }

  // Use native DOM element instead of jQuery object
  private cellText: string = '';
  private getDeepText(element: Element): void {
    if (!element) return;

    const el = element as HTMLElement; // Cast for property access

    if (el instanceof HTMLSelectElement) {
      const select = el;
      const selectedIndex = select.selectedIndex;
      if (selectedIndex >= 0 && select.options[selectedIndex]) {
        this.cellText += select.options[selectedIndex].text.trim();
      }
    } else if (el.children && el.children.length > 0) {
      // Recursively process children
      Array.from(el.children).forEach((child) => {
        this.getDeepText(child);
      });
    } else {
      if (el instanceof HTMLInputElement) {
        const input = el;
        if (input.type === 'radio') {
          this.cellText += input.checked ? 'Selected' : 'Unselected';
        } else if (input.type === 'checkbox') {
          this.cellText += input.checked ? 'Checked' : 'Unchecked';
        } else {
          this.cellText += (input.value || '').toString().trim(); // Handle null/undefined value
        }
      } else {
        // For other elements, use textContent
        this.cellText += (el.textContent || '').toString().trim(); // Handle null/undefined textContent
      }
    }
  }

  private columnList: string[] = [];
  private getJSONColumnRows(
    tableID: string
  ): { Columns: any[]; Rows: any[] } | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const tableElement = this.document.getElementById(tableID);
    if (!tableElement) {
      console.error(`Table with ID '${tableID}' not found for PDF export.`);
      return null;
    }

    try {
      const headerRowElements =
        tableElement.querySelectorAll('thead > tr > th');
      const cols: any[] = [];
      const rows: any[] = [];
      this.columnList = [];

      // Process header row for PDF columns
      headerRowElements.forEach((th, index) => {
        const anchor = th.querySelector('a');
        const headerText = anchor
          ? anchor.textContent?.trim() || ''
          : th.textContent?.trim() || '';
        const colKey = `col${index}`;
        cols.push({ title: headerText, dataKey: colKey });
        this.columnList.push(colKey);
      });

      // Process body rows for PDF data
      const bodyRowElements = tableElement.querySelectorAll('tbody > tr');
      bodyRowElements.forEach((tr) => {
        const row: any = {};
        const cellElements = tr.querySelectorAll('td');

        cellElements.forEach((td, j) => {
          if (j < this.columnList.length) {
            // Ensure we don't exceed column list
            this.cellText = '';
            this.getDeepText(td); // Pass native element
            const colKey = this.columnList[j];
            row[colKey] = this.cellText.trim();
          }
        });

        rows.push(row);
      });

      return { Columns: cols, Rows: rows };
    } catch (error) {
      console.error('Error generating JSON data for PDF:', error);
      return null;
    }
  }

  private getHTMLTable(tableID: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const tableElement = this.document.getElementById(tableID);
    if (!tableElement) {
      console.error(`Table with ID '${tableID}' not found for Word export.`);
      return null;
    }

    try {
      const css: string =
        '<style>' +
        '@page WordSection1{size: 841.95pt 595.35pt;mso-page-orientation: landscape}' +
        'div.WordSection1 {page: WordSection1;}' +
        'table{border-collapse:collapse;font-family:Trebuchet MS;}' +
        'td{padding: 5px;border: 1px solid #AAAAAA}' +
        'th{background-color: #006699;color: #ffffff;padding: 5px;border: 1px solid #AAAAAA;}' +
        '</style>';

      let html: string = css + '<div class="WordSection1"><table><tr>';

      // Add header row for Word
      const headerRowElements =
        tableElement.querySelectorAll('thead > tr > th');
      headerRowElements.forEach((th) => {
        const anchor = th.querySelector('a');
        const headerText = anchor
          ? anchor.textContent?.trim() || ''
          : th.textContent?.trim() || '';
        html += `<th>${this.escapeXml(headerText)}</th>`; // Escape header text
      });
      html += '</tr>';

      // Add body rows for Word
      const bodyRowElements = tableElement.querySelectorAll('tbody > tr');
      bodyRowElements.forEach((tr) => {
        html += '<tr>';
        const cellElements = tr.querySelectorAll('td');

        cellElements.forEach((td) => {
          html += '<td>';
          this.cellText = '';
          this.getDeepText(td); // Pass native element
          html += this.escapeXml(this.cellText.trim()); // Escape cell text
          html += '</td>';
        });
        html += '</tr>';
      });

      html += '</table></div>';
      return html;
    } catch (error) {
      console.error('Error generating HTML for Word export:', error);
      return null;
    }
  }
}

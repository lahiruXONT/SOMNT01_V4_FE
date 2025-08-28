import { Component, Input, inject, AfterViewInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

declare var $: any;
declare var jsPDF: any;

@Component({
  selector: 'xont-ventura-gridexport',
  standalone: true,
  template: `
    <span class="Linkboldtext">{{ gridName }}&nbsp;&nbsp;</span>
    <button
      title="Excel"
      class="btn btn-xs"
      style="color: white; background-color: #20744b; padding: 0px 4px; font-size: 14px;"
      (click)="btnExcelExport_OnClick(gridId, gridName)"
    >
      <i class="fa fa-file-excel-o" aria-hidden="true"></i>
    </button>
    <button
      title="PDF"
      class="btn btn-xs"
      style="color: white; background-color: #bb0706; padding: 0px 4px; font-size: 14px;"
      (click)="btnPDFExport_OnClick(gridId, gridName)"
    >
      <i class="fa fa-file-pdf-o" aria-hidden="true"></i>
    </button>
    <button
      title="Word"
      class="btn btn-xs"
      style="color: white; background-color: #2d5fa2; padding: 0px 4px; font-size: 14px;"
      (click)="btnWordExport_OnClick(gridId, gridName)"
    >
      <i class="fa fa-file-word-o" aria-hidden="true"></i>
    </button>
  `,
})
export class XontVenturaGridExportComponent implements AfterViewInit {
  @Input() id!: string;
  @Input() gridName!: string;
  @Input() gridId!: string;

  private document = inject(DOCUMENT);
  private cellText: string = '';

  ngAfterViewInit() {
    // Initialization logic if needed
  }

  btnExcelExport_OnClick(tableID: string, tableName: string): void {
    const xml = this.htmlTableToXML(tableID.trim(), tableName.trim());

    if (this.isIE()) {
      if ((window.navigator as any).msSaveBlob) {
        const blob = new Blob([xml], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        (window.navigator as any).msSaveBlob(blob, `${tableName}.xls`);
      }
    } else {
      const uri = `data:application/vnd.ms-excel,${encodeURIComponent(xml)}`;
      this.downloadFile(uri, `${tableName}.xls`);
    }
  }

  private emitXmlHeader(tableName: string): string {
    return `<?xml version="1.0"?>
<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <ss:Styles>
    <ss:Style ss:ID="columnheaders">
      <ss:Font ss:Bold="1" />
    </ss:Style>
  </ss:Styles>
  <ss:Worksheet ss:Name="${tableName}">
    <ss:Table>
`;
  }

  private emitXmlFooter(): string {
    return `</ss:Table>
  </ss:Worksheet>
</ss:Workbook>`;
  }

  private isIE(): boolean {
    const ua = window.navigator.userAgent;
    return (
      ua.includes('MSIE ') || ua.includes('Trident/') || ua.includes('Edge/')
    );
  }

  private htmlTableToXML(tableID: string, tableName: string): string {
    const headerRow = $(`#${tableID} > thead > tr > th`);
    let xml = this.emitXmlHeader(tableName);

    // Set column widths
    for (let i = 0; i < headerRow.length; i++) {
      const width = $(headerRow[i]).width();
      xml +=
        width !== -1
          ? `<ss:Column ss:AutoFitWidth="0" ss:Width="${width}"/>\n`
          : `<ss:Column ss:AutoFitWidth="0" />\n`;
    }

    // Write column headers
    xml += '<ss:Row>\n';
    for (let i = 0; i < headerRow.length; i++) {
      const anchorTags = headerRow[i].getElementsByTagName('a');
      const headerText =
        anchorTags.length > 0
          ? anchorTags[0].textContent?.toString().trim() || ''
          : headerRow[i].textContent?.toString().trim() || '';

      xml += `  <ss:Cell ss:StyleID="columnheaders">
    <ss:Data ss:Type="String">${headerText}</ss:Data>
  </ss:Cell>\n`;
    }
    xml += '</ss:Row>\n';

    // Write table body
    const bodyRows = $(`#${tableID} > tbody > tr`);
    for (let i = 0; i < bodyRows.length; i++) {
      xml += '<ss:Row>\n';
      const cellList = bodyRows[i].getElementsByTagName('td');

      for (let j = 0; j < cellList.length; j++) {
        this.cellText = '';
        this.getDeepText($(cellList[j]));

        const cellValue = this.cellText.trim();
        const dataType =
          cellValue && !isNaN(cellValue as any) ? 'Number' : 'String';

        xml += `  <ss:Cell>
    <ss:Data ss:Type="${dataType}">${cellValue}</ss:Data>
  </ss:Cell>\n`;
      }
      xml += '</ss:Row>\n';
    }

    xml += this.emitXmlFooter();
    return xml;
  }

  private getDeepText(DOMObject: any): void {
    const element = DOMObject[0];

    if (element.nodeName === 'SELECT') {
      const selectedIndex = element.selectedIndex;
      this.cellText +=
        element.options[selectedIndex]?.text?.toString().trim() || '';
    } else if (element.children.length > 0) {
      for (let i = 0; i < element.children.length; i++) {
        this.getDeepText($(element.children[i]));
      }
    } else {
      if (element.nodeName === 'INPUT') {
        switch (element.type) {
          case 'radio':
            this.cellText += element.checked ? 'Selected' : 'Unselected';
            break;
          case 'checkbox':
            this.cellText += element.checked ? 'Checked' : 'Unchecked';
            break;
          default:
            this.cellText += element.value?.toString().trim() || '';
        }
      } else {
        this.cellText += element.innerText?.toString().trim() || '';
      }
    }
  }

  btnPDFExport_OnClick(tableID: string, tableName: string): void {
    const doc = new jsPDF('p', 'pt', 'a4');
    const options = {
      theme: 'grid',
      styles: { overflow: 'linebreak', fontSize: 8, lineColor: '#AAAAAA' },
      headerStyles: { fillColor: '#006699' },
    };

    const data = this.getJSONColumnRows(tableID);
    (doc as any).autoTable(data.Columns, data.Rows, options);
    doc.save(`${tableName}.pdf`);
  }

  private getJSONColumnRows(tableID: string): { Columns: any[]; Rows: any[] } {
    const headerRow = $(`#${tableID} > thead > tr > th`);
    const cols: any[] = [];
    const rows: any[] = [];
    const columnList: string[] = [];

    // Process headers
    for (let i = 0; i < headerRow.length; i++) {
      const anchorTags = headerRow[i].getElementsByTagName('a');
      const headerText =
        anchorTags.length > 0
          ? anchorTags[0].textContent?.toString().trim() || ''
          : headerRow[i].textContent?.toString().trim() || '';

      const columnKey = `col${i}`;
      cols.push({ title: headerText, dataKey: columnKey });
      columnList.push(columnKey);
    }

    // Process rows
    const bodyRows = $(`#${tableID} > tbody > tr`);
    for (let i = 0; i < bodyRows.length; i++) {
      const cellList = bodyRows[i].getElementsByTagName('td');
      const row: any = {};

      for (let j = 0; j < cellList.length; j++) {
        this.cellText = '';
        this.getDeepText($(cellList[j]));
        row[columnList[j]] = this.cellText.trim();
      }

      rows.push(row);
    }

    return { Columns: cols, Rows: rows };
  }

  btnWordExport_OnClick(tableID: string, tableName: string): void {
    const htmlContent = this.getHTMLTable(tableID);
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword',
    });

    if (this.isIE()) {
      if ((window.navigator as any).msSaveBlob) {
        (window.navigator as any).msSaveOrOpenBlob(blob, `${tableName}.doc`);
      }
    } else {
      const url = URL.createObjectURL(blob);
      this.downloadFile(url, `${tableName}.doc`);
    }
  }

  private getHTMLTable(tableID: string): string {
    const css = `<style>
      @page WordSection1{size: 841.95pt 595.35pt;mso-page-orientation: landscape}
      div.WordSection1 {page: WordSection1;}
      table{border-collapse:collapse;font-family:Trebuchet MS;}
      td{padding: 5px;border: 1px solid #AAAAAA}
      th{background-color: #006699;color: #ffffff;padding: 5px;border: 1px solid #AAAAAA;}
    </style>`;

    const headerRow = $(`#${tableID} > thead > tr > th`);
    let html = `${css}<div class="WordSection1"><table><tr>`;

    // Process headers
    for (let i = 0; i < headerRow.length; i++) {
      const anchorTags = headerRow[i].getElementsByTagName('a');
      const headerText =
        anchorTags.length > 0
          ? anchorTags[0].textContent?.toString().trim() || ''
          : headerRow[i].textContent?.toString().trim() || '';

      html += `<th>${headerText}</th>`;
    }
    html += '</tr>';

    // Process rows
    const bodyRows = $(`#${tableID} > tbody > tr`);
    for (let i = 0; i < bodyRows.length; i++) {
      html += '<tr>';
      const cellList = bodyRows[i].getElementsByTagName('td');

      for (let j = 0; j < cellList.length; j++) {
        this.cellText = '';
        this.getDeepText($(cellList[j]));
        html += `<td>${this.cellText.trim()}</td>`;
      }
      html += '</tr>';
    }

    html += '</table></div>';
    return html;
  }

  private downloadFile(uri: string, fileName: string): void {
    const downloadLink = this.document.createElement('a');
    downloadLink.href = uri;
    downloadLink.download = fileName;
    this.document.body.appendChild(downloadLink);
    downloadLink.click();
    this.document.body.removeChild(downloadLink);
  }
}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PDFFileService {
  private file: File | null = null;
  private _imgFile: File | null = null;

  get imgFile(): File | null { return this._imgFile; }
  set imgFile(value: File) { this._imgFile = value; }

  setFile(file: File) {
    this.file = file;
  }

  getFile(): File | null {
    return this.file;
  }
}

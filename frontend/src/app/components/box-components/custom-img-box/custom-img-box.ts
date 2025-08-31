import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlockObject } from '../../../models/box-models/BlockObject';
import { ImgBox } from '../../../models/box-models/ImgBox';

@Component({
  selector: 'app-custom-img-box',
  imports: [CommonModule],
  templateUrl: './custom-img-box.html',
  styleUrl: './custom-img-box.css'
})
export class CustomImgBox {

  @Input() set imgBox(value: ImgBox) {
    this._imgBox = value;
  }

  public _imgBox: any;
  @Output() positionChangedBox = new EventEmitter<{ top: number; left: number, clickedPageNum: number }>();
  @Output() baseBoxEmitter = new EventEmitter<BlockObject>();

  constructor() {
  }

  ngOnInit(): void {
    console.log(this._imgBox)
    console.log("Child OnInit")
  }
}

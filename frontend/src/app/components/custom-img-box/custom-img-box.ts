import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ImgBox } from '../../models/ImgBox';
import { CommonModule } from '@angular/common';
import { BlockObject } from '../../models/BlockObject';

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

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alert, AlertService } from './alert-service';


@Component({
  selector: 'app-alert',
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.css'
})
export class AlertComponent implements OnInit {
  //=================================================== variables =================================================

  message = '';
  alertTitle = '';
  type: 'success' | 'error' | 'warning' | 'info' = 'info';
  visible = false;
  position: { top: number; left: number } | null = null;

  constructor(private alertService: AlertService) {}

  //=======================================================================================================================
  // This is function is called onInit of this component. It subscribes to alert$ callable from the AlertService.
  // Whenever an Alert is fired this object is instantiated using the current alert messages.
	//=======================================================================================================================
  ngOnInit(): void {
    this.alertService.alert$.subscribe((alert: Alert) => {
      this.message = alert.message;
      this.alertTitle = alert.alertTitle;
      this.type = alert.type;
      this.visible = true;

      if (alert.dismissAfter) {
        setTimeout(() => (this.visible = false), alert.dismissAfter);
      }
    });
  }
}

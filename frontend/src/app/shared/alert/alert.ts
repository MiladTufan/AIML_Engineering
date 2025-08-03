import { Component, OnInit } from '@angular/core';
import { Alert, AlertService } from '../../services/alert-service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-alert',
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.css'
})
export class AlertComponent implements OnInit {
  message = '';
  alertTitle = '';
  type: 'success' | 'error' | 'warning' | 'info' = 'info';
  visible = false;
  position: { top: number; left: number } | null = null;

  constructor(private alertService: AlertService) {}

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

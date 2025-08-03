import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Alert {
	message: string;
	alertTitle: string,
	type: 'success' | 'error' | 'warning' | 'info';
	dismissAfter?: number;
	position?: { top: number; left: number };
}

@Injectable({
	providedIn: 'root'
})
export class AlertService {

	private alertSubject = new Subject<Alert>();
	alert$ = this.alertSubject.asObservable();

	show(alert: Alert) {
		this.alertSubject.next(alert);
	}

	createAlert(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, dismiss: number) {
		this.show({
			message: message,
			alertTitle: title,
			type: type,
			dismissAfter: 3000
		});
	}
}

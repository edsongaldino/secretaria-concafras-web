import { Injectable } from '@angular/core';
import {
  HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HTTP_INTERCEPTORS
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';

@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {
  constructor(private notify: NotificationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        const payload: any = err.error ?? {};
        const title = payload?.title || payload?.message || 'Erro na solicitação.';
        const details = payload?.errors
          ? Object.values(payload.errors as Record<string, string[]>).flat().join('\n')
          : undefined;

        this.notify.errorCenter(title, details ?? '');
        return throwError(() => err);
      })
    );
  }
}

export const ApiErrorInterceptorProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: ApiErrorInterceptor,
  multi: true
};

// src/app/core/interceptors/api-prefix.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class ApiPrefixInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (/^https?:\/\//i.test(req.url)) return next.handle(req);
    if (req.url.startsWith('assets/') || req.url.startsWith('/assets/')) return next.handle(req);

    const url = req.url.startsWith('/api')
      ? `${environment.apiUrl.replace(/\/+$/,'')}${req.url}`
      : req.url;

    return next.handle(req.clone({ url }));
  }
}

export const ApiPrefixInterceptorProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: ApiPrefixInterceptor,
  multi: true
};

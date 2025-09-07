import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiPrefixInterceptor: HttpInterceptorFn = (req, next) => {
  // Se já for URL absoluta (http/https), não mexe
  if (/^https?:\/\//i.test(req.url)) {
    return next(req);
  }

  // Se começar com /api -> prefixa com apiUrl
  const url = req.url.startsWith('/api')
    ? `${environment.apiUrl}${req.url}`
    : req.url;

  return next(req.clone({ url }));
};

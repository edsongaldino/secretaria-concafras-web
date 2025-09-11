// app.config.ts
import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { appRoutes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { provideNgxMask } from 'ngx-mask';
import { ApiErrorInterceptorProvider } from './core/interceptors/api-error.interceptor';
import { ApiPrefixInterceptorProvider } from './core/interceptors/api-prefix.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()   // <- ESSENCIAL para pegar os class-based
    ),
    provideRouter(appRoutes),
    provideClientHydration(withEventReplay()),
    provideNgxMask(),
    importProvidersFrom(MatIconModule),

    // Registre ambos como HTTP_INTERCEPTORS
    ApiPrefixInterceptorProvider,
    ApiErrorInterceptorProvider,
  ]
};

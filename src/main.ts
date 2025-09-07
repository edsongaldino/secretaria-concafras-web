// main.ts
import 'zone.js'; // tem que ser a PRIMEIRA importação

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { apiPrefixInterceptor } from './app/core/interceptors/api-prefix.interceptor';

// Se você usa rotas:
import { provideRouter } from '@angular/router';
import { appRoutes } from './app/app.routes';
import { provideNgxMask } from 'ngx-mask';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([apiPrefixInterceptor])),
    provideRouter(appRoutes), // remova se você NÃO usa rotas
    provideNgxMask({                                        // <<<
      validation: true,
      dropSpecialCharacters: true, // ex.: CPF sai “apenas dígitos”
      // você pode colocar outras opções aqui
    }),
  ]
});

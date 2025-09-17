// main.ts
import 'zone.js'; // tem que ser a PRIMEIRA importação

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';

import { provideHttpClient, withFetch } from '@angular/common/http';

// Se você usa rotas:
import { LOCALE_ID, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app/app.routes';
import { provideNgxMask } from 'ngx-mask';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt, 'pt-BR');

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter(appRoutes), // remova se você NÃO usa rotas
    provideNgxMask({                                        // <<<
      validation: true,
      dropSpecialCharacters: true, // ex.: CPF sai “apenas dígitos”
      // você pode colocar outras opções aqui
    }),
    provideEchartsCore({ echarts }),
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ]
});

import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/portal/home', pathMatch: 'full' },
  {
    path: 'portal',
    loadChildren: () =>
      import('./features/portal/portal.routes').then(m => m.PORTAL_ROUTES)
  },
  { path: 'secretaria', 
    loadChildren: () => 
      import('./features/secretaria/secretaria.routes').then(m => m.SECRETARIA_ROUTES) 
  }
];
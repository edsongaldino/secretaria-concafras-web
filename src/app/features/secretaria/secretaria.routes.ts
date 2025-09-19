import { Routes } from '@angular/router';
import { Login } from './login/login';
import { UsuariosLista } from './usuarios/lista/lista';
import { AuthGuard } from '../../guards/auth-guard';
import { EventoListComponent } from './eventos/evento-list/evento-list';

export const SECRETARIA_ROUTES: Routes = [
    {
    path: '',
    loadComponent: () => import('./layout/layout')
      .then(m => m.Layout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard')
          .then(m => m.Dashboard)
      },
      {
        path: 'eventos',
        loadComponent: () => import('./eventos/evento-list/evento-list')
          .then(m => m.EventoListComponent)
      },
      // outras páginas...
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  }
];
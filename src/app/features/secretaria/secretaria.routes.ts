import { Routes } from '@angular/router';
import { Login } from './login/login';
import { UsuariosLista } from './usuarios/lista/lista';
import { AuthGuard } from '../../guards/auth-guard';
import { EventoListComponent } from './eventos/evento-list/evento-list';
import { DashBoardComponent } from './dashboard/dashboard.component';

export const SECRETARIA_ROUTES: Routes = [
    {
    path: '',
    loadComponent: () => import('./layout/secretaria.component')
      .then(m => m.SecretariaComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component')
          .then(m => m.DashBoardComponent)
      },
      // outras páginas...
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  }
];
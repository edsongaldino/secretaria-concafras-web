import { Routes, CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';

const adminGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  //&& auth.hasAnyPerfil(['Gestor','Secretaria','Coordenador'])
  return auth.isAuthenticated();
};

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canMatch: [adminGuard],
    loadComponent: () => import('./layout/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'eventos', loadComponent: () => import('./pages/eventos/list.component').then(m => m.ListComponent) },
      { path: 'inscricoes', loadComponent: () => import('./pages/inscricoes/list.component').then(m => m.ListComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  }
];

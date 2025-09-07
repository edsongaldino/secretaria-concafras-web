import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Home } from './features/home/home';
import { AuthGuard } from './guards/auth-guard';
import { UsuariosLista } from './features/usuarios/lista/lista';
import { InscricaoForm } from './features/inscricao/inscricao-form/inscricao-form';
import { EventoListComponent } from './features/eventos/evento-list/evento-list';
import { EventoFormComponent } from './features/eventos/evento-form/evento-form';
import { RenderMode } from '@angular/ssr';
import { InscricaoList } from './features/inscricao/inscricao-list/inscricao-list';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'home', component: Home, canActivate: [AuthGuard] },
  { path: 'usuarios', component: UsuariosLista, canActivate: [AuthGuard] },

  { path: 'inscricao/:eventoId', component: InscricaoForm, data: { renderMode: RenderMode.Client } },
  { path: 'eventos', component: EventoListComponent, canActivate: [AuthGuard] },
  { path: 'eventos/novo', component: EventoFormComponent, data: { renderMode: RenderMode.Client } },
  { path: 'eventos/editar/:id', component: EventoFormComponent, data: { renderMode: RenderMode.Client } },
  { path: 'eventos/:eventoId/inscricoes/:participanteId',component: InscricaoList},
  { path: 'eventos/:eventoId/inscricao/nova/:responsavelId',component: InscricaoForm}
];
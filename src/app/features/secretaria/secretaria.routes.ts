import { Routes } from '@angular/router';
import { Login } from './login/login';
import { UsuariosLista } from './usuarios/lista/lista';
import { AuthGuard } from '../../guards/auth-guard';
import { EventoListComponent } from './eventos/evento-list/evento-list';

export const SECRETARIA_ROUTES: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'usuarios', component: UsuariosLista, canActivate: [AuthGuard] },
    { path: 'eventos', component: EventoListComponent, canActivate: [AuthGuard] }
];
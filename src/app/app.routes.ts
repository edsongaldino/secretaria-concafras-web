import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Home } from './features/home/home';
import { AuthGuard } from './guards/auth-guard';
import { UsuariosLista } from './features/usuarios/lista/lista';
import { InscricaoForm } from './features/inscricao/inscricao-form/inscricao-form';
import { EventoListComponent } from './features/eventos/evento-list/evento-list';
import { EventoFormComponent } from './features/eventos/evento-form/evento-form';
import { InscricaoList } from './features/inscricao/inscricao-list/inscricao-list';
import { PagamentoRetornoComponent } from './features/inscricao/inscricao-retorno-pagamento/inscricao-retorno-pagamento';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'home', component: Home, canActivate: [AuthGuard] },
  { path: 'usuarios', component: UsuariosLista, canActivate: [AuthGuard] },

  { path: 'inscricao/:eventoId', component: InscricaoForm },
  { path: 'eventos', component: EventoListComponent, canActivate: [AuthGuard] },
  { path: 'eventos/novo', component: EventoFormComponent },
  { path: 'eventos/editar/:id', component: EventoFormComponent },
  { path: 'eventos/:eventoId/inscricoes/:participanteId', component: InscricaoList },
  { path: 'eventos/:eventoId/inscricao/nova/:responsavelId', component: InscricaoForm },
  { path: 'pagamento/sucesso',  component: PagamentoRetornoComponent },
  { path: 'pagamento/pendente', component: PagamentoRetornoComponent },
  { path: 'pagamento/erro',     component: PagamentoRetornoComponent },
  { path: 'inscricoes/editar/:inscricaoId', component: InscricaoForm }
];

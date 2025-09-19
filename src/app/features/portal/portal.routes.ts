import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth-guard';
import { Home } from './home/home';
import { InscricaoForm } from './inscricao/inscricao-form/inscricao-form';
import { InscricaoList } from './inscricao/inscricao-list/inscricao-list';
import { PagamentoRetornoComponent } from './inscricao/inscricao-retorno-pagamento/inscricao-retorno-pagamento';

export const PORTAL_ROUTES: Routes = [
  { path: 'home', component: Home },
  { path: 'inscricao/:eventoId', component: InscricaoForm },
  { path: 'eventos/:eventoId/inscricoes/:participanteId', component: InscricaoList },
  { path: 'eventos/:eventoId/inscricao/nova/:responsavelId', component: InscricaoForm },
  { path: 'pagamento/sucesso',  component: PagamentoRetornoComponent },
  { path: 'pagamento/pendente', component: PagamentoRetornoComponent },
  { path: 'pagamento/erro',     component: PagamentoRetornoComponent },
  { path: 'inscricoes/editar/:inscricaoId', component: InscricaoForm },
];
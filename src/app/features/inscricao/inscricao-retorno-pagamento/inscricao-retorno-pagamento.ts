import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, switchMap, take, filter } from 'rxjs';
import { PagamentoService } from '../../../core/services/pagamentos.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-pagamento-retorno',
  standalone: true, // <-- indispensável em apps sem NgModule
  template: `
  <div class="p-6 text-center">
    <h2 class="mb-2">Processando pagamento…</h2>
    <p>{{mensagem}}</p>
  </div>`
})
export class PagamentoRetornoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pagamentos = inject(PagamentoService);
  private notify = inject(NotificationService);

  mensagem = 'Aguarde enquanto atualizamos seu status.';

  ngOnInit(): void {
    const pid = this.route.snapshot.queryParamMap.get('pid');
    const url = this.router.url;
    if (url.includes('/sucesso'))  this.mensagem = 'Pagamento aprovado no provedor. Finalizando...';
    if (url.includes('/pendente')) this.mensagem = 'Pagamento em análise. Isso pode levar alguns instantes.';
    if (url.includes('/erro'))     this.mensagem = 'Pagamento não aprovado. Verificando status...';

    if (!pid) { this.router.navigate(['/inscricoes']); return; }

    interval(3000).pipe(
      take(10),
      switchMap(() => this.pagamentos.obterStatus(pid)),
      filter(res => ['Pago','Falhou','Cancelado','Expirado','Estornado','Chargeback'].includes(res.status))
    ).subscribe({
      next: res => {
        this.notify.successCenter('Status: ' + res.status, '');
        this.router.navigate(['/inscricoes']);
      },
      error: _ => this.router.navigate(['/inscricoes'])
    });
  }
}
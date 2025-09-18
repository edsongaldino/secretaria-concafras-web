import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InscricaoService } from '../../../../core/services/inscricao.service';
import { MaterialModule } from '../../../../shared/material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { ListaInscricoesDto } from '../../../../core/models/inscricao.model';
import { EventoService } from '../../../../core/services/evento.service';
import { PagamentoService, CheckoutGrupoPayload } from '../../../../core/services/pagamentos.service';
import { Evento } from '../../../../core/models/evento.model';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { HeaderComponent } from '../../header/header';

@Component({
  selector: 'app-inscricao-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, HeaderComponent],
  templateUrl: './inscricao-list.html',
  styleUrls: ['./inscricao-list.scss']
})
export class InscricaoList implements OnInit {

  private route = inject(ActivatedRoute);

  displayedColumns: string[] = [
    'dataInscricao',
    'participanteNome',
    'participanteDataNascimento',
    'participanteIdade',
    'valorInscricao',
    'status',
    'acoes'
  ];

  dataSource = new MatTableDataSource<ListaInscricoesDto>();

  eventoId!: string;
  participanteId!: string;

  // responsável vindo da rota (participante)
  private responsavelParticipanteId!: string;

  // usado para lógica local (ex.: saber se removeu a inscrição do responsável)
  private responsavelInscricaoId: string = '';

  evento?: Evento;
  loadingPagar = false;
  private removidos = new Set<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private inscricaoService: InscricaoService,
    private router: Router,
    private eventoService: EventoService,
    private pagamentoService: PagamentoService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.eventoId = this.route.snapshot.paramMap.get('eventoId')!;
    this.participanteId = this.route.snapshot.paramMap.get('participanteId')!;

    // param "responsavelId" na rota segue sendo PARTICIPANTE (legado)
    const respParam = this.route.snapshot.paramMap.get('responsavelId');
    this.responsavelParticipanteId = respParam ?? this.participanteId;

    this.carregarInscricoes();
  }

  carregarInscricoes(): void {
    this.inscricaoService.getInscricoes(this.eventoId, this.participanteId).subscribe({
      next: (data: ListaInscricoesDto[]) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;

        // encontra a INSCRIÇÃO do participante-responsável (apenas para lógica local)
        const respInsc = data.find(i => i.participanteId === this.responsavelParticipanteId);
        this.responsavelInscricaoId = this.getInscricaoId(respInsc ?? {}) || '';

        // fallback: se não achar, define o primeiro da lista como responsável
        if (!this.responsavelInscricaoId && data.length > 0) {
          this.reatribuirResponsavelPara(data[0]);
        }
      },
      error: err => console.error(err)
    });

    this.eventoService.obterPorId(this.eventoId).subscribe({
      next: ev => this.evento = ev,
      error: err => console.error('Erro ao carregar evento', err)
    });
  }

  incluirInscricao() {
    // criação usa PARTICIPANTE responsável
    const respParticipanteId = this.responsavelParticipanteId ?? this.participanteId;
    this.router.navigate(['/eventos', this.eventoId, 'inscricao', 'nova', respParticipanteId]);
  }

  get bannerStyle(): string {
    const fallback = '/img/banner-inscricao.jpg';
    const raw = (this.evento?.bannerUrl || '').trim();
    if (!raw) return `url('${fallback}')`;
    const safe = raw.replace(/'/g, "\\'");
    return `url('${safe}'), url('${fallback}')`;
  }

  finalizarInscricao() {
    if (this.loadingPagar) return;

    // garantir que há responsável válido na lista atual (por segurança)
    if (!this.responsavelInscricaoId || !this.existeInscricaoPorId(this.responsavelInscricaoId)) {
      const primeira = this.dataSource.data[0];
      if (!primeira) {
        this.notify.errorCenter('Sem inscrições', 'Não há inscrições para finalizar.');
        return;
      }
      this.reatribuirResponsavelPara(primeira);
    }

    this.loadingPagar = true;

    const payload: CheckoutGrupoPayload = {
      eventoId: this.eventoId,
      // ✅ agora enviamos o PARTICIPANTE do responsável (bate com FK no banco)
      responsavelFinanceiroId: this.responsavelParticipanteId,
      excluirInscricaoIds: Array.from(this.removidos)
    };

    // DEBUG: veja na aba Network → Payload se está indo certinho
    console.log('Checkout payload ->', payload);

    this.pagamentoService.criarCheckoutGrupo(payload)
      .pipe(finalize(() => (this.loadingPagar = false)))
      .subscribe({
        next: res => {
          if (res.checkoutUrl) {
            window.location.href = res.checkoutUrl;
          } else {
            this.notify.errorCenter('Sem inscrições elegíveis', res.mensagem ?? '');
          }
        },
        error: _ => { /* interceptor já trata */ }
      });
  }

  // ===== helpers =====

  private getInscricaoId(i: Partial<ListaInscricoesDto>): string {
    return (i as any)?.inscricaoId ?? (i as any)?.id ?? '';
  }

  private existeInscricaoPorId(inscricaoId: string): boolean {
    return this.dataSource.data.some(i => this.getInscricaoId(i) === inscricaoId);
  }

  private reatribuirResponsavelPara(item: ListaInscricoesDto) {
    // ajusta ambos: para telas (participante) e para lógica local (inscrição)
    this.responsavelInscricaoId = this.getInscricaoId(item);
    this.responsavelParticipanteId = item.participanteId;
  }

  editar(item: ListaInscricoesDto) {
    const id = (item as any).inscricaoId ?? (item as any).id;
    if (!id) {
      this.notify.errorCenter('Erro', 'ID da inscrição não encontrado.');
      return;
    }

    // rota sem eventoId
    this.router.navigate(['/inscricoes', 'editar', id]);
  }

  // Remoção local com reatribuição automática se remover o responsável
  async removerLocal(item: ListaInscricoesDto) {
    if (this.dataSource.data.length <= 1) {
      this.notify.errorCenter('Ação não permitida', 'Não é possível remover a única inscrição do grupo.');
      return;
    }

    const ok = await this.notify.confirm('Tem certeza?', `Deseja remover a inscrição de ${item.participanteNome}?`);
    if (!ok) return;

    const id = this.getInscricaoId(item);
    if (!id) return;

    const removendoResponsavel = (id === this.responsavelInscricaoId);

    // remove da tabela
    const restante = this.dataSource.data.filter(i => this.getInscricaoId(i) !== id);
    this.dataSource.data = restante;
    (this.dataSource as any)._updateChangeSubscription?.();
    this.paginator?.firstPage();

    // marca para exclusão no checkout
    this.removidos.add(id);

    // se removeu o responsável, escolher o primeiro restante como novo responsável
    if (removendoResponsavel && restante.length > 0) {
      const novo = restante[0];
      this.reatribuirResponsavelPara(novo);
      this.notify.successCenter('Responsável atualizado', `Novo responsável: ${novo.participanteNome}.`);
    }

    this.notify.successCenter('Removido!', 'A inscrição foi removida da lista.');
  }
}

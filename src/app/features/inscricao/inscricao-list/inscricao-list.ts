import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InscricaoService } from '../../../core/services/inscricao.service';
import { MaterialModule } from '../../../shared/material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { ListaInscricoesDto } from '../../../core/models/inscricao.model';
import { EventoService } from '../../../core/services/evento.service';
import { PagamentoService } from '../../../core/services/pagamentos.service';
import { Evento } from '../../../core/models/evento.model';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-inscricao-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatPaginator],
  templateUrl: './inscricao-list.html',
  styleUrls: ['./inscricao-list.scss']
})
export class InscricaoList implements OnInit {

  private route = inject(ActivatedRoute);
  displayedColumns: string[] = ['nome', 'cpf', 'email', 'dataInscricao', 'status',];
  dataSource = new MatTableDataSource<ListaInscricoesDto>();
  eventoId!: string;
  responsavelId!: string;
  participanteId!: string;
  evento?: Evento;
  loadingPagar = false;

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
    this.responsavelId = this.route.snapshot.paramMap.get('responsavelId') ?? this.participanteId;
    this.carregarInscricoes();
  }

  carregarInscricoes(): void {
    
    this.inscricaoService.getInscricoes(this.eventoId, this.participanteId).subscribe({
      next: (data: ListaInscricoesDto[]) => {
        console.log(data);
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      },
      error: err => console.error(err)
    });

    this.eventoService.obterPorId(this.eventoId).subscribe({
      next: ev => this.evento = ev,
      error: err => console.error('Erro ao carregar evento', err)
    });

  }

  incluirInscricao() {
    const respId = this.responsavelId ?? this.participanteId;
    this.router.navigate([
      '/eventos',
      this.eventoId,
      'inscricao',
      'nova',
      respId
    ]);
  }

  get bannerStyle(): string {
    const fallback = '/img/banner-inscricao.jpg'; // <- barra no começo!
    const raw = (this.evento?.bannerUrl || '').trim();
    if (!raw) return `url('${fallback}')`;
    const safe = raw.replace(/'/g, "\\'");
    // tenta o banner do evento; se falhar o download, o fallback aparece
    return `url('${safe}'), url('${fallback}')`;
  }

  finalizarInscricao() {
    if (this.loadingPagar) return;
    this.loadingPagar = true;

    this.pagamentoService.criarCheckoutGrupo(this.eventoId, this.responsavelId)
      .pipe(finalize(() => (this.loadingPagar = false)))
      .subscribe({
        next: res => {
          if (res.checkoutUrl) {
            // abre o checkout
            window.location.href = res.checkoutUrl;
          } else {
            // nenhum item elegível
            this.notify.errorCenter('Sem inscrições elegíveis', res.mensagem ?? '');
          }
        },
        error: _ => {
          // seus erros já são tratados pelo ApiErrorInterceptor;
          // aqui, no máximo, você pode reabilitar o botão
        }
      });
  }

  
}

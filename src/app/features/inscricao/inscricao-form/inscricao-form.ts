import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { catchError, forkJoin, of, firstValueFrom } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap, tap } from 'rxjs/operators';

import { MaterialModule } from '../../../shared/material.module';
import { EnderecoComponent } from '../../../shared/components/endereco/endereco';
import { SharedModule } from '../../../shared/shared.module';

import { EventoService } from '../../../core/services/evento.service';
import { ParticipanteService } from '../../../core/services/participante.service';
import { InscricaoService } from '../../../core/services/inscricao.service';
import { CursoService } from '../../../core/services/curso.service';

import { Evento } from '../../../core/models/evento.model';
import { ComissaoEventoService } from '../../../core/services/comissao-evento.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NotificationService } from '../../../core/services/notification.service';

type Publico = 'Crianca' | 'Jovem' | 'Adulto';

@Component({
  selector: 'app-inscricao-form',
  standalone: true,
  templateUrl: './inscricao-form.html',
  styleUrls: ['./inscricao-form.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    EnderecoComponent,
    SharedModule
  ]
})
export class InscricaoForm implements OnInit {
  form!: FormGroup;
  evento!: Evento;
  cursosTemaAtual: any[] = [];
  cursosTemaEspecifico: any[] = [];
  comissoes: any[] = [];
  responsavelId!: string;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private eventoService: EventoService,
    private participanteService: ParticipanteService,
    private inscricaoService: InscricaoService,
    private cursoService: CursoService,
    private comissaoEventoService: ComissaoEventoService,
    private router: Router,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.inicializarForm();

    const eventoId = this.route.snapshot.paramMap.get('eventoId');
    this.responsavelId = this.route.snapshot.paramMap.get('responsavelId')!;

    if (!eventoId) {
      console.error('Parâmetro :eventoId não encontrado.');
      return;
    }

    this.form.get('publico')?.valueChanges
    .pipe(startWith(this.form.get('publico')?.value))
    .subscribe((pub: string) => this.toggleResponsavel(pub));

    // Preenche o form com o id do evento e trava edição
    this.form.patchValue({ eventoId });
    this.form.get('eventoId')?.disable();

    // Recalcula público quando o usuário altera a data de nascimento
    this.form.get('dataNascimento')?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((val: string) => this.definirPublicoPeloEvento(val));

    // Carrega evento; depois comissões e cursos em paralelo
    this.eventoService.obterPorId(eventoId)
      .pipe(
        tap((evento) => {
          this.evento = evento;

          // Se já tinha data preenchida, garante cálculo
          const dn = this.form.get('dataNascimento')?.value as string | null;
          if (dn) this.definirPublicoPeloEvento(dn);
        }),
        switchMap(() =>
          forkJoin({
            comissoes: this.comissaoEventoService.listarPorEvento(eventoId).pipe(catchError(() => of([]))),
            atuais: this.cursoService.listarPorEvento(eventoId).pipe(catchError(() => of([])))
          })
        )
      )
      .subscribe({
        next: ({ comissoes, atuais }) => {
          this.comissoes = comissoes;
          this.cursosTemaAtual = atuais;
          this.cursosTemaEspecifico = atuais; // ajuste quando tiver endpoint específico
        },
        error: (err) => console.error('Erro ao carregar dados da inscrição', err)
      });
  }

  inicializarForm(): void {
    this.form = this.fb.group({
      eventoId: ['', Validators.required],
      nome: ['', Validators.required],
      dataNascimento: ['', Validators.required],
      publico: [{ value: '', disabled: false }, Validators.required],
      cpf: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: [''],
      instituicao: [''],
      trabalhador: [false],
      neofito: [true],
      cursoTemaAtualId: [''],
      cursoTemaEspecificoId: [''],
      comissaoId: [''],
      responsavel: this.fb.group({
        nome: [''],
        cpf: [''],
        telefone: [''],
        parentesco: ['']
      }),
      endereco: this.fb.group({
        cep: ['', Validators.required],
        logradouro: [''],
        numero: [''],
        complemento: [''],
        bairro: [''],
        cidade: [''],
        estado: ['']
      })
    });
  }

  get enderecoForm(): FormGroup {
    return this.form.get('endereco') as FormGroup;
  }

  get bannerStyle(): string {
    const fallback = '/img/banner-inscricao.jpg'; // <- barra no começo!
    const raw = (this.evento?.bannerUrl || '').trim();
    if (!raw) return `url('${fallback}')`;
    const safe = raw.replace(/'/g, "\\'");
    // tenta o banner do evento; se falhar o download, o fallback aparece
    return `url('${safe}'), url('${fallback}')`;
  }



  // ================== LÓGICA DE PÚBLICO ==================

  private toLocalDate(y: number, m: number, d: number): Date {
    // cria Date sem fuso/horário (meia-noite local)
    return new Date(y, m, d);
  }

  private parseDateSafe(input: string | Date | null | undefined): Date | null {
    if (!input) return null;

    if (input instanceof Date) {
      if (isNaN(input.getTime())) return null;
      return this.toLocalDate(input.getFullYear(), input.getMonth(), input.getDate());
    }

    const raw = String(input).trim();

    // dd/MM/yyyy
    let m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    if (m) return this.toLocalDate(+m[3], +m[2] - 1, +m[1]);

    // ddMMyyyy
    m = /^(\d{2})(\d{2})(\d{4})$/.exec(raw);
    if (m) return this.toLocalDate(+m[3], +m[2] - 1, +m[1]);

    // yyyy-MM-dd
    m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (m) return this.toLocalDate(+m[1], +m[2] - 1, +m[3]);

    // yyyy-MM-ddTHH:mm:ss(Z|.xxxZ) -> usa só a parte da data, ignora fuso
    m = /^(\d{4})-(\d{2})-(\d{2})T/.exec(raw);
    if (m) return this.toLocalDate(+m[1], +m[2] - 1, +m[3]);

    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return this.toLocalDate(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private obterDataInicioEvento(): Date | null {
    if (!this.evento) return null;
    // 🔧 ajuste o nome exato do campo, se necessário
    const raw: string | Date | undefined =
      (this.evento as any).dataInicio ??
      (this.evento as any).dataInicial ??
      (this.evento as any).inicio;
    return raw ? this.parseDateSafe(raw) : null;
  }

  private idadeEmMeses(nasc: Date, base: Date): number {
    const y = base.getFullYear() - nasc.getFullYear();
    const m = base.getMonth() - nasc.getMonth();
    let meses = y * 12 + m;
    if (base.getDate() < nasc.getDate()) meses -= 1; // ainda não fez “mesversário”
    return meses;
  }

  private classificarPublico(meses: number): Publico {
    if (meses <= 143) return 'Crianca'; // até 11a11m
    if (meses <= 167) return 'Jovem';   // 12 a 13
    return 'Adulto';                     // 14+
  }

  private definirPublicoPeloEvento(dataNascStr?: string) {
    const base = this.obterDataInicioEvento();
    const nasc = this.parseDateSafe(dataNascStr ?? null);
    if (!base || !nasc) return;

    const meses = this.idadeEmMeses(nasc, base);
    const publico = this.classificarPublico(meses);
    this.form.patchValue({ publico }, { emitEvent: false });
    this.toggleResponsavel(publico);
  }

  private toggleResponsavel(pub: string) {
    const grp = this.form.get('responsavel') as FormGroup;
    const nome = grp.get('nome')!;
    const cpf = grp.get('cpf')!;
    const telefone = grp.get('telefone')!;
    const parentesco = grp.get('parentesco')!;

    const isCrianca = pub === 'Crianca';

    if (isCrianca) {
      // habilita e exige o básico
      grp.enable({ emitEvent: false });
      nome.setValidators([Validators.required]);
      cpf.setValidators([Validators.required]);
      telefone.setValidators([]); 
      parentesco.setValidators([]);
    } else {
      // limpa e desliga tudo quando NÃO for criança
      grp.reset({}, { emitEvent: false });
      grp.disable({ emitEvent: false });
      nome.clearValidators();
      cpf.clearValidators();
      telefone.clearValidators();
      parentesco.clearValidators();
    }

    nome.updateValueAndValidity({ emitEvent: false });
    cpf.updateValueAndValidity({ emitEvent: false });
    telefone.updateValueAndValidity({ emitEvent: false });
    parentesco.updateValueAndValidity({ emitEvent: false });
  }

  get isCrianca(): boolean {
    return this.form?.get('publico')?.value === 'Crianca';
  }

  // ================== SALVAR ==================

  async salvar(): Promise<void> {
    if (this.form.invalid) return;

    // eventoId está desabilitado -> use getRawValue
    const dados = this.form.getRawValue();

    try {
      const participante = await firstValueFrom(
        this.participanteService.criarOuObterPorCpf({
          nome: dados.nome,
          cpf: dados.cpf,
          email: dados.email,
          telefone: dados.telefone,
          instituicao: dados.instituicao,
          endereco: dados.endereco
        })
      );

      if (!participante?.id) {
        Swal.fire({
          icon: 'error',
          title: 'Erro ao salvar!',
          text: 'Participante não encontrado ou não pôde ser criado.',
          confirmButtonText: 'Tentar novamente'
        });
        return;
      }

      const res = await firstValueFrom(this.inscricaoService.criarInscricao({
        eventoId: dados.eventoId,
        participanteId: participante.id,
        responsavelFinanceiroId: this.responsavelId,
        cursoTemaAtualId: this.toNull(dados.cursoTemaAtualId),
        cursoTemaEspecificoId: this.toNull(dados.cursoTemaEspecificoId),
        comissaoId: this.toNull(dados.comissaoId)
      }));

      // pegue do retorno se existir (preferível); senão, use o fallback local
      const eventoId = (res as any)?.eventoId ?? dados.eventoId;
      const responsavelId =
        (res as any)?.responsavelFinanceiroId ??
        this.responsavelId ??
        participante.id;


      this.notify.successCenterRedirect(
        'Inscrição concluída!',
        'Na próxima tela você pode efetuar o pagamento ou incluir mais inscrições.',
        ['/eventos', eventoId, 'inscricoes', responsavelId]
      );

    } catch (err) {
      this.notify.errorCenter('Erro ao salvar!!', 'Não foi possível concluir sua inscrição.');
    }
  }

  private toNull<T>(v: T | '' | undefined | null): T | null {
    return v === '' || v === undefined || v === null ? null : v;
  }
}

import { Component, OnInit, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { combineLatest, forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError, distinctUntilChanged, startWith, switchMap, tap, debounceTime, filter, map } from 'rxjs/operators'; // <<< novo

import { MaterialModule } from '../../../../shared/material.module';
import { EnderecoComponent } from '../../../../shared/components/endereco/endereco';
import { SharedModule } from '../../../../shared/shared.module';

import { EventoService } from '../../../../core/services/evento.service';
import { ParticipanteService } from '../../../../core/services/participante.service';
import { InscricaoService } from '../../../../core/services/inscricao.service';
import { CursoService } from '../../../../core/services/curso.service';
import { ComissaoEventoService } from '../../../../core/services/comissao-evento.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { Evento } from '../../../../core/models/evento.model';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';
import { InscricaoExistenciaDto } from '../../../../core/models/inscricao.model';
import { HeaderComponent } from '../../header/header';

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
    SharedModule,
    HeaderComponent
  ]
})
export class InscricaoForm implements OnInit {
  form!: FormGroup;
  evento!: Evento;
  cursosTemaAtual: any[] = [];
  cursosTemaEspecifico: any[] = [];
  comissoes: any[] = [];
  responsavelId!: string;
  isLoadingCursos = false;
  inscricaoExistenteId?: string;   // <- ID da inscrição existente
  inscricaoExistente?: boolean;

  // ====== EDIÇÃO ======
  isEdit = false;
  inscricaoId?: string;
  // =====================

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private eventoService: EventoService,
    private participanteService: ParticipanteService,
    private inscricaoService: InscricaoService,
    private cursoService: CursoService,
    private comissaoEventoService: ComissaoEventoService,
    private router: Router,
    private notify: NotificationService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.inicializarForm();

    // pega parâmetros mesmo em rotas aninhadas
    const idEdicaoParam = this.getRouteParamAny('id', 'inscricaoId');

    const eventoIdFromRoute = this.getRouteParamDeep('eventoId');
    const responsavelIdFromRoute = this.getRouteParamDeep('responsavelId');

    // Fallback: se a URL tiver '/editar/', considere edição
    const url = this.router.url || '';
    const isEditarUrl = /\/editar\//i.test(url);

    // Detecta modo edição
    this.isEdit = !!idEdicaoParam || isEditarUrl;
    this.inscricaoId = idEdicaoParam ?? (isEditarUrl ? this.route.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('inscricaoId') ?? undefined : undefined);

    // Reage à mudança de público para ligar/desligar "responsável"
    this.form.get('publico')?.valueChanges
      .pipe(startWith(this.form.get('publico')?.value))
      .subscribe((pub: string) => this.toggleResponsavel(pub));

    if (this.isEdit && this.inscricaoId) {
      // MODO EDIÇÃO
      this.carregarParaEdicao(this.inscricaoId);
      return;
    }

    // ===== MODO CRIAÇÃO =====
    if (!eventoIdFromRoute) {
      console.error('Parâmetro :eventoId não encontrado (modo criação). URL:', url);
      this.notify.errorCenter('Erro', 'Evento não informado na rota.');
      return;
    }

    this.responsavelId = responsavelIdFromRoute!;

    // Preenche o form com o id do evento e trava edição
    this.form.patchValue({ eventoId: eventoIdFromRoute });
    this.form.get('eventoId')?.disable();

    // <<< novo: observar CPF e pré-preencher + checar inscrição existente
    this.setupCpfPrecheck(eventoIdFromRoute);

    // Recalcula público quando o usuário altera a data de nascimento
    this.form.get('dataNascimento')?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((val: string) => this.definirPublicoPeloEvento(val));

    // 1) Carrega o evento
    this.eventoService.obterPorId(eventoIdFromRoute)
      .pipe(
        tap((evento) => {
          this.evento = evento;
          const dn = this.form.get('dataNascimento')?.value as string | null;
          if (dn) this.definirPublicoPeloEvento(dn);
        }),
        // 2) Carrega comissões
        switchMap(() =>
          this.comissaoEventoService
            .listarPorEvento(eventoIdFromRoute)
            .pipe(catchError(() => of([])))
        )
      )
      .subscribe({
        next: (comissoes) => {
          this.comissoes = comissoes;
          // 3) Auto-refresh dos cursos
          this.setupAutoRefreshCursos();
        },
        error: (err) => console.error('Erro ao carregar dados do evento/comissões', err)
      });
  }

  /** Atualiza cursos sempre que público / neófito / trabalhador mudarem. */
  private setupAutoRefreshCursos() {
    const publico$     = this.form.get('publico')!.valueChanges.pipe(startWith(this.form.get('publico')!.value));
    const neofito$     = this.form.get('neofito')!.valueChanges.pipe(startWith(this.form.get('neofito')!.value));
    const trabalhador$ = this.form.get('trabalhador')!.valueChanges.pipe(startWith(this.form.get('trabalhador')!.value));

    combineLatest([publico$, neofito$, trabalhador$])
      .pipe(
        switchMap(([publico, neofito, trabalhador]) => {
          if (trabalhador === true) {
            this.cursosTemaAtual = [];
            this.cursosTemaEspecifico = [];
            this.form.patchValue({ cursoTemaAtualId: null, cursoTemaEspecificoId: null }, { emitEvent: false });
            return of({ atual: [], espec: [] });
          }

          if (!this.evento?.id) return of({ atual: [], espec: [] });

          this.isLoadingCursos = true;

          const filtrosBase: { publico?: string; neofito?: boolean | null } = {
            publico: publico || undefined,
            neofito: neofito ?? null   // null => não filtra
          };

          return forkJoin({
            atual: this.cursoService
              .listarPorEvento(this.evento.id, { ...filtrosBase, bloco: 'TemaAtual' })
              .pipe(catchError(() => of([]))),
            espec: this.cursoService
              .listarPorEvento(this.evento.id, { ...filtrosBase, bloco: 'TemaEspecifico' })
              .pipe(catchError(() => of([])))
          });
        }),
        tap(() => (this.isLoadingCursos = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ atual, espec }) => {
        this.cursosTemaAtual = atual;
        this.cursosTemaEspecifico = espec;
        this.ensureInOptions('cursoTemaAtualId', this.cursosTemaAtual);
        this.ensureInOptions('cursoTemaEspecificoId', this.cursosTemaEspecifico);
      });
  }

  private ensureInOptions(controlName: string, options: { id: any }[]) {
    const ctrl = this.form.get(controlName)!;
    const val = ctrl.value;
    if (!val) return;
    const exists = options.some(o => o.id === val);
    if (!exists) ctrl.patchValue(null, { emitEvent: false });
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
      neofito: [null],
      cursoTemaAtualId: [null],
      cursoTemaEspecificoId: [null],
      comissaoId: [null],
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
    const fallback = '/img/banner-inscricao.jpg';
    const raw = (this.evento?.bannerUrl || '').trim();
    if (!raw) return `url('${fallback}')`;
    const safe = raw.replace(/'/g, "\\'");
    return `url('${safe}'), url('${fallback}')`;
  }

  // ================== LÓGICA DE PÚBLICO ==================

  private toLocalDate(y: number, m: number, d: number): Date {
    return new Date(y, m, d);
  }

  private parseDateSafe(input: string | Date | null | undefined): Date | null {
    if (!input) return null;

    if (input instanceof Date) {
      if (isNaN(input.getTime())) return null;
      return this.toLocalDate(input.getFullYear(), input.getMonth(), input.getDate());
    }

    const raw = String(input).trim();

    let m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    if (m) return this.toLocalDate(+m[3], +m[2] - 1, +m[1]);

    m = /^(\d{2})(\d{2})(\d{4})$/.exec(raw);
    if (m) return this.toLocalDate(+m[3], +m[2] - 1, +m[1]);

    m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (m) return this.toLocalDate(+m[1], +m[2] - 1, +m[3]);

    m = /^(\d{4})-(\d{2})-(\d{2})T/.exec(raw);
    if (m) return this.toLocalDate(+m[1], +m[2] - 1, +m[3]);

    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return this.toLocalDate(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private obterDataInicioEvento(): Date | null {
    if (!this.evento) return null;
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
    if (base.getDate() < nasc.getDate()) meses -= 1;
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
      grp.enable({ emitEvent: false });
      nome.setValidators([Validators.required]);
      cpf.setValidators([Validators.required]);
      telefone.setValidators([]);
      parentesco.setValidators([]);
    } else {
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

  // ================== MODO EDIÇÃO ==================

  private carregarParaEdicao(id: string) {
    this.inscricaoService.getInscricaoEdit(id)
      .pipe(
        switchMap((insc: any) => {
          if (!insc) throw new Error('Inscrição não encontrada');

          // fonte da verdade no modo edição
          this.responsavelId = insc.responsavelFinanceiroId
            ?? this.getRouteParamDeep('responsavelId')
            ?? this.responsavelId;

          // eventoId fixo e readonly
          this.form.patchValue({ eventoId: insc.eventoId });
          this.form.get('eventoId')?.disable();

          return this.eventoService.obterPorId(insc.eventoId).pipe(
            tap((evento) => (this.evento = evento)),
            switchMap(() => this.comissaoEventoService.listarPorEvento(insc.eventoId)),
            tap((comissoes) => (this.comissoes = comissoes)),
            tap(() => this.setupAutoRefreshCursos()),
            switchMap(() =>
              this.participanteService.obterPorId(insc.participanteId)
                .pipe(
                  catchError(() => of(null)),
                  tap((p: any) => {
                    // Preenche dados básicos do participante
                    this.form.patchValue({
                      nome: p?.nome ?? insc.participanteNome ?? '',
                      cpf: p?.cpf ?? '',
                      email: p?.email ?? '',
                      telefone: p?.telefone ?? '',
                      instituicao: p?.instituicaoNome ?? '',
                      dataNascimento: this.toBrDateFromIso(p?.dataNascimento) ?? '',
                      endereco: {
                        cep: p?.endereco?.cep ?? '',
                        logradouro: p?.endereco?.logradouro ?? '',
                        numero: p?.endereco?.numero ?? '',
                        complemento: p?.endereco?.complemento ?? '',
                        bairro: p?.endereco?.bairro ?? '',
                        cidade: p?.endereco?.cidade ?? '',
                        estado: p?.endereco?.estado ?? ''
                      }
                    }, { emitEvent: false });
                  }),
                  tap(() => {
                    // Define tipo e cursos/comissão
                    const trabalhador = !!insc.ehTrabalhador;
                    this.form.patchValue({ trabalhador }, { emitEvent: false });

                    if (trabalhador) {
                      this.form.patchValue({ comissaoId: insc.comissaoEventoId ?? null }, { emitEvent: false });
                    } else {
                      const [temaAtual, temaEspec] = Array.isArray(insc.cursoIds) ? insc.cursoIds : [];
                      this.form.patchValue({
                        cursoTemaAtualId: temaAtual ?? null,
                        cursoTemaEspecificoId: temaEspec ?? null
                      }, { emitEvent: false });
                    }
                  }),
                  tap(() => {
                    // recalcula público se já houver data
                    const dn = this.form.get('dataNascimento')?.value as string | null;
                    if (dn) this.definirPublicoPeloEvento(dn);
                  })
                )
            )
          );
        })
      )
      .subscribe({
        next: () => { /* ok */ },
        error: (err) => {
          console.error('Erro ao carregar a inscrição para edição:', err);
          this.notify.errorCenter('Erro', 'Não foi possível carregar a inscrição para edição.');
        }
      });
  }

  // ================== SALVAR (CRIAÇÃO) ==================

  async salvar(): Promise<void> {
    if (this.form.invalid) return;

    const dados = this.form.getRawValue();

    try {
      const participante = await firstValueFrom(
        this.participanteService.criarOuObterPorCpf({
          nome: dados.nome,
          cpf: dados.cpf,
          dataNascimento: this.toDateOnly(dados.dataNascimento),
          email: dados.email,
          telefone: dados.telefone,
          instituicao: dados.instituicao,
          endereco: dados.endereco
        })
      );

      const participanteId = participante?.id ?? null;
      if (!participanteId) {
        await Swal.fire({
          icon: 'error',
          title: 'Erro ao salvar!',
          text: 'Participante sem ID retornado pela API.',
          confirmButtonText: 'Ok'
        });
        return;
      }

      const checagem = await firstValueFrom(
        this.inscricaoService.checkExiste(this.evento.id, participanteId).pipe(
          catchError(() => of({ existe: false, inscricaoId: null } as InscricaoExistenciaDto))
        )
      );

      const jaExiste = !!checagem.existe;
      if (jaExiste) {
        this.inscricaoExistenteId = checagem.inscricaoId ?? undefined;
        await Swal.fire({
          icon: 'warning',
          title: 'Já existe inscrição',
          text: 'Este CPF já possui uma inscrição para este evento. Use a inscrição existente para continuar/pagar.',
          confirmButtonText: 'Ok'
        });
        return;
      }

      if (!participante?.id) {
        await Swal.fire({
          icon: 'error',
          title: 'Erro ao salvar!',
          text: 'Participante não encontrado ou não pôde ser criado.',
          confirmButtonText: 'Ok'
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

      const eventoId = (res as any)?.eventoId ?? dados.eventoId;
      const responsavelId =
        (res as any)?.responsavelFinanceiroId ??
        this.responsavelId ??
        participante.id;

      await Swal.fire({
        icon: 'success',
        title: 'Inscrição concluída!',
        text: 'Na próxima tela você pode efetuar o pagamento ou incluir mais inscrições.',
        confirmButtonText: 'Continuar'
      });

      this.router.navigate(['/eventos', eventoId, 'inscricoes', responsavelId]);

    } catch (err: any) {
      const { icon, title, html, errorsObj } = this.extractProblem(err);

      await Swal.fire({
        icon,
        title,
        html,
        confirmButtonText: 'Ok',
        width: 520,
        allowOutsideClick: false
      });

      if (errorsObj) {
        Object.keys(errorsObj).forEach(k => {
          const ctrl = this.form.get(this.mapServerFieldToForm(k));
          if (ctrl) ctrl.setErrors({ server: (errorsObj[k] ?? []).join(' ') });
        });
      }
    }
  }

  /** Lê ProblemDetails da API e prepara conteúdo para o SweetAlert */
  private extractProblem(err: any): { icon: 'error'|'warning'; title: string; html?: string; errorsObj?: Record<string, string[]> } {
    const payload: any = err?.error ?? err ?? {};
    const status: number | undefined = payload?.status ?? err?.status;

    const icon: 'error'|'warning' = status === 409 ? 'warning' : 'error';
    const title =
      payload?.title ||
      payload?.message ||
      (status === 0 ? 'Falha de conexão.' : 'Não foi possível concluir a operação.');

    const errorsObj = payload?.errors as Record<string, string[]> | undefined;

    let html: string | undefined;
    if (errorsObj && typeof errorsObj === 'object') {
      const itens: string[] = [];
      for (const [campo, msgs] of Object.entries(errorsObj)) {
        (msgs || []).forEach(m => {
          const label = campo
            .replace(/Id$/,'')
            .replace(/([A-Z])/g,' $1')
            .trim();
          itens.push(`<li><strong>${this.escapeHtml(label)}:</strong> ${this.escapeHtml(m)}</li>`);
        });
      }
      if (itens.length) {
        html = `<ul style="text-align:left;margin:0;padding-left:1.1rem">${itens.join('')}</ul>`;
      }
    } else if (payload?.detail) {
      html = `<p style="text-align:left;margin:0">${this.escapeHtml(payload.detail)}</p>`;
    }

    return { icon, title, html, errorsObj };
  }

  private escapeHtml(s: string): string {
    return String(s).replace(/[&<>"']/g, ch =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' } as any)[ch]
    );
  }

  /** Mapeia nomes de campos do backend -> nomes dos FormControls */
  private mapServerFieldToForm(k: string): string {
    const map: Record<string, string> = {
      EventoId: 'eventoId',
      ParticipanteId: 'participanteId',
      CursoOuComissao: 'cursoTemaAtualId'
    };
    return map[k] ?? (k ? k.charAt(0).toLowerCase() + k.slice(1) : k);
  }

  private toNull<T>(v: T | '' | undefined | null): T | null {
    return v === '' || v === undefined || v === null ? null : v;
  }

  private toDateOnly(data: string) {
    const [dia, mes, ano] = (data || '').split('/');
    return `${ano}-${mes}-${dia}`; // yyyy-MM-dd
  }

  /** Converte ISO/Date para dd/MM/yyyy (ou retorna null se inválido) */
  private toBrDateFromIso(value: any): string | null {
    if (!value) return null;
    // pode vir "2025-09-12T00:00:00Z" ou "2025-09-12T00:00:00" ou Date
    const d = value instanceof Date ? value : new Date(String(value));
    if (isNaN(d.getTime())) return null;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private getRouteParamAny(...names: string[]): string | null {
    for (const n of names) {
      const v = this.getRouteParamDeep(n);
      if (v) return v;
    }
    return null;
  }

  /** Busca um parâmetro subindo na árvore de rotas (rota atual -> pais). */
  private getRouteParamDeep(name: string): string | null {
    let r: any = this.route.snapshot;
    while (r) {
      const v = r.paramMap?.get?.(name);
      if (v) return v;
      r = r.parent;
    }
    return null;
  }

  // ========= CPF precheck (novo) =========

  /** Observa CPF (somente criação): busca participante por CPF e, se achar, preenche; também verifica inscrição no evento. */
  private setupCpfPrecheck(eventoId: string) {
    this.form.get('cpf')!.valueChanges.pipe(
      debounceTime(400),
      map(v => (v || '').toString()),
      distinctUntilChanged(),
      map(v => v.replace(/\D/g, '')),
      filter(digits => digits.length >= 11),
      switchMap(digits =>
        // use o método que você JÁ tem na sua service:
        // ex.: this.participanteService.obterPorCpf(digits)
        this.participanteService.obterPorCpf(digits).pipe(
          catchError(() => of(null)),
          tap((p: any) => this.autopreencherPorParticipante(p)),
          switchMap((p: any) => {
            if (!p?.id) return of(null);
            // usa o endpoint existente de inscrição por evento+participante
            return this.inscricaoService.checkExiste(eventoId, p.id).pipe(
              catchError(() => of({ existe: false } as InscricaoExistenciaDto)),
              tap(res => {
                if (res.existe) {
                  this.inscricaoExistenteId = res.inscricaoId ?? undefined; // opcional, guardar
                  this.notify.infoCenter(
                    'Participante já inscrito neste evento',
                    'Este CPF já possui uma inscrição para este evento. Acesse a inscrição existente para concluir o pagamento.'
                  );
                } else {
                  this.inscricaoExistenteId = undefined;
                }
              })
            );
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  /** Preenche o formulário a partir de um Participante (sem sobrescrever o que o usuário já digitou). */
  private autopreencherPorParticipante(p: any) {
    
    if (!p) {
      this.notify.infoCenter('Novo participante', 'Não encontramos cadastro para este CPF.');
      return;
    }

    // Dados básicos
    this.safePatch('nome', p.nome);
    this.safePatch('email', p.email);
    this.safePatch('telefone', p.telefone);
    this.safePatch('instituicao', p.instituicaoNome ?? p.instituicao ?? '');

    if (p.dataNascimento) {
      const d = this.toBrDateFromIso(p.dataNascimento);
      this.safePatch('dataNascimento', d);
      if (d) this.definirPublicoPeloEvento(d);
    }

    // Endereço (mantendo sua estrutura atual)
    const e = p.endereco || {};
    this.safePatch('endereco.cep',         e.cep);
    this.safePatch('endereco.logradouro',  e.logradouro);
    this.safePatch('endereco.numero',      e.numero);
    this.safePatch('endereco.complemento', e.complemento);
    this.safePatch('endereco.bairro',      e.bairro);
    this.safePatch('endereco.estado',      e.estado);  // UF (texto)
    this.safePatch('endereco.cidade',      e.cidade);  // Nome (texto)

    // Se setamos UF por patch, e seu EnderecoComponent depender do change, isso já dispara valueChanges.
    // Caso precise garantir, reemita manualmente:
    const uf = this.form.get('endereco.estado')?.value;
    if (uf) this.form.get('endereco.estado')?.setValue(uf, { emitEvent: true });

    this.notify.successCenter('Dados carregados', 'Cadastro encontrado para este CPF.');
  }

  /** Atribui valor apenas se o campo estiver vazio (não sobrescreve digitação do usuário). */
  private safePatch(path: string, value: any) {
    const ctrl = this.form.get(path);
    if (!ctrl) return;
    const cur = ctrl.value;
    const isEmpty = cur === null || cur === undefined || cur === '';
    if (isEmpty && value !== undefined && value !== null && value !== '') {
      ctrl.patchValue(value, { emitEvent: false });
    }
  }
}

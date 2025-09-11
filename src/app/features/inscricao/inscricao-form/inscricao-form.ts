import { Component, OnInit, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { combineLatest, forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs/operators';

import { MaterialModule } from '../../../shared/material.module';
import { EnderecoComponent } from '../../../shared/components/endereco/endereco';
import { SharedModule } from '../../../shared/shared.module';

import { EventoService } from '../../../core/services/evento.service';
import { ParticipanteService } from '../../../core/services/participante.service';
import { InscricaoService } from '../../../core/services/inscricao.service';
import { CursoService } from '../../../core/services/curso.service';
import { ComissaoEventoService } from '../../../core/services/comissao-evento.service';
import { NotificationService } from '../../../core/services/notification.service';

import { Evento } from '../../../core/models/evento.model';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';

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
  isLoadingCursos = false;

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

    const eventoId = this.route.snapshot.paramMap.get('eventoId');
    this.responsavelId = this.route.snapshot.paramMap.get('responsavelId')!;

    if (!eventoId) {
      console.error('Parâmetro :eventoId não encontrado.');
      return;
    }

    // Reage à mudança de público para ligar/desligar "responsável"
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

    // 1) Carrega o evento
    this.eventoService.obterPorId(eventoId)
      .pipe(
        tap((evento) => {
          this.evento = evento;
          // Se já tinha data preenchida, garante cálculo
          const dn = this.form.get('dataNascimento')?.value as string | null;
          if (dn) this.definirPublicoPeloEvento(dn);
        }),
        // 2) Carrega comissões (cursos ficam reativos abaixo)
        switchMap(() =>
          this.comissaoEventoService
            .listarPorEvento(eventoId)
            .pipe(catchError(() => of([])))
        )
      )
      .subscribe({
        next: (comissoes) => {
          this.comissoes = comissoes;
          // 3) Só depois de ter evento e form prontos, ligo o auto-refresh dos cursos
          this.setupAutoRefreshCursos();
        },
        error: (err) => console.error('Erro ao carregar dados do evento/comissões', err)
      });
  }

  /** Atualiza cursos sempre que público / neófito / trabalhador mudarem. */
  private setupAutoRefreshCursos() {
    const publico$    = this.form.get('publico')!.valueChanges.pipe(startWith(this.form.get('publico')!.value));
    const neofito$    = this.form.get('neofito')!.valueChanges.pipe(startWith(this.form.get('neofito')!.value));
    const trabalhador$= this.form.get('trabalhador')!.valueChanges.pipe(startWith(this.form.get('trabalhador')!.value));

    combineLatest([publico$, neofito$, trabalhador$])
      .pipe(
        switchMap(([publico, neofito, trabalhador]) => {
          // Se estiver em "trabalhador", limpa cursos e não busca
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
        // Se a opção selecionada saiu da lista após o filtro, zera o control
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
      neofito: [null], // null => não filtra; mude para true/false se quiser filtro padrão
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

  // ================== SALVAR ==================

  async salvar(): Promise<void> {
    if (this.form.invalid) return;

    const dados = this.form.getRawValue();

    try {
      const participante = await firstValueFrom(
        this.participanteService.criarOuObterPorCpf({
          nome: dados.nome,
          cpf: dados.cpf,
          dataNascimento: dados.dataNascimento,
          email: dados.email,
          telefone: dados.telefone,
          instituicao: dados.instituicao,
          endereco: dados.endereco
        })
      );

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

      // (Opcional) marca os controles com erro do servidor para aparecer <mat-error>
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
      CursoOuComissao: 'cursoTemaAtualId' // ajuste se quiser marcar outro control
    };
    // fallback: tenta camelCase
    return map[k] ?? (k ? k.charAt(0).toLowerCase() + k.slice(1) : k);
  }

  private toNull<T>(v: T | '' | undefined | null): T | null {
    return v === '' || v === undefined || v === null ? null : v;
  }
}

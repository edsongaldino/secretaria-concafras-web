import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { NgxMaskDirective } from 'ngx-mask';
import { NotificationService } from '../../../core/services/notification.service';
import { catchError, EMPTY, timeout } from 'rxjs';

type PaisDto   = { id: string; iso2: string; iso3: string; nome: string };
type EstadoDto = { id: string; nome: string; uf: string };
type CidadeDto = { id: string; nome: string; ibge?: string };

@Component({
  selector: 'app-endereco',
  standalone: true,
  templateUrl: './endereco.html',
  styleUrls: ['./endereco.scss'],
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, NgxMaskDirective]
})
export class EnderecoComponent implements OnInit {
  @Input() formGroup!: FormGroup;

  paises: PaisDto[] = [];
  estados: EstadoDto[] = [];
  cidades: CidadeDto[] = [];

  // trackBy
  trackPais   = (_: number, x: PaisDto)   => x.iso2;
  trackEstado = (_: number, x: EstadoDto) => x.id;
  trackCidade = (_: number, x: CidadeDto) => x.id;

  constructor(private http: HttpClient, private notify: NotificationService) {}

  ngOnInit(): void {
    this.ensureControls();

    // carrega países (Brasil primeiro)
    this.http.get<PaisDto[]>('/api/paises').subscribe(ps => {
      this.paises = ps.sort((a,b) => (a.iso2 === 'BR' ? -1 : b.iso2 === 'BR' ? 1 : a.nome.localeCompare(b.nome)));
    });

    if (this.isBR()) {
      this.carregarEstados().then(() => {
        const uf = this.formGroup.get('estado')?.value as string | null;
        if (uf) this.onEstadoChange(); // popula cidades se já tiver UF
      });
    }
  }

  // ===== helpers/estado do form =====
  private ensureControls() {
    const fg = this.formGroup;
    if (!fg.get('countryCode'))      fg.addControl('countryCode',      new FormControl('BR', Validators.required));
    if (!fg.get('estado'))           fg.addControl('estado',           new FormControl(''));        // UF (compat)
    if (!fg.get('cidade'))           fg.addControl('cidade',           new FormControl(''));        // nome (compat)
    if (!fg.get('estadoId'))         fg.addControl('estadoId',         new FormControl(null));      // UUID
    if (!fg.get('cidadeId'))         fg.addControl('cidadeId',         new FormControl(null));      // UUID
    if (!fg.get('estadoProvincia'))  fg.addControl('estadoProvincia',  new FormControl(''));
    if (!fg.get('cidadeTexto'))      fg.addControl('cidadeTexto',      new FormControl(''));

    this.applyValidatorsByCountry();
  }

  isBR(): boolean {
    return (this.formGroup.get('countryCode')?.value || 'BR') === 'BR';
  }

  private applyValidatorsByCountry() {
    const fg = this.formGroup;
    const br = this.isBR();
    fg.get('estado')?.setValidators(br ? [Validators.required] : []);
    fg.get('cidade')?.setValidators(br ? [Validators.required] : []);
    fg.get('cidadeTexto')?.setValidators(!br ? [Validators.required] : []);
    fg.get('estado')?.updateValueAndValidity({ emitEvent: false });
    fg.get('cidade')?.updateValueAndValidity({ emitEvent: false });
    fg.get('cidadeTexto')?.updateValueAndValidity({ emitEvent: false });
  }

  // ===== País =====
  onPaisChange() {
    const fg = this.formGroup;
    if (this.isBR()) {
      fg.patchValue({ estadoProvincia: '', cidadeTexto: '' });
      this.applyValidatorsByCountry();
      this.carregarEstados();
    } else {
      fg.patchValue({ cep: '', estado: '', cidade: '', estadoId: null, cidadeId: null });
      this.estados = [];
      this.cidades = [];
      this.applyValidatorsByCountry();
    }
  }

  // ===== Estados/Cidades (BR) =====
  async carregarEstados() {
    const xs = await this.http.get<EstadoDto[]>('/api/estados').toPromise();
    this.estados = xs ?? [];
    const uf = this.formGroup.get('estado')?.value as string | null;
    if (uf) {
      const est = this.estados.find(e => e.uf === uf);
      this.formGroup.patchValue({ estadoId: est?.id ?? null });
    }
  }

  onEstadoChange() {
    const uf = this.formGroup.get('estado')?.value as string | null;
    if (!uf) {
      this.formGroup.patchValue({ estadoId: null, cidade: '', cidadeId: null });
      this.cidades = [];
      return;
    }
    this.http.get<EstadoDto>(`/api/estados/uf/${uf}`).subscribe(est => {
      this.formGroup.patchValue({ estadoId: est?.id ?? null, cidade: '', cidadeId: null });
      if (est?.id) {
        this.http.get<CidadeDto[]>(`/api/estados/${est.id}/cidades`).subscribe(cs => this.cidades = cs);
      } else {
        this.cidades = [];
      }
    });
  }

  onCidadeChange() {
    const nome = (this.formGroup.get('cidade')?.value || '').toString();
    const found = this.cidades.find(c => normalize(c.nome) === normalize(nome));
    this.formGroup.patchValue({ cidadeId: found?.id ?? null });
  }

  // ===== CEP (força BR e preenche) =====
  buscarCep(): void {
    const raw = this.formGroup.get('cep')?.value ?? '';
    const cep = raw.replace(/\D/g, '');

    if (cep.length !== 8) {
      this.notify.errorCenter('CEP inválido', 'Digite 8 dígitos (ex.: 78048-000).');
      return;
    }

    this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).pipe(
      timeout(8000),
      catchError(() => {
        this.notify.errorCenter('Serviço indisponível', 'Não foi possível consultar o CEP agora. Tente novamente mais tarde.');
        return EMPTY;
      })
    ).subscribe(dados => {
      if (dados?.erro) {
        this.notify.errorCenter('CEP não encontrado', 'Confira o CEP informado ou preencha o endereço manualmente.');
        return;
      }

      // força Brasil e preenche campos básicos
      this.formGroup.patchValue({
        countryCode: 'BR',
        logradouro: dados.logradouro ?? this.formGroup.get('logradouro')?.value,
        bairro: dados.bairro ?? this.formGroup.get('bairro')?.value,
        complemento: dados.complemento ?? this.formGroup.get('complemento')?.value,
        estado: (dados.uf || '').toUpperCase()
      });

      // dispara carregamento de cidades pelo UF
      this.onPaisChange?.();   // se você tiver esse método no componente
      this.onEstadoChange();

      const ibge = (dados.ibge || '').toString().padStart(7, '0');
      const localidade = dados.localidade || '';

      const tryPick = () => {
        if (!this.cidades?.length) { setTimeout(tryPick, 120); return; }
        const byIbge = this.cidades.find(c => (c as any).ibge === ibge);
        const byName = this.cidades.find(c => normalize(c.nome) === normalize(localidade));
        const chosen = byIbge ?? byName;
        if (chosen) this.formGroup.patchValue({ cidade: chosen.nome, cidadeId: chosen.id });
      };
      tryPick();
    });
  }
}

function normalize(s?: string) {
  return (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
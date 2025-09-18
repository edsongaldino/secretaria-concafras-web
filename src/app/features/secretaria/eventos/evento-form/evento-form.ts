import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventoService } from '../../../../core/services/evento.service';
import { Evento } from '../../../../core/models/evento.model';
import { MaterialModule } from '../../../../shared/material.module';
import { CommonModule } from '@angular/common';
import { EnderecoComponent } from '../../../../shared/components/endereco/endereco';

@Component({
  selector: 'app-evento-form',
  templateUrl: './evento-form.html',
  styleUrls: ['./evento-form.scss'],
  imports: [
    MaterialModule,
    CommonModule,
    ReactiveFormsModule,
    EnderecoComponent
  ]
})

export class EventoFormComponent implements OnInit {
  form!: FormGroup;
  id: string | null = null;
  carregando = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private eventoService: EventoService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.criarFormulario();

    if (this.id) {
      this.carregarEvento(this.id);
    }
  }

  criarFormulario(): void {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required],
      inscricaoInicio: ['', Validators.required],
      inscricaoFim: ['', Validators.required],
      valorInscricaoCrianca: [''],
      valorInscricaoAdulto: [''],
      bannerUrl: [''],
      endereco: this.fb.group({
        cep: ['', Validators.required],
        logradouro: [''],
        numero: [''],
        complemento: [''],
        bairro: [''],
        estado: [''],
        cidade: ['']
      })
    });
  }

  carregarEvento(id: string): void {
    this.carregando = true;
    this.eventoService.obterPorId(id).subscribe({
      next: (evento) => {
        this.form.patchValue(evento);
        this.carregando = false;
      },
      error: () => {
        alert('Erro ao carregar evento.');
        this.carregando = false;
      }
    });
  }

  salvar(): void {
    if (this.form.invalid) return;

    const evento: any = { ...this.form.value };

    // Corrige datas para UTC simples
    evento.dataInicio = `${evento.dataInicio}T00:00:00Z`;
    evento.dataFim = `${evento.dataFim}T00:00:00Z`;
    evento.inscricaoInicio = `${evento.inscricaoInicio}T00:00:00Z`;
    evento.inscricaoFim = `${evento.inscricaoFim}T00:00:00Z`;

    if (this.id) {
      this.eventoService.atualizar(this.id, evento).subscribe(() => {
        alert('Evento atualizado com sucesso!');
        this.router.navigate(['/eventos']);
      });
    } else {
      this.eventoService.criar(evento).subscribe(() => {
        alert('Evento criado com sucesso!');
        this.router.navigate(['/eventos']);
      });
    }
  }

  get enderecoForm(): FormGroup {
    return this.form.get('endereco') as FormGroup;
  }

}

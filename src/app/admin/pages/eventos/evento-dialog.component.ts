import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { EventoService } from '../../../core/services/evento.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: true,
  selector: 'app-evento-dialog',
  templateUrl: './evento-dialog.component.html',
  styleUrls: ['./evento-dialog.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule
  ]
})
export class EventoDialogComponent {
  private fb = inject(FormBuilder);
  private svc = inject(EventoService);
  private notify = inject(NotificationService);

  form: FormGroup = this.fb.group({
    id: [],
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    cidade: [''],
    estado: [''],
    dataInicio: [null, Validators.required],
    dataFim: [null, Validators.required],
  });

  constructor(
    private ref: MatDialogRef<EventoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ){
    if (data){ this.form.patchValue(data); }
  }

  async salvar(){
    if (this.form.invalid) return;
    const dto = this.form.getRawValue();
    try {
      if (dto.id) await firstValueFrom(this.svc.atualizar(dto.id, dto));
      else await firstValueFrom(this.svc.criar(dto));
      this.notify.successCenter('Evento salvo com sucesso');
      this.ref.close(true);
    } catch(e:any){ this.notify.errorCenter('Erro ao salvar evento', e?.message ?? ''); }
  }
}

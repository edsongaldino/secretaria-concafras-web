import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { InscricaoService } from '../../../core/services/inscricao.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: true,
  selector: 'app-inscricao-dialog',
  templateUrl: './inscricao-dialog.component.html',
  styleUrls: ['./inscricao-dialog.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ]
})
export class InscricaoDialogComponent {
  private fb = inject(FormBuilder);
  private svc = inject(InscricaoService);
  private notify = inject(NotificationService);

  statusOptions = ['Pendente','Confirmada','Cancelada'];

  form: FormGroup = this.fb.group({
    id: [],
    status: ['', Validators.required],
    valor: [0]
  });

  constructor(
    private ref: MatDialogRef<InscricaoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ){
    if (data){ this.form.patchValue({ id: data.id, status: data.status, valor: data.valor }); }
  }

  async salvar(){
    if (this.form.invalid) return;
    const dto = this.form.getRawValue();
    try {
      await firstValueFrom(this.svc.atualizarInscricao(dto.id, { status: dto.status, valor: dto.valor }));
      this.notify.successCenter('Inscrição atualizada');
      this.ref.close(true);
    } catch(e:any){ this.notify.errorCenter('Erro ao salvar inscrição', e?.message ?? ''); }
  }
}

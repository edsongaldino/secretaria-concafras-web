import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from './material.module'; // onde está centralizado o Angular Material
import { EnderecoComponent } from './components/endereco/endereco';
import { NgxMaskDirective } from 'ngx-mask';

@NgModule({
  declarations: [
     // seus componentes reutilizáveis aqui
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    NgxMaskDirective
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    NgxMaskDirective
  ]
})
export class SharedModule {}

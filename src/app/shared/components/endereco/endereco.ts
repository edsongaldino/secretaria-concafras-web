import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-endereco',
  standalone: true,
  templateUrl: './endereco.html',
  styleUrls: ['./endereco.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule
  ]
})
export class EnderecoComponent implements OnInit {
  @Input() formGroup!: FormGroup;

  estados = [
    { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' }
  ];
  cidades: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const estado = this.formGroup.get('estado')?.value;
    const cidade = this.formGroup.get('cidade')?.value;
    if (estado) this.carregarCidades(cidade);
  }

  buscarCep(): void {
    const cep = this.formGroup.get('cep')?.value?.replace(/\D/g, '');
    if (cep?.length !== 8) return;

    this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).subscribe(dados => {
      if (!dados.erro) {
        this.formGroup.patchValue({
          logradouro: dados.logradouro,
          bairro: dados.bairro,
          complemento: dados.complemento
        });

        // Buscar cidade no seu banco usando nome + uf
        this.http.get<any>(`/api/cidades/buscar?nome=${dados.localidade}&uf=${dados.uf}`).subscribe(cidade => {
          if (cidade?.id) {
            this.formGroup.patchValue({ cidadeId: cidade.id });
          }
        });
      }
    });
  }


  carregarCidades(cidadeSelecionada: string = ''): void {
    const estado = this.formGroup.get('estado')?.value;
    if (estado) {
      this.http.get<any[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`)
        .subscribe(cidades => {
          this.cidades = cidades.map(c => c.nome);
          if (cidadeSelecionada) {
            this.formGroup.patchValue({ cidade: cidadeSelecionada });
          }
        });
    }
  }
}

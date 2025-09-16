import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Cidade } from '../models/cidade.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EstadoDto { id: string; nome: string; uf: string; }

@Injectable({ providedIn: 'root' })

export class EstadoService {
  private http = inject(HttpClient);
  list() { return this.http.get<EstadoDto[]>('/api/estados'); }
  obterPorUF(uf: string) { return this.http.get<EstadoDto>(`/api/estados/uf/${uf}`); }
}

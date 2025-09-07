// src/app/services/comissao.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Comissao } from '../models/comissao.model';

@Injectable({ providedIn: 'root' })
export class ComissaoService {
  // se preferir, troque por environment.apiBaseUrl + '/comissoes'
  private readonly baseUrl = '/api/comissoes';

  constructor(private http: HttpClient) {}

  listar(): Observable<Comissao[]> {
    return this.http.get<Comissao[]>(this.baseUrl);
  }

  obter(id: string): Observable<Comissao> {
    return this.http.get<Comissao>(`${this.baseUrl}/${id}`);
  }

  criar(payload: Partial<Comissao>): Observable<string> {
    // backend pode retornar o id criado; ajuste o tipo se retornar void
    return this.http.post<string>(this.baseUrl, payload);
  }

  atualizar(id: string, payload: Partial<Comissao>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

// src/app/services/comissao.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Comissao } from '../models/comissao.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ComissaoService {

  private readonly apiUrl = `${environment.apiUrl}/comissoes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Comissao[]> {
    return this.http.get<Comissao[]>(this.apiUrl);
  }

  obter(id: string): Observable<Comissao> {
    return this.http.get<Comissao>(`${this.apiUrl}/${id}`);
  }

  criar(payload: Partial<Comissao>): Observable<string> {
    // backend pode retornar o id criado; ajuste o tipo se retornar void
    return this.http.post<string>(this.apiUrl, payload);
  }

  atualizar(id: string, payload: Partial<Comissao>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

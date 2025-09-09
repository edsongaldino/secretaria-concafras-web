// src/app/services/comissao-evento.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ComissaoEvento } from '../models/comissao-evento.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ComissaoEventoService {

  private readonly apiUrl = `${environment.apiUrl}/comissoes-evento`;

  constructor(private http: HttpClient) {}

  /**
   * Lista as comissões vinculadas a um evento.
   * Preferível usar querystring: GET /api/comissoes-evento?eventoId=...
   * (se sua API usa path /obter-por-evento/{id}, ajuste aqui)
   */
  listarPorEvento(eventoId: string): Observable<ComissaoEvento[]> {
    const params = new HttpParams().set('eventoId', eventoId);
    return this.http.get<ComissaoEvento[]>(this.apiUrl, { params });
  }

  /**
   * Obtém uma comissão-evento específica.
   */
  obter(id: string): Observable<ComissaoEvento> {
    return this.http.get<ComissaoEvento>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cria os vínculos de comissões do catálogo para um evento.
   * Exemplo de payload:
   * {
   *   eventoId: '...',
   *   comissaoIds: ['id1','id2',...],
   *   coordenadores: [{ comissaoId: 'id1', usuarioId: '...' }]
   * }
   */
  criarParaEvento(payload: {
    eventoId: string;
    comissaoIds: string[];
    coordenadores?: { comissaoId: string; usuarioId: string }[];
  }): Observable<void> {
    return this.http.post<void>(this.apiUrl, payload);
  }

  /**
   * Atualiza o coordenador de uma comissão-evento.
   * PUT /api/comissoes-evento/{id}/coordenador  { usuarioId: string | null }
   */
  atualizarCoordenador(comissaoEventoId: string, usuarioId: string | null): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${comissaoEventoId}/coordenador`, { usuarioId });
  }

  /**
   * Atualiza campos gerais da comissão-evento (ex.: observações).
   * Ajuste o tipo do payload conforme seu DTO backend.
   */
  atualizar(comissaoEventoId: string, payload: Partial<ComissaoEvento>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${comissaoEventoId}`, payload);
  }

  /**
   * Exclui a comissão vinculada ao evento.
   */
  excluir(comissaoEventoId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${comissaoEventoId}`);
  }
}

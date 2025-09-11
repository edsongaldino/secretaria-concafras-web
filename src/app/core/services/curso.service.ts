import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Curso, Publico } from '../models/curso.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CursoService {

  private readonly apiUrl = `${environment.apiUrl}/curso`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.apiUrl);
  }

  listarPorEvento(
    eventoId: string,
    filtros: { publico?: string; bloco?: 'TemaAtual' | 'TemaEspecifico' | number; neofito?: boolean | null }
  ): Observable<Curso[]> {
    let params = new HttpParams();
    if (filtros.publico) params = params.set('publico', filtros.publico);
    if (filtros.bloco !== undefined && filtros.bloco !== null) params = params.set('bloco', String(filtros.bloco));
    if (filtros.neofito !== undefined && filtros.neofito !== null) params = params.set('neofito', String(filtros.neofito));
    return this.http.get<Curso[]>(`${this.apiUrl}/obter-por-evento/${eventoId}`, { params });
  }

}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Curso, Publico } from '../models/curso.model';

@Injectable({ providedIn: 'root' })
export class CursoService {

  private readonly apiUrl = '/api/curso';

  constructor(private http: HttpClient) {}

  listar(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.apiUrl);
  }

  listarPorEvento(eventoId: string, publico?: Publico, neofito?: boolean) {
    const params: any = {};
    if (publico) params.publico = publico;
    if (neofito !== undefined) params.neofito = neofito;
    return this.http.get<Curso[]>(`${this.apiUrl}/obter-por-evento/${eventoId}`, { params });
  }

}

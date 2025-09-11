import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Evento } from '../models/evento.model';
import { Comissao } from '../models/comissao.model';
import { Curso } from '../models/curso.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class EventoService {

  private readonly apiUrl = `${environment.apiUrl}/evento`;

  constructor(private http: HttpClient) {}

  obterPorId(id: string): Observable<Evento> {
    console.log(id);
    return this.http.get<Evento>(`${this.apiUrl}/${id}`);
  }

  criar(evento: Evento): Observable<any> {
    console.log(evento);
    return this.http.post(this.apiUrl, evento);
  }

  listarTodos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.apiUrl);
  }

  obterTodos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.apiUrl);
  }

  atualizar(id: string, evento: Evento): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, evento);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // cursos por tipo (se preferir endpoints separados, veja bloco alternativo abaixo)
  obterCursos(eventoId: string, tipo: 'atual'|'especifico'|'crianca'|'jovem') {
    return this.http.get<Curso[]>(`${this.apiUrl}/${eventoId}/cursos`, { params: { tipo } });
  }
  
}

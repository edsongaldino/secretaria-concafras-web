import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Inscricao, ListaInscricoesDto } from '../models/inscricao.model';

@Injectable({
  providedIn: 'root'
})
export class InscricaoService {

  private readonly apiUrl = `${environment.apiUrl}/inscricao`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getEventosAbertos(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/eventos/abertos`);
  }

  criarInscricao(inscricao: Inscricao): Observable<Inscricao> {
    return this.http.post<Inscricao>(`${this.apiUrl}/criar`, inscricao);
  }

  getInscricoes(eventoId: string, participanteId: string) {
    return this.http.get<ListaInscricoesDto[]>(`${this.apiUrl}/lista-inscricoes/${eventoId}/${participanteId}`);
  }

}

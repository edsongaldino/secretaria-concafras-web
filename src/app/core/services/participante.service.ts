import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Participante } from '../models/participante.model';

@Injectable({
  providedIn: 'root'
})

export class ParticipanteService {
  
  private readonly apiUrl = `${environment.apiUrl}/participantes`;

  constructor(private http: HttpClient) {}

  criarOuObterPorCpf(participante: Participante): Observable<Participante> {
    return this.http.post<Participante>(`${this.apiUrl}/criar-ou-obter-por-cpf`, participante);
  }

  obterPorId(id: string) {
    return this.http.get<Participante>(`${this.apiUrl}/${id}`);
  }

  obterPorCpf(cpf: string) {
    return this.http.get<Participante>(`${this.apiUrl}/obter-por-cpf/${cpf}`);
  }

}

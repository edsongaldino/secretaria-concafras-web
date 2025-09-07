import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Participante } from '../models/participante.model';

@Injectable({
  providedIn: 'root'
})

export class ParticipanteService {
  private readonly apiUrl = '/api/participantes';

  constructor(private http: HttpClient) {}

  criarOuObterPorCpf(participante: Participante): Observable<Participante> {
    console.log(participante);
    return this.http.post<Participante>(`${this.apiUrl}/criar-ou-obter-por-cpf`, participante);
  }

}

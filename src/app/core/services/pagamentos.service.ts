import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagamentoCreateResultDto } from '../models/pagamento.model';

@Injectable({
  providedIn: 'root'
})
export class PagamentoService {

  private readonly apiUrl = `${environment.apiUrl}/inscricao`;

  constructor(private http: HttpClient) {} 

  criarCheckoutGrupo(eventoId: string, responsavelId: string) {
    return this.http.post<PagamentoCreateResultDto>('/api/pagamentos/grupo/checkout', {
      eventoId, responsavelFinanceiroId: responsavelId
    });
  }

}

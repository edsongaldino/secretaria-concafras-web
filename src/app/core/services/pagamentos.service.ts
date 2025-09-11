import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagamentoCreateResultDto } from '../models/pagamento.model';

@Injectable({
  providedIn: 'root'
})
export class PagamentoService {

  private readonly apiUrl = `${environment.apiUrl}/pagamentos`;

  constructor(private http: HttpClient) {} 

  criarCheckoutGrupo(eventoId: string, responsavelId: string) {
    return this.http.post<PagamentoCreateResultDto>(`${this.apiUrl}/grupo/checkout`, {
      eventoId, responsavelFinanceiroId: responsavelId
    });
  }

}

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
    console.log(eventoId, responsavelId);
    return this.http.post<PagamentoCreateResultDto>(`${this.apiUrl}/checkout/grupo`, {
      eventoId, responsavelFinanceiroId: responsavelId
    });
  }

  obterStatus(pagamentoId: string) {
    return this.http.get<{ pagamentoId: string; status: string; itens: { inscricaoId: string }[] }>(
      `${this.apiUrl}/status/${pagamentoId}`
    );
  }

}

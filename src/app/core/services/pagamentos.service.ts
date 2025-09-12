import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagamentoCreateResultDto } from '../models/pagamento.model';


export interface CheckoutGrupoPayload {
  eventoId: string;
  responsavelFinanceiroId: string;
  excluirInscricaoIds: string[]; // nunca null
}

@Injectable({
  providedIn: 'root'
})

export class PagamentoService {

  private readonly apiUrl = `${environment.apiUrl}/pagamentos`;

  constructor(private http: HttpClient) {} 

  criarCheckoutGrupo(body: CheckoutGrupoPayload) {
    // garanta que excluirInscricaoIds nunca é null/undefined
    if (!body.excluirInscricaoIds) body.excluirInscricaoIds = [];


    return this.http.post<{
      checkoutUrl?: string;
      mensagem?: string;
      // ... resto do contrato
    }>(`${this.apiUrl}/checkout/grupo`, body);
  }

  obterStatus(pagamentoId: string) {
    return this.http.get<{ pagamentoId: string; status: string; itens: { inscricaoId: string }[] }>(
      `${this.apiUrl}/status/${pagamentoId}`
    );
  }

}

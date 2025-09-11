export interface PagamentoCreateResultDto {
    pagamentoId: string; 
    eventoId: string; 
    responsavelFinanceiroId: string;
    valor: number; 
    status: string; 
    checkoutUrl?: string;
    mensagem?: string | null;
  }
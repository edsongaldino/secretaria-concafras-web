export interface Inscricao {
  id?: string;
  eventoId: string;
  participanteId: string;
  responsavelFinanceiroId?: string;
  cursoTemaAtualId?: string;
  cursoTemaEspecificoId?: string;
  comissaoId?: string;
}

export interface ListaInscricoesDto {
  inscricaoId: string;
  eventoId: string;
  eventoTitulo: string;
  dataInscricao: string;
  temaAtual: string;
  temaEspecifico: string;
  trabalhador: boolean;
}
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
  participanteId: string;
  participanteNome: string;
  participanteDataNascimento:string;
  participanteIdade:string;
  valorInscricao: string;
  trabalhador: boolean;
}

export interface InscricaoEditDto {
  id: string;
  eventoId: string;
  participanteId: string;
  responsavelFinanceiroId: string;
  dataInscricao: string;      // ISO
  valorInscricao: number;
  participanteNome?: string | null;
  eventoTitulo?: string | null;
  ehTrabalhador: boolean;
  comissaoEventoId?: string | null;
  cursoIds: string[];
}

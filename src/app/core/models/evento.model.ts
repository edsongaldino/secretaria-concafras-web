import { Endereco } from './endereco.model';

export interface Evento {
  id: string;
  titulo: string;
  dataInicio: Date;
  dataFim: Date;
  inscricaoInicio: Date;
  inscricaoFim: Date;
  bannerUrl?: string;
  valorInscricaoCrianca?: number;
  valorInscricaoAdulto?: number;
  endereco: Endereco;
}

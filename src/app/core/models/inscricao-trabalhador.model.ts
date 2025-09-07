import { Inscricao } from "../../features/inscricao/inscricao";

export interface InscricaoTrabalhador {
  id: string;
  inscricaoId: string;
  comissaoEventoId: string;
  nivel: number; // enum no backend; aqui pode ser number ou union
  inscricao: Inscricao; // para mostrar participante, etc.
}
import { Comissao } from "./comissao.model";
import { InscricaoTrabalhador } from "./inscricao-trabalhador.model";
import { Usuario } from "./usuario.model";
import { UsuarioRole } from "./usuario-role";

export interface ComissaoEvento {
  id: string;
  eventoId: string;
  comissaoId: string;
  comissao: Comissao;
  coordenadorUsuarioId?: string | null;
  coordenadorUsuario?: Usuario | null;
  observacoes?: string | null;

  inscricoesTrabalhadores: InscricaoTrabalhador[];
  usuarioRoles: UsuarioRole[];
}
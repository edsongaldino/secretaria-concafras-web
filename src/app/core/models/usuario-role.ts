import { Usuario } from "./usuario.model";

export interface UsuarioRole {
  id: string;
  usuarioId: string;
  role: number; // seu enum (ou string se API serializa como string)
  eventoId?: string | null;
  comissaoEventoId?: string | null;
  usuario?: Usuario;
}
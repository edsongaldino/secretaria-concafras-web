export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

export type PerfilUsuario =
  | 'Participante' | 'Gestor' | 'Coordenador' | 'Financeiro' | 'Secretaria';
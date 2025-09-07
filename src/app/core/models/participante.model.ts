import { Endereco } from "./endereco.model";

export interface Participante {
  id?: string;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  instituicao?: string;
  endereco: Endereco;
}
export type Publico = 'Crianca' | 'Jovem' | 'Adulto';

export interface Curso {
  Id: string;
  titulo: string;
  descricao: string;
  bloco: number;
  eventoId: string;
  institutoId: string;
  publico: Publico;
  neofito: boolean;
}
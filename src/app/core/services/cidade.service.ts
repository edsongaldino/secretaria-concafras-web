import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cidade } from '../models/cidade.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CidadeService {
  private readonly api = '/api/cidades'; // ajuste conforme sua rota

  constructor(private http: HttpClient) {}

  listar(): Observable<Cidade[]> {
    return this.http.get<Cidade[]>(this.api);
  }

  buscarPorNomeEUf(nome: string, uf: string): Observable<Cidade | null> {
    return this.http.get<Cidade>(`/api/cidades/buscar?nome=${nome}&uf=${uf}`);
  }

}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cidade } from '../models/cidade.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CidadeService {

  private readonly apiUrl = `${environment.apiUrl}/cidades`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Cidade[]> {
    return this.http.get<Cidade[]>(this.apiUrl);
  }

  buscarPorNomeEUf(nome: string, uf: string): Observable<Cidade | null> {
    return this.http.get<Cidade>(`${this.apiUrl}/buscar?nome=${nome}&uf=${uf}`);
  }

}

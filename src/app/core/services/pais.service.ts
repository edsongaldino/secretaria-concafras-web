import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface PaisDto { id: string; iso2: string; iso3: string; nome: string; }

@Injectable({ providedIn: 'root' })
export class PaisService {
  private http = inject(HttpClient);
  list(): Observable<PaisDto[]> {
    return this.http.get<PaisDto[]>('/api/paises').pipe(
      map(xs => xs.sort((a,b) => (a.iso2 === 'BR' ? -1 : b.iso2 === 'BR' ? 1 : a.nome.localeCompare(b.nome))))
    );
  }
}

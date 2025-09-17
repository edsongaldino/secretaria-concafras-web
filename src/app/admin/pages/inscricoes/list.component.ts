import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { InscricaoService } from '../../../core/services/inscricao.service';
import { InscricaoDialogComponent } from './inscricao-dialog.component';

export interface InscricaoVm {
  id: string;
  participanteNome: string;
  eventoTitulo: string;
  status: string;
  valor?: number;
}

@Component({
  standalone: true,
  selector: 'app-inscricoes-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  imports: [
    CommonModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatDialogModule
  ]
})
export class ListComponent implements OnInit {
  private svc = inject(InscricaoService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  displayedColumns = ['participante','evento','status','valor','acoes'];
  data = new MatTableDataSource<InscricaoVm>([]);

  total = 0; pageIndex = 0; pageSize = 10; filtro = '';
  sortActive = 'participante'; sortDir: 'asc' | 'desc' = 'asc';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(){ this.load(); }

  async load(){
    try {
      const res: any = await firstValueFrom(this.svc.getAll());
      this.data.data = res?.items ?? res?.data ?? [];
      this.total = res?.total ?? res?.count ?? this.data.data.length;
    } catch (e: any) {
      this.notify.errorCenter('Erro ao carregar inscrições', e?.message ?? '');
    }
  }

  onSearch(value: string){ this.filtro = value?.trim(); this.pageIndex = 0; this.load(); }
  onSort(e: Sort){ this.sortActive = e.active; this.sortDir = (e.direction || 'asc') as any; this.load(); }
  onPage(e: PageEvent){ this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.load(); }

  editar(row: InscricaoVm){
    this.dialog.open(InscricaoDialogComponent, { width: '600px', data: row })
      .afterClosed().subscribe(ok => ok && this.load());
  }
}

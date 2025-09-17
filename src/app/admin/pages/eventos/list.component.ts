import { Component, ViewChild, inject, OnInit, AfterViewInit } from '@angular/core';
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
import { EventoService } from '../../../core/services/evento.service';
import { EventoDialogComponent } from './evento-dialog.component';

export interface EventoVm {
  id: string;
  titulo: string;
  cidade?: string;
  estado?: string;
  dataInicio?: string; // ISO
  dataFim?: string;    // ISO
}

@Component({
  standalone: true,
  selector: 'app-eventos-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  imports: [
    CommonModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatDialogModule
  ]
})
export class ListComponent implements OnInit, AfterViewInit {
  private svc = inject(EventoService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  displayedColumns = ['titulo','cidade','periodo','acoes'];
  data = new MatTableDataSource<EventoVm>([]);

  total = 0; pageIndex = 0; pageSize = 10; filtro = '';
  sortActive = 'titulo'; sortDir: 'asc' | 'desc' = 'asc';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(){ this.load(); }
  ngAfterViewInit(){
    this.data.paginator = this.paginator;
    this.data.sort = this.sort;
  }

  async load(){
    try {
      const res: any = await firstValueFrom(this.svc.listarTodos());
      this.data.data = res?.items ?? res?.data ?? [];
      this.total = res?.total ?? res?.count ?? this.data.data.length;
    } catch (e: any) {
      this.notify.errorCenter('Erro ao carregar eventos', e?.message ?? '');
    }
  }

  onSearch(value: string){ this.filtro = value?.trim(); this.pageIndex = 0; this.load(); }
  onSort(e: Sort){ this.sortActive = e.active; this.sortDir = (e.direction || 'asc') as any; this.load(); }
  onPage(e: PageEvent){ this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.load(); }

  novo(){
    this.dialog.open(EventoDialogComponent, { width: '640px', data: null })
      .afterClosed().subscribe(ok => ok && this.load());
  }
  editar(row: EventoVm){
    this.dialog.open(EventoDialogComponent, { width: '640px', data: row })
      .afterClosed().subscribe(ok => ok && this.load());
  }
  async remover(row: EventoVm){
    if (!confirm(`Remover evento "${row.titulo}"?`)) return;
    try { await firstValueFrom(this.svc.excluir(row.id)); this.notify.successCenter('Evento removido'); this.load(); }
    catch(e:any){ this.notify.errorCenter('Erro ao remover', e?.message ?? ''); }
  }
}

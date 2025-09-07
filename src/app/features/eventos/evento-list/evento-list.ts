import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Evento } from '../../../core/models/evento.model';
import { EventoService } from '../../../core/services/evento.service';
import { MaterialModule } from '../../../shared/material.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-evento-list',
  templateUrl: './evento-list.html',
  imports: [
    MaterialModule,
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule
  ]
})
export class EventoListComponent implements OnInit {

  displayedColumns: string[] = ['titulo', 'dataInicio', 'dataFim', 'acoes'];
  dataSource = new MatTableDataSource<Evento>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private eventoService: EventoService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.carregarEventos();
  }

  carregarEventos(): void {
    this.eventoService.listarTodos().subscribe(eventos => {
      this.dataSource.data = eventos;
      this.dataSource.paginator = this.paginator;
    });
  }

  editar(id: string): void {
    this.router.navigate(['/eventos/editar', id]);
  }
}

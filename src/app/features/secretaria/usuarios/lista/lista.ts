import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UsuarioService} from '../../../../core/services/usuario.service';
import { Usuario } from '../../../../core/models/usuario.model';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista.html',
  styleUrls: ['./lista.scss']
})
export class UsuariosLista implements OnInit {
excluir(arg0: string) {
throw new Error('Method not implemented.');
}
editar(arg0: string) {
throw new Error('Method not implemented.');
}
  usuarios: Usuario[] = [];
  loading = true;
  errorMessage = '';

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erro ao carregar usuários';
        this.loading = false;
      }
    });
  }
}

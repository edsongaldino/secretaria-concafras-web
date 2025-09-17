import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  standalone: true,
  selector: 'app-admin-shell',
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss'],
  imports: [
    RouterOutlet, RouterLink, NgIf, NgFor, AsyncPipe,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule,
    MatButtonModule, MatMenuModule, MatBadgeModule, MatInputModule, MatFormFieldModule,
    MatTooltipModule
  ]
})
export class AdminShellComponent implements OnInit {
  private auth = inject(AuthService);
  mini = signal<boolean>(false);

  ngOnInit(){
    this.mini.set(localStorage.getItem('adminMini') === '1');
  }

  toggleMini(){
    const next = !this.mini();
    this.mini.set(next);
    localStorage.setItem('adminMini', next ? '1' : '0');
  }

  can(perfis: string[]) {
    const a: any = this.auth as any;
    if (typeof a.hasAnyPerfil === 'function') return a.hasAnyPerfil(perfis);
    if (typeof a.hasPerfil === 'function') return perfis.some((p: string) => a.hasPerfil(p));
    const user = a.usuario ?? a.user ?? {};
    const roles: string[] = user.perfis ?? user.roles ?? [];
    return perfis.some((p: string) => roles.includes(p));
  }
  logout(){ this.auth.logout(); }
}
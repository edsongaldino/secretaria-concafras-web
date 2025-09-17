import { Component, inject } from '@angular/core';
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

@Component({
  standalone: true,
  selector: 'app-admin-shell',
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss'],
  imports: [
    RouterOutlet, RouterLink, NgIf, NgFor, AsyncPipe,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule,
    MatButtonModule, MatMenuModule, MatBadgeModule, MatInputModule, MatFormFieldModule
  ]
})
export class AdminShellComponent {
  private auth = inject(AuthService);
  can(perfis: string[]) { return this.auth.hasAnyPerfil(perfis as any); }
  logout(){ this.auth.logout(); }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';  // Para navegação de rotas
import { FormsModule } from '@angular/forms'; 
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email: string = '';
  senha: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient, private auth : AuthService, private router: Router) {}

  login() {
    this.auth.login(this.email, this.senha).subscribe({
      next: (response) => {
        this.auth.setToken(response.token);   // salva o token pelo service
        this.router.navigate(['/home']);
      },
      error: () => {
        this.errorMessage = 'Credenciais inválidas!';
      }
    });
  }

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }


}

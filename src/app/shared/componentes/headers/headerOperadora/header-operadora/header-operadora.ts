import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { AuthService } from '@core/services/auth/auth-service';

@Component({
    selector: 'app-header-operadora',
    imports: [RouterLink, AsyncPipe],
    templateUrl: './header-operadora.html',
    styleUrl: './header-operadora.css',
})
export class HeaderOperadora {
    private authService = inject(AuthService);

    user$ = this.authService.currentUser$;

    onLogout() {
        this.authService.logout().subscribe();
    }
}
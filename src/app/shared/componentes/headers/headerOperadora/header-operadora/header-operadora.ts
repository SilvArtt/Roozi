import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth/auth-service';

@Component({
    selector: 'app-header-operadora',
    imports: [RouterLink],
    templateUrl: './header-operadora.html',
    styleUrl: './header-operadora.css',
})
export class HeaderOperadora {
    private authService = inject(AuthService);

    onLogout() {
        this.authService.logout().subscribe();
    }
}
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth/auth-service';

@Component({
    selector: 'app-header-app',
    imports: [RouterLink],
    templateUrl: './header-app.html',
    styleUrl: './header-app.css',
})
export class HeaderApp {
    private authService = inject(AuthService);

    onLogout() {
        this.authService.logout().subscribe();
    }
}
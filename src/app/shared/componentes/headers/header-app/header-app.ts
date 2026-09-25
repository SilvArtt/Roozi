import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { AuthService } from '@core/services/auth/auth-service';

@Component({
    selector: 'app-header-app',
    imports: [RouterLink, AsyncPipe],
    templateUrl: './header-app.html',
    styleUrl: './header-app.css',
})
export class HeaderApp {
    private authService = inject(AuthService);

    user$ = this.authService.currentUser$;

    onLogout() {
        this.authService.logout().subscribe();
    }
}
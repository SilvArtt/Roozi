import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';

import { AuthService } from '@core/services/auth/auth-service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
        take(1),
        map((user) => {
            if (!user) {
                router.navigate(['/login']);
                return false;
            }

            if (user.type === 'operator') {
                router.navigate(['/operadora/dashboard']);
                return false;
            }

            return true;
        })
    );
};
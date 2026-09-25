import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take, timeout, catchError, of } from 'rxjs';

import { AuthService } from '@core/services/auth/auth-service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const snapshot = authService.currentUserSnapshot;
    if (snapshot) {
        if (snapshot.type === 'operator') {
            router.navigate(['/operadora/dashboard']);
            return false;
        }
        return true;
    }

    return authService.currentUser$.pipe(
        filter((user) => user !== null),
        take(1),
        map((user) => {
            if (user.type === 'operator') {
                router.navigate(['/operadora/dashboard']);
                return false;
            }
            return true;
        }),
        timeout({ each: 5000, with: () => {
            router.navigate(['/login']);
            return of(false);
        }}),
        catchError(() => {
            router.navigate(['/login']);
            return of(false);
        })
    );
};
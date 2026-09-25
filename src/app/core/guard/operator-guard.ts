import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take, timeout, catchError, of } from 'rxjs';

import { AuthService } from '@core/services/auth/auth-service';
import { User } from '@core/models';

export const operatorGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // ⭐ Se já tem snapshot em memória, decide na hora
    const snapshot = authService.currentUserSnapshot;
    if (snapshot) {
        if (snapshot.type !== 'operator') {
            router.navigate(['/dashboard']);
            return false;
        }
        return true;
    }

    // ⭐ Senão, espera o primeiro valor não-nulo (com timeout de 5s)
    return authService.currentUser$.pipe(
        filter((user): user is User => user !== null),
        take(1),
        map((user) => {
            if (user.type !== 'operator') {
                router.navigate(['/dashboard']);
                return false;
            }
            return true;
        }),
        timeout({
            each: 5000,
            with: () => {
                router.navigate(['/login']);
                return of(false);
            },
        }),
        catchError(() => {
            router.navigate(['/login']);
            return of(false);
        })
    );
};
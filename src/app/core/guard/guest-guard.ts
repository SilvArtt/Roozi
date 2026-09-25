import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { filter, map, take, timeout, catchError, of } from "rxjs";

import { AuthService } from "@core/services/auth/auth-service";
import { User } from "@core/models";

export const guestGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);


    const snapshot = authService.currentUserSnapshot;
    if (snapshot) {
        if (snapshot.type === 'operator') {
            router.navigate(['/operadora/dashboard']);
        } else {
            router.navigate(['/dashboard']);
        }
        return false;
    }

    
    return authService.currentUser$.pipe(
        filter((user): user is User => user !== null),
        take(1),
        map((user) => {
            // Se chegou aqui, o user é garantidamente User (não null)
            if (user.type === 'operator') {
                router.navigate(['/operadora/dashboard']);
            } else {
                router.navigate(['/dashboard']);
            }
            return false;
        }),
        timeout({
            each: 500,
            with: () => {
                // Timeout significa "usuário deslogado" → deixa passar
                return of(true);
            },
        }),
        catchError(() => {
            // Erro também significa "deixa passar"
            return of(true);
        })
    );
};
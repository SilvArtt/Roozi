import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "@core/services/auth/auth-service";
import { filter, map, take, timeout, catchError, of } from "rxjs";

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
        timeout({ each: 500, with: () => of(null) }),
        take(1),
        map((user) => {
            if (user) {
                if (user.type === 'operator') {
                    router.navigate(['/operadora/dashboard']);
                } else {
                    router.navigate(['/dashboard']);
                }
                return false;
            }
            return true;
        }),
        catchError(() => of(true))
    );
};
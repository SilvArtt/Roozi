import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "@core/services/auth/auth-service";
import { map, take } from "rxjs";

export const guestGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
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
        })
    );
};
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ViaCepResult {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
}

@Injectable({
    providedIn: 'root',
})
export class CepService {
    private http = inject(HttpClient);
    private readonly baseUrl = 'https://viacep.com.br/ws';

    buscarCep(cep: string): Observable<ViaCepResult | null> {
        const cepLimpo = cep.replace(/\D/g, '');

        if (cepLimpo.length !== 8) {
            return of(null);
        }

        return this.http.get<any>(`${this.baseUrl}/${cepLimpo}/json/`).pipe(
            map((resposta) => {
                if (resposta.erro) {
                    return null;
                }

                return {
                    street: resposta.logradouro || '',
                    neighborhood: resposta.bairro || '',
                    city: resposta.localidade || '',
                    state: resposta.uf || '',
                } as ViaCepResult;
            }),
            catchError(() => of(null))
        );
    }
}
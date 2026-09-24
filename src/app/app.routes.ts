import { Routes } from '@angular/router';
import { authGuard } from '@core/guard/auth-guard';
import { guestGuard } from '@core/guard/guest-guard';
import { operatorGuard } from '@core/guard/operator-guard';

export const routes: Routes = [
    // ─── Públicas ───
    {
        path: '',
        loadComponent: () => import('./pages/index/index').then(m => m.Index)
    },
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/login/login').then(m => m.Login)
    },
    {
        path: 'cadastro',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/cadastro/cadastro').then(m => m.Cadastro)
    },

    // ─── Passageiro ───
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard)
    },
    {
        path: 'solicitacao',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/solicitacao/solicitacao').then(m => m.Solicitacao)
    },
    {
        path: 'recarga',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/recarga/recarga').then(m => m.Recarga)
    },
    {
        path: 'bloqueio',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/bloqueio/bloqueio').then(m => m.Bloqueio)
    },

    // ─── Operadora ───
    {
        path: 'operadora/dashboard',
        canActivate: [operatorGuard],
        loadComponent: () => import('./pages/pages-operators/dashboard/operator-dashboard/operator-dashboard').then(m => m.OperatorDashboard)
    },
    {
        path: 'operadora/cartoes',
        canActivate: [operatorGuard],
        loadComponent: () => import('./pages/pages-operators/cartoes/gerenciamento-cartao/gerenciamento-cartao').then(m => m.GerenciamentoCartao)
    },
    {
        path: 'operadora/pedidos',
        canActivate: [operatorGuard],
        loadComponent: () => import('./pages/pages-operators/pedidos/gerenciador-pedidos/gerenciador-pedidos').then(m => m.GerenciadorPedidos)
    },
    {
        path: 'operadora/perfil',
        canActivate: [operatorGuard],
        loadComponent: () => import('./pages/pages-operators/perfil/perfil').then(m => m.Perfil)
    },

    { path: '**', redirectTo: '' }
];
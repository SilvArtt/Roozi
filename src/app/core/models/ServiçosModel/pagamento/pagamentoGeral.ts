export enum PaymentMethod{
    PIX = 'pix',
    CARTAOCREDITO = 'credit-card',
    CARTAODEBITO = 'debit-card',
    BOLETO = 'boleto'
}

export enum PaymentStatus {
    PENDENTE = 'pending',
    FOI_PAGO = 'paid',
    EXPIROU = 'expired',
    CANCELADO = 'canceled',
    FALHOU = 'failed'
}


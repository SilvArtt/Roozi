import {PaymentMethod, PaymentStatus } from "./pagamentoGeral";

type PaymentReferenceType ='card_request' | 'recharge';

export interface PagamentoModel {
    id: string;
    reference_id: string;
    reference_type:PaymentReferenceType;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    total: number;
    items: PaymentSummaryItem[];
    created_at: Date;
    paid_at: Date;
}

export interface PixPayment extends PagamentoModel {
    payment_method: PaymentMethod.PIX;
    pix_code:string;
}

export interface CreditCardPayment extends PagamentoModel {
    payment_method: PaymentMethod.CARTAOCREDITO;
}

export interface DebitCardPayment extends PagamentoModel {
    payment_method: PaymentMethod.CARTAODEBITO;
}

export interface BoletoPayment extends PagamentoModel{
    payment_method: PaymentMethod.BOLETO;
    boleto_code: string;
    boleto_due_date: Date;
}

export type Payment = PixPayment | CreditCardPayment| DebitCardPayment | BoletoPayment;


export interface PaymentSummaryItem {  
    label: string;  
    amount: number;
}

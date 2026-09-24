export interface DeliveryAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export type DeliveryType = 'pickup' | 'home_delivery'

export enum DeliveryStatus {
  PAGAMENTO_PENDENTE = 'pending_payment',
  PROCESSANDO = 'processing',
  EM_CAMINHO = 'shipped',
  ENVIADO = 'delivered',
  CANCELADO = 'cancelled'
}
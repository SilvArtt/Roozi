import { CardType, PassengerCategory } from "../cardEnums";
import { DeliveryAddress, DeliveryStatus, DeliveryType } from "./delivery";

export interface RequisicaoCartaoModel {
    id: string;
    user_id: string;
    operator_id:string;
    area_id: string;
    card_type: CardType;
    passenger_category: PassengerCategory;
    has_cpf_linked:boolean;
    cpf?: string;
    delivery_type?: DeliveryType;
    station?: string;
    address?: DeliveryAddress;
    status: DeliveryStatus;
    card_code?: string;
    card_id?: string;
    created_at: Date;
    updated_at?: Date;
}

export interface RequisicaoPayLoad {
    user_id: string;
    area_id: string;
    operator_id:string;
    card_type: CardType;
    passenger_category: PassengerCategory;
    has_cpf_linked:boolean;
    cpf?: string;
    delivery_type?: DeliveryType;
    station?: string;
    address?: DeliveryAddress;
    lgpd_consent: boolean;
}


export enum PedidoStatus {
    AGUARDANDO_APROVACAO = 'pending_payment',
    APROVADO = 'processing',
    ENTREGUE = 'shipped',
    CANCELADO = 'cancelled',
}


export interface MeuPedido {
    id: string;
    operator_id: string;
    operator_name: string;      
    card_type: CardType;
    passenger_category: PassengerCategory;
    status: PedidoStatus;
    card_code?: string;
    card_id?:string;         
    is_virtual: boolean;
    created_at: Date;
}

import { CardType, PassengerCategory } from "../cardEnums";
import { DeliveryAddress, DeliveryStatus, DeliveryType } from "./delivery";

export interface RequisicaoCartaoModel {
    id: string;
    user_id: string;
    operator_id:string;
    area_id: string;
    card_type: CardType;
    passenger_category: PassengerCategory;
    cpf?: string;
    delivery_type: DeliveryType;
    station?: string;
    address?: DeliveryAddress;
    status: DeliveryStatus;
    created_at: Date;
}

export interface RequisicaoPayLoad {
    user_id: string;
    area_id: string;
    operator_id:string;
    card_type: CardType;
    passenger_category: PassengerCategory;
    cpf?: string;
    delivery_type: DeliveryType;
    station?: string;
    address?: DeliveryAddress;
    lgpd_consent: boolean;
}

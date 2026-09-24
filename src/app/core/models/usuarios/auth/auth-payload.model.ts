import { CardType, PassengerCategory } from "../../cartão/cardEnums";

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPassengerPayload {
    email: string;
    password:string;
    full_name: string; 
    username: string; 
    phone?: string; 
    cpf?: string;
    lgpd_consent: boolean;
}

export interface RegisterOperatorPayload {
  email: string;
  password:string;
  manager_name: string;
  company_name: string;
  cnpj: string;
  area_ids: string[];
  billing_system?: string;
  company_phone: string;
  available_card_types: CardType[];
  available_categories: PassengerCategory[];
  lgpd_consent: boolean;
}

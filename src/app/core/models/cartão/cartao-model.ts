import { CardStatus, CardType, PassengerCategory } from "./cardEnums";

export interface CartaoModel {
  id: string;
  user_id: string;
  operator_id: string;
  operator_name: string;

  nickname: string;
  card_code:string;
  masked_number: string;

  card_type: CardType;
  card_status: CardStatus;
  balance: number;
  frozen_balance?: number;     
  blocked_at?: Date;      
  transferred_to?: string;

  passenger_category: PassengerCategory;

  created_at: Date;
  updated_at: Date;
}

export interface AddCardPayload {  
   nickname: string;  
   card_code: string;  
   operator_id: string;  
   card_type: CardType;
}



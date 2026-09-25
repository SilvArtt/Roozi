import { CardType, PassengerCategory } from "./cartão/cardEnums";

export type OperatorStatus = 'active' | 'pending' | 'suspended';

export interface OperatorCompany {
    id: string;
    user_id: string;
    company_name: string;
    area_ids: string[];
    available_card_types: CardType[];
    available_categories: PassengerCategory[];
    billing_system?: string;
    status: OperatorStatus;
    created_at: Date;
    updated_at: Date;
}
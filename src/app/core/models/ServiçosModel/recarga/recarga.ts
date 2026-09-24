import { PaymentMethod, PaymentStatus} from "../pagamento/pagamentoGeral";
import { RechargeStatus } from "./recargaStatus";

export interface Recarga {
    id: string;
    card_id: string; //fk
    user_id: string; //fk
    amount: number;
    payment_method: PaymentMethod;
    payment_status:PaymentStatus;
    recarga_status: RechargeStatus;
    created_at: Date;
    confirmed_at?: Date;
}

export interface RechargePayload {  
    card_id: string;  
    amount: number;  
    payment_method: PaymentMethod;
}

import { CardType } from "../../cartão/cardEnums";
import { BlockReason, BlockStatus} from "./blockRequestEnum";

export interface BlockRequestModel {
    id: string;
    card_id: string;
    user_id: string;
    operator_id: string;
    holder_name: string;
    card_type: CardType;
    has_cpf_linked: boolean;
    cpf?: string;
    reason: BlockReason;
    other_reason?: string;
    status: BlockStatus;
    created_at: Date;
}

export interface BlockRequestPayload{
    card_code:string;
    holder_name:string;
    card_type:CardType;
    has_cpf_linked:boolean;
    cpf?: string;
    reason: BlockReason;
    other_reason?:string;
    confirm_block: boolean;
}
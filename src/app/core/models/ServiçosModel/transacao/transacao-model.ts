import { TimeFilter,  TransactionTypeFilter} from "./filter";
import { tipoTransacao } from "./transacaoEnum";

export interface TransacaoModel {
    id: string;
    card_id: string; //fk
    user_id: string; //fk
    amount:number;
    type: tipoTransacao;
    title: string;
    description?:string;
    date:Date;
    icon:string;
}

export interface TransacaoFilter{
    card_id?: string;
    time_filter: TimeFilter;
    type: TransactionTypeFilter;
    start_date?: Date;
    end_date?: Date;
}


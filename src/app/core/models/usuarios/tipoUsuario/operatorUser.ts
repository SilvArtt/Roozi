import { UserModel } from "../usuarioModel";

export interface Operator extends UserModel {
    type: 'operator';
    manager_name: string;
    company_name: string;
    company_phone: string;  
    cnpj: string; 
    lgpd_consent: boolean;
}
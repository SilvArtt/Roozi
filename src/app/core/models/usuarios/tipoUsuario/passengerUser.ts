import { UserModel } from "../usuarioModel";

export interface Passenger extends UserModel{
    type:'passenger';
    full_name: string;
    username: string;
    phone?: string;
    cpf?: string;
    lgpd_consent: boolean;
}
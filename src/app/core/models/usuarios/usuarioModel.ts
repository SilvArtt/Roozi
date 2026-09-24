import { Passenger } from "./tipoUsuario/passengerUser";
import { userType } from "./tipoUsuario/userTypes";
import { Operator } from "./tipoUsuario/operatorUser";


export interface UserModel {
     id: string,
     type: userType,
     email: string,
     created_at: Date,
     updated_at: Date,
}

export type User = Passenger | Operator;

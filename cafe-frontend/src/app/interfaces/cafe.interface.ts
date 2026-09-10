import { Tipo } from "./tipo.interface"

export interface Cafe {
    id: number;
    name: string;
    description: string;
    tipo: Tipo;
}
import { createContext, Dispatch, SetStateAction } from "react";

export interface ContractData {
    networkId: number;
    deployedNetwork: any;
    instance: any;
}
export const contractDataCtx = createContext<
    [ContractData | null, Dispatch<SetStateAction<ContractData | null>>]
>(undefined as any);

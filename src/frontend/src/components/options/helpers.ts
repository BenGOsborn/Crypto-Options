import { createContext, Dispatch, SetStateAction } from "react";

export interface Option {
    id: number;
    expiry: number;
    status: "none" | "exercised" | "collected";
    writer: string;
    owner: string;
    tokenAddress: string;
    strikePrice: number;
    type: "call" | "put";
}

// Option to sell context
export const sellOptionContext = createContext<
    [Option | null, Dispatch<SetStateAction<Option | null>>]
>(undefined as any);

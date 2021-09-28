import { createContext, Dispatch, SetStateAction } from "react";

export interface OptionsMarket {
    optionsMarket: any;
    address: string;
    baseUnitAmount: number;
    tradeCurrency: any;
    tradeCurrencyDecimals: number;
}

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

// Options contract context
export const optionsMarketContext = createContext<
    [OptionsMarket | null, Dispatch<SetStateAction<OptionsMarket | null>>]
>(undefined as any);

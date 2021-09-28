import { createContext, Dispatch, SetStateAction } from "react";

export interface OptionsMarket {
    optionsMarket: any;
    address: string;
    baseUnitAmount: number;
    tradeCurrency: any;
    tradeCurrencyDecimals: number;
}

// Options contract context
export const optionsMarketContext = createContext<
    [OptionsMarket | null, Dispatch<SetStateAction<OptionsMarket | null>>]
>(undefined as any);

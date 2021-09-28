import { createContext, Dispatch, SetStateAction } from "react";

export interface OptionsMarket {
    optionsMarket: any;
    address: string;
    baseUnitAmount: number;
    tradeCurrency: string;
}

// Options contract context
export const selectorContext = createContext<
    [OptionsMarket | null, Dispatch<SetStateAction<OptionsMarket | null>>]
>(undefined as any);

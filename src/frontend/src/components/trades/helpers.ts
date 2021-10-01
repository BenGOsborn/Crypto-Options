import { createContext, Dispatch, SetStateAction } from "react";

export interface Trade {
    id: number;
    optionId: number;
    premium: string;
    tradeStatus: string;
    expiry: number;
    writer: string;
    tokenAddress: string;
    strikePrice: string;
    type: string;
}

export const tradesContext = createContext<[Trade[], Dispatch<SetStateAction<Trade[]>>]>(undefined as any);

export const userTradesContext = createContext<[Trade[], Dispatch<SetStateAction<Trade[]>>]>(undefined as any);

export const buyTradeContext = createContext<[Trade | null, Dispatch<SetStateAction<Trade | null>>]>(undefined as any);

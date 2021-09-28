import { createContext, Dispatch, SetStateAction } from "react";

export interface Trade {
    id: number;
    optionId: number;
    tradePrice: number;
    tradeStatus: string;
    expiry: number;
    writer: string;
    tokenAddress: string;
    price: number;
    type: string;
}

export interface SearchFilter {
    optionType: "call" | "put" | "any";
    tokenAddress: string;
    tradeStatus: "open" | "closed" | "cancelled" | "any";
    writtenByUser: "true" | "false" | "any";
    expiryDateStart: number;
    expiryDateEnd: number;
}

export const tradesContext = createContext<
    [Trade[], Dispatch<SetStateAction<Trade[]>>]
>(undefined as any);

export const userTradesContext = createContext<
    [Trade[], Dispatch<SetStateAction<Trade[]>>]
>(undefined as any);

export const buyTradeContext = createContext<
    [Trade | null, Dispatch<SetStateAction<Trade | null>>]
>(undefined as any);

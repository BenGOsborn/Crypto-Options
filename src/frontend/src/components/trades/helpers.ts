export interface Trade {
    id: number;
    optionId: number;
    tradePrice: number;
    tradeStatus: string;
    expiry: number;
    writer: string;
    tokenAddress: string;
    amount: number;
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

import { createContext, Dispatch, SetStateAction } from "react";

// Shopping cart context
export const selectorContext = createContext<
    [string, Dispatch<SetStateAction<string>>]
>(undefined as any);

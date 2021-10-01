-   Implement the market with some kind of stable coin (what would be the problem with trading using ETH if ETH's price fluctuates ?)
-   Deploy to multiple networks with the same ABI

-   Add a way of limiting the size of the tables height with a scroll bar
-   Add labels for the different sections
-   Write more tests / clean them up
-   Update the states when an option is added / removed
-   Filter by status instead of "unavailable"
-   Remove trade status from the non user trades

-   Maybe add some type of bid system where if one person offers to execute the trade, it is held in limbo and lets other people bid on it for more, after a short amount of time this option will be transferred to them and unlocked ?
    -   I could make a bidding system where people can submit bids to an order, and then after a certain expiration date then a person can go through, execute those trades, and then pay a portion of the bids paid to the person. The amount that the trade is listed for will be the bid price, and it will be the minimum they can pay for that trade

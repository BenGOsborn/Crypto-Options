-   Implement the market with some kind of stable coin (what would be the problem with trading using ETH if ETH's price fluctuates ?)
-   Deploy to multiple networks with the same ABI

-   Write more tests / clean them up
-   Redeploy new version of contract to ropsten

-   Fix the broken part of collecting and updating the list when an option is exercised / sold

-   Maybe add some type of bid system where if one person offers to execute the trade, it is held in limbo and lets other people bid on it for more, after a short amount of time this option will be transferred to them and unlocked ?
    -   I could make a bidding system where people can submit bids to an order, and then after a certain expiration date then a person can go through, execute those trades, and then pay a portion of the bids paid to the person. The amount that the trade is listed for will be the bid price, and it will be the minimum they can pay for that trade

-   Instead of having the number of coins per option be determined, allow the user to go through and write multiple options in the same transaction each with a fixed amount of the token
-   Please try and make some sort of orderbook that automatically calculates the price of the option in DAI (I need some way of getting implied volatility though)

-   Implement the market with some kind of stable coin (what would be the problem with trading using ETH if ETH's price fluctuates ?)
-   Maybe seperate contracts into a trade contract and an option contract
-   Deploy to multiple networks with the same ABI
-   Migrate contract to external, calldata, storage for better gas costs

-   Prevent the web socket from adding adding the same item more than once ?
-   Add a price range as a filter
-   Add a way of limiting the size of the tables height with a scroll bar
-   Add labels for the different sections
-   Update labels to sell option section and write options and trade and such
-   Make new account on metamask to test with ?

-   Write more tests / clean them up
-   Add in the decimals when specifying token amounts (and round them down from the frontend)
-   Implement some method that allows an admin to stop trades and new options from being written allowing the legacyfying of the old contract

-   It appears there is a problem with its ability to determine a date ?

-   Maybe add some type of bid system where if one person offers to execute the trade, it is held in limbo and lets other people bid on it for more, after a short amount of time this option will be transferred to them and unlocked ?

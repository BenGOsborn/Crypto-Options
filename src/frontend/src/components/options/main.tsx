function Options() {
    return (
        <div className="options">
            {sellOption !== null ? (
                <div className="bg-black bg-opacity-80 fixed inset-0 flex items-center justify-center">
                    <div className="mx-auto sm:w-2/5 w-4/5 min-w-min bg-white rounded-xl shadow-md p-6">
                        <h2 className="font-bold text-xl uppercase text-gray-900">
                            Sell Option
                        </h2>
                        {/* **** I NEED TO WRITE CUSTOM MESSAGES FOR A CALL OPTION AND A PUT OPTION AS AN OPTION WRITER AND NON OPTION WRITER */}
                        {sellOption.type === "call" ? (
                            sellOption.writer === account ? (
                                <p className="text-gray-500">
                                    When someone buys your option, they will
                                    have the right to exercise that option for
                                    the strike price you set for the option.
                                    Note that we will also take a three percent
                                    transaction of the trade price when the
                                    trade is executed.
                                </p>
                            ) : (
                                <p className="text-gray-500">
                                    When someone buys your option, they will
                                    have the right to exercise that option for
                                    the strike price you set for the option.
                                    Note that we will also take a three percent
                                    transaction of the trade price when the
                                    trade is executed.
                                </p>
                            )
                        ) : sellOption.writer === account ? (
                            <p className="text-gray-500">
                                When someone buys your option, they will have
                                the right to exercise that option for the strike
                                price you set for the option. Note that we will
                                also take a three percent transaction of the
                                trade price when the trade is executed.
                            </p>
                        ) : (
                            <p className="text-gray-500">
                                When someone buys your option, they will have
                                the right to exercise that option for the strike
                                price you set for the option. Note that we will
                                also take a three percent transaction of the
                                trade price when the trade is executed.
                            </p>
                        )}
                        <form
                            onSubmit={async (e) => {
                                // Prevent page from reloading
                                e.preventDefault();
                                // Open an order for the option
                                await optionsMarket.methods
                                    .openTrade(sellOption.id, sellOptionPrice)
                                    .send({ from: account });
                                // Close the modal
                                setSellOption(null);
                            }}
                        >
                            <fieldset className="flex flex-col my-5">
                                <label
                                    className="text-gray-900 font-bold whitespace-nowrap"
                                    htmlFor="tokenPrice"
                                >
                                    Sell Price
                                </label>
                                <input
                                    type="number"
                                    name="tokenPrice"
                                    id="tokenPrice"
                                    placeholder="100"
                                    min={0}
                                    onChange={(e) =>
                                        setSellOptionPrice(
                                            e.target.valueAsNumber
                                        )
                                    }
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </fieldset>
                            <div className="flex flex-row justify-between items-stretch sm:flex-row flex-col sm:space-y-0 space-y-4 sm:space-x-4">
                                <input
                                    className="transition duration-100 cursor-pointer bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-16"
                                    type="submit"
                                    value="Sell"
                                />
                                <button
                                    onClick={(e) => {
                                        setSellOption(null);
                                    }}
                                    className="transition duration-100 cursor-pointer bg-transparent border-gray-500 border hover:border-gray-700 text-gray-500 hover:text-gray-700 font-bold rounded py-2 px-8"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default Options;

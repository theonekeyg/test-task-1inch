## Description

This is a test task for a Backend Engineer position at 1inch - [Test Task](./Test%20task%20-%20Backend%20Engineer.docx.pdf).

## Solution

The solution provides implementation that fully suffices the requirements of the task (N - requirement, A - answer):

**1.** You cannot use on-chain functions to get return amount. You can only get state metadata for off-chain calculation (e.g. balances). You need to implement the math on backend side.

**A:** Solution uses `ERC20.balanceOf(pair)` to get reserves for the pair, and uses the following formula for output amount calculation: $amountOut = \frac{amountIn * 997 * reserveOut}{amountIn * 997 + reserveIn * 1000}$, correctly including uniswap fee into calculation.

----------------------------------------------------------------------

**2.** You can only use ethers or web3 libraries to communicate with blockchain and perform off-chain calculations.

**A:** Solution uses ethers v6 to communicate with blockchain. For interaction with contracts I used [typechain](https://www.npmjs.com/package/typechain), it generates type-safe ethers contract bindings from ABIs (see `src/abi` directory), generation script is located in `package.json`.

----------------------------------------------------------------------

**3.** The response time of `/gasPrice` should be not more than 50ms.

**A:** To achieve this latency, solution could not afford to make RPC request during gas price resolution. Instead solution implements background polling of gas price and caches the results. When `/gasPrice` is called, it returns cached value. The response time I get locally is ~14ms. To reproduce the result, start the app with `pnpm run start:prod` and run `pnpm checkGasPriceResponseTime`.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e
```

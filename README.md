## Description

This is a test task for a Backend Engineer position at 1inch - [description](./Test%20task%20-%20Backend%20Engineer.docx.pdf).

## Solution

The solution provides implementation that fully suffices the requirements of the task:

* You cannot use on-chain functions to get return amount. You can only get state metadata for off-chain calculation (e.g. balances). You need to implement the math on backend side
- Solution uses ERC20.balanceOf(pair) to get reserves for the pair, correctly includes the uniswap fee into calculation

* You can only use ethers or web3 libraries to communicate with blockchain and perform off-chain calculations
- Solution uses ethers v6 to communicate with blockchain. For interaction with contracts I used typechain, that generate type-safe bindings from ABIs (see src/abi directory), generation script is in package.json.

* The response time of `/gasPrice` should be not more than 50ms
- Solution implements background polling of gas price. When `/gasPrice` is called, it returns cached value. The response time I get locally is ~14ms, to reproduce the result, start the app with `pnpm run start:prod` and run `pnpm checkGasPriceResponseTime`

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

# test coverage
$ pnpm run test:cov
```
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { APP_CONFIG } from '../src/config';

// Hoist-safe mock for ethers' JsonRpcProvider
jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  const sendMock = jest.fn();
  const JsonRpcProviderMock = jest.fn().mockImplementation(() => ({
    send: sendMock, // not used by UniswapService path, but harmless
  }));
  return {
    ...actual,
    __esModule: true,
    JsonRpcProvider: JsonRpcProviderMock,
    _mocks: { sendMock, JsonRpcProviderMock },
  };
});

// Mock the ABI factories used by UniswapService
// Service imports from '../abi', but from test location it resolves to '../src/abi'
jest.mock('../src/abi', () => {
  // We'll create simple in-memory mocks that return deterministic values
  const factoryConnectMock = jest.fn();
  const erc20ConnectMock = jest.fn();

  return {
    __esModule: true,
    UniswapV2Factory__factory: { connect: factoryConnectMock },
    ERC20__factory: { connect: erc20ConnectMock },
    _mocks: { factoryConnectMock, erc20ConnectMock },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const abiMocks = require('../src/abi')._mocks;

import { AppModule } from './../src/app.module';

describe('Uniswap (e2e)', () => {
  let app: INestApplication<App>;

  // Test constants
  const fromToken = '0xdac17f958d2ee523a2206206994597c13d831ec7';
  const toToken = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  const pairAddress = '0x3333333333333333333333333333333333333333';
  const amountIn = 1000n;
  const reserveIn = 3000000n;
  const reserveOut = 3500000n;

  beforeEach(async () => {
    // Reset and wire ABI mocks for each test
    abiMocks.factoryConnectMock.mockReset();
    abiMocks.erc20ConnectMock.mockReset();

    // Mock UniswapV2Factory contract
    const factoryContract = {
      getPair: jest.fn().mockResolvedValue(pairAddress),
    };
    abiMocks.factoryConnectMock.mockReturnValue(factoryContract);

    // Mock ERC20 token contracts by address
    const erc20ByAddress: Record<string, any> = {};
    erc20ByAddress[fromToken] = {
      balanceOf: jest.fn().mockResolvedValue(reserveIn),
    };
    erc20ByAddress[toToken] = {
      balanceOf: jest.fn().mockResolvedValue(reserveOut),
    };
    abiMocks.erc20ConnectMock.mockImplementation((address: string) => erc20ByAddress[address]);

    const moduleBuilder = await Test.createTestingModule({
      imports: [AppModule],
    });

    // Override config to avoid relying on process.env
    moduleBuilder.overrideProvider(APP_CONFIG).useValue({
      ETH_RPC_URL: 'http://localhost:8545',
      PORT: 3000,
      GAS_FETCH_INTERVAL_MS: 1000,
      UNISWAP_V2_FACTORY_ADDRESS: '0x0000000000000000000000000000000000000000',
    });

    const moduleFixture: TestingModule = await moduleBuilder.compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });
  
  it('GET /return/:from/:to/:amountIn computes outputAmount using reserves', async () => {
    // Expected output per UniswapService formula
    const expected = "1162";

    const res = await request(app.getHttpServer())
      .get(`/return/${fromToken}/${toToken}/${amountIn.toString()}`)
      .expect(200);

    expect(res.body).toEqual({ outputAmount: expected });
  });

  it('GET /return returns error when no pair exists', async () => {
    // Rewire factory to return zero address -> should throw
    const zero = '0x0000000000000000000000000000000000000000';
    abiMocks.factoryConnectMock.mockReturnValueOnce({
      getPair: jest.fn().mockResolvedValue(zero),
    });

    // Need new app instance to pick up rewired factory mock
    await app.close();
    const moduleBuilder = await Test.createTestingModule({
      imports: [AppModule],
    });
    moduleBuilder.overrideProvider(APP_CONFIG).useValue({
      ETH_RPC_URL: 'http://localhost:8545',
      PORT: 3000,
      GAS_FETCH_INTERVAL_MS: 1000,
      UNISWAP_V2_FACTORY_ADDRESS: '0x0000000000000000000000000000000000000000',
    });
    const moduleFixture: TestingModule = await moduleBuilder.compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer())
      .get(`/return/${fromToken}/${toToken}/${amountIn.toString()}`)
      .expect(404);

    // Nest default error body contains statusCode and message
    expect(res.body.message).toContain('No pair found for the given token addresses');
  });
});


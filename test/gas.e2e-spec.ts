import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { APP_CONFIG } from '../src/config';

// Hoist-safe mock for JsonRpcProvider that preserves the rest of ethers module
jest.mock('ethers', () => {
  // Use the real module for everything except JsonRpcProvider
  const actual = jest.requireActual('ethers');
  const sendMock = jest.fn();
  const JsonRpcProviderMock = jest.fn().mockImplementation(() => ({
    send: sendMock,
  }));
  return {
    ...actual,
    __esModule: true,
    JsonRpcProvider: JsonRpcProviderMock,
    _mocks: { sendMock, JsonRpcProviderMock },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ethersMock = require('ethers');
const sendMock: jest.Mock = ethersMock._mocks.sendMock;

import { AppModule } from './../src/app.module';

describe('GasService (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    sendMock.mockReset();
    sendMock.mockResolvedValueOnce('0x3b9aca00'); // 1,000,000,000 wei

    const moduleBuilder = await Test.createTestingModule({
      imports: [AppModule],
    });

    // Override config so tests don't depend on external env
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

  it('GET /gasPrice returns gas price from eth_gasPrice', async () => {
    const res = await request(app.getHttpServer()).get('/gasPrice').expect(200);

    expect(res.body).toEqual({
      gasPriceRaw: '0x3b9aca00',
      gasPrice: parseInt('3b9aca00', 16),
    });
  });
});

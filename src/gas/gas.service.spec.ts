import { Test } from '@nestjs/testing';
import { GasService } from './gas.service';
import { APP_CONFIG, AppConfig } from '../config';

// Mock ethers JsonRpcProvider (avoid referencing variables before init due to jest.mock hoisting)
jest.mock('ethers', () => {
  const sendMock = jest.fn();
  const JsonRpcProviderMock = jest.fn().mockImplementation(() => ({
    send: sendMock,
  }));
  return {
    __esModule: true,
    JsonRpcProvider: JsonRpcProviderMock,
    _mocks: { sendMock, JsonRpcProviderMock },
  };
});

// Access exposed mocks from the mocked module
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ethersMock = require('ethers');
const sendMock: jest.Mock = ethersMock._mocks.sendMock;
const JsonRpcProviderMock: jest.Mock = ethersMock._mocks.JsonRpcProviderMock;

const makeConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  ETH_RPC_URL: 'http://localhost:8545',
  PORT: 3000,
  GAS_FETCH_INTERVAL_MS: 1000,
  UNISWAP_V2_FACTORY_ADDRESS: '0x0000000000000000000000000000000000000000',
  ...overrides,
});

describe('GasService', () => {
  let service: GasService;
  let config: AppConfig;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.spyOn(global, 'setInterval');
    sendMock.mockReset();
    (JsonRpcProviderMock as jest.Mock).mockClear();

    config = makeConfig();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GasService,
        {
          provide: APP_CONFIG,
          useValue: config,
        },
      ],
    }).compile();

    service = moduleRef.get(GasService);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should warm the cache on init and start polling', async () => {
    // Arrange: first response
    sendMock.mockResolvedValueOnce('0x3b9aca00'); // 1 gwei

    // Act: manual lifecycle init
    await service.onModuleInit();

    // Assert: provider created and used
    expect(JsonRpcProviderMock).toHaveBeenCalledWith(config.ETH_RPC_URL);
    expect(sendMock).toHaveBeenCalledWith('eth_gasPrice', []);

    // Cached result should be returned
    const first = await service.getGasPrice();
    expect(first).toEqual({ gasPriceRaw: '0x3b9aca00', gasPrice: parseInt('3b9aca00', 16) });

    // Arrange next poll result
    sendMock.mockResolvedValueOnce('0x4a817c800'); // 20 gwei

    // Advance timer to trigger polling interval
    jest.advanceTimersByTime(config.GAS_FETCH_INTERVAL_MS);

    // Allow pending microtasks to resolve
    await Promise.resolve();

    const second = await service.getGasPrice();
    expect(second).toEqual({ gasPriceRaw: '0x4a817c800', gasPrice: parseInt('4a817c800', 16) });

    // Ensure background polling was scheduled
    expect(setInterval).toHaveBeenCalled();
  });

  it('should keep previous cache on fetch failure', async () => {
    // Seed cache
    sendMock.mockResolvedValueOnce('0x1');
    await service.onModuleInit();
    const seeded = await service.getGasPrice();
    expect(seeded).toEqual({ gasPriceRaw: '0x1', gasPrice: 1 });

    // Next polling fails
    const { Logger } = require('@nestjs/common');
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    sendMock.mockRejectedValueOnce(new Error('rpc down'));

    jest.advanceTimersByTime(config.GAS_FETCH_INTERVAL_MS);
    await Promise.resolve();

    const afterFail = await service.getGasPrice();
    expect(afterFail).toEqual(seeded); // unchanged
  });

  it('should clear interval on destroy (no further polls)', async () => {
    // Warm once
    sendMock.mockResolvedValueOnce('0x2');
    await service.onModuleInit();

    // Clear interval
    service.onModuleDestroy();

    // Advance timers; no additional send calls should occur
    const callsBefore = sendMock.mock.calls.length;
    jest.advanceTimersByTime(config.GAS_FETCH_INTERVAL_MS * 3);
    await Promise.resolve();
    const callsAfter = sendMock.mock.calls.length;

    expect(callsAfter).toBe(callsBefore);
  });

  it('getGasPrice triggers immediate fetch if cache empty', async () => {
    // When cache is empty, getGasPrice should attempt to update once
    sendMock.mockResolvedValueOnce('0x5');

    const res = await service.getGasPrice();
    expect(sendMock).toHaveBeenCalledWith('eth_gasPrice', []);
    expect(res).toEqual({ gasPriceRaw: '0x5', gasPrice: 5 });
  });
});

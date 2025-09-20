import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const EthAddressParam = createParamDecorator(
  (paramName: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const value: string | undefined = req.params?.[paramName];

    const pattern = /^0x[a-fA-F0-9]{40}$/;
    if (!value || !pattern.test(value)) {
      throw new BadRequestException(
        `Invalid Ethereum address for "${paramName}": ${value}. Expected format: 0x[a-fA-F0-9]{40}`,
      );
    }
    return value;
  },
);
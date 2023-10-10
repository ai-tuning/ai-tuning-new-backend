import { BadRequestException, ValidationPipe } from '@nestjs/common';

export const customValidationPipe = async (data: any[], dto: any) => {
  const validationPipe = new ValidationPipe({
    transform: true,

    exceptionFactory: (errors) => {
      console.log(errors);
      throw new BadRequestException(errors);
    },
  });
  return await Promise.all(
    data.map((item: any) => {
      return validationPipe.transform(item, { metatype: dto, type: 'body' });
    }),
  );
};

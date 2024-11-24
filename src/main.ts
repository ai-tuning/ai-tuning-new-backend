import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import {
  AllExceptionFilter,
  I18nInterceptor,
  ErrorFormatter,
} from './features/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api/v1'); //route prefix
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      transform: true,
      enableDebugMessages: true,
      forbidNonWhitelisted: true,
      validationError: {
        target: false,
        value: false,
      },
      validateCustomDecorators: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,

      exceptionFactory: (errors) => {
        const errorObject = ErrorFormatter(errors); //convert validation error message
        throw new BadRequestException(errorObject);
      },
    }),
  );

  const yamlContent = fs.readFileSync(
    path.join(process.cwd(), 'docs.yaml'),
    'utf-8',
  );
  const document: OpenAPIObject = yaml.load(yamlContent) as OpenAPIObject;

  SwaggerModule.setup('/api-docs', app, document);
  const httpAdapter = app.get(HttpAdapterHost);

  app.useGlobalFilters(new AllExceptionFilter(httpAdapter));

  app.useGlobalInterceptors(new I18nInterceptor());

  await app.listen(5050);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

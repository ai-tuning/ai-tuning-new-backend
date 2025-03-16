import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';

import { BadRequestException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import { AllExceptionFilter, I18nInterceptor, ErrorFormatter } from './features/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const origins = [
    'https://admin.ai-tuningfiles.com',
    'https://portal.ai-tuningfiles.com',
    'https://portal.tuningfile-server.com',
  ];

  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:4000');
  }

  app.enableCors({
    origin: origins,
    credentials: true,
  });
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

  const yamlContent = fs.readFileSync(path.join(process.cwd(), 'docs.yaml'), 'utf-8');
  const document: OpenAPIObject = yaml.load(yamlContent) as OpenAPIObject;
  SwaggerModule.setup('/api-docs', app, document);
  const httpAdapter = app.get(HttpAdapterHost);
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  app.use(compression());
  app.use(helmet());
  app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
  app.use(cookieParser(config.get<string>('cookie_secret')));
  app.useGlobalFilters(new AllExceptionFilter(httpAdapter));
  app.useGlobalInterceptors(new I18nInterceptor());
  await app.listen(2600);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

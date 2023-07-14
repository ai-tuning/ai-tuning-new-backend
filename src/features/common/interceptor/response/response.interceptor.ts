import * as express from 'express'
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { I18nContext } from 'nestjs-i18n';

export interface Response<T> {
  data: T;
}

export interface responseValue {
  data: any,
  code: any,
  message?: string
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler,): Observable<any> {
    const ctx = context.switchToHttp()
    const response = ctx.getResponse<express.Response>()
    const i18n = I18nContext.current()

    return next.handle().pipe(map(data => {
      if (data) {
        const returnValue: responseValue = { data: data.message ? data.data : data, code: response.statusCode, message: data.message }

        if (data.message) returnValue.message = i18n.t(`${i18n.lang}.${data.message}`).replace(/en\.|bn\./g, "") //remove en. and bn. if the translated value not found
        return returnValue
      } else {
        return {
          data: null
        }
      }

    }))
  }
}

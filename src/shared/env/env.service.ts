import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EnvSchema } from './env.schema'

@Injectable()
export class EnvService {
  constructor(private readonly configService: ConfigService) {}
  get<K extends keyof EnvSchema>(key: K): EnvSchema[K] {
    const value = this.configService.get(key);
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value as EnvSchema[K];
  }
}

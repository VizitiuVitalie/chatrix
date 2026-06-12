import * as Joi from 'joi';
import { NODE_ENV } from '../../common/enums/node-env.enum';

export interface EnvVars {
  NODE_ENV: NODE_ENV;

  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  POSTGRES_SCHEMA: string;

  BACKEND_PORT: number;
  FRONTEND_ORIGIN: string;

  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TTL: string;
  REFRESH_TTL: string;

  COOKIE_DOMAIN: string;
  COOKIE_DOMAIN_LEGACY: string;
  COOKIE_SECURE: boolean;

  S3_ENDPOINT: string;
  S3_PORT: number;
  S3_CONSOLE_PORT: number;
  S3_REGION: string;
  S3_BUCKET: string;
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
  S3_PUBLIC_URL: string;
  MAX_UPLOAD_SIZE_MB: number;
  DEFAULT_USER_QUOTA_MB: number;

  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}

export const envValidationSchema = Joi.object<EnvVars>({
  NODE_ENV: Joi.string()
    .valid(...Object.values(NODE_ENV))
    .default(NODE_ENV.DEVELOPMENT),

  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_SCHEMA: Joi.string().required(),

  BACKEND_PORT: Joi.number().required(),
  FRONTEND_ORIGIN: Joi.string().required(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_TTL: Joi.string().required(),
  REFRESH_TTL: Joi.string().required(),

  COOKIE_DOMAIN: Joi.string().allow('').required(),
  COOKIE_DOMAIN_LEGACY: Joi.string().allow('').default(''),
  COOKIE_SECURE: Joi.boolean().default(false),

  S3_ENDPOINT: Joi.string().uri().required(),
  S3_PORT: Joi.number().default(9000),
  S3_CONSOLE_PORT: Joi.number().default(9001),
  S3_REGION: Joi.string().default('us-east-1'),
  S3_BUCKET: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_PUBLIC_URL: Joi.string().uri().required(),
  MAX_UPLOAD_SIZE_MB: Joi.number().default(25),
  DEFAULT_USER_QUOTA_MB: Joi.number().default(500),

  VAPID_PUBLIC_KEY: Joi.string().required(),
  VAPID_PRIVATE_KEY: Joi.string().required(),
  VAPID_SUBJECT: Joi.string()
    .pattern(/^(mailto:|https:\/\/)/)
    .required(),
});

export const validateEnv = (rawEnv: NodeJS.ProcessEnv): EnvVars => {
  const result = envValidationSchema.validate(rawEnv, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (result.error) {
    throw new Error(`Env validation failed: ${result.error.message}`);
  }

  return result.value;
};

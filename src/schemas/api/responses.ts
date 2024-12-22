import { createApiListResponseSchema, createApiResponseSchema } from '@/schemas/api/base';
import {
  accountSchema,
  apiTokenSchema,
  checkAuthDetailsSchema,
} from '@/schemas/api/endpoints/account';
import { concealDataSchema } from '@/schemas/api/endpoints/secrets';
import { customDomainSchema, customerSchema } from '@/schemas/models';
import { colonelDataResponseSchema } from '@/schemas/models/colonel';
import { brandSettingschema, imagePropsSchema } from '@/schemas/models/domain/brand';
import { metadataDetailsSchema, metadataSchema } from '@/schemas/models/metadata';
import { secretDetailsSchema, secretSchema } from '@/schemas/models/secret';
import { z } from 'zod';

export interface AsyncDataResult<T> {
  data: T | null;
  error: string | null;
  status: number | null;
}

// Specific metadata response schema with properly typed details
export const metadataRecordResponseSchema = createApiResponseSchema(
  metadataSchema,
  metadataDetailsSchema
);
export const metadataRecordsResponseSchema = createApiListResponseSchema(metadataSchema);

// Specialized secret response schema
export const secretRecordResponseSchema = createApiResponseSchema(
  secretSchema,
  secretDetailsSchema.optional()
);

// Model-specific response schemas
export const customerResponseSchema = createApiResponseSchema(
  customerSchema,
  checkAuthDetailsSchema
);
export const apiTokenResponseSchema = createApiResponseSchema(apiTokenSchema);
export const customDomainResponseSchema = createApiResponseSchema(customDomainSchema);
export const customDomainRecordsResponseSchema = createApiListResponseSchema(customDomainSchema);
export const accountResponseSchema = createApiResponseSchema(accountSchema);
export const concealDataResponseSchema = createApiResponseSchema(concealDataSchema);
export const checkAuthDataResponseSchema = createApiResponseSchema(customerSchema);
export const brandSettingsResponseSchema = createApiResponseSchema(brandSettingschema);
export const imagePropsResponseSchema = createApiResponseSchema(imagePropsSchema);

/**
 * Response type exports combining API structure with transformed app types
 * These types represent the shape after schema transformation
 */
export type ApiTokenApiResponse = z.infer<typeof apiTokenResponseSchema>;
export type CustomDomainApiResponse = z.infer<typeof customDomainResponseSchema>;
export type CustomerResponse = z.infer<typeof customerResponseSchema>;
export type AccountApiResponse = z.infer<typeof accountResponseSchema>;
export type MetadataRecordApiResponse = z.infer<typeof metadataRecordResponseSchema>;
export type SecretRecordApiResponse = z.infer<typeof secretRecordResponseSchema>;
export type ConcealDataApiResponse = z.infer<typeof concealDataResponseSchema>;
export type CheckAuthDataApiResponse = z.infer<typeof checkAuthDataResponseSchema>;
export type BrandSettingsApiResponse = z.infer<typeof brandSettingsResponseSchema>;
export type ImagePropsApiResponse = z.infer<typeof imagePropsResponseSchema>;
export type CustomDomainRecordsApiResponse = z.infer<typeof customDomainRecordsResponseSchema>;
export type UpdateDomainBrandResponse = z.infer<typeof customDomainResponseSchema>;

// Colonel response types
export type ColonelDataApiResponse = z.infer<typeof colonelDataResponseSchema>;

export const CsrfResponse = z.object({
  isValid: z.boolean(),
  shrimp: z.string().optional(),
});

export type TCsrfResponse = z.infer<typeof CsrfResponse>;

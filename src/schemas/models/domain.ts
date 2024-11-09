// src/schemas/models/domain.ts
import { baseApiRecordSchema } from '@/schemas/base'
import { booleanFromString } from '@/utils/transforms'
import { z } from 'zod'

import { brandSettingsInputSchema } from './domain/brand'
import { vhostSchema } from './domain/vhost'

/**
 * @fileoverview Custom domain schema for API transformation boundaries
 *
 * Key Design Decisions:
 * 1. Input schemas handle API -> App transformation
 * 2. App uses single shared type between stores/components
 * 3. No explicit output schemas - serialize when needed
 *
 * Type Flow:
 * API Response (strings) -> InputSchema -> Store/Components -> API Request
 *                          ^                                ^
 *                          |                                |
 *                       transform                       serialize
 *
 * Validation Rules:
 * - Boolean fields come as strings from Ruby/Redis ('true'/'false')
 * - Domain parts must be strings
 * - Optional nested objects (vhost, brand)
 */

// Domain strategy constants and type
export const DomainStrategyValues = {
  CANONICAL: 'canonical',
  SUBDOMAIN: 'subdomain',
  CUSTOM: 'custom',
  INVALID: 'invalid'
} as const

export type DomainStrategy = typeof DomainStrategyValues[keyof typeof DomainStrategyValues]

/**
 * Input schema for custom domain from API
 * - Handles string -> boolean coercion from Ruby/Redis
 * - Validates domain parts
 * - Handles nested objects (vhost, brand)
 */
const customDomainBaseSchema = z.object({
  // Core identifiers
  domainid: z.string(),
  custid: z.string(),

  // Domain parts
  display_domain: z.string(),
  base_domain: z.string(),
  subdomain: z.string(),
  trd: z.string(),
  tld: z.string(),
  sld: z.string(),
  _original_value: z.string(),

  // Boolean fields that come as strings from API
  is_apex: booleanFromString,
  verified: booleanFromString,

  // Validation fields
  txt_validation_host: z.string(),
  txt_validation_value: z.string(),

  // Optional nested objects
  vhost: vhostSchema.optional().or(z.object({}).strict()),
  brand: brandSettingsInputSchema.optional().or(z.object({}).strict()),
})

// Combine base record schema with domain-specific fields
export const customDomainInputSchema = baseApiRecordSchema.merge(customDomainBaseSchema)
//export const customDomainInputSchema = baseApiRecordSchema.merge(
//  customDomainBaseSchema.partial() // Makes all fields optional temporarily
//)

// Export inferred types for use in stores/components
export type CustomDomain = z.infer<typeof customDomainInputSchema>

/**
 * Input schema for domain cluster from API
 * Used for managing domain routing/infrastructure
 */
const customDomainClusterBaseSchema = z.object({
  type: z.string(),
  cluster_ip: z.string(),
  cluster_name: z.string(),
  cluster_host: z.string(),
  vhost_target: z.string()
})

export const customDomainClusterInputSchema = baseApiRecordSchema.merge(customDomainClusterBaseSchema)

export type CustomDomainCluster = z.infer<typeof customDomainClusterInputSchema>

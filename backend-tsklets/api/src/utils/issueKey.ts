import { db } from '../db/index.js'
import { products, productSequences } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// Type code mapping: ticket type -> single letter prefix
const TYPE_CODES: Record<string, string> = {
  epic: 'E',
  feature: 'F',
  task: 'T',
  bug: 'B',
  support: 'S',
  feature_request: 'R',
  spike: 'K',
  note: 'N',
}

// Reverse mapping for validation
const VALID_TYPE_CODES = new Set(Object.values(TYPE_CODES))

/**
 * Generate a nanoUUID for ticket primary key
 * Using 12 characters for good uniqueness while keeping it readable
 */
export function generateTicketId(): string {
  return nanoid(12)
}

/**
 * Get the type code for a ticket type
 * @param type - Ticket type (e.g., 'support', 'feature_request', 'epic')
 * @returns Single letter code (e.g., 'S', 'R', 'E')
 */
export function getTypeCode(type: string): string {
  const code = TYPE_CODES[type]
  if (!code) {
    throw new Error(`Invalid ticket type: ${type}. Valid types: ${Object.keys(TYPE_CODES).join(', ')}`)
  }
  return code
}

/**
 * Generate the next issue key for a product and type
 * Format: {PRODUCT_CODE}-{TYPE_CODE}-{SEQUENCE}
 * Example: TKL-S-001, HRMS-F-023
 *
 * @param productId - Product ID
 * @param type - Ticket type (e.g., 'support', 'epic', 'feature')
 * @returns Promise<{ key: string, id: string }> - The generated key and nanoUUID
 */
export async function generateIssueKey(
  productId: number,
  type: string
): Promise<{ key: string; id: string }> {
  // Get product code
  const [product] = await db
    .select({ code: products.code })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product) {
    throw new Error(`Product not found: ${productId}`)
  }

  if (!product.code) {
    throw new Error(`Product ${productId} has no code defined. Please set a product code first.`)
  }

  const typeCode = getTypeCode(type)

  // Get or create sequence for this product+type combination
  // Use a transaction to ensure atomic increment
  const result = await db.transaction(async (tx) => {
    // Try to get existing sequence
    const [existing] = await tx
      .select({ id: productSequences.id, nextNum: productSequences.nextNum })
      .from(productSequences)
      .where(
        and(
          eq(productSequences.productId, productId),
          eq(productSequences.issueType, typeCode as any)
        )
      )
      .limit(1)

    let sequenceNum: number

    if (existing) {
      // Increment existing sequence
      sequenceNum = existing.nextNum
      await tx
        .update(productSequences)
        .set({ nextNum: sequenceNum + 1 })
        .where(eq(productSequences.id, existing.id))
    } else {
      // Create new sequence for this product+type
      sequenceNum = 1
      await tx.insert(productSequences).values({
        productId,
        issueType: typeCode as any,
        nextNum: 2, // Next one will be 2
      })
    }

    return sequenceNum
  })

  // Format sequence as 3-digit padded number (001, 002, ..., 999, 1000, ...)
  const paddedNum = result.toString().padStart(3, '0')

  // Generate the key and ID
  const key = `${product.code}-${typeCode}-${paddedNum}`
  const id = generateTicketId()

  return { key, id }
}

/**
 * Parse an issue key into its components
 * @param key - Issue key (e.g., 'TKL-S-001')
 * @returns { productCode, typeCode, sequenceNum } or null if invalid
 */
export function parseIssueKey(key: string): {
  productCode: string
  typeCode: string
  sequenceNum: number
} | null {
  const match = key.match(/^([A-Z0-9-]+)-([A-Z])-(\d+)$/)
  if (!match) {
    return null
  }

  const [, productCode, typeCode, seqStr] = match

  if (!VALID_TYPE_CODES.has(typeCode)) {
    return null
  }

  return {
    productCode,
    typeCode,
    sequenceNum: parseInt(seqStr, 10),
  }
}

/**
 * Validate if a string is a valid issue key format
 */
export function isValidIssueKey(key: string): boolean {
  return parseIssueKey(key) !== null
}

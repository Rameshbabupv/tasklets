import { db } from '../db/index.js'
import { products, productSequences } from '../db/schema.js'
import { eq, and, sql } from 'drizzle-orm'

export type IssueType = 'E' | 'F' | 'T' | 'B' | 'S' | 'N'

/**
 * Generate a new issue key with type prefix (e.g., TSKLTS-E001, CSUP-T042)
 * Uses per-product, per-type sequence counters
 */
export async function generateIssueKey(
  productId: number,
  issueType: IssueType
): Promise<string> {
  // Get product code
  const [product] = await db.select({ code: products.code })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product || !product.code) {
    throw new Error(`Product ${productId} not found or has no code`)
  }

  // Try to increment existing sequence
  const [updated] = await db.update(productSequences)
    .set({ nextNum: sql`${productSequences.nextNum} + 1` })
    .where(and(
      eq(productSequences.productId, productId),
      eq(productSequences.issueType, issueType)
    ))
    .returning({ nextNum: productSequences.nextNum })

  let issueNum: number

  if (updated) {
    // Sequence exists, use incremented value - 1 (since we incremented first)
    issueNum = updated.nextNum - 1
  } else {
    // First issue of this type for this product - insert new sequence
    await db.insert(productSequences).values({
      productId,
      issueType,
      nextNum: 2, // Next one will be 2
    })
    issueNum = 1
  }

  return `${product.code}-${issueType}${String(issueNum).padStart(3, '0')}`
}

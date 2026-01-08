/**
 * Extract {{variable}} patterns from config content
 * Returns array of unique variable names found
 */
export interface ExtractedVariable {
  name: string
  description?: string
  defaultValue?: string
}

export function extractVariables(content: string): ExtractedVariable[] {
  const regex = /\{\{(\w+)\}\}/g
  const variables = new Set<string>()
  let match

  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1])
  }

  return Array.from(variables).map(name => ({ name }))
}

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .substring(0, 100)             // Limit length
}

/**
 * Check if a slug is valid (URL-friendly)
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 100
}

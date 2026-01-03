import stringsSimilarity from './stringSimilarity';

/**
 * Normalizes a column name for comparison:
 * - Lowercase
 * - Replace underscores with spaces
 * - Trim whitespace
 * - Collapse multiple spaces to single space
 */
export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/_/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Checks if two column names are an exact match after normalization.
 */
export function isExactMatch(name1: string, name2: string): boolean {
  return normalizeColumnName(name1) === normalizeColumnName(name2);
}

interface SourceColumn {
  index: number;
  name: string;
}

interface TemplateColumn {
  id: string;
  label: string;
}

/**
 * Finds the best column matches using a two-phase approach:
 * 1. Exact matches (after normalization) - these take priority
 * 2. Fuzzy matches (similarity > 0.8) - fallback for remaining columns
 *
 * Returns a mapping of templateId -> sourceIndex
 */
export function findBestColumnMatches(
  sourceColumns: SourceColumn[],
  templateColumns: TemplateColumn[]
): Record<string, number> {
  const mappings: Record<string, number> = {};
  const usedSourceIndices = new Set<number>();

  // Phase 1: Exact matches (priority)
  for (const template of templateColumns) {
    for (const source of sourceColumns) {
      if (usedSourceIndices.has(source.index)) continue;

      if (isExactMatch(source.name, template.label)) {
        mappings[template.id] = source.index;
        usedSourceIndices.add(source.index);
        break;
      }
    }
  }

  // Phase 2: Fuzzy matches (fallback)
  for (const template of templateColumns) {
    if (mappings[template.id] !== undefined) continue;

    for (const source of sourceColumns) {
      if (usedSourceIndices.has(source.index)) continue;

      const similarity = stringsSimilarity(
        source.name.toLowerCase(),
        template.label.toLowerCase()
      );

      if (similarity > 0.8) {
        mappings[template.id] = source.index;
        usedSourceIndices.add(source.index);
        break;
      }
    }
  }

  return mappings;
}

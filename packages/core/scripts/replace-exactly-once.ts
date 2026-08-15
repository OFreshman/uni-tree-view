export function replaceExactlyOnce(
  source: string,
  search: string,
  replacement: string,
  description: string
): string {
  const matchCount = source.split(search).length - 1;
  if (matchCount !== 1) {
    throw new Error(
      `Expected ${description} to match exactly once, but found ${matchCount} matches.`
    );
  }

  return source.replace(search, replacement);
}
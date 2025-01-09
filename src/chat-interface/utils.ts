// parses out everything in ebtween the <thinking> tags in claude's response
export function FilterThinkingContent(text: string): string {
  // More explicit regex pattern
  const thinkingPattern = /<thinking>\s*([\s\S]*?)\s*<\/thinking>/gi;

  // Remove thinking blocks
  const cleaned = text.replace(thinkingPattern, "");

  // Clean up whitespace
  return cleaned
    .replace(/^\s+/, "") // Remove leading whitespace
    .replace(/\s+$/, "") // Remove trailing whitespace
    .replace(/\n{3,}/g, "\n\n") // Normalize multiple newlines
    .trim();
}


/**
 * @fileOverview Utility functions for note processing, usable on client and server.
 */

// Helper function to derive title from content
// It searches for the first line that contains actual text after removing links and tags.
export const deriveTitleFromContent = (content: string): string => {
  if (!content) return "";
  const lines = content.split('\n');
  for (const line of lines) {
    let processedLine = line;
    // Remove [[note:ID]] links
    processedLine = processedLine.replace(/\[\[note:[^\]]+\]\]/g, '');
    // Remove #tags
    processedLine = processedLine.replace(/#([^#\s\/]+(?:\/[^#\s\/]+)*)/g, '');
    processedLine = processedLine.trim();
    if (processedLine.length > 0) {
      return processedLine;
    }
  }
  return ""; // Return empty if no suitable line found
};

// Helper function to extract tags from content
export const extractTagsFromContent = (content: string): string[] => {
  const extracted: string[] = [];
  // Regex updated to allow a wider range of characters in tags, including non-ASCII
  const regex = /#([^#\s\/]+(?:\/[^#\s\/]+)*)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    extracted.push(match[1]);
  }
  return Array.from(new Set(extracted)).sort(); // Remove duplicates and sort
};

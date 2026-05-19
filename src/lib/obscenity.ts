import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import { cuss as italianCuss } from 'cuss/it';

const englishMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

// Solo parole singole (no spazi) con severità >= 1 — le parole a 0 sono falsi positivi (es. "uccello", "finocchio")
const italianWords = Object.entries(italianCuss)
  .filter(([word, severity]) => severity >= 1 && !word.includes(' '))
  .map(([word]) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

const italianRegex = new RegExp(italianWords.join('|'), 'i');

export function containsProfanity(text: string): boolean {
  return englishMatcher.hasMatch(text) || italianRegex.test(text);
}
import {
  RegExpMatcher,
  DataSet,
  parseRawPattern,
  englishDataset,
  englishRecommendedTransformers,
  resolveLeetSpeakTransformer,
  toAsciiLowerCaseTransformer,
  skipNonAlphabeticTransformer,
} from 'obscenity';
import { cuss as italianCuss } from 'cuss/it';

const englishMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

// Parole singole con severità >= 1 — le parole a 0 sono falsi positivi (es. "uccello", "finocchio")
const italianDataset = new DataSet();
for (const [word, severity] of Object.entries(italianCuss)) {
  if ((severity as number) >= 1 && !word.includes(' ')) {
    italianDataset.addPhrase(p => p.addPattern(parseRawPattern(word)));
  }
}

// Matcher italiano separato: i transformer inglesi (whitelist) rompono le parole italiane,
// quindi usiamo solo leet speak + lowercase + skip non-alpha
const italianMatcher = new RegExpMatcher({
  ...italianDataset.build(),
  blacklistMatcherTransformers: [
    resolveLeetSpeakTransformer(),
    toAsciiLowerCaseTransformer(),
    skipNonAlphabeticTransformer(),
  ],
});

export function containsProfanity(text: string): boolean {
  return englishMatcher.hasMatch(text) || italianMatcher.hasMatch(text);
}
import { DefectCategory, DefectSeverity, Sentiment, TaxonomyRule } from '../types';

export const TAXONOMY: TaxonomyRule[] = [
  {
    issue: 'Safety',
    severity: 'Critical',
    words: [
      'unsafe', 'danger', 'dangerous', 'hazard', 'hazardous', 'hurt', 'injury', 'injured',
      'sharp edge', 'choking hazard', 'choking', 'swallow', 'toxic', 'chemical smell',
      'strong smell', 'burn', 'burned', 'fire', 'overheat', 'shock', 'electric', 'fumes', 'lead'
    ]
  },
  {
    issue: 'Function issue',
    severity: 'Major',
    words: [
      'not working', 'does not work', "doesn't work", "won't work", 'stopped working',
      'stops working', 'stop working', 'malfunction', 'defective', 'defect', "won't turn on",
      'does not turn on', 'no power', 'button not', 'sound not working', 'light not working',
      'motor', 'battery issue', 'battery drain', 'leak battery', 'dead on arrival', 'doa', 'curing', 'uv light'
    ]
  },
  {
    issue: 'Missing parts',
    severity: 'Major',
    words: [
      'missing', 'missing part', 'missing parts', 'parts missing', 'piece missing',
      'pieces missing', 'not included', 'accessory missing', 'incomplete', 'empty',
      'nothing inside', 'lost items inside', 'missing pieces'
    ]
  },
  {
    issue: 'Damage',
    severity: 'Major',
    words: [
      'broken', 'broke', 'breaks', 'break easily', 'cracked', 'crack', 'shattered',
      'snapped', 'bent', 'ripped', 'torn', 'fell apart', 'falls apart', 'came apart',
      'damaged item', 'dent', 'dented', 'head fell off', 'arm broke'
    ]
  },
  {
    issue: 'Quality',
    severity: 'Major',
    words: [
      'poor quality', 'bad quality', 'low quality', 'cheap', 'cheaply made', 'feels cheap',
      'flimsy', 'weak', 'poorly made', 'not durable', 'durability', 'falls off', "wont stay",
      "won't stay", 'slides off', 'paint', 'peeling', 'peel', 'scratches easily', 'defective quality'
    ]
  },
  {
    issue: 'Packaging',
    severity: 'Minor',
    words: [
      'packaging', 'poor packaging', 'box damaged', 'damaged box', 'crushed box',
      'arrived open', 'open box', 'no box', 'box was crushed', 'torn box'
    ]
  },
  {
    issue: 'Assembly / Instruction',
    severity: 'Minor',
    words: [
      'hard to assemble', 'difficult to assemble', 'assembly', 'instruction', 'instructions',
      'manual', 'hard to use', 'confusing', 'hard to put together', 'directions unclear'
    ]
  },
  {
    issue: 'Size / Appearance mismatch',
    severity: 'Minor',
    words: [
      'smaller than expected', 'too small', 'too big', 'not as pictured', 'not like picture',
      'looks different', 'color different', 'wrong color', 'wrong size', 'wrong item',
      'misleading', 'not as described', 'tiny'
    ]
  },
  {
    issue: 'Delivery',
    severity: 'Minor',
    words: [
      'arrived late', 'never arrived', 'late delivery', 'delivery', 'shipping',
      'lost package', 'delayed'
    ]
  },
  {
    issue: 'Value',
    severity: 'Minor',
    words: [
      'overpriced', 'not worth', 'waste of money', 'too expensive', 'too costly',
      'not worth the price', 'rip off'
    ]
  }
];

const PRIORITY: Record<string, number> = {};
TAXONOMY.forEach((r, i) => {
  PRIORITY[r.issue] = TAXONOMY.length - i;
});

const SEVERITY: Record<string, DefectSeverity> = {};
TAXONOMY.forEach((r) => {
  SEVERITY[r.issue] = r.severity;
});

function lc(s: string): string {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Scored Defect Classifier (v2)
 * Evaluates keyword matches per category and breaks ties via QA severity hierarchy.
 */
export function classifyIssue(text: string): DefectCategory {
  const t = lc(text);
  if (!t) return 'Other';
  let best: DefectCategory = 'Other';
  let bestScore = 0;
  let bestPri = -1;

  for (let i = 0; i < TAXONOMY.length; i++) {
    const r = TAXONOMY[i];
    let score = 0;
    for (let j = 0; j < r.words.length; j++) {
      if (t.includes(r.words[j])) {
        score++;
      }
    }
    if (score > 0) {
      const pri = PRIORITY[r.issue] || 0;
      if (score > bestScore || (score === bestScore && pri > bestPri)) {
        best = r.issue;
        bestScore = score;
        bestPri = pri;
      }
    }
  }
  return best;
}

export function getIssueSeverity(issue: DefectCategory): DefectSeverity {
  return SEVERITY[issue] || 'Minor';
}

const NEG_WORDS = [
  'bad', 'broken', 'poor', 'terrible', 'disappointed', 'missing', 'damaged',
  'defective', 'not working', 'waste', 'cheap', 'unsafe', 'late', 'burn',
  'burns', 'burned', 'awful', 'horrible', 'ruined', 'useless', 'beware'
];

const POS_WORDS = [
  'good', 'great', 'love', 'loved', 'excellent', 'perfect', 'cute', 'nice',
  'happy', 'quality is good', 'awesome', 'amazing', 'durable', 'recommend'
];

export function getSentiment(text: string): Sentiment {
  const t = lc(text);
  if (NEG_WORDS.some((w) => t.includes(w))) return 'NEGATIVE';
  if (POS_WORDS.some((w) => t.includes(w))) return 'POSITIVE';
  return 'NEUTRAL';
}

const KEYWORD_POOL = [
  'broken', 'missing', 'quality', 'packaging', 'damaged', 'poor', 'defective',
  'not working', 'stopped working', 'delivery', 'late', 'cheap', 'flimsy',
  'falls off', 'peeling', 'unsafe', 'choking', 'small parts', 'overpriced',
  'not worth', 'burn', 'smell', 'sticky', 'cure'
];

export function getKeywords(text: string): string[] {
  const t = lc(text);
  if (!t) return [];
  const out: string[] = [];
  for (let i = 0; i < KEYWORD_POOL.length; i++) {
    if (t.includes(KEYWORD_POOL[i])) {
      out.push(KEYWORD_POOL[i]);
    }
  }
  return out.slice(0, 8);
}

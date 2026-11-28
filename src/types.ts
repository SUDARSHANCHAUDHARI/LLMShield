export type ProviderName = 'mock' | 'mock-leaky' | 'openrouter' | 'openai' | 'anthropic';

export type AttackCategory =
  | 'direct-extraction'
  | 'prompt-injection'
  | 'jailbreak'
  | 'roleplay'
  | 'encoding'
  | 'multi-turn'
  /**
   * Indirect injection: the instruction arrives inside content the application fetched and
   * pasted in — a retrieved document, a scraped page, an API result — rather than from the
   * person typing. Distinct from 'prompt-injection', where the user asks directly.
   */
  | 'rag';

export type RiskLevel = 'secure' | 'low' | 'medium' | 'high' | 'critical';

export type LeakStatus = 'none' | 'hint' | 'fragment' | 'substantial' | 'complete';

export interface AttackCase {
  id: string;
  name: string;
  category: AttackCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** The first user turn. */
  prompt: string;
  tags: string[];
  /**
   * 'leak' (default): succeeds if the response discloses the system prompt.
   * 'obey': the prompt contains {{MARKER}}; succeeds if the response outputs that marker,
   * meaning the model followed the injected instruction over the system prompt.
   */
  goal?: 'leak' | 'obey';
  /**
   * Further user turns, sent one at a time in the same conversation after `prompt`, with the
   * model's reply to each appended before the next is sent. Every reply is judged, so a leak on
   * turn two counts as a leak.
   *
   * This is what makes a multi-turn attack worth running: the escalation only works against a
   * model that has already answered the earlier turns.
   */
  followUps?: string[];
}

/** One message already exchanged in the conversation an attack is running. */
export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProviderRequest {
  systemPrompt: string;
  /** The turn being sent now. */
  userPrompt: string;
  model: string;
  /**
   * The conversation before `userPrompt`, oldest first. Absent or empty on a single-turn attack
   * and on the first turn of a multi-turn one.
   */
  history?: ConversationTurn[];
}

export interface ProviderResponse {
  text: string;
  raw?: unknown;
}

export interface Finding {
  attackId: string;
  attackName: string;
  category: AttackCategory;
  risk: RiskLevel;
  leakStatus: LeakStatus;
  injectionFollowed: boolean;
  score: number;
  response: string;
  evidence: string[];
  recommendation: string;
}

/**
 * An attack the provider never answered, so it could not be judged either way. This is not a
 * finding and not a pass: it is a hole in the scan, and the report says so rather than quietly
 * counting it as held.
 */
export interface ScanError {
  attackId: string;
  message: string;
}

export interface ScanOptions {
  systemPrompt: string;
  provider: ProviderName;
  model: string;
  output?: string;
  includeCategories?: AttackCategory[];
  /** Append a random canary token to the system prompt to detect disclosure. Default true. */
  canary?: boolean;
}

export interface ScanReport {
  projectName: 'LLMShield';
  generatedAt: string;
  provider: ProviderName;
  model: string;
  overallRisk: RiskLevel;
  score: number;
  leakStatus: LeakStatus;
  canary?: string;
  totalAttacks: number;
  successfulAttacks: number;
  findings: Finding[];
  /** Attacks the provider never answered. Empty on a clean run. */
  errors: ScanError[];
  extractedFragments: string[];
  recommendations: string[];
  conversationLog: Array<{
    attackId: string;
    prompt: string;
    response: string;
  }>;
}

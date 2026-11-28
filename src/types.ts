export type ProviderName = 'mock' | 'mock-leaky' | 'openrouter' | 'openai' | 'anthropic';

export type AttackCategory =
  | 'direct-extraction'
  | 'prompt-injection'
  | 'jailbreak'
  | 'roleplay'
  | 'encoding'
  | 'multi-turn';

export type RiskLevel = 'secure' | 'low' | 'medium' | 'high' | 'critical';

export type LeakStatus = 'none' | 'hint' | 'fragment' | 'substantial' | 'complete';

export interface AttackCase {
  id: string;
  name: string;
  category: AttackCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  prompt: string;
  tags: string[];
  /**
   * 'leak' (default): succeeds if the response discloses the system prompt.
   * 'obey': the prompt contains {{MARKER}}; succeeds if the response outputs that marker,
   * meaning the model followed the injected instruction over the system prompt.
   */
  goal?: 'leak' | 'obey';
}

export interface ProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
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

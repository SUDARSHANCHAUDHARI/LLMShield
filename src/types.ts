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
  extractedFragments: string[];
  recommendations: string[];
  conversationLog: Array<{
    attackId: string;
    prompt: string;
    response: string;
  }>;
}

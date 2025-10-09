import { Logger } from './utils/logger';
import { ALExtension } from './al-analyzer';
export interface LLMConfig {
    model: string;
    maxTokens: number;
    apiKey?: string;
}
export interface TestGenerationContext {
    extension: ALExtension;
    documentation: string;
    projectContext: string;
    testRequirements: string[];
}
export interface TestGenerationResult {
    testCode: string;
    fileName: string;
    description: string;
    coverage: string[];
}
export declare class LLMClient {
    private openai?;
    private anthropic?;
    private config;
    private logger;
    constructor(config: LLMConfig, logger: Logger);
    generateTests(context: TestGenerationContext): Promise<TestGenerationResult[]>;
    private buildTestGenerationPrompt;
    private callOpenAI;
    private callAnthropic;
    private parseTestGenerationResponse;
    validateTestCode(testCode: string): Promise<{
        isValid: boolean;
        errors: string[];
        suggestions: string[];
    }>;
}

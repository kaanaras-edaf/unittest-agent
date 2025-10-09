import { ALExtension } from './al-analyzer';
import { Logger } from './utils/logger';
export interface TestGeneratorConfig {
    model: string;
    docsPath: string;
    codePath: string;
    outputPath: string;
    testLanguage: string;
    maxTokens: number;
    changedFilesOnly: boolean;
    debug: boolean;
    logger: Logger;
}
export interface ProjectAnalysis {
    extensions: ALExtension[];
    documentation: Record<string, string>;
    dependencies: string[];
    crossModuleIntegrations: Integration[];
}
export interface Integration {
    source: string;
    target: string;
    type: 'event' | 'flowfield' | 'reference';
    description: string;
}
export interface GenerationResult {
    testsGenerated: number;
    outputPath: string;
    files: string[];
    errors: string[];
}
export declare class TestGenerator {
    private config;
    private alAnalyzer;
    private llmClient?;
    private logger;
    constructor(config: TestGeneratorConfig, initializeLLM?: boolean);
    generateTests(filesToAnalyze: string[]): Promise<GenerationResult>;
    getAllALFiles(): Promise<string[]>;
    analyzeProject(filesToAnalyze?: string[]): Promise<ProjectAnalysis>;
    private loadDocumentation;
    private extractProjectDependencies;
    private identifyIntegrations;
    private eventsMatch;
    private buildTestContext;
    private generateIntegrationTests;
    private addTestFileHeader;
    private generateTestSummary;
}

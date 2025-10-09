import fs from 'fs-extra';
import path from 'path';
import glob from 'fast-glob';
import { ALAnalyzer, ALExtension } from './al-analyzer';
import { LLMClient, LLMConfig, TestGenerationContext, TestGenerationResult } from './llm-client';
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

export class TestGenerator {
  private config: TestGeneratorConfig;
  private alAnalyzer: ALAnalyzer;
  private llmClient?: LLMClient;
  private logger: Logger;

  constructor(config: TestGeneratorConfig, initializeLLM: boolean = true) {
    this.config = config;
    this.logger = config.logger;
    this.alAnalyzer = new ALAnalyzer(this.logger);
    
    if (initializeLLM) {
      const llmConfig: LLMConfig = {
        model: config.model,
        maxTokens: config.maxTokens
      };
      
      this.llmClient = new LLMClient(llmConfig, this.logger);
    }
  }

  async generateTests(filesToAnalyze: string[]): Promise<GenerationResult> {
    try {
      this.logger.info(`🔍 Analyzing ${filesToAnalyze.length} AL files...`);
      
      // Analyze the project
      const analysis = await this.analyzeProject(filesToAnalyze);
      
      // Ensure output directory exists
      await fs.ensureDir(this.config.outputPath);
      
      const results: GenerationResult = {
        testsGenerated: 0,
        outputPath: this.config.outputPath,
        files: [],
        errors: []
      };

      // Generate tests for each extension
      for (const extension of analysis.extensions) {
        try {
          this.logger.info(`📝 Generating tests for ${extension.name}...`);
          
          const context = this.buildTestContext(extension, analysis);
          
          if (!this.llmClient) {
            throw new Error('LLM client not initialized. Cannot generate tests without API keys.');
          }
          
          const testResults = await this.llmClient.generateTests(context);
          
          for (const testResult of testResults) {
            const testFilePath = path.join(this.config.outputPath, testResult.fileName);
            
            // Add file header and metadata
            const finalTestCode = this.addTestFileHeader(testResult, extension);
            
            await fs.writeFile(testFilePath, finalTestCode, 'utf-8');
            
            this.logger.success(`✅ Generated test file: ${testResult.fileName}`);
            results.files.push(testFilePath);
            results.testsGenerated++;
          }
          
        } catch (error) {
          const errorMsg = `Failed to generate tests for ${extension.name}: ${error}`;
          this.logger.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      // Generate integration tests
      if (analysis.crossModuleIntegrations.length > 0) {
        try {
          this.logger.info('🔗 Generating cross-module integration tests...');
          const integrationTests = await this.generateIntegrationTests(analysis);
          
          for (const testResult of integrationTests) {
            const testFilePath = path.join(this.config.outputPath, testResult.fileName);
            const finalTestCode = this.addTestFileHeader(testResult, null);
            
            await fs.writeFile(testFilePath, finalTestCode, 'utf-8');
            
            this.logger.success(`✅ Generated integration test: ${testResult.fileName}`);
            results.files.push(testFilePath);
            results.testsGenerated++;
          }
        } catch (error) {
          const errorMsg = `Failed to generate integration tests: ${error}`;
          this.logger.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      // Generate test summary
      await this.generateTestSummary(results, analysis);
      
      return results;
    } catch (error) {
      this.logger.error(`Test generation failed: ${error}`);
      throw error;
    }
  }

  async getAllALFiles(): Promise<string[]> {
    try {
      const patterns = this.config.codePath.split(',').map(p => p.trim());
      const files = await glob(patterns, {
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/tests/**']
      });
      
      return files.filter(file => file.endsWith('.al'));
    } catch (error) {
      this.logger.error(`Failed to find AL files: ${error}`);
      return [];
    }
  }

  async analyzeProject(filesToAnalyze?: string[]): Promise<ProjectAnalysis> {
    try {
      const alFiles = filesToAnalyze || await this.getAllALFiles();
      const extensions: ALExtension[] = [];
      
      // Analyze each AL file
      for (const filePath of alFiles) {
        try {
          const extension = await this.alAnalyzer.analyzeALFile(filePath);
          extensions.push(extension);
        } catch (error) {
          this.logger.warn(`Failed to analyze ${filePath}: ${error}`);
        }
      }

      // Load documentation
      const documentation = await this.loadDocumentation();
      
      // Extract dependencies
      const dependencies = this.extractProjectDependencies(extensions);
      
      // Identify cross-module integrations
      const crossModuleIntegrations = this.identifyIntegrations(extensions);
      
      return {
        extensions,
        documentation,
        dependencies,
        crossModuleIntegrations
      };
    } catch (error) {
      this.logger.error(`Project analysis failed: ${error}`);
      throw error;
    }
  }

  private async loadDocumentation(): Promise<Record<string, string>> {
    try {
      const patterns = this.config.docsPath.split(',').map(p => p.trim());
      const docFiles = await glob(patterns, { absolute: true });
      
      const documentation: Record<string, string> = {};
      
      for (const filePath of docFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const relativePath = path.relative(process.cwd(), filePath);
          documentation[relativePath] = content;
        } catch (error) {
          this.logger.warn(`Failed to read documentation file ${filePath}: ${error}`);
        }
      }
      
      return documentation;
    } catch (error) {
      this.logger.error(`Failed to load documentation: ${error}`);
      return {};
    }
  }

  private extractProjectDependencies(extensions: ALExtension[]): string[] {
    const allDeps = new Set<string>();
    
    for (const extension of extensions) {
      extension.dependencies.forEach(dep => allDeps.add(dep));
    }
    
    return Array.from(allDeps);
  }

  private identifyIntegrations(extensions: ALExtension[]): Integration[] {
    const integrations: Integration[] = [];
    
    // Find event-based integrations
    for (const ext of extensions) {
      for (const event of ext.events) {
        if (event.eventType === 'publisher') {
          // Find subscribers in other extensions
          for (const otherExt of extensions) {
            if (otherExt.name !== ext.name) {
              for (const otherEvent of otherExt.events) {
                if (otherEvent.eventType === 'subscriber' && 
                    this.eventsMatch(event, otherEvent)) {
                  integrations.push({
                    source: ext.name,
                    target: otherExt.name,
                    type: 'event',
                    description: `${event.name} event integration`
                  });
                }
              }
            }
          }
        }
      }
    }

    // Find flowfield integrations
    for (const ext of extensions) {
      for (const flowfield of ext.flowfields) {
        if (flowfield.sourceTable) {
          // Find extensions that might contain the source table
          for (const otherExt of extensions) {
            if (otherExt.name !== ext.name) {
              const hasSourceTable = otherExt.objects.some(obj => 
                obj.name === flowfield.sourceTable || 
                obj.name.includes(flowfield.sourceTable!)
              );
              
              if (hasSourceTable) {
                integrations.push({
                  source: otherExt.name,
                  target: ext.name,
                  type: 'flowfield',
                  description: `${flowfield.name} flowfield references ${flowfield.sourceTable}`
                });
              }
            }
          }
        }
      }
    }

    return integrations;
  }

  private eventsMatch(event1: any, event2: any): boolean {
    // Simple name matching - could be enhanced with parameter matching
    return event1.name === event2.name || 
           event1.name.toLowerCase().includes(event2.name.toLowerCase()) ||
           event2.name.toLowerCase().includes(event1.name.toLowerCase());
  }

  private buildTestContext(extension: ALExtension, analysis: ProjectAnalysis): TestGenerationContext {
    // Combine all documentation into a single context
    const allDocs = Object.entries(analysis.documentation)
      .map(([file, content]) => `## ${file}\n${content}`)
      .join('\n\n');

    // Build project context
    const projectContext = `
This is part of a Business Central project with ${analysis.extensions.length} extensions.

Extensions in project:
${analysis.extensions.map(ext => `- ${ext.name}: ${ext.objects.length} objects, ${ext.events.length} events`).join('\n')}

Cross-module integrations:
${analysis.crossModuleIntegrations.map(integration => 
  `- ${integration.source} → ${integration.target} (${integration.type}): ${integration.description}`
).join('\n')}
`;

    // Define test requirements based on extension analysis
    const testRequirements = [
      'Test all public procedures and business logic',
      'Verify flowfield calculations and formulas',
      'Test event publishing and subscription scenarios',
      'Validate error handling and edge cases',
      'Test cross-module integration points',
      'Ensure proper data validation',
      'Test performance for critical operations'
    ];

    // Add specific requirements based on extension features
    if (extension.events.length > 0) {
      testRequirements.push('Test event-driven workflows');
    }
    
    if (extension.flowfields.length > 0) {
      testRequirements.push('Verify flowfield accuracy with sample data');
    }

    return {
      extension,
      documentation: allDocs,
      projectContext,
      testRequirements
    };
  }

  private async generateIntegrationTests(analysis: ProjectAnalysis): Promise<TestGenerationResult[]> {
    const context: TestGenerationContext = {
      extension: {
        name: 'Integration',
        filePath: 'integration',
        objects: [],
        events: [],
        flowfields: [],
        dependencies: []
      },
      documentation: Object.values(analysis.documentation).join('\n\n'),
      projectContext: `
Cross-module integrations to test:
${analysis.crossModuleIntegrations.map(integration => 
  `- ${integration.source} → ${integration.target} (${integration.type}): ${integration.description}`
).join('\n')}
`,
      testRequirements: [
        'Test end-to-end workflows across multiple modules',
        'Verify event chains work correctly',
        'Test flowfield calculations that span modules',
        'Validate data consistency across extensions',
        'Test error propagation between modules'
      ]
    };

    if (!this.llmClient) {
      throw new Error('LLM client not initialized. Cannot generate integration tests without API keys.');
    }

    return await this.llmClient.generateTests(context);
  }

  private addTestFileHeader(testResult: TestGenerationResult, extension: ALExtension | null): string {
    const timestamp = new Date().toISOString();
    const extensionInfo = extension ? `Extension: ${extension.name}` : 'Integration Tests';
    
    const header = `// Generated by AL Test Generator
// ${timestamp}
// ${extensionInfo}
// Description: ${testResult.description}
// Coverage: ${testResult.coverage.join(', ')}

`;

    return header + testResult.testCode;
  }

  private async generateTestSummary(results: GenerationResult, analysis: ProjectAnalysis): Promise<void> {
    const summary = `# Test Generation Summary

Generated on: ${new Date().toISOString()}

## Statistics
- Tests Generated: ${results.testsGenerated}
- Extensions Analyzed: ${analysis.extensions.length}
- Cross-module Integrations: ${analysis.crossModuleIntegrations.length}
- Errors: ${results.errors.length}

## Generated Test Files
${results.files.map(file => `- ${path.basename(file)}`).join('\n')}

## Extensions Covered
${analysis.extensions.map(ext => `
### ${ext.name}
- Objects: ${ext.objects.length}
- Events: ${ext.events.length}
- Flowfields: ${ext.flowfields.length}
- Dependencies: ${ext.dependencies.length}
`).join('\n')}

## Integration Points
${analysis.crossModuleIntegrations.map(integration => 
  `- ${integration.source} → ${integration.target} (${integration.type})`
).join('\n')}

${results.errors.length > 0 ? `## Errors\n${results.errors.map(err => `- ${err}`).join('\n')}` : ''}
`;

    const summaryPath = path.join(this.config.outputPath, 'TEST_SUMMARY.md');
    await fs.writeFile(summaryPath, summary, 'utf-8');
    
    this.logger.info(`📋 Test summary saved to: ${summaryPath}`);
  }
}
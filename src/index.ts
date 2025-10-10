#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';
import { TestGenerator } from './test-generator';
import { Logger } from './utils/logger';
import { GitHubAnalyzer } from './github-analyzer';

// Load environment variables
config();

const program = new Command();

program
  .name('unittest-agent')
  .description('AI-powered unit test generator for Business Central AL extensions')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate unit tests for AL extensions')
  .option('--model <model>', 'AI model to use (e.g., openai:gpt-4, anthropic:claude-3-sonnet)', 'openai:gpt-4')
  .option('--docs-path <path>', 'Glob pattern for documentation files', './*/md/*.md,./md/*.md')
  .option('--code-path <path>', 'Glob pattern for AL code files', './**/*.al')
  .option('--output-path <path>', 'Directory for generated tests', './tests')
  .option('--test-language <lang>', 'Language for generated tests', 'AL')
  .option('--max-tokens <number>', 'Maximum tokens for LLM responses', '4000')
  .option('--changed-files-only', 'Only generate tests for changed files in PR', false)
  .option('--debug', 'Enable debug logging', false)
  .action(async (options) => {
    try {
      const logger = new Logger(options.debug);
      logger.info('🧪 Starting AL Unit Test Generation...');
      
      const generator = new TestGenerator({
        model: options.model,
        docsPath: options.docsPath,
        codePath: options.codePath,
        outputPath: options.outputPath,
        testLanguage: options.testLanguage,
        maxTokens: parseInt(options.maxTokens),
        changedFilesOnly: options.changedFilesOnly,
        debug: options.debug,
        logger
      });

      let filesToAnalyze: string[] = [];

      if (options.changedFilesOnly && process.env.GITHUB_EVENT_NAME === 'pull_request') {
        logger.info('📋 Analyzing changed files in PR...');
        const githubAnalyzer = new GitHubAnalyzer(logger);
        filesToAnalyze = await githubAnalyzer.getChangedALFiles();
        logger.info(`Found ${filesToAnalyze.length} changed AL files`);
      } else {
        logger.info('📋 Analyzing all AL files...');
        filesToAnalyze = await generator.getAllALFiles();
        logger.info(`Found ${filesToAnalyze.length} AL files`);
      }

      if (filesToAnalyze.length === 0) {
        logger.warn('⚠️  No AL files found to analyze');
        return;
      }

      const results = await generator.generateTests(filesToAnalyze);
      
      logger.info(`✅ Generated ${results.testsGenerated} test files`);
      logger.info(`📁 Tests saved to: ${results.outputPath}`);
      
      // Set outputs for GitHub Actions
      if (process.env.GITHUB_ACTIONS) {
        console.log(`::set-output name=tests_generated::${results.testsGenerated}`);
        console.log(`::set-output name=tests_path::${results.outputPath}`);
      }
      
    } catch (error) {
      console.error('❌ Error generating tests:', error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze AL code structure without generating tests')
  .option('--docs-path <path>', 'Glob pattern for documentation files', './*/md/*.md,./md/*.md')
  .option('--code-path <path>', 'Glob pattern for AL code files', './**/*.al')
  .option('--debug', 'Enable debug logging', false)
  .action(async (options) => {
    try {
      const logger = new Logger(options.debug);
      logger.info('🔍 Analyzing AL code structure...');
      
      const generator = new TestGenerator({
        model: 'openai:gpt-4', // Not used for analysis
        docsPath: options.docsPath,
        codePath: options.codePath,
        outputPath: './tests',
        testLanguage: 'AL',
        maxTokens: 4000,
        changedFilesOnly: false,
        debug: options.debug,
        logger
      }, false); // Don't initialize LLM client for analysis

      const analysis = await generator.analyzeProject();
      
      logger.info('📊 Project Analysis Results:');
      console.log(JSON.stringify(analysis, null, 2));
      
    } catch (error) {
      console.error('❌ Error analyzing project:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

export { TestGenerator, GitHubAnalyzer };
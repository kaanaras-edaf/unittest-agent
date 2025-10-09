"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClient = void 0;
const openai_1 = __importDefault(require("openai"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class LLMClient {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        // Initialize the appropriate client based on model
        if (config.model.startsWith('openai:')) {
            this.openai = new openai_1.default({
                apiKey: config.apiKey || process.env.OPENAI_API_KEY,
            });
        }
        else if (config.model.startsWith('anthropic:')) {
            this.anthropic = new sdk_1.default({
                apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
            });
        }
        else {
            throw new Error(`Unsupported model provider: ${config.model}`);
        }
    }
    async generateTests(context) {
        try {
            this.logger.debug(`Generating tests for extension: ${context.extension.name}`);
            const prompt = this.buildTestGenerationPrompt(context);
            let response;
            if (this.openai && this.config.model.startsWith('openai:')) {
                response = await this.callOpenAI(prompt);
            }
            else if (this.anthropic && this.config.model.startsWith('anthropic:')) {
                response = await this.callAnthropic(prompt);
            }
            else {
                throw new Error('No valid LLM client initialized');
            }
            return this.parseTestGenerationResponse(response, context.extension.name);
        }
        catch (error) {
            this.logger.error(`Failed to generate tests: ${error}`);
            throw error;
        }
    }
    buildTestGenerationPrompt(context) {
        return `
# AL Unit Test Generation Task

You are an expert Business Central AL developer tasked with generating comprehensive unit tests for AL extensions.

## Extension Information
**Name**: ${context.extension.name}
**File Path**: ${context.extension.filePath}

## Objects in Extension
${context.extension.objects.map(obj => `
- **${obj.type}** ${obj.id} "${obj.name}"
  - Fields: ${obj.fields?.length || 0}
  - Procedures: ${obj.procedures?.length || 0}
`).join('')}

## Events
${context.extension.events.map(event => `
- **${event.eventType}**: ${event.name} (${event.objectType}: ${event.objectName})
`).join('')}

## Flowfields
${context.extension.flowfields.map(ff => `
- **${ff.name}** in ${ff.tableName}: ${ff.calcMethod} from ${ff.sourceTable || 'unknown'}.${ff.sourceField || 'unknown'}
`).join('')}

## Dependencies
${context.extension.dependencies.join(', ')}

## Documentation Context
${context.documentation}

## Project Context
${context.projectContext}

## Test Requirements
${context.testRequirements.map(req => `- ${req}`).join('\n')}

## Task
Generate comprehensive AL unit tests that cover:

1. **Object Functionality**: Test main procedures and business logic
2. **Flowfield Calculations**: Verify flowfield formulas and calculations
3. **Event Integration**: Test event publishers and subscribers
4. **Cross-Module Integration**: Test interactions with other modules
5. **Error Handling**: Test validation and error scenarios
6. **Edge Cases**: Test boundary conditions and unusual inputs

## Output Format
Please provide your response in the following JSON format:

\`\`\`json
{
  "tests": [
    {
      "fileName": "Test[ExtensionName].al",
      "description": "Brief description of what this test file covers",
      "testCode": "// Complete AL test code here",
      "coverage": ["List of features/functions tested"]
    }
  ]
}
\`\`\`

## AL Test Guidelines
- Use proper AL syntax for Business Central test framework
- Include [Test] attribute for test procedures
- Use proper naming conventions (Test[FunctionName])
- Include setup and teardown procedures when needed
- Use Assert functions for validation
- Test both positive and negative scenarios
- Include comments explaining test scenarios
- Follow AL coding standards and best practices

Generate tests that are production-ready and follow Business Central testing best practices.
`;
    }
    async callOpenAI(prompt) {
        if (!this.openai) {
            throw new Error('OpenAI client not initialized');
        }
        const modelName = this.config.model.replace('openai:', '');
        const response = await this.openai.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert Business Central AL developer specializing in unit test generation. Generate high-quality, comprehensive unit tests for AL extensions.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: this.config.maxTokens,
            temperature: 0.3, // Lower temperature for more consistent code generation
        });
        return response.choices[0]?.message?.content || '';
    }
    async callAnthropic(prompt) {
        if (!this.anthropic) {
            throw new Error('Anthropic client not initialized');
        }
        const modelName = this.config.model.replace('anthropic:', '');
        const response = await this.anthropic.messages.create({
            model: modelName,
            max_tokens: this.config.maxTokens,
            temperature: 0.3,
            system: 'You are an expert Business Central AL developer specializing in unit test generation. Generate high-quality, comprehensive unit tests for AL extensions.',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
        });
        const content = response.content[0];
        return content.type === 'text' ? content.text : '';
    }
    parseTestGenerationResponse(response, extensionName) {
        try {
            // Extract JSON from the response
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            const parsed = JSON.parse(jsonMatch[1]);
            if (!parsed.tests || !Array.isArray(parsed.tests)) {
                throw new Error('Invalid response format: missing tests array');
            }
            return parsed.tests.map((test) => ({
                testCode: test.testCode || '',
                fileName: test.fileName || `Test${extensionName}.al`,
                description: test.description || 'Generated unit tests',
                coverage: test.coverage || []
            }));
        }
        catch (error) {
            this.logger.warn(`Failed to parse JSON response, attempting fallback: ${error}`);
            // Fallback: extract code blocks
            const codeBlocks = response.match(/```al\n([\s\S]*?)\n```/g);
            if (codeBlocks && codeBlocks.length > 0) {
                return [{
                        testCode: codeBlocks[0].replace(/```al\n|\n```/g, ''),
                        fileName: `Test${extensionName}.al`,
                        description: 'Generated unit tests (fallback parsing)',
                        coverage: ['Basic functionality']
                    }];
            }
            throw new Error('Could not parse test generation response');
        }
    }
    async validateTestCode(testCode) {
        const prompt = `
Please review the following AL unit test code and validate it:

\`\`\`al
${testCode}
\`\`\`

Check for:
1. Syntax errors
2. AL test framework usage
3. Best practices
4. Missing imports or dependencies
5. Test coverage completeness

Provide feedback in JSON format:
\`\`\`json
{
  "isValid": boolean,
  "errors": ["list of errors"],
  "suggestions": ["list of improvement suggestions"]
}
\`\`\`
`;
        try {
            let response;
            if (this.openai && this.config.model.startsWith('openai:')) {
                response = await this.callOpenAI(prompt);
            }
            else if (this.anthropic && this.config.model.startsWith('anthropic:')) {
                response = await this.callAnthropic(prompt);
            }
            else {
                throw new Error('No valid LLM client initialized');
            }
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            return {
                isValid: true,
                errors: [],
                suggestions: []
            };
        }
        catch (error) {
            this.logger.error(`Failed to validate test code: ${error}`);
            return {
                isValid: false,
                errors: [`Validation failed: ${error}`],
                suggestions: []
            };
        }
    }
}
exports.LLMClient = LLMClient;

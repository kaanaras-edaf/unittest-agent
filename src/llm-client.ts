import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
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

export class LLMClient {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private config: LLMConfig;
  private logger: Logger;

  constructor(config: LLMConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;

    // Initialize the appropriate client based on model
    if (config.model.startsWith('openai:')) {
      this.openai = new OpenAI({
        apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      });
    } else if (config.model.startsWith('anthropic:')) {
      this.anthropic = new Anthropic({
        apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      });
    } else {
      throw new Error(`Unsupported model provider: ${config.model}`);
    }
  }

  async generateTests(context: TestGenerationContext): Promise<TestGenerationResult[]> {
    try {
      this.logger.debug(`Generating tests for extension: ${context.extension.name}`);
      
      const prompt = this.buildTestGenerationPrompt(context);
      
      let response: string;
      
      if (this.openai && this.config.model.startsWith('openai:')) {
        response = await this.callOpenAI(prompt);
      } else if (this.anthropic && this.config.model.startsWith('anthropic:')) {
        response = await this.callAnthropic(prompt);
      } else {
        throw new Error('No valid LLM client initialized');
      }

      return this.parseTestGenerationResponse(response, context.extension.name);
    } catch (error) {
      this.logger.error(`Failed to generate tests: ${error}`);
      throw error;
    }
  }

  private buildTestGenerationPrompt(context: TestGenerationContext): string {
    return `# AL Unit Test Generation Task

You are an expert Business Central AL developer tasked with generating COMPLETE, WORKING unit tests for AL extensions.

## CRITICAL INSTRUCTIONS
- Generate ACTUAL, EXECUTABLE test code, NOT comments or placeholders
- Include real AL syntax, actual field names, and working test logic
- Use specific data from the provided AL code analysis
- Create tests that would actually compile and run in Business Central
- Include proper setup, execution, and assertion logic

## Extension Information
**Name**: ${context.extension.name}
**File Path**: ${context.extension.filePath}

## ACTUAL AL CODE ANALYSIS
${this.buildCodeAnalysisSection(context.extension)}

## ACTUAL SOURCE CODE
\`\`\`al
${context.extension.sourceCode || 'Source code not available'}
\`\`\`

## DOCUMENTATION CONTEXT
${context.documentation}

## PROJECT CONTEXT  
${context.projectContext}

## REQUIRED TEST TYPES
${context.testRequirements.map(req => `- ${req}`).join('\n')}

## DETAILED TEST GENERATION REQUIREMENTS

### 1. Table Extension Tests
For each table extension, generate tests that:
- Create test records with actual field values
- Validate field assignments and calculations
- Test triggers (OnInsert, OnModify, OnDelete, OnValidate)
- Test flowfield calculations with real formulas

### 2. Procedure Tests  
For each procedure, generate tests that:
- Call procedures with actual parameters
- Validate return values and side effects
- Test different parameter combinations
- Include error handling scenarios

### 3. Event Tests
For event publishers/subscribers:
- Trigger actual events with test data
- Validate event parameter passing
- Test integration between modules via events

### 4. Integration Tests
- Test cross-module functionality
- Validate data flow between extensions
- Test business logic workflows

## AL TEST CODE REQUIREMENTS
- Use [Test] attribute, NOT [TestMethod]
- Include proper codeunit structure with Subtype = Test
- Use actual table/field names from the analysis
- Include realistic test data creation
- Use proper Assert statements (Assert.IsTrue, Assert.AreEqual, etc.)
- Include error scenarios with asserterror keyword
- Follow AL naming conventions exactly

## OUTPUT FORMAT
Return ONLY valid JSON in this exact format:

\`\`\`json
{
  "tests": [
    {
      "fileName": "Test[ActualObjectName].al",
      "description": "Specific description of tests for [ObjectName]", 
      "testCode": "// COMPLETE AL TEST CODEUNIT CODE HERE - NO PLACEHOLDERS",
      "coverage": ["Specific features tested"]
    }
  ]
}
\`\`\`

## EXAMPLE OF EXPECTED OUTPUT QUALITY
Instead of generating placeholder comments like "// Test calculation logic", generate actual code like:

\`\`\`al
[Test]
procedure TestCustomerEngagementScoreCalculation()
var
    Customer: Record Customer;
    SalesHeader: Record "Sales Header";
    Item: Record Item;
begin
    // Setup test data
    Customer.Init();
    Customer."No." := 'TEST001';
    Customer.Name := 'Test Customer';
    Customer.Insert();
    
    // Create sales data that affects engagement
    SalesHeader.Init();
    SalesHeader."No." := 'SALES001';
    SalesHeader."Sell-to Customer No." := Customer."No.";
    SalesHeader."Document Type" := SalesHeader."Document Type"::Order;
    SalesHeader.Insert();
    
    // Trigger engagement calculation
    Customer.CalcFields("Engagement Score");
    
    // Assert expected result
    Assert.IsTrue(Customer."Engagement Score" >= 0, 'Engagement score should be calculated');
end;
\`\`\`

Generate WORKING, COMPILABLE AL test code with this level of detail and specificity.`;
  }

  private buildCodeAnalysisSection(extension: ALExtension): string {
    let analysis = '';
    
    // Add objects with their actual code structure
    if (extension.objects.length > 0) {
      analysis += '\n### Objects Found:\n';
      extension.objects.forEach(obj => {
        analysis += `\n**${obj.type} ${obj.id} "${obj.name}"**\n`;
        
        if (obj.fields && obj.fields.length > 0) {
          analysis += 'Fields:\n';
          obj.fields.forEach(field => {
            analysis += `  - ${field.name}: ${field.type}`;
            if (field.isFlowfield && field.calcFormula) {
              analysis += ` (Flowfield: ${field.calcFormula})`;
            }
            analysis += '\n';
          });
        }
        
        if (obj.procedures && obj.procedures.length > 0) {
          analysis += 'Procedures:\n';
          obj.procedures.forEach(proc => {
            analysis += `  - ${proc.name}(`;
            analysis += proc.parameters.map(p => `${p.isVar ? 'var ' : ''}${p.name}: ${p.type}`).join(', ');
            analysis += ')';
            if (proc.returnType) analysis += ` : ${proc.returnType}`;
            analysis += '\n';
          });
        }
      });
    }
    
    // Add events with context
    if (extension.events.length > 0) {
      analysis += '\n### Events:\n';
      extension.events.forEach(event => {
        analysis += `- ${event.eventType}: ${event.name}`;
        if (event.objectType && event.objectName) {
          analysis += ` (${event.objectType}: ${event.objectName})`;
        }
        analysis += '\n';
      });
    }
    
    // Add flowfields with formulas
    if (extension.flowfields.length > 0) {
      analysis += '\n### Flowfields:\n';
      extension.flowfields.forEach(ff => {
        analysis += `- ${ff.name} in ${ff.tableName}: ${ff.calcMethod}`;
        if (ff.sourceTable && ff.sourceField) {
          analysis += ` from ${ff.sourceTable}.${ff.sourceField}`;
        }
        analysis += '\n';
      });
    }
    
    return analysis || 'No detailed code analysis available.';
  }

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const modelName = this.config.model.replace('openai:', '');
    
    const response = await this.openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are an expert Business Central AL developer specializing in unit test generation. You MUST generate complete, working AL test code with actual implementations, not placeholder comments. Focus on creating production-ready test codeunits that would compile and run successfully in Business Central.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.max(this.config.maxTokens, 8000), // Ensure sufficient tokens for detailed code
      temperature: 0.2, // Lower temperature for more consistent, deterministic code generation
      response_format: { type: "json_object" } // Ensure JSON output
    });

    return response.choices[0]?.message?.content || '';
  }

  private async callAnthropic(prompt: string): Promise<string> {
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

  private parseTestGenerationResponse(response: string, extensionName: string): TestGenerationResult[] {
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

      return parsed.tests.map((test: any) => ({
        testCode: test.testCode || '',
        fileName: test.fileName || `Test${extensionName}.al`,
        description: test.description || 'Generated unit tests',
        coverage: test.coverage || []
      }));
    } catch (error) {
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

  async validateTestCode(testCode: string): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  }> {
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
      let response: string;
      
      if (this.openai && this.config.model.startsWith('openai:')) {
        response = await this.callOpenAI(prompt);
      } else if (this.anthropic && this.config.model.startsWith('anthropic:')) {
        response = await this.callAnthropic(prompt);
      } else {
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
    } catch (error) {
      this.logger.error(`Failed to validate test code: ${error}`);
      return {
        isValid: false,
        errors: [`Validation failed: ${error}`],
        suggestions: []
      };
    }
  }
}
# AL Unit Test Generator 🧪

AI-powered unit test generator for Microsoft Dynamics 365 Business Central AL extensions.

[![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue)](https://github.com/marketplace/actions/al-unit-test-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## 🚀 Features

- **AI-Powered Test Generation**: Uses OpenAI GPT-4 or Anthropic Claude to generate comprehensive unit tests
- **AL Language Support**: Specifically designed for Business Central AL extensions
- **Documentation-Aware**: Analyzes project documentation to generate contextually relevant tests
- **Cross-Module Integration**: Identifies and tests interactions between different modules
- **Event & Flowfield Testing**: Specialized testing for AL-specific features like events and flowfields
- **GitHub Actions Integration**: Seamlessly integrates into CI/CD pipelines
- **Intelligent Analysis**: Only generates tests for changed files in PRs (configurable)

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Examples](#examples)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🏃‍♂️ Quick Start

### 1. Add to Your Workflow

Create `.github/workflows/al-test-generation.yml`:

```yaml
name: AL Test Generation

on:
  pull_request:
    paths: ['**/*.al', '**/md/*.md']

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-username/al-test-generator@v1
        with:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          DOCS_PATH: "./*/md/*.md,./md/*.md"
          CODE_PATH: "./**/*.al"
          OUTPUT_PATH: "./tests"
```

### 2. Configure Secrets

Add these secrets to your repository:
- `OPENAI_API_KEY`: Your OpenAI API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key (optional)

### 3. Structure Your Project

Organize your AL project like this:

```
your-al-project/
├── .github/workflows/
├── Module1/
│   ├── md/feature.md
│   └── Module1Ext.al
├── Module2/
│   ├── md/feature.md
│   └── Module2Ext.al
├── md/
│   └── architecture.md
└── tests/ (generated)
```

## 🛠 Installation

### As a GitHub Action

Use directly in your workflows (recommended):

```yaml
- uses: your-username/al-test-generator@v1
```

### As a Node.js Package

```bash
npm install -g al-test-generator
```

### Local Development

```bash
git clone https://github.com/your-username/al-test-generator.git
cd al-test-generator
npm install
npm run build
```

## 📝 Usage

### GitHub Action

```yaml
- name: Generate AL Unit Tests
  uses: your-username/al-test-generator@v1
  with:
    # Required
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
    # AI Provider (choose one)
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    
    # Configuration
    MODEL_STRING: "openai:gpt-4"  # or "anthropic:claude-3-sonnet"
    DOCS_PATH: "./*/md/*.md,./md/*.md"
    CODE_PATH: "./**/*.al"
    OUTPUT_PATH: "./tests"
    CHANGED_FILES_ONLY: "true"  # Only analyze changed files in PRs
    DEBUG: "false"
```

### Command Line

```bash
# Generate tests for all AL files
al-test-generator generate --docs-path "./*/md/*.md" --code-path "./**/*.al"

# Generate tests for specific files
al-test-generator generate --code-path "./SalesModule/*.al" --output-path "./tests/sales"

# Analyze project structure without generating tests
al-test-generator analyze --code-path "./**/*.al"

# Enable debug mode
al-test-generator generate --debug --docs-path "./docs/*.md" --code-path "./**/*.al"
```

## ⚙️ Configuration

### Input Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `GITHUB_TOKEN` | ✅ | - | GitHub token for repository access |
| `OPENAI_API_KEY` | ⚠️ | - | OpenAI API key (required if using OpenAI models) |
| `ANTHROPIC_API_KEY` | ⚠️ | - | Anthropic API key (required if using Anthropic models) |
| `MODEL_STRING` | ❌ | `openai:gpt-4` | AI model to use |
| `DOCS_PATH` | ❌ | `./*/md/*.md,./md/*.md` | Glob pattern for documentation files |
| `CODE_PATH` | ❌ | `./**/*.al` | Glob pattern for AL code files |
| `OUTPUT_PATH` | ❌ | `./tests` | Directory for generated tests |
| `TEST_LANGUAGE` | ❌ | `AL` | Language for generated tests |
| `MAX_TOKENS` | ❌ | `4000` | Maximum tokens for AI responses |
| `CHANGED_FILES_ONLY` | ❌ | `true` | Only analyze changed files in PRs |
| `DEBUG` | ❌ | `false` | Enable debug logging |

### Supported AI Models

#### OpenAI Models
- `openai:gpt-4` (recommended)
- `openai:gpt-4-turbo`
- `openai:gpt-3.5-turbo`

#### Anthropic Models
- `anthropic:claude-3-sonnet`
- `anthropic:claude-3-haiku`
- `anthropic:claude-3-opus`

### Environment Variables

Create a `.env` file for local development:

```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GITHUB_TOKEN=your_github_token_here
```

## 📚 Examples

### Basic AL Extension Testing

For a simple AL extension:

```al
// SalesAnalysis.al
tableextension 50001 "Sales Analysis Customer" extends Customer
{
    fields
    {
        field(50001; "Average Sales Amount"; Decimal)
        {
            FieldClass = FlowField;
            CalcFormula = Average("Sales Header"."Total Amount" WHERE("Sell-to Customer No." = FIELD("No.")));
        }
    }
}

codeunit 50001 "Sales Analysis Events"
{
    [IntegrationEvent(false, false)]
    procedure OnSalesPosted(SalesHeader: Record "Sales Header")
    begin
    end;
}
```

The generator creates comprehensive tests:

```al
// TestSalesAnalysis.al (generated)
codeunit 70001 "Test Sales Analysis"
{
    Subtype = Test;
    TestPermissions = Disabled;

    [Test]
    procedure TestAverageSalesAmountCalculation()
    var
        Customer: Record Customer;
        SalesHeader: Record "Sales Header";
    begin
        // Test flowfield calculation with sample data
        // ... comprehensive test implementation
    end;

    [Test]
    procedure TestOnSalesPostedEvent()
    begin
        // Test event publisher functionality
        // ... event testing implementation
    end;
}
```

### Cross-Module Integration Testing

For projects with multiple modules, the generator identifies integration points:

```
Project Structure:
├── SalesAnalysis/     (publishes sales events)
├── InventoryTracker/  (subscribes to sales events)
└── CustomerEngagement/ (uses data from both modules)
```

Generated integration tests verify:
- Event chains work correctly
- Flowfield calculations span modules
- Data consistency across extensions

### Documentation-Driven Testing

Given documentation like:

```markdown
# Sales Analysis Feature

## Business Logic
- Calculate average sales per customer
- Trigger events when sales are posted
- Update customer engagement scores

## Edge Cases
- Handle customers with no sales
- Validate negative amounts
- Test with large datasets
```

The generator creates tests that specifically cover these documented scenarios.

## 🔧 Advanced Features

### Custom Test Templates

Create custom test templates in your project:

```typescript
// config/test-templates.ts
export const customTemplates = {
  flowfield: `
    [Test]
    procedure Test{{fieldName}}Calculation()
    begin
        // Custom flowfield test template
    end;
  `,
  event: `
    [Test]
    procedure Test{{eventName}}Event()
    begin
        // Custom event test template
    end;
  `
};
```

### Test Generation Rules

Configure test generation behavior:

```json
// config/rules.json
{
  "testNaming": {
    "prefix": "Test",
    "suffix": "",
    "includeObjectId": true
  },
  "coverage": {
    "minimumProcedures": 0.8,
    "includePrivateMethods": false,
    "testEvents": true,
    "testFlowfields": true
  },
  "aiPrompt": {
    "temperature": 0.3,
    "includeComments": true,
    "generateNegativeTests": true
  }
}
```

### Integration with AL Test Framework

Generated tests work with standard AL testing tools:

```yaml
# .github/workflows/al-testing.yml
- name: Run AL Tests
  run: |
    # Use AL Test Runner
    & "C:\Program Files\Microsoft Dynamics 365 Business Central\150\Service\ALTestRunner.exe" `
      --server localhost `
      --database "BC150" `
      --testpage 130450
```

## 🐛 Troubleshooting

### Common Issues

**❌ "No AL files found"**
```bash
# Check your CODE_PATH pattern
al-test-generator generate --debug --code-path "./**/*.al"
```

**❌ "API rate limit exceeded"**
```yaml
# Add delays between requests
- uses: your-username/al-test-generator@v1
  with:
    MAX_TOKENS: "2000"  # Reduce token usage
```

**❌ "Invalid AL syntax in generated tests"**
```yaml
# Use more specific documentation
DOCS_PATH: "./detailed-specs/*.md"  # More detailed docs = better tests
```

### Debug Mode

Enable detailed logging:

```bash
al-test-generator generate --debug
```

This shows:
- File discovery process
- Documentation parsing
- AI prompt construction
- Test generation steps

### Validation

The tool includes built-in validation:

```typescript
// Validates generated AL syntax
const validation = await llmClient.validateTestCode(generatedTest);
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
git clone https://github.com/your-username/al-test-generator.git
cd al-test-generator
npm install
npm run dev
```

### Running Tests

```bash
npm test
npm run test:watch
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Shippie](https://github.com/mattzcarey/shippie) for GitHub Actions integration patterns
- Microsoft Dynamics 365 Business Central team for AL language specifications
- OpenAI and Anthropic for AI model capabilities

## 📞 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issues](https://github.com/your-username/al-test-generator/issues)
- 💬 [Discussions](https://github.com/your-username/al-test-generator/discussions)
- 📧 [Email Support](mailto:support@example.com)

---

**Made with ❤️ for the Business Central community**
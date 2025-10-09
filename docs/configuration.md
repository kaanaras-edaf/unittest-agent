# Configuration Guide

This guide covers all configuration options for the AL Unit Test Generator.

## Environment Variables

### Required Variables

```env
# GitHub Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# AI Provider (choose one or both)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
```

### Optional Variables

```env
# Default model selection
DEFAULT_MODEL=openai:gpt-4

# Debug mode
DEBUG=false

# Custom base URL for OpenAI-compatible APIs
OPENAI_BASE_URL=https://api.openai.com/v1
```

## File Patterns

### Documentation Patterns

```yaml
# Standard pattern for module documentation
DOCS_PATH: "./*/md/*.md,./md/*.md"

# Include all markdown files
DOCS_PATH: "./**/*.md"

# Specific documentation directories
DOCS_PATH: "./docs/**/*.md,./specifications/**/*.md"

# Multiple specific files
DOCS_PATH: "./readme.md,./architecture.md,./modules/*/spec.md"
```

### Code Patterns

```yaml
# All AL files in project
CODE_PATH: "./**/*.al"

# Specific modules only
CODE_PATH: "./SalesModule/*.al,./InventoryModule/*.al"

# Exclude certain directories
CODE_PATH: "./**/*.al,!./deprecated/**,!./backup/**"

# Include related configuration files
CODE_PATH: "./**/*.al,./**/app.json"
```

## AI Model Configuration

### OpenAI Models

```yaml
# GPT-4 (recommended for complex AL logic)
MODEL_STRING: "openai:gpt-4"

# GPT-4 Turbo (faster, larger context)
MODEL_STRING: "openai:gpt-4-turbo"

# GPT-3.5 Turbo (cost-effective)
MODEL_STRING: "openai:gpt-3.5-turbo"
```

### Anthropic Models

```yaml
# Claude 3 Sonnet (balanced performance)
MODEL_STRING: "anthropic:claude-3-sonnet"

# Claude 3 Haiku (fastest)
MODEL_STRING: "anthropic:claude-3-haiku"

# Claude 3 Opus (highest quality)
MODEL_STRING: "anthropic:claude-3-opus"
```

### Token Limits

```yaml
# Conservative (faster, lower cost)
MAX_TOKENS: "2000"

# Standard (balanced)
MAX_TOKENS: "4000"

# Comprehensive (detailed tests, higher cost)
MAX_TOKENS: "8000"
```

## Test Generation Rules

Create `config/rules.json`:

```json
{
  "testNaming": {
    "prefix": "Test",
    "suffix": "",
    "includeObjectId": true,
    "camelCase": true
  },
  "coverage": {
    "minimumProcedures": 0.8,
    "includePrivateMethods": false,
    "testEvents": true,
    "testFlowfields": true,
    "testIntegrationPoints": true,
    "generateNegativeTests": true
  },
  "aiPrompt": {
    "temperature": 0.3,
    "includeComments": true,
    "generateDocumentation": true,
    "focusOnBusinessLogic": true
  },
  "outputFormat": {
    "indentation": "    ",
    "lineEndings": "crlf",
    "includeFileHeader": true
  }
}
```

## Workflow Configuration

### Basic PR Workflow

```yaml
name: AL Test Generation
on:
  pull_request:
    paths: ['**/*.al', '**/md/*.md']

jobs:
  test-generation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: your-username/al-test-generator@v1
        with:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CHANGED_FILES_ONLY: "true"
```

### Advanced Workflow with Multiple Models

```yaml
jobs:
  test-generation:
    strategy:
      matrix:
        model: 
          - "openai:gpt-4"
          - "anthropic:claude-3-sonnet"
    steps:
      - uses: your-username/al-test-generator@v1
        with:
          MODEL_STRING: ${{ matrix.model }}
          OUTPUT_PATH: "./tests/${{ matrix.model }}"
```

### Conditional Generation

```yaml
- name: Check for AL changes
  id: changes
  run: |
    if git diff --name-only HEAD^ HEAD | grep -q '\.al$'; then
      echo "has_al_changes=true" >> $GITHUB_OUTPUT
    fi

- name: Generate tests
  if: steps.changes.outputs.has_al_changes == 'true'
  uses: your-username/al-test-generator@v1
```

## Project Structure Requirements

### Recommended Structure

```
your-al-project/
├── .github/workflows/          # GitHub Actions
├── config/                     # Tool configuration
│   ├── rules.json
│   └── .env.example
├── docs/                       # Project documentation
│   └── architecture.md
├── ModuleName/                 # AL Modules
│   ├── md/                     # Module documentation
│   │   ├── feature.md
│   │   └── api.md
│   ├── src/                    # AL source files
│   │   ├── Tables/
│   │   ├── Pages/
│   │   └── Codeunits/
│   └── ModuleName.al           # Main extension file
├── tests/                      # Generated tests (auto-created)
└── app.json                   # AL app manifest
```

### Documentation Requirements

Each module should have documentation that includes:

```markdown
# Module Name

## Overview
Brief description of the module's purpose.

## Business Logic
- Key business rules
- Calculation methods
- Validation requirements

## Integration Points
- Events published/subscribed
- Tables extended
- Dependencies on other modules

## Edge Cases
- Error scenarios to test
- Boundary conditions
- Performance considerations
```

## Integration Settings

### GitHub Repository Settings

1. **Secrets Configuration**:
   ```
   Settings → Secrets and variables → Actions
   ```
   Add:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`

2. **Workflow Permissions**:
   ```yaml
   permissions:
     contents: read
     pull-requests: write
     issues: write
   ```

3. **Branch Protection Rules**:
   ```
   Require status checks: AL Test Generation
   ```

### VS Code Integration

For local development, add to `.vscode/settings.json`:

```json
{
  "al-test-generator.autoGenerate": true,
  "al-test-generator.model": "openai:gpt-4",
  "al-test-generator.outputPath": "./tests",
  "al-test-generator.includeDocumentation": true
}
```

## Performance Optimization

### Rate Limiting

```yaml
# Stagger API calls for large projects
- uses: your-username/al-test-generator@v1
  with:
    MAX_TOKENS: "2000"  # Smaller requests
    CHANGED_FILES_ONLY: "true"  # Reduce scope
```

### Caching

```yaml
- name: Cache AI responses
  uses: actions/cache@v4
  with:
    path: ~/.cache/al-test-generator
    key: tests-${{ hashFiles('**/*.al') }}
```

### Parallel Processing

```yaml
strategy:
  matrix:
    module: [SalesAnalysis, InventoryTracker, CustomerEngagement]
steps:
  - uses: your-username/al-test-generator@v1
    with:
      CODE_PATH: "./${{ matrix.module }}/*.al"
      OUTPUT_PATH: "./tests/${{ matrix.module }}"
```

## Troubleshooting Configuration

### Debug Mode

Enable detailed logging:

```yaml
- uses: your-username/al-test-generator@v1
  with:
    DEBUG: "true"
```

### Validation

Test your configuration locally:

```bash
# Dry run
al-test-generator analyze --debug

# Validate patterns
al-test-generator generate --dry-run --code-path "./**/*.al"
```

### Common Issues

1. **File Pattern Issues**:
   ```bash
   # Test pattern matching
   find . -name "*.al" | head -10
   ```

2. **API Key Issues**:
   ```bash
   # Test API connectivity
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

3. **Permission Issues**:
   ```yaml
   # Ensure proper permissions
   permissions:
     contents: read
     pull-requests: write
   ```

## Security Considerations

### API Key Security

- Use GitHub Secrets, never commit keys
- Rotate keys regularly
- Use least-privilege tokens
- Monitor usage and costs

### Generated Code Review

- Always review generated tests before merging
- Validate business logic correctness
- Check for security implications
- Ensure test data doesn't contain sensitive information

### Access Control

```yaml
# Limit workflow to specific branches
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]
```
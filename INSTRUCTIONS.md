# Project Instructions

## Overview
This file contains the core instructions and guidelines for the UnitTest-Agent project.

## Instructions
# AI Test Generation Agent Project Context

## Project Overview
You need to build a standalone AI agent that automatically generates unit tests by analyzing project documentation and code structure. This agent will be reusable across multiple repositories.

## Reference Project: Shippie
Shippie is an AI-powered code review agent that integrates into GitHub Actions workflows. Your agent should follow a similar architecture but focus on test generation instead of code review.

Key files from Shippie to reference:
- `action.yml` - GitHub Action definition
- `.github/workflows/` - Example workflows
- `src/` - Core agent logic
- `docs/` - Configuration and usage documentation

## Expected Target Project Structure Template
The agent can work with AL projects following this general structure:
```
<ProjectName>/
├── .github/workflows/
│   └── *.yml                    # CI/CD workflows
├── <Module1>/
│   ├── md/
│   │   └── feature.md           # Module documentation
│   └── *.al                     # AL extension files
├── <Module2>/
│   ├── md/
│   │   └── feature.md           # Module documentation
│   └── *.al                     # AL extension files
├── md/
│   └── architecture.md          # Overall project documentation
└── tests/                       # Generated tests output directory
```

**Note**: The agent dynamically discovers project structure by scanning for:
- `.al` files for code analysis
- `.md` files for documentation context
- Module directories containing both code and documentation

## Agent Requirements

### Core Functionality
1. **Documentation Analysis**: Read and understand markdown files (feature.md, architecture.md)
2. **Code Analysis**: Parse AL/code files to understand module structure and integration points
3. **LLM Integration**: Use OpenAI/Claude API to generate contextually relevant unit tests
4. **Test Output**: Write generated tests to appropriate directories with proper naming conventions

### Expected Agent Project Structure
```
ai-test-agent/
├── action.yml                    # GitHub Action definition
├── package.json                  # Node.js dependencies
├── src/
│   ├── index.js                  # Main entry point
│   ├── analyzer.js               # Code/documentation analysis
│   ├── llm-client.js            # LLM API integration
│   └── test-generator.js        # Test file generation logic
├── .github/workflows/
│   ├── check-pr-title.yml       # PR title validation
│   ├── claude.yml               # Claude model integration
│   ├── pr.yml                   # PR workflow
│   └── release-package.yml      # Package release automation
├── docs/
│   ├── README.md                # Setup and usage instructions
│   ├── configuration.md         # Configuration options
│   └── examples.md              # Usage examples
├── config/
│   ├── .env.example             # Environment variables template
│   └── rules.json               # Test generation rules/patterns
└── examples/
    └── sample-workflow.yml      # Example usage in workflows
```

## Example Workflow Integration
Target projects can integrate the agent into their CI/CD workflows:

```yaml
name: Run Tests

on:
  push:
    branches: [ main, feature/* ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      # Generate tests using the AI agent
      - name: Generate Unit Tests with AI Agent
        uses: <your-username>/unittest-agent@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          docs-path: './*/md/*.md,./md/*.md'
          code-path: './*/*.al'
          output-path: './tests'

      - name: Run tests
        run: npm test

      - name: GitHub Test Reporter
        uses: ctrf-io/github-test-reporter@v1.0.24
        with:
          report-path: './ctrf/*.json'
          github-report: true
        if: always()
```

## Expected Workflow
1. **Trigger**: Push/PR to target branches
2. **Checkout**: Get repository code
3. **Setup**: Install Node.js and dependencies
4. **Analyze Project**: Scan for AL files and documentation
5. **Generate Tests**: AI agent creates contextually relevant unit tests
6. **Run Tests**: Execute generated tests
7. **Report**: Display test results in PR

## Key Integration Points
- Agent discovers and reads markdown documentation to understand module features
- Agent parses AL extension files to understand code structure and dependencies
- Agent generates tests for flowfields, event integration, and business logic
- Agent outputs tests in format compatible with AL test framework
- Tests cover cross-module integration scenarios and business workflows

## AL Project Analysis Capabilities
The agent analyzes AL (Application Language) projects to understand:

### Code Structure Detection
- **Table Extensions**: Fields, keys, triggers, and flowfields
- **Codeunits**: Procedures, local variables, and business logic
- **Event Integration**: Publishers and subscribers across modules
- **Dependencies**: Cross-module references and integration points

### Documentation Context Extraction
- **Feature Documentation**: Module-specific functionality from `.md` files
- **Architecture Documentation**: Overall system design and integration patterns
- **Business Logic**: Workflows and rules described in documentation

### Test Generation Patterns
- **Flowfield Calculations**: Tests for computed fields and aggregations
- **Event Publishing/Subscribing**: Integration tests for event-driven logic
- **Cross-Module Integration**: Tests covering module interdependencies
- **Business Logic Validation**: Tests for procedures and triggers

## Integration Analysis
The agent automatically identifies integration points by analyzing:
- Event publishers and their corresponding subscribers
- Flowfield dependencies between tables
- Cross-module procedure calls and data flow
- Shared table extensions and field usage

## Success Criteria
- Agent can be published as a reusable GitHub Action
- Generated tests are syntactically correct and executable
- Tests cover the main functionality described in documentation
- Agent works with AL (Application Language) projects following the expected structure
- Clear documentation for setup and configuration
- Tests cover cross-module integration scenarios (events, flowfields, business logic)

## Next Steps
1. Create the agent project structure
2. Implement core functionality (documentation parsing, LLM integration, test generation)
3. Create GitHub Action definition (action.yml)
4. Add example workflows and documentation
5. Test with your current AL project
6. Publish as reusable action

## Important Notes
- The agent should understand AL (Application Language) syntax for Business Central extensions
- Tests should be generated in a format compatible with AL test framework
- Focus on testing flowfield calculations, event publishing/subscribing, and cross-module integration
- Documentation files contain detailed feature explanations and workflows that the LLM should use as context
---

**Note**: This file serves as the primary reference for project requirements and guidelines. All development decisions should align with the instructions provided here.
# How to Use UnitTest-Agent in Your AL Project

## Prerequisites
1. **OpenAI API Key**: Get one from https://platform.openai.com/api-keys
2. **Node.js**: Version 18 or higher
3. **AL Project Structure**: Your project should follow the expected structure with `.al` files and `.md` documentation

## Setup Options

### Option 1: GitHub Action Integration (Recommended)

#### Step 1: Add GitHub Secrets
1. Go to your repository → Settings → Secrets and variables → Actions
2. Add a new secret: `OPENAI_API_KEY` with your OpenAI API key

#### Step 2: Create Workflow File
Create `.github/workflows/test-generation.yml` in your AL project:

```yaml
name: Generate Unit Tests

on:
  push:
    branches: [ main, feature/* ]
  pull_request:
    branches: [ main ]

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Generate Unit Tests
        uses: your-username/unittest-agent@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          docs-path: './*/md/*.md,./md/*.md'
          code-path: './*/*.al'
          output-path: './tests'
          model: 'gpt-4o'  # Optional

      - name: Commit generated tests
        if: github.event_name == 'push'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add tests/
          git diff --staged --quiet || git commit -m "Auto-generated unit tests [skip ci]"
          git push
```

### Option 2: Local CLI Usage

#### Step 1: Clone and Setup
```bash
# Clone the UnitTest-Agent
git clone https://github.com/your-username/unittest-agent.git
cd unittest-agent
npm install
npm run build
```

#### Step 2: Set Environment Variable
```bash
# Linux/Mac
export OPENAI_API_KEY='your-api-key-here'

# Windows PowerShell
$env:OPENAI_API_KEY='your-api-key-here'

# Windows Command Prompt
set OPENAI_API_KEY=your-api-key-here
```

#### Step 3: Run on Your AL Project
```bash
# Navigate to your AL project
cd /path/to/your/al-project

# Generate tests (analyze + generate)
node /path/to/unittest-agent/dist/index.js generate \
  --docs './*/md/*.md,./md/*.md' \
  --code './*/*.al' \
  --output './tests'

# Or just analyze without generating tests
node /path/to/unittest-agent/dist/index.js analyze \
  --docs './*/md/*.md' \
  --code './*/*.al'
```

## Configuration Options

### Input Parameters
- `openai-api-key`: Your OpenAI API key (required for generation)
- `docs-path`: Glob pattern for documentation files (default: './*/md/*.md,./md/*.md')
- `code-path`: Glob pattern for AL files (default: './*/*.al')
- `output-path`: Directory for generated tests (default: './tests')
- `model`: OpenAI model to use (default: 'gpt-4o', options: 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo')

### Example Project Structure
Your AL project should look like this:
```
YourALProject/
├── .github/workflows/
│   └── test-generation.yml    # Add this workflow
├── SalesModule/
│   ├── md/
│   │   └── feature.md         # Module documentation
│   └── SalesExt.al           # AL extension files
├── InventoryModule/
│   ├── md/
│   │   └── feature.md
│   └── InventoryExt.al
├── md/
│   └── architecture.md       # Overall documentation
└── tests/                    # Generated tests will go here
```

## Output
The agent will generate:
- Unit test files in the `tests/` directory
- Tests for flowfield calculations
- Integration tests for event publishers/subscribers
- Cross-module integration tests
- Business logic validation tests

## Troubleshooting

### Common Issues
1. **API Key Error**: Make sure your OpenAI API key is valid and has sufficient credits
2. **File Not Found**: Check that your glob patterns match your actual file structure
3. **Permission Errors**: Ensure the output directory is writable

### Debug Mode
Add `--debug` flag to see detailed analysis:
```bash
node /path/to/unittest-agent/dist/index.js generate --debug
```

## Next Steps
1. Set up your OpenAI API key
2. Choose integration method (GitHub Action or local CLI)
3. Run the agent on your AL project
4. Review and customize generated tests
5. Integrate with your existing test framework
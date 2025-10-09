# UnitTest-Agent 🧪

AI-powered unit test generator for Microsoft Dynamics 365 Business Central AL extensions.

[![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue)](https://github.com/kaanaras-edaf/unittest-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

## 🚀 Features

- **🤖 AI-Powered Test Generation**: Uses OpenAI GPT models to generate comprehensive unit tests
- **📄 AL Language Support**: Specifically designed for Business Central AL extensions
- **📚 Documentation-Aware**: Analyzes project documentation to generate contextually relevant tests
- **🔗 Cross-Module Integration**: Identifies and tests interactions between different modules
- **⚡ Event & Flowfield Testing**: Specialized testing for AL-specific features like events and flowfields
- **🔧 GitHub Actions Integration**: Seamlessly integrates into CI/CD pipelines
- **🎯 Smart Analysis**: Analyzes project structure and dependencies automatically

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Examples](#-examples)
- [Project Structure](#-project-structure)
- [Advanced Usage](#-advanced-usage)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🏃‍♂️ Quick Start

### 1. Add to Your AL Project

Copy one of the example workflows from our [`examples/`](./examples/) directory to your AL project's `.github/workflows/` folder:

**Recommended**: [`target-project-workflow.yml`](./examples/target-project-workflow.yml)

```yaml
name: AL Test Generation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  generate-and-run-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate Unit Tests
        uses: kaanaras-edaf/unittest-agent@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          docs-path: './*/md/*.md,./md/*.md'
          code-path: './*/*.al'
          output-path: './tests'
```

### 2. Configure Secrets

Add your OpenAI API key to repository secrets:
1. Go to your repository → Settings → Secrets and variables → Actions
2. Add new secret: `OPENAI_API_KEY` with your [OpenAI API key](https://platform.openai.com/api-keys)

### 3. Test the Action

Push a change or create a PR to trigger the workflow and see AI-generated tests!

## 🛠 Installation

### GitHub Action (Recommended)

Use directly in your workflows:

```yaml
- uses: kaanaras-edaf/unittest-agent@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

### Local CLI Usage

```bash
# Clone the repository
git clone https://github.com/kaanaras-edaf/unittest-agent.git
cd unittest-agent

# Install and build
npm install
npm run build

# Set API key
export OPENAI_API_KEY='your-api-key-here'  # Linux/Mac
$env:OPENAI_API_KEY='your-api-key-here'    # Windows PowerShell

# Run on your AL project
node dist/index.js generate --docs './*/md/*.md' --code './*/*.al' --output './tests'
```

## ⚙️ Configuration

### Input Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `openai-api-key` | OpenAI API key for test generation | - | ✅ Yes |
| `docs-path` | Glob pattern for documentation files | `./*/md/*.md,./md/*.md` | No |
| `code-path` | Glob pattern for AL files | `./*/*.al` | No |
| `output-path` | Directory for generated tests | `./tests` | No |
| `model` | OpenAI model to use | `gpt-4o` | No |

### Supported Models

- `gpt-4o` (recommended)
- `gpt-4-turbo`
- `gpt-3.5-turbo`

### Example with Custom Configuration

```yaml
- uses: kaanaras-edaf/unittest-agent@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    docs-path: './documentation/**/*.md'
    code-path: './src/**/*.al'
    output-path: './generated-tests'
    model: 'gpt-4-turbo'
```

## 📁 Project Structure

Your AL project should follow this structure for optimal results:

```
YourALProject/
├── .github/workflows/
│   └── test-generation.yml     # Copied from examples/
├── SalesModule/
│   ├── md/
│   │   └── feature.md          # Module documentation
│   └── SalesExt.al            # AL extension files
├── InventoryModule/
│   ├── md/
│   │   └── feature.md
│   └── InventoryExt.al
├── CustomerModule/
│   ├── md/
│   │   └── feature.md
│   └── CustomerExt.al
├── md/
│   └── architecture.md         # Overall project documentation
└── tests/                      # Generated tests (created by agent)
    ├── SalesModuleTests.al
    ├── InventoryModuleTests.al
    └── CustomerModuleTests.al
```

## 🎯 Examples

### Complete Workflow Examples

See our [`examples/`](./examples/) directory for ready-to-use workflows:

- **[`target-project-workflow.yml`](./examples/target-project-workflow.yml)** - Complete test generation and execution
- **[`pr-workflow.yml`](./examples/pr-workflow.yml)** - PR-focused workflow for changed files only
- **[`sample-workflow.yml`](./examples/sample-workflow.yml)** - Basic usage example

Each example includes detailed comments and setup instructions.

### What Gets Generated

The agent creates comprehensive unit tests covering:

#### 📊 **Table Extensions**
- Field validation tests
- Trigger behavior verification
- Flowfield calculation tests

#### 📡 **Event Integration**
- Event publisher tests
- Event subscriber verification
- Cross-module event flow tests

#### 🔧 **Business Logic**
- Procedure functionality tests
- Parameter validation
- Error handling scenarios

#### 🔗 **Integration Scenarios**
- Module interdependency tests
- Data flow verification
- End-to-end workflow testing

## 🚀 Advanced Usage

### CLI Commands

```bash
# Analyze project structure (no API key required)
node dist/index.js analyze --docs './*/md/*.md' --code './*/*.al'

# Generate tests with specific model
node dist/index.js generate --model 'gpt-4-turbo' --docs './docs/**/*.md' --code './src/**/*.al'

# Enable debug output
node dist/index.js generate --debug
```

### Development and Testing

```bash
# Run the development test workflow
npm run build
npm run type-check

# Test CLI functionality
node dist/index.js --help
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **"Action not found"** | Ensure you're using `kaanaras-edaf/unittest-agent@v1` |
| **"API key missing"** | Add `OPENAI_API_KEY` to repository secrets |
| **"No AL files found"** | Check your `code-path` glob pattern matches your files |
| **"No documentation found"** | Verify `docs-path` matches your documentation location |
| **Rate limit errors** | Reduce API calls or upgrade your OpenAI plan |

### Debug Mode

Enable detailed logging by adding `DEBUG: "true"` to your workflow:

```yaml
- uses: kaanaras-edaf/unittest-agent@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    DEBUG: "true"
```

### Getting Help

- 📖 **Documentation**: Check our [setup guide](./SETUP.md) and [usage documentation](./docs/USAGE.md)
- 🐛 **Issues**: Report bugs at [GitHub Issues](https://github.com/kaanaras-edaf/unittest-agent/issues)
- 💬 **Discussions**: Ask questions in [GitHub Discussions](https://github.com/kaanaras-edaf/unittest-agent/discussions)

## 🤝 Contributing

We welcome contributions! Please see our [contributing guidelines](./CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/kaanaras-edaf/unittest-agent.git
cd unittest-agent
npm install
npm run build
```

### Running Tests

```bash
npm test
npm run type-check
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the [Shippie](https://github.com/marketplace/actions/shippie) GitHub Action pattern
- Built for the Microsoft Dynamics 365 Business Central community
- Powered by OpenAI's GPT models

## 📊 Repository Stats

![GitHub stars](https://img.shields.io/github/stars/kaanaras-edaf/unittest-agent)
![GitHub forks](https://img.shields.io/github/forks/kaanaras-edaf/unittest-agent)
![GitHub issues](https://img.shields.io/github/issues/kaanaras-edaf/unittest-agent)
![GitHub pull requests](https://img.shields.io/github/issues-pr/kaanaras-edaf/unittest-agent)

---

**Made with ❤️ for the Business Central AL community**
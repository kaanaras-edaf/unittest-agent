# UnitTest-Agent Release Notes

## 🚀 v1.2.0 - Enhanced Test Generation Quality

**Release Date**: January 2025

### ✨ Major Improvements

#### 🎯 Working Code Generation
- **BREAKING THROUGH**: AI now generates **actual working AL test implementations** instead of placeholder comments
- **Source Code Context**: Full AL source code is included in LLM prompts for better understanding
- **Production-Ready**: Generated tests are compilable and follow AL best practices

#### 🧠 Enhanced Prompt Engineering
- **Detailed Requirements**: Comprehensive instructions for generating working test code
- **Specific Examples**: Prompt includes real AL test examples showing expected quality
- **Context-Aware**: Includes table structures, field definitions, and procedure signatures

#### ⚙️ Technical Enhancements
- **Increased Token Limits**: Minimum 8000 tokens for detailed code generation
- **JSON Output Format**: Ensures structured, parseable responses
- **Lower Temperature**: More consistent and deterministic code generation (0.2)
- **Enhanced System Prompt**: Better instructions for production-ready test generation

### 🔧 What Changed

**Before v1.2.0**: Generated placeholder tests like:
```al
// Test calculation logic
// Verify flowfield values
// Assert expected results
```

**After v1.2.0**: Generates actual working tests like:
```al
LibraryAssert.AreEqual(ExpectedValue, ActualValue, 'Score calculation should match expected value');
CustomerScore.TestField("Rating", CustomerScore.Rating::Gold);
Customer.SetFilter("Customer Posting Group", 'DOMESTIC');
```

### 📦 Migration Guide

Update your workflows to use the latest version:

```yaml
- uses: kaanaras-edaf/unittest-agent@v1.2.0  # Latest version
# OR
- uses: kaanaras-edaf/unittest-agent@v1      # Auto-updates to latest v1.x
```

---

## 🔧 v1.1.0 - Stability & Fixes

**Release Date**: January 2025

### � Critical Fixes
- **✅ Fixed npm 404 Error**: Resolved "Package 'al-test-generator' not found" error in GitHub Actions
- **🏷️ Proper Versioning**: Clean tag structure for reliable action usage  
- **🔧 Build Process**: Uses local repository code instead of non-existent npm package

### 📦 Technical Changes
- Changed action.yml to use local build process (`npm ci && npm run build`)
- Updated all references from 'al-test-generator' to 'unittest-agent'
- Streamlined GitHub Actions workflow structure

---

## 🚀 v1.0.0 - Initial Release

**Release Date**: January 2025

AI-powered unit test generator for Business Central AL extensions.

### ✨ Features

- **📄 Documentation Analysis**: Reads and understands markdown files (feature.md, architecture.md)
- **🔍 AL Code Analysis**: Parses AL extension files to understand module structure and integration points
- **🤖 LLM Integration**: Uses OpenAI/Claude API to generate contextually relevant unit tests
- **📝 Test Generation**: Creates comprehensive unit tests for:
  - Flowfield calculations and aggregations
  - Event publishing/subscribing patterns
  - Cross-module integration scenarios
  - Business logic validation
  - Table extensions and triggers

### 🛠️ Usage

```yaml
- name: Generate Unit Tests
  uses: kaanaras-edaf/unittest-agent@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    docs-path: './*/md/*.md,./md/*.md'
    code-path: './*/*.al'
    output-path: './tests'
    model: 'gpt-4o'  # Optional: gpt-4o, gpt-4-turbo, gpt-3.5-turbo
```

### 📋 Requirements

- OpenAI API key from https://platform.openai.com/api-keys
- AL project with `.al` extension files
- Markdown documentation files (`.md`)
- Node.js 18+ (automatically provided in GitHub Actions)

### 🏗️ Supported Project Structure

```
YourALProject/
├── Module1/
│   ├── md/feature.md
│   └── *.al
├── Module2/
│   ├── md/feature.md
│   └── *.al
├── md/architecture.md
└── tests/ (generated)
```

### 🔧 Configuration Options

| Input | Description | Default | Required |
|-------|-------------|---------|----------|
| `openai-api-key` | OpenAI API key for test generation | - | Yes |
| `docs-path` | Glob pattern for documentation files | `./*/md/*.md,./md/*.md` | No |
| `code-path` | Glob pattern for AL files | `./*/*.al` | No |
| `output-path` | Directory for generated tests | `./tests` | No |
| `model` | OpenAI model to use | `gpt-4o` | No |

### 📚 Examples

#### Basic Usage
```yaml
- uses: kaanaras-edaf/unittest-agent@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

#### Custom Paths
```yaml
- uses: kaanaras-edaf/unittest-agent@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    docs-path: './docs/**/*.md'
    code-path: './src/**/*.al'
    output-path: './generated-tests'
```

#### Using Different Model
```yaml
- uses: kaanaras-edaf/unittest-agent@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    model: 'gpt-4-turbo'
```

### 🎯 What Gets Generated

The agent creates unit tests that cover:

1. **Table Extensions**
   - Field validation tests
   - Trigger behavior tests
   - Flowfield calculation verification

2. **Event Integration**
   - Event publisher tests
   - Event subscriber tests
   - Cross-module event flow tests

3. **Business Logic**
   - Procedure functionality tests
   - Parameter validation tests
   - Error handling tests

4. **Integration Scenarios**
   - Module interdependency tests
   - Data flow verification tests
   - End-to-end workflow tests

### 📖 Documentation

- [Setup Guide](./SETUP.md)
- [Usage Instructions](./docs/USAGE.md)
- [Configuration Options](./docs/configuration.md)
- [Publishing Guide](./PUBLISHING.md)

### 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### 📝 License

MIT License - see [LICENSE](./LICENSE) file for details.

### 🐛 Issues & Support

Report issues at: https://github.com/kaanaras-edaf/unittest-agent/issues

### 💡 Future Enhancements

- Support for additional LLM providers (Anthropic Claude)
- Test framework integration (AL Test Runner)
- Custom test templates
- Batch processing for large projects
- Integration with AL Language Server
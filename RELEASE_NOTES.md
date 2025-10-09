# UnitTest-Agent v1.0.0 Release Notes

## 🚀 UnitTest-Agent v1.0.0 - Initial Release

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
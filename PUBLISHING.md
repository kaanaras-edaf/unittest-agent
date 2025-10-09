# Publishing UnitTest-Agent to GitHub Actions

## Step-by-Step Publishing Guide

### Step 1: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository Settings**:
   - Repository name: `unittest-agent`
   - Description: `AI-powered unit test generator for Business Central AL extensions`
   - Visibility: **Public** (required for GitHub Actions)
   - Don't initialize with README (you already have one)

3. **Create Repository**

### Step 2: Push Your Code

```bash
# Add the GitHub repository as remote origin
git remote add origin https://github.com/YOUR-USERNAME/unittest-agent.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Create Release Tags

```bash
# Create version tags (required for GitHub Actions)
git tag -a v1.0.0 -m "Release version 1.0.0"
git tag -a v1 -m "Release version 1.x"

# Push tags to GitHub
git push origin v1.0.0
git push origin v1
```

### Step 4: Create GitHub Release

1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. **Tag version**: `v1.0.0`
4. **Release title**: `UnitTest-Agent v1.0.0`
5. **Description**:
```markdown
## UnitTest-Agent v1.0.0

AI-powered unit test generator for Business Central AL extensions.

### Features
- Analyzes AL code and documentation
- Generates comprehensive unit tests
- Supports flowfield calculations
- Cross-module integration testing
- Event publisher/subscriber testing

### Usage
```yaml
- name: Generate Unit Tests
  uses: YOUR-USERNAME/unittest-agent@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    docs-path: './*/md/*.md'
    code-path: './*/*.al'
    output-path: './tests'
```

### Requirements
- OpenAI API key
- AL project with .al files and .md documentation
```
6. Click "Publish release"

### Step 5: Test the Published Action

Create a test repository with this workflow:

```yaml
name: Test UnitTest-Agent
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test UnitTest-Agent
        uses: YOUR-USERNAME/unittest-agent@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          docs-path: './*/md/*.md'
          code-path: './*/*.al'
          output-path: './tests'
```

## Important Notes

### Action Versioning
- Use semantic versioning (v1.0.0, v1.1.0, etc.)
- Maintain major version tags (v1, v2) for easy updates
- Users can reference `@v1` for latest v1.x or `@v1.0.0` for specific version

### Repository Requirements
- Must be **public** for others to use
- Must have `action.yml` in root directory
- All dependencies must be included (node_modules or build process)

### Distribution Strategy
- **Recommended**: Include `dist/` folder with compiled JavaScript
- **Alternative**: Use Docker-based action (heavier but more isolated)

### GitHub Marketplace (Optional)
After testing, you can submit to GitHub Marketplace:
1. Go to repository → Actions tab
2. Click "Publish this Action to the GitHub Marketplace"
3. Fill out the marketplace form
4. Add appropriate tags and categories
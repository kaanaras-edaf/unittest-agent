import { Octokit } from '@octokit/rest';
import { Logger } from './utils/logger';
import fs from 'fs-extra';
import path from 'path';

export class GitHubAnalyzer {
  private octokit: Octokit;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async getChangedALFiles(): Promise<string[]> {
    try {
      if (!process.env.GITHUB_REPOSITORY) {
        throw new Error('GITHUB_REPOSITORY environment variable not set');
      }

      const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
      const pullNumber = this.getPullRequestNumber();

      if (!pullNumber) {
        this.logger.warn('Not in a pull request context, analyzing all files');
        return [];
      }

      this.logger.debug(`Fetching changed files for PR #${pullNumber}`);

      const { data: files } = await this.octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      });

      const alFiles = files
        .filter(file => 
          file.filename.endsWith('.al') && 
          file.status !== 'removed' &&
          fs.existsSync(file.filename)
        )
        .map(file => path.resolve(file.filename));

      this.logger.debug(`Found ${alFiles.length} changed AL files: ${alFiles.join(', ')}`);

      return alFiles;
    } catch (error) {
      this.logger.error(`Failed to get changed files: ${error}`);
      return [];
    }
  }

  private getPullRequestNumber(): number | null {
    // Try to get PR number from different sources
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      const eventPath = process.env.GITHUB_EVENT_PATH;
      if (eventPath && fs.existsSync(eventPath)) {
        try {
          const event = fs.readJsonSync(eventPath);
          return event.pull_request?.number || null;
        } catch (error) {
          this.logger.debug(`Failed to parse GitHub event: ${error}`);
        }
      }
    }

    // Try to extract from GITHUB_REF (refs/pull/123/merge)
    const ref = process.env.GITHUB_REF;
    if (ref && ref.includes('/pull/')) {
      const match = ref.match(/\/pull\/(\d+)\//);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return null;
  }

  async getRepositoryInfo(): Promise<{
    owner: string;
    repo: string;
    branch: string;
    sha: string;
  }> {
    const repository = process.env.GITHUB_REPOSITORY;
    if (!repository) {
      throw new Error('GITHUB_REPOSITORY environment variable not set');
    }

    const [owner, repo] = repository.split('/');
    const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'main';
    const sha = process.env.GITHUB_SHA || '';

    return { owner, repo, branch, sha };
  }
}
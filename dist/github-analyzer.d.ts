import { Logger } from './utils/logger';
export declare class GitHubAnalyzer {
    private octokit;
    private logger;
    constructor(logger: Logger);
    getChangedALFiles(): Promise<string[]>;
    private getPullRequestNumber;
    getRepositoryInfo(): Promise<{
        owner: string;
        repo: string;
        branch: string;
        sha: string;
    }>;
}

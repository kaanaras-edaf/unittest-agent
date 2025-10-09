export class Logger {
  private debugMode: boolean;

  constructor(debug: boolean = false) {
    this.debugMode = debug;
  }

  info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  warn(message: string): void {
    console.warn(`⚠️  ${message}`);
  }

  error(message: string): void {
    console.error(`❌ ${message}`);
  }

  debug(message: string): void {
    if (this.debugMode) {
      console.log(`🐛 [DEBUG] ${message}`);
    }
  }

  success(message: string): void {
    console.log(`✅ ${message}`);
  }
}
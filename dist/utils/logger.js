"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    constructor(debug = false) {
        this.debugMode = debug;
    }
    info(message) {
        console.log(`ℹ️  ${message}`);
    }
    warn(message) {
        console.warn(`⚠️  ${message}`);
    }
    error(message) {
        console.error(`❌ ${message}`);
    }
    debug(message) {
        if (this.debugMode) {
            console.log(`🐛 [DEBUG] ${message}`);
        }
    }
    success(message) {
        console.log(`✅ ${message}`);
    }
}
exports.Logger = Logger;

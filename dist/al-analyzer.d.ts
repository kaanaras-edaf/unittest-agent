import { Logger } from './utils/logger';
export interface ALExtension {
    name: string;
    filePath: string;
    objects: ALObject[];
    events: ALEvent[];
    flowfields: ALFlowfield[];
    dependencies: string[];
}
export interface ALObject {
    type: string;
    id: number;
    name: string;
    description?: string;
    fields?: ALField[];
    procedures?: ALProcedure[];
}
export interface ALField {
    name: string;
    type: string;
    description?: string;
    isFlowfield?: boolean;
    calcFormula?: string;
}
export interface ALProcedure {
    name: string;
    parameters: ALParameter[];
    returnType?: string;
    isEvent?: boolean;
    eventType?: string;
    description?: string;
}
export interface ALParameter {
    name: string;
    type: string;
    isVar?: boolean;
}
export interface ALEvent {
    name: string;
    eventType: 'publisher' | 'subscriber';
    objectType?: string;
    objectName?: string;
    description?: string;
    parameters?: ALParameter[];
}
export interface ALFlowfield {
    name: string;
    tableName: string;
    calcMethod: string;
    sourceField?: string;
    sourceTable?: string;
    filters?: string[];
}
export declare class ALAnalyzer {
    private logger;
    constructor(logger: Logger);
    analyzeALFile(filePath: string): Promise<ALExtension>;
    private parseALObjects;
    private extractObjectContent;
    private parseFields;
    private parseProcedures;
    private parseParameters;
    private extractEvents;
    private extractFlowfields;
    private extractCalcMethod;
    private extractSourceField;
    private extractSourceTable;
    private extractDependencies;
}

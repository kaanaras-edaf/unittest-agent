import fs from 'fs-extra';
import path from 'path';
import { Logger } from './utils/logger';

export interface ALExtension {
  name: string;
  filePath: string;
  objects: ALObject[];
  events: ALEvent[];
  flowfields: ALFlowfield[];
  dependencies: string[];
  sourceCode?: string; // Add source code for LLM context
}

export interface ALObject {
  type: string; // table, page, codeunit, etc.
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

export class ALAnalyzer {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async analyzeALFile(filePath: string): Promise<ALExtension> {
    try {
      this.logger.debug(`Analyzing AL file: ${filePath}`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath, '.al');
      
      const extension: ALExtension = {
        name: fileName,
        filePath,
        objects: [],
        events: [],
        flowfields: [],
        dependencies: [],
        sourceCode: content // Include source code for LLM analysis
      };

      // Parse AL objects
      extension.objects = this.parseALObjects(content);
      
      // Extract events
      extension.events = this.extractEvents(content, extension.objects);
      
      // Extract flowfields
      extension.flowfields = this.extractFlowfields(content, extension.objects);
      
      // Extract dependencies (using statements, table references, etc.)
      extension.dependencies = this.extractDependencies(content);
      
      this.logger.debug(`Found ${extension.objects.length} objects, ${extension.events.length} events, ${extension.flowfields.length} flowfields`);
      
      return extension;
    } catch (error) {
      this.logger.error(`Failed to analyze AL file ${filePath}: ${error}`);
      throw error;
    }
  }

  private parseALObjects(content: string): ALObject[] {
    const objects: ALObject[] = [];
    
    // Regex patterns for different AL object types
    const objectPatterns = [
      /(?:^|\n)\s*(table|page|codeunit|query|report|xmlport)\s+(\d+)\s+"?([^"{\n]+)"?\s*(?:extends\s+"?([^"{\n]+)"?)?\s*{/gi,
      /(?:^|\n)\s*(tableextension|pageextension)\s+(\d+)\s+"?([^"{\n]+)"?\s+extends\s+"?([^"{\n]+)"?\s*{/gi
    ];

    for (const pattern of objectPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const objectType = match[1].toLowerCase();
        const id = parseInt(match[2], 10);
        const name = match[3].trim().replace(/"/g, '');
        
        const obj: ALObject = {
          type: objectType,
          id,
          name,
          fields: [],
          procedures: []
        };

        // Extract the object content (between braces)
        const objectStart = match.index + match[0].length;
        const objectContent = this.extractObjectContent(content, objectStart);
        
        if (objectContent) {
          obj.fields = this.parseFields(objectContent);
          obj.procedures = this.parseProcedures(objectContent);
        }

        objects.push(obj);
      }
    }

    return objects;
  }

  private extractObjectContent(content: string, startIndex: number): string {
    let braceCount = 1;
    let currentIndex = startIndex;
    
    while (currentIndex < content.length && braceCount > 0) {
      const char = content[currentIndex];
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
      currentIndex++;
    }
    
    return content.substring(startIndex, currentIndex - 1);
  }

  private parseFields(content: string): ALField[] {
    const fields: ALField[] = [];
    
    // Match field definitions
    const fieldPattern = /field\s*\(\s*(\d+)\s*;\s*"?([^;"]+)"?\s*;\s*([^;{]+)\s*\)/gi;
    let match;
    
    while ((match = fieldPattern.exec(content)) !== null) {
      const name = match[2].trim().replace(/"/g, '');
      const type = match[3].trim();
      
      const field: ALField = {
        name,
        type,
        isFlowfield: type.toLowerCase().includes('flowfield')
      };

      // Extract calc formula for flowfields
      if (field.isFlowfield) {
        const calcFormulaMatch = content.match(new RegExp(`field\\s*\\([^}]*${name}[^}]*CalcFormula\\s*=\\s*([^;]+);`, 'i'));
        if (calcFormulaMatch) {
          field.calcFormula = calcFormulaMatch[1].trim();
        }
      }

      fields.push(field);
    }

    return fields;
  }

  private parseProcedures(content: string): ALProcedure[] {
    const procedures: ALProcedure[] = [];
    
    // Match procedure definitions
    const procedurePattern = /(local\s+)?procedure\s+"?([^"(]+)"?\s*\(([^)]*)\)\s*(?::\s*([^;{]+))?\s*[;{]/gi;
    let match;
    
    while ((match = procedurePattern.exec(content)) !== null) {
      const name = match[2].trim().replace(/"/g, '');
      const paramString = match[3] || '';
      const returnType = match[4]?.trim();
      
      const procedure: ALProcedure = {
        name,
        parameters: this.parseParameters(paramString),
        returnType
      };

      // Check if it's an event
      const eventPattern = new RegExp(`\\[(?:IntegrationEvent|BusinessEvent|InternalEvent).*\\]\\s*(?:local\\s+)?procedure\\s+"?${name}`, 'i');
      if (eventPattern.test(content)) {
        procedure.isEvent = true;
        procedure.eventType = 'publisher';
      }

      // Check if it's an event subscriber
      const subscriberPattern = new RegExp(`\\[EventSubscriber.*\\]\\s*(?:local\\s+)?procedure\\s+"?${name}`, 'i');
      if (subscriberPattern.test(content)) {
        procedure.isEvent = true;
        procedure.eventType = 'subscriber';
      }

      procedures.push(procedure);
    }

    return procedures;
  }

  private parseParameters(paramString: string): ALParameter[] {
    if (!paramString.trim()) {
      return [];
    }

    return paramString.split(';').map(param => {
      const trimmed = param.trim();
      const isVar = trimmed.toLowerCase().startsWith('var ');
      const withoutVar = isVar ? trimmed.substring(4) : trimmed;
      const parts = withoutVar.split(':').map(p => p.trim());
      
      return {
        name: parts[0],
        type: parts[1] || 'Variant',
        isVar
      };
    });
  }

  private extractEvents(content: string, objects: ALObject[]): ALEvent[] {
    const events: ALEvent[] = [];
    
    // Extract from procedures marked as events
    for (const obj of objects) {
      if (obj.procedures) {
        for (const proc of obj.procedures) {
          if (proc.isEvent) {
            events.push({
              name: proc.name,
              eventType: proc.eventType as 'publisher' | 'subscriber',
              objectType: obj.type,
              objectName: obj.name,
              parameters: proc.parameters
            });
          }
        }
      }
    }

    return events;
  }

  private extractFlowfields(content: string, objects: ALObject[]): ALFlowfield[] {
    const flowfields: ALFlowfield[] = [];
    
    for (const obj of objects) {
      if (obj.fields) {
        for (const field of obj.fields) {
          if (field.isFlowfield && field.calcFormula) {
            const flowfield: ALFlowfield = {
              name: field.name,
              tableName: obj.name,
              calcMethod: this.extractCalcMethod(field.calcFormula),
              sourceField: this.extractSourceField(field.calcFormula),
              sourceTable: this.extractSourceTable(field.calcFormula)
            };
            
            flowfields.push(flowfield);
          }
        }
      }
    }

    return flowfields;
  }

  private extractCalcMethod(calcFormula: string): string {
    const match = calcFormula.match(/^(Sum|Count|Average|Min|Max|Lookup)/i);
    return match ? match[1] : 'Unknown';
  }

  private extractSourceField(calcFormula: string): string | undefined {
    const match = calcFormula.match(/\(([^.]+)\.([^)]+)\)/);
    return match ? match[2] : undefined;
  }

  private extractSourceTable(calcFormula: string): string | undefined {
    const match = calcFormula.match(/\(([^.]+)\./);
    return match ? match[1].replace(/"/g, '') : undefined;
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Extract using statements
    const usingPattern = /using\s+([^;]+);/gi;
    let match;
    while ((match = usingPattern.exec(content)) !== null) {
      dependencies.push(match[1].trim());
    }

    // Extract table references
    const tableRefPattern = /(?:Record|RecRef|Rec)\s+"?([^";\s]+)"?/gi;
    while ((match = tableRefPattern.exec(content)) !== null) {
      const tableName = match[1].trim();
      if (!dependencies.includes(tableName)) {
        dependencies.push(tableName);
      }
    }

    return dependencies;
  }
}
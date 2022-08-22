import * as configApi from './config';
import { log } from './logger';
import { getDiagrams } from './diagram-api/diagramAPI';
import { detectType } from './diagram-api/detectType';
export class Diagram {
  type = 'graph';
  parser;
  renderer;
  db;
  constructor(public txt: string, parseError?: Function) {
    const diagrams = getDiagrams();
    const cnf = configApi.getConfig();
    this.txt = txt;
    this.type = detectType(txt, cnf);
    log.debug('Type ' + this.type);

    // console.log('this.type', this.type, diagrams[this.type]);
    // Setup diagram
    // @ts-ignore
    this.db = diagrams[this.type].db;
    this.db.clear?.();

    // @ts-ignore
    this.renderer = diagrams[this.type].renderer;
    // @ts-ignore
    this.parser = diagrams[this.type].parser;
    // @ts-ignore
    this.parser.parser.yy = this.db;
    // @ts-ignore
    if (typeof diagrams[this.type].init === 'function') {
      // @ts-ignore
      diagrams[this.type].init(cnf);
      log.debug('Initialized diagram ' + this.type, cnf);
    }
    this.txt += '\n';
    this.parser.parser.yy.graphType = this.type;
    this.parser.parser.yy.parseError = (str: string, hash: string) => {
      const error = { str, hash };
      throw error;
    };
    // TODO Q: Should diagrams be parsed inside constructor?
    this.parse(this.txt, parseError);
  }

  parse(text: string, parseError?: Function): boolean {
    try {
      text = text + '\n';
      this.db.clear();
      this.parser.parse(text);
      return true;
    } catch (error) {
      // Is this the correct way to access mermiad's parseError()
      // method ? (or global.mermaid.parseError()) ?
      // @ts-ignore
      if (parseError) {
        // @ts-ignore
        if (error.str != undefined) {
          // handle case where error string and hash were
          // wrapped in object like`const error = { str, hash };`
          // @ts-ignore
          parseError(error.str, error.hash);
        } else {
          // assume it is just error string and pass it on
          // @ts-ignore
          parseError(error);
        }
      } else {
        // No mermaid.parseError() handler defined, so re-throw it
        throw error;
      }
    }
    return false;
  }

  getParser() {
    return this.parser;
  }

  getType() {
    return this.type;
  }
}

export default Diagram;

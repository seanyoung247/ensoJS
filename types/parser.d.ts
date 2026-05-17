
export interface ParserRegister {
  generator(plugin: unknown): void;
  attribute(plugin: unknown): void;
  content(plugin: unknown): void;
}

export interface ParserContext {
  Effect: unknown;
  Action: unknown;
  compileValue: (...args: any[]) => unknown;

  addBinding: (...args: any[]) => void;
  addWatcher: (...args: any[]) => void;

  parseSource: (...args: any[]) => unknown;
  collectBindings: (...args: any[]) => unknown;

  EnsoFragment: CustomElementConstructor;
}

export type ParserFunction = (
  register: ParserRegister,
  ctx: ParserContext
) => void;


import { EnsoTemplate } from "./template";

interface EnsoFragment {
    readonly tag: string;
    readonly component: unknown;

    isAttached: boolean;

    mount(): void;
    unmount(): void;

    _requestUpdate(): void;
    _getNodes(): Node[] | null;
    _setENV(env: Record<string, unknown>): void;
    _insertAfterAnchor(...elements: Node[]): void;
    _getChildFragments(): EnsoFragment[];
}

interface EnsoFragmentConstructor {
    new (
        parent: unknown,
        template: EnsoTemplate,
        placeholder?: ChildNode
    ): EnsoFragment;
}

type EffectFunction = () => unknown;

interface Effect {
    readonly element: Node;
    readonly action: EffectFunction;

    run(): unknown;
}

interface EffectConstructor {
    new (
        parent: unknown,
        element: Node,
        action: Action<any>
    ): Effect;
}

interface Action<T = Record<string, unknown>> {
    readonly data: T;
    readonly code: string;

    createEffect(
        parent: unknown,
        element: Node
    ): Effect;

    createFunc(parent: unknown): EffectFunction;
}

interface ActionConstructor {
    new <T = Record<string, unknown>>(
        code: string,
        data?: T,
        effect?: EffectConstructor
    ): Action<T>;
}

export interface ParserPlugin {
    readonly type: string;
    match(...args: any[]): boolean;
    preprocess(...args: any[]): boolean;
    process(...args: any[]): void;
}

export interface ParserRegister {
    generator(plugin: ParserPlugin): void;
    attribute(plugin: ParserPlugin): void;
    content(plugin: ParserPlugin): void;
}

export interface ParserContext {
    readonly Effect: EffectConstructor;
    readonly Action: ActionConstructor;

    compileValue(value: string): string;

    addBinding(
        parent: unknown,
        bind: string,
        effect: Effect
    ): void;

    addWatcher(
        parent: unknown,
        bind: string,
        fn: (prop: string, value: unknown) => void
    ): void;

    collectBindings(
        source: string,
        set: Set<string>
    ): void;

    parseSource(
        source: string,
        set?: Set<string> | null
    ): string;

    readonly EnsoFragment: EnsoFragmentConstructor;
}

export type ParserFunction = (
    register: ParserRegister,
    ctx: ParserContext
) => void;

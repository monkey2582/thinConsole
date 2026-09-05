/**
 * thinConsole - A lightweight web debugging console
 * @version 1.5.0
 */

/**
 * ThinConsole instance (the runtime export is an ES6 class, must be used with `new`)
 */
declare class thinConsole {

    constructor(options?: thinConsole.Options);

    /** Version string (e.g. "1.5.0") */
    readonly version: string;

    /** Current options (sanitized) */
    readonly options: thinConsole.Options;

    /** Current tab id */
    currentTab: string;

    /** Current theme id */
    currentTheme: string;

    /** Max log entries */
    maxLog: number;

    /** Max network request records */
    maxNetwork: number;

    /** Currently selected element */
    selectedElement: Element | null;

    /** Register & mount a plugin on this instance (same rules as the static addPlugin) */
    addPlugin(name: string, plugin: typeof thinConsole.Plugin | ((tC: thinConsole.Sandbox) => void)): this;

    /** Show the console overlay, optionally switching to a tab */
    show(tab?: string): this;

    /** Hide the console overlay */
    hide(): this;

    /** Destroy the instance and remove all DOM elements; mounted plugins get destroy() called */
    destroy(): void;

    /** Destroy this instance and create a NEW one with the given options (returns the new instance) */
    setOption(options: thinConsole.Options): thinConsole;

    /** Switch to a tab by id */
    switchTab(tab: string): void;

    /** Enable previously disabled plugin(s) - single name or array */
    enablePlugin(name: string | string[]): this;

    /** Disable & unload plugin(s) - single name or array (calls the plugin destroy()) */
    disablePlugin(name: string | string[]): this;

    /** Hide/restore log-type filter buttons: ban("warn") hides warn logs' filter; ban() resets all */
    ban(type?: string, on?: boolean): this;

    /** Show a toast notification */
    showNotification(message: string, type?: string): void;

    /** Send a new network request from the request editor */
    sendNewRequest(): void;

    /** Resend a previous network request */
    resendRequest(req: thinConsole.NetRequest): void;

    /** Apply custom icon overrides. Values must be "viewBox|path.d" format */
    applyIcon(icons: Record<string, string>): void;

    /** Trigger a global hook with arguments */
    triggerGlobalHook(name: keyof thinConsole.HookMap, ...args: any[]): void;

    /** Escape HTML special characters */
    escapeHtml(str: string): string;

    /** Safe JSON stringify with circular reference handling */
    safeStringify(value: any, indent?: number, json?: boolean): string;

    /** Get the icon SVG string */
    icon(name: string, className?: string): string;

    /** Append a <style> with the given CSS into the console shadow DOM */
    applyCSS(css: string): HTMLStyleElement;

    /** Build a virtual (windowed) list inside the scrollable container */
    createVirtualList<T>(container: HTMLElement, options: thinConsole.VirtualListOptions<T>): thinConsole.VirtualListController<T>;

    /** Storage accessor (local, session, cookie) */
    readonly storage: thinConsole.StorageAccessor;
}

declare namespace thinConsole {

  /** Position configuration for the floating button */
  interface Position {
    x: number;
    y: number;
  }

  /** Custom filter configuration */
  interface FilterConfig {
    id: string;
    name: string;
  }

  /** Constructor options */
  interface Options {
    /** Button background color (default "#007aff") */
    color?: string;
    /** Button width (default "auto") */
    width?: string;
    /** Button height (default "auto") */
    height?: string;
    /** Theme: "light", "dark", "auto", or custom theme name (default "auto") */
    theme?: string;
    /** Enable plugins (default true) */
    plugins?: boolean;
    /** List of disabled plugin names (default []). Blocks both pre- and post-instance registration, can be lifted via enablePlugin() */
    disabledPlugins?: string[];
    /** Enable JS execution (default true) */
    jsExecute?: boolean;
    /** Button position, null = saved/dragged (default null) */
    pos?: Position | null;
    /** Max number of log entries (default 100000) */
    maxLog?: number;
    /** Max number of network requests (default 1000) */
    maxNetwork?: number;
    /** Per-plugin options keyed by plugin name (default {}) */
    pluginOption?: Record<string, object>;
    /** Custom log filters (default null = builtin) */
    filters?: FilterConfig[] | null;
    /** Enable element comments (default true) */
    showComments?: boolean;
  }

  /** Storage backend interface (local / session / cookie) */
  interface StorageBackend {
    get(key: string): string | null;
    set(key: string, value: string, days?: number): void;
    remove(key: string): void;
    clear(): void;
    /** Number of stored entries (a function at runtime, not a property) */
    length(): number;
    key(index: number): string | null;
  }

  interface StorageAccessor {
    local: StorageBackend;
    session: StorageBackend;
    cookie: StorageBackend;
  }

  /** Custom theme configuration */
  interface ThemeConfig {
    vars: Record<string, string>;
    icons?: Record<string, string>;
  }

  /** Header button configuration */
  interface HeaderButton {
    icon: string;
    fn?: () => void;
  }

  /** Hook names and their handler arrays */
  interface HookMap {
    beforeRender: HookHandler[];
    afterRender: HookHandler[];
    beforeLog: HookHandler[];
    afterLog: HookHandler[];
    beforeOpen: HookHandler[];
    afterOpen: HookHandler[];
    beforeClose: HookHandler[];
    afterClose: HookHandler[];
    beforeClear: HookHandler[];
    afterClear: HookHandler[];
    pluginMount: HookHandler[];
    pluginUnmount: HookHandler[];
  }

  type HookHandler = (...args: any[]) => void;

  /** Custom tab configuration */
  interface TabConfig {
    id: string;
    name: string;
    icon?: string;
    render?(container: HTMLElement): void;
    html?: string;
    onShow?(): void;
  }

  /** Network request record */
  interface NetRequest {
    id: number;
    url: string;
    method: string;
    status: number;
    statusText: string;
    reqHeaders: Record<string, string>;
    reqBody: any;
    resHeaders: Record<string, string>;
    resBody: string | null;
    startTime: number;
    endTime: number;
    duration: number;
    error: string | null;
  }

  /** Sandbox proxy that exposes instance API to plugins safely */
  interface Sandbox {
    tC: ThinConsole;
    pluginOption: Record<string, object>;
    readonly __isSandbox: boolean;
  }

  /** Options for the virtual list created via ThinConsole#createVirtualList */
  interface VirtualListOptions<T> {
    /** Initial data items (default []) */
    initialData?: T[];
    /** Fixed item height in px (used for window estimation) */
    itemHeight: number;
    /** Render one data item to an element or an HTML string */
    renderItem: (item: T) => HTMLElement | string;
    /** HTML injected when the list is empty */
    emptyHTML?: string;
    /** Function returning a stable key per item (default: (e) => e.id) */
    trackBy?: (item: T) => string;
  }

  /** Controller returned by ThinConsole#createVirtualList */
  interface VirtualListController<T> {
    /** Replace the dataset (and optionally the render function) */
    update(data?: T[], renderItem?: (item: T) => HTMLElement | string): void;
    /** Force re-render of the visible window */
    render(): void;
    /** Remove listeners and virtual-list state from the container */
    destroy(): void;
  }

  /** A single value inside the map passed to setFilterCounts */
  type FilterCountValue = number | { filterCount: number; exactCount?: number };

  /**
   * Base plugin class. Extend this to create a class-based plugin.
   * ```ts
   * class MyPlugin extends thinConsole.tCPlugin {
   *   init() { /* ... *\/ }
   *   addTab() { return { id: "my", name: "My Tab" }; }
   * }
   * thinConsole.addPlugin("my", MyPlugin);
   * ```
   */
  class Plugin {
    protected tC: ThinConsole;
    pluginOption: Record<string, object>;
    /** Derived from the plugin class name (constructor.name.toLowerCase()) */
    id: string;
    constructor(tC: ThinConsole);
    init(): void;
    iszh(): boolean;
    isen(): boolean;
    isMobile(): boolean;
    render(container: HTMLElement): void;
    onShow(): void;
    onHide(): void;
    destroy(): void;
  }

  /** ThinConsole instance type (back-compat alias of `thinConsole`) */
  type ThinConsole = thinConsole;

// ---- Static API ----

  /** Current singleton instance, or null */
  const tC: ThinConsole | null;

  /** Registered plugins (class or factory function), keyed by plugin name */
  const plugins: Record<string, typeof Plugin | ((tC: Sandbox) => void)>;

  /** Registered themes */
  const themes: Record<string, ThemeConfig>;

  /** Registered header buttons (max 5) */
  const headerButtons: HeaderButton[];

  /** Global hook arrays */
  const hooks: HookMap;

  /** The Plugin base class (also exposed as window.tCPlugin) */
  const tCPlugin: typeof Plugin;

  /** Register a custom theme */
  function addTheme(
    name: string,
    styles: string,
    icons?: Record<string, string>
  ): typeof thinConsole;

  /** Add a header button (max 5) */
  function addHeader(icon: string, fn?: () => void): typeof thinConsole;

  /** Set options (destroys and recreates the singleton; returns the NEW instance) */
  function setOption(options: Options): ThinConsole;

  /** Show the console overlay (static convenience) */
  function show(tab?: string): typeof thinConsole;

  /** Hide/restore log-type filters on the current instance (no-op without an instance) */
  function ban(type?: string, on?: boolean): typeof thinConsole;

  /** Hide the console overlay (static convenience) */
  function hide(): typeof thinConsole;

  /** Destroy the singleton (static convenience) */
  function destroy(): void;

  /** console.log passthrough (static convenience) */
  function log(...args: any[]): typeof thinConsole;

  /** console.info passthrough (static convenience) */
  function info(...args: any[]): typeof thinConsole;

  /** console.warn passthrough (static convenience) */
  function warn(...args: any[]): typeof thinConsole;

  /** console.error passthrough (static convenience) */
  function error(...args: any[]): typeof thinConsole;

  /** Register a plugin (class or function). Works before AND after creating an instance */
  function addPlugin(name: string, plugin: typeof Plugin | ((tC: Sandbox) => void)): typeof thinConsole;

  /** Enable previously disabled plugin(s) on the current instance - single name or array */
  function enablePlugin(name: string | string[]): typeof thinConsole;

  /** Disable & unload plugin(s) on the current instance - single name or array */
  function disablePlugin(name: string | string[]): typeof thinConsole;

  /** Add custom tabs */
  function addTabs(tabs: TabConfig | TabConfig[]): typeof thinConsole;

  /** Register a global hook handler */
  function addHook(name: keyof HookMap, handler: HookHandler): typeof thinConsole;

  /** Remove a global hook handler */
  function removeHook(name: keyof HookMap, handler: HookHandler): typeof thinConsole;

  /** Update the per-type filter counts shown on the current filter bar */
  function setFilterCounts(counts: Record<string, FilterCountValue>): typeof thinConsole;
}

export = thinConsole;
/**
 * thinConsole - A lightweight web debugging console
 * @version 1.3.7
 */

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
    /** Button text (max 11 chars, default "thinConsole") */
    text?: string;
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
    /** List of disabled plugin names (default []) */
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
  }

  /** Storage backend interface (local / session / cookie) */
  interface StorageBackend {
    get(key: string): string | null;
    set(key: string, value: string, days?: number): void;
    remove(key: string): void;
    clear(): void;
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

  /**
   * Base plugin class. Extend this to create a class-based plugin.
   * ```ts
   * class MyPlugin extends tCPlugin {
   *   init() { /* ... *\/ }
   *   addTab() { return { id: "my", name: "My Tab" }; }
   * }
   * thinConsole.addPlugin("my", MyPlugin);
   * ```
   */
  class Plugin {
    protected tC: ThinConsole;
    pluginOption: Record<string, object>;
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

  /** ThinConsole instance */
  class ThinConsole {
    constructor(options?: Options);

    /** Version string */
    readonly version: string;

    /** Current options (sanitized) */
    readonly options: Options;

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

    /** Initialize the console (creates button + overlay) */
    init(): void;

    /** Show the console overlay, optionally switching to a tab */
    show(tab?: string): this;

    /** Hide the console overlay */
    hide(): this;

    /** Destroy the instance and remove all DOM elements */
    destroy(): void;

    /** Destroy and recreate with new options */
    setOption(options: Options): this;

    /** Switch to a tab by id */
    switchTab(tab: string): void;

    /** Show a toast notification */
    showNotification(message: string, type?: string): void;

    /** Toggle mute state for console logs */
    toggleMute(): void;

    /** Toggle search bar visibility */
    toggleSearch(): void;

    /** Run code from the title input */
    runCode(): void;

    /** Copy a log entry */
    copyLog(id: string, plain?: boolean, raw?: boolean): void;

    /** Clear all logs */
    clearAllLogs(all?: boolean): void;

    /** Add a localStorage item (opens editor) */
    addLSItem(): void;

    /** Edit a localStorage item by key */
    editLSItem(key: string): void;

    /** Save the current localStorage editor content */
    saveLSItem(): void;

    /** Remove a localStorage item by key */
    removeLSItem(key: string): void;

    /** Start the element picker mode */
    startElementPicker(): void;

    /** Expand the element tree to reveal a specific element */
    expandToElement(el: Element): void;

    /** Copy an element's HTML */
    copyElementHTML(el: Element): void;

    /** Delete an element from the DOM */
    deleteElement(el: Element): void;

    /** Start observing DOM mutations for element tree updates */
    startElementObserver(): void;

    /** Stop the element mutation observer */
    stopElementObserver(): void;

    /** Re-render current tab content */
    renderContent(): void;

    /** Capture XHR and fetch network requests */
    captureNetworkRequests(): void;

    /** Render the network request list */
    renderNetworkList(): void;

    /** Clear network requests (respects active filter) */
    clearNetworkRequests(): void;

    /** Send a new network request from the request editor */
    sendNewRequest(): void;

    /** Show network request detail panel */
    showNetDetail(id: number): void;

    /** Resend a previous network request */
    resendRequest(req: NetRequest): void;

    /** Apply custom icon overrides */
    applyIcon(icons: Record<string, string>): void;

    /** Set the icon for a specific filter button */
    setFilterIcon(filterId: string, iconId: string): boolean;

    /** Disable a plugin by name */
    disablePlugin(name: string): this;

    /** Enable a previously disabled plugin */
    enablePlugin(name: string): this;

    /** Trigger a global hook with arguments */
    triggerGlobalHook(name: keyof HookMap, ...args: any[]): void;

    /** Load a single plugin by name */
    loadSinglePlugin(name: string): this;

    /** Create a sandbox proxy for plugin isolation */
    createSandbox(target: ThinConsole): Sandbox;

    /** Escape HTML special characters */
    escapeHtml(str: string): string;

    /** Safe JSON stringify with circular reference handling */
    safeStringify(value: any, indent?: number, json?: boolean): string;

    /** Get the icon SVG string */
    icon(name: string, className?: string): string;

    /** Storage accessor (local, session, cookie) */
    readonly storage: StorageAccessor;
  }

  // ---- Static API ----

  /** Current singleton instance, or null */
  const tC: ThinConsole | null;

  /** Registered plugins (class-based) */
  const plugins: Record<string, typeof Plugin>;

  /** Registered themes */
  const themes: Record<string, ThemeConfig>;

  /** Registered header buttons (max 5) */
  const headerButtons: HeaderButton[];

  /** Global hook arrays */
  const hooks: HookMap;

  /** Register a custom theme */
  function addTheme(
    name: string,
    styles: string,
    icons?: Record<string, string>
  ): typeof thinConsole;

  /** Add a header button (max 5) */
  function addHeader(icon: string, fn?: () => void): typeof thinConsole;

  /** Set options (destroys and recreates the singleton) */
  function setOption(options: Options): typeof thinConsole;

  /** Show the console overlay (static convenience) */
  function show(tab?: string): typeof thinConsole;

  /** Hide the console overlay (static convenience) */
  function hide(): typeof thinConsole;

  /** Destroy the singleton (static convenience) */
  function destroy(): typeof thinConsole;

  /** console.log passthrough (static convenience) */
  function log(...args: any[]): typeof thinConsole;

  /** console.info passthrough (static convenience) */
  function info(...args: any[]): typeof thinConsole;

  /** console.warn passthrough (static convenience) */
  function warn(...args: any[]): typeof thinConsole;

  /** console.error passthrough (static convenience) */
  function error(...args: any[]): typeof thinConsole;

  /** Register a plugin (class or function) */
  function addPlugin(name: string, plugin: typeof Plugin | ((tC: Sandbox) => void)): typeof thinConsole;

  /** Add custom tabs */
  function addTabs(tabs: TabConfig | TabConfig[]): typeof thinConsole;
}

/** The Plugin base class, also available as window.tCPlugin */
declare const tCPlugin: typeof thinConsole.Plugin;

/** Main constructor: create or reuse the singleton */
declare function thinConsole(options?: thinConsole.Options): thinConsole.ThinConsole;

export = thinConsole;

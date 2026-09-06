/**
 * thinConsole - A lightweight web debugging console
 * @version 1.5.2
 */

/**
 * ThinConsole instance (the runtime export is an ES6 class, must be used with `new`)
 */
declare class thinConsole {

    constructor(options?: thinConsole.Options);

    /** Version string (e.g. "1.5.2") */
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

    /** Currently selected element (Elements tab) */
    selectedElement: Element | null;

    /** Shared store: plugin-visible writable state (get / set / subscribe) */
    readonly store: thinConsole.Store;

    /** Register & mount a class-based plugin on this instance. Only classes extending tCPlugin are accepted (function plugins were removed — use hooks instead) */
    addPlugin(name: string, plugin: typeof thinConsole.Plugin): this;

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

    /** Unload & remove a mounted plugin entirely (calls plugin destroy(), removes its tab UI) */
    destroyPlugin(name: string): this;

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

    /**
     * Trigger a hook by name. The name is auto-registered when it does not exist.
     * Listeners registered via addHook are called with (...args); this = the thinConsole instance.
     */
    triggerHook(name: string, ...args: any[]): void;

    /** Alias used internally: fire all listeners of a hook (auto-registers the name) */
    triggerGlobalHook(name: string, ...args: any[]): void;

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

  /** Subscriber callback used by store.subscribe: (newValue, key, oldValue) */
  type StoreSubscriber = (value: any, key: string, oldValue: any) => void;

  /**
   * Shared store — plugin-visible writable state.
   * Events (hooks) are read-only notifications; the store is the writable channel.
   */
  interface Store {
    /** Read a key's value (single key → raw value) */
    get(key: string): any;
    /** Read multiple keys → object { key: value, ... } */
    get(keys: string[]): Record<string, any>;

    /**
     * Write value(s). Keys may be an array (all get the same value; each key notifies once).
     * writeable (3rd param) is a write-lock control:
     *  - false → lock this key as private to the current caller (other plugins / anonymous tc.store writes are rejected with a console warning)
     *  - true  → unlock (only the owner may unlock)
     *  - omitted → leave the lock state unchanged
     * Any successful set notifies every subscriber of the key — including the owner itself.
     */
    set(key: string | string[], value: any, writeable?: boolean): Store;

    /**
     * Delete key(s). Accepts a single key or an array (each key notifies its subscribers once with
     * (undefined, key, oldValue)). Locked keys behave like set: only the owner may remove them, and
     * an owner removal also clears the lock. Removing a non-existent key is a silent no-op.
     */
    remove(key: string | string[]): Store;

    /**
     * Lock / unlock key(s) without writing a value.
     * Available on the shared store for API symmetry, but ONLY a plugin owner view (`this.store`)
     * can actually change a lock — calling `tc.store.writeable(...)` is rejected with a warning.
     * On the owner view: writeable(key, false) locks the key to this plugin; writeable(key, true)
     * unlocks it (only the owning plugin may unlock; trying to lock/unlock another plugin's key is
     * rejected with a warning). Accepts a single key or an array.
     */
    writeable(key: string | string[], writeable: boolean): Store;

    /**
     * Subscribe to key(s). Both keys and callbacks accept arrays (key[] × fn[] registers the full combination).
     * Fired on every successful set with (value, key, oldValue); returns an unsubscribe function.
     */
    subscribe(key: string | string[], fn: StoreSubscriber | StoreSubscriber[]): () => void;
  }

  /**
   * Owner view of the store injected into every mounted plugin instance (`this.store`).
   * Shares the same data source as the shared store; `set(..., false)` locks the key to this plugin (owner).
   */
  interface StoreView {
    get(key: string): any;
    get(keys: string[]): Record<string, any>;
    set(key: string | string[], value: any, writeable?: boolean): StoreView;
    remove(key: string | string[]): StoreView;
    /**
     * Lock (false) / unlock (true) key(s) as this plugin. Only the owning plugin can change the lock.
     */
    writeable(key: string | string[], writeable: boolean): StoreView;
    subscribe(key: string | string[], fn: StoreSubscriber | StoreSubscriber[]): () => void;
  }

  /** Hook listener entry as stored internally (once listeners are auto-removed after the first trigger) */
  interface HookEntry {
    fn: HookHandler;
    once: boolean;
  }

  /**
   * Built-in hook names. Hook names are NOT pre-registered:
   * addHook / triggerHook auto-create any unknown name (triggering once is enough to register it),
   * so custom events can use arbitrary strings (recommended namespace: "plugin:event").
   */
  interface HookMap {
    afterInit: HookEntry[];
    beforeRender: HookEntry[];
    afterRender: HookEntry[];
    beforeLog: HookEntry[];
    afterLog: HookEntry[];
    beforeOpen: HookEntry[];
    afterOpen: HookEntry[];
    beforeClose: HookEntry[];
    afterClose: HookEntry[];
    beforeClear: HookEntry[];
    afterClear: HookEntry[];
    pluginMount: HookEntry[];
    pluginUnmount: HookEntry[];
  }

  /** Hook handler. `this` is bound to the thinConsole instance at call time */
  type HookHandler = (this: ThinConsole, ...args: any[]) => void;

  /** Tab descriptor returned by a plugin's addTab() (the only supported way to add a custom tab now) */
  interface TabDescriptor {
    id: string;
    name: string;
    icon?: string;
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

  /**
   * Sandbox proxy handed to a plugin's constructor (and exposed as `plugin.tC`).
   * It behaves like the thinConsole instance but blocks writes to `options` / `pluginOption`
   * and marks itself with `__isSandbox`. In type-land it is interchangeable with ThinConsole.
   */
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
   *   init() { this.store.set('theme', '#007aff'); }        // owner store view
   *   addTab() { return { id: 'my', name: 'My Tab' }; }     // optional: creates a tab
   *   render(el) { el.innerHTML = '<p>hello</p>'; }         // called on tab switch
   *   onShow()  {}
   *   onHide()  {}
   *   destroy() {}
   * }
   * thinConsole.addPlugin('my', MyPlugin);                  // only classes are accepted
   * ```
   */
  class Plugin {
    /** Sandboxed instance API (reads behave like the thinConsole instance; options/pluginOption writes are blocked) */
    protected tC: ThinConsole;
    pluginOption: Record<string, object>;
    /** Owner store view — shares data with tc.store; set(key, v, false) locks the key to this plugin */
    readonly store: StoreView;
    /** Derived from the plugin class name (constructor.name.toLowerCase()) */
    id: string;
    constructor(tC: Sandbox | ThinConsole);
    init(): void;
    /** Return a tab descriptor to add a custom tab for this plugin */
    addTab?(): TabDescriptor;
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

  /** Registered plugins (classes only, keyed by plugin name) */
  const plugins: Record<string, typeof Plugin>;

  /** Registered themes */
  const themes: Record<string, ThemeConfig>;

  /** Registered header buttons (max 5) */
  const headerButtons: HeaderButton[];

  /** Global hook arrays (built-in hooks pre-seeded; custom names auto-create on addHook/triggerHook) */
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

  /**
   * Register a class-based plugin. Works before AND after creating an instance.
   * Only classes extending tCPlugin are accepted — function (micro) plugins were removed;
   * use addHook('afterInit', ...) or hooks for one-shot bootstrap code.
   */
  function addPlugin(name: string, plugin: typeof Plugin): typeof thinConsole;

  /** Enable previously disabled plugin(s) on the current instance - single name or array */
  function enablePlugin(name: string | string[]): typeof thinConsole;

  /** Disable & unload plugin(s) on the current instance - single name or array */
  function disablePlugin(name: string | string[]): typeof thinConsole;

  /**
   * Register a hook listener. `name` may be any string — unknown names are auto-created
   * (no defineHook needed). Pass `once = true` to auto-remove after the first trigger (default false).
   * The handler receives all triggerHook arguments with `this` bound to the thinConsole instance.
   */
  function addHook(name: string, handler: HookHandler, once?: boolean): typeof thinConsole;

  /** Remove a previously added hook listener (matched by function reference) */
  function removeHook(name: string, handler: HookHandler): typeof thinConsole;

  /**
   * Trigger a hook with arguments (listeners receive them). Auto-registers the name if missing.
   * No-op with a console warning when no instance exists yet (the name is still registered).
   * Hooks are read-only notifications — to share mutable state between plugins use the store instead.
   */
  function triggerHook(name: string, ...args: any[]): typeof thinConsole;

  /** Update the per-type filter counts shown on the current filter bar */
  function setFilterCounts(counts: Record<string, FilterCountValue>): typeof thinConsole;
}

export = thinConsole;
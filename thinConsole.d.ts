/**
 * thinConsole - A lightweight web debugging console
 * @version 1.6.0
 */

/**
 * ThinConsole instance (the runtime export is an ES6 class, must be used with `new`)
 */
declare class thinConsole {

    constructor(options?: thinConsole.Options);

    /** Version string, e.g. "1.5.8" (matches the built bundle) */
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

    /**
     * Show the console overlay, optionally switching to a tab and to a specific filter.
     *
     * @param tab        Tab id ('console' | 'localstorage' | 'network' | 'elements' | plugin id)
     * @param filterName Optional filter id inside that tab. If omitted/empty/nonexistent,
     *                   only the tab is switched and the current filter is left untouched.
     *                   Built-in filter ids:
     *                     console      → 'all' | 'log' | 'info' | 'warn' | 'error'
     *                     network      → 'all' | 'get' | 'post' | 'put' | 'success' | 'failed'
     *                     localstorage → 'local' | 'session' | 'cookie'
     */
    show(tab?: string, filterName?: string): this;

    /** Hide the console overlay */
    hide(): this;

    /**
     * Destroy the instance and remove all DOM elements; mounted plugins get destroy() called.
     *
     * NOTE: only acts when this instance is the current singleton (tC === this).
     * Calling it on a stale/non-current instance is a silent no-op.
     */
    destroy(): void;

    /** Destroy this instance and create a NEW one with the given options (returns the new instance) */
    setOption(options: thinConsole.Options): thinConsole;

    /**
     * Switch to a tab by id, optionally also selecting a filter inside that tab.
     *
     * Named `switch` (not `switchTab`) because the scope is broader than "tabs":
     * it moves to a tab AND, with the second argument, to a specific filter panel.
     *
     * @param tab        Tab id ('console' | 'localstorage' | 'network' | 'elements' | plugin id)
     * @param filterName Optional filter id. If omitted/empty/nonexistent, only the tab is switched.
     */
    switch(tab: string, filterName?: string): void;

    /** Enable previously disabled plugin(s) - single name or array */
    enablePlugin(name: string | string[]): this;

    /** Disable & unload plugin(s) - single name or array (calls the plugin destroy()) */
    disablePlugin(name: string | string[]): this;

    /** Unload & remove a mounted plugin entirely (calls plugin destroy(), removes its tab UI) */
    destroyPlugin(name: string): this;

    /**
     * Hide / restore log-type filter buttons.
     * `ban("warn")` hides the warn filter; `ban("warn", false)` restores it.
     * Called with no arguments it defaults to ("all", true) — i.e. hides EVERY filter.
     * @param type filter id, or "all" (default "all")
     * @param on   true = hide, false = restore (default true)
     */
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

    /**
     * Switch the singleton to a tab, optionally also selecting a filter inside it (static convenience).
     *
     * Declared with a quoted name because `switch` is a reserved word — TypeScript only accepts it
     * as a quoted member, so type-checked calls go through
     * `thinConsole['switch']('network', 'all')`. The unquoted `thinConsole.switch(...)`
     * works at runtime as well.
     */
    static 'switch'(tab: string, filterName?: string): typeof thinConsole;
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

  /** Header button declaration passed to addHeader (internal shape) */
  interface HeaderButton {
    icon: string;
    /** Extra CSS class(es) applied alongside 'header-icon-btn' — use it to target your own button */
    cls?: string | null;
    clickMethods?: (HeaderHandler | number)[] | null;
    forTab?: string | null;
    bound?: any[];
    elEl?: HTMLElement | null;
  }

  /** Handler used by header buttons (bound to the underlying DOM event) */
  type HeaderHandler = (ev?: Event) => void;

  /**
   * Controller returned by addHeader(). Chainable, and lets you bind/unbind DOM events
   * on the created header button afterwards.
   *
   * NOTE: addHeader() does NOT return the thinConsole namespace — always keep this object
   * if you need to remove() the button or attach extra events.
   */
  interface HeaderButtonController {
    /** The internal descriptor (avoid mutating) */
    readonly _d: HeaderButton;
    /** Remove the button from the header bar and unbind its events */
    remove(): HeaderButtonController;
    /**
     * Bind DOM event(s) to the button.
     * `events` accepts a space/comma separated string or an array.
     * `handler` may be a function, an array of functions, an array of numbers
     * (indices into the original clickMethods), or a single number.
     */
    on(
      events: string | string[],
      handler?: HeaderHandler | (HeaderHandler | number)[] | number
    ): HeaderButtonController;
    /** Unbind previously bound event(s). Same argument shapes as on() */
    off(
      events: string | string[],
      handler?: HeaderHandler | (HeaderHandler | number)[] | number
    ): HeaderButtonController;
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
     * A successful set records the caller as the key's OWNER (anonymous tc.store calls → public key).
     * writeable (3rd param) is a write-lock control:
     *  - false → lock this key as private to the current caller (only meaningful from a plugin owner view)
     *  - true  → unlock (only the owner may unlock)
     *  - omitted → leave the lock state unchanged
     * Any successful set notifies every subscriber of the key — including the owner itself.
     */
    set(key: string | string[], value: any, writeable?: boolean): Store;

    /**
     * Delete key(s) — single key or array. Only the OWNER may remove a key it wrote (or holds the
     * writeable lock on); public keys (created by anonymous tc.store.set) can be removed by anyone.
     * Other plugins' keys are rejected with a console warning. A successful remove notifies the key's
     * subscribers once with (undefined, key, oldValue) and then AUTO-UNBINDS all of that key's
     * subscriptions. Removing a non-existent key is a silent no-op.
     */
    remove(key: string | string[]): Store;

    /**
     * Unbind previously registered subscriber(s) — name/name[] × fn/fn[] (the full combination).
     * Same as calling the returned off() from subscribe, but name-addressed.
     */
    unsubscribe(key: string | string[], fn: StoreSubscriber | StoreSubscriber[]): Store;

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
    unsubscribe(key: string | string[], fn: StoreSubscriber | StoreSubscriber[]): StoreView;
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
    /**
     * Language hook — override these in your plugin if you branch on locale.
     *
     * IMPORTANT: the base implementation is NOT a runtime locale detection. It returns
     * constants baked into the build:
     *   - Chinese bundle: iszh() -> true,  isen() -> false
     *   - English bundle: iszh() -> false, isen() -> true
     * To follow the console's own UI language, call this.iszh() / this.isen()
     * instead of inspecting navigator.language.
     */
    iszh(): boolean;
    isen(): boolean;
    /** True on touch/mobile user agents (iPad, Android, iPhone, iPod, BlackBerry, Opera Mini, …) */
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

  /** Registered header buttons. NOTE: there is NO count limit — addHeader() appends, remove() frees the slot */
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

  /**
   * Add a header button. There is NO count limit — addHeader() always appends,
   * and remove() releases the slot again (button count / DOM nodes / internal list stay in sync).
   * Returns a HeaderButtonController — NOT the thinConsole namespace.
   *
   * Two call shapes are supported:
   *   addHeader(icon, fn)             // legacy
   *   addHeader(icon, cls, fn)        // preferred — `cls` is an extra class name
   *                                   // applied besides 'header-icon-btn', so you can
   *                                   // tell your own buttons apart (e.g. '.my-btn').
   *
   * @param icon  Icon name registered in the icon map
   * @param cls   Extra CSS class name(s) for the button, or the handler when called as addHeader(icon, fn)
   * @param fn    Optional handler. Accepts a function, an array of functions,
   *              an array of numbers (indices into clickMethods), or a single number.
   *              Defaults to no handler.
   * @example
   * const btn = thinConsole.addHeader('copy', 'btn-copy', () => alert('hi'));
   * document.querySelector('.btn-copy');   // your button
   * btn.off('click').remove();             // unbind and remove (slot is freed)
   */
  function addHeader(
    icon: string,
    cls?: string | null | HeaderHandler | (HeaderHandler | number)[] | number,
    fn?: HeaderHandler | (HeaderHandler | number)[] | number
  ): HeaderButtonController;

  /** Set options (destroys and recreates the singleton; returns the NEW instance) */
  function setOption(options: Options): ThinConsole;

  /** Show the console overlay, optionally switching to a tab and to a specific filter (static convenience) */
  function show(tab?: string, filterName?: string): typeof thinConsole;

  /**
   * Hide/restore log-type filters on the current instance (no-op without an instance).
   * Defaults to ("all", true) when called with no arguments — hides every filter.
   */
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
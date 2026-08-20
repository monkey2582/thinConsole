// Type definitions for thinConsole v1.3.6
// Project: thinConsole - A lightweight mobile web debugging console
// UMD module: supports CommonJS, AMD, and global (browser window.thinConsole)

// Class + namespace merge: class provides the value & constructor,
// namespace provides additional types accessible as thinConsole.X
declare class thinConsole {
  constructor(options?: thinConsole.Options);

  // ---- Instance properties ----
  version: string;
  options: Required<
    Omit<thinConsole.Options, "filters"> & { filters: thinConsole.Filter[] | null }
  >;
  currentTab: string;
  currentTheme: "light" | "dark";
  selectedElement: Node | null;
  logs: thinConsole.LogEntry[];
  networkRequests: thinConsole.NetworkRequest[];
  maxLog: number;
  /** Maximum number of network requests to retain (default: 1000) */
  maxNetwork: number;

  // ---- Instance methods ----
  show(tab?: string): thinConsole;
  hide(): thinConsole;
  destroy(): void;
  switchTab(tab: string): void;
  showNotification(message: string, type?: string): void;
  toggleSearch(visible?: boolean): void;
  toggleMute(): void;
  clearAllLogs(silent?: boolean): void;
  startElementPicker(): void;
  deleteElement(element: Node): void;
  copyElementHTML(element: Element): void;
  expandToElement(element: Node): void;
  getShadowRoot(element: Element): thinConsole.ShadowRootInfo | null;
  registerPlugin(id: string, pluginClass: any): thinConsole;
  disablePlugin(id: string): thinConsole;
  enablePlugin(id: string): thinConsole;
  destroyPlugin(id: string): void;

  /**
   * Override existing icons or add new ones.
   * Icons are shared globally — overrides affect all panels.
   *
   * @param icons Object mapping icon names to "viewBox|path.d" strings
   * @throws Error if `icons` is not an object, or any value doesn't contain "|"
   *
   * @example
   * tC.applyIcon({
   *   "my-icon": "0 0 24 24|M10 2L4 8",
   *   "info-circle": "0 0 512 512|..."  // override existing
   * })
   */
  applyIcon(icons: Record<string, string>): void;

  /**
   * Set the icon for a filter button by its filter ID.
   * The icon name must already exist in the icon map
   * (use `applyIcon` to add new icons first).
   *
   * @param filterId The filter button's id (data-type, data-ls-type, data-orig, or data-net-filter)
   * @param iconName An existing icon name from the icon map
   * @returns true if the filter was found and updated, false otherwise
   * @throws Error if the icon name doesn't exist
   */
  setFilterIcon(filterId: string, iconName: string): boolean;

  /**
   * Create a sandboxed proxy of the thinConsole instance.
   * Blocks get/set/delete on `options` and `pluginOption` properties.
   * All other methods are available with proper `this` binding.
   * Used internally when instantiating plugins.
   * @param tC The real thinConsole instance
   * @returns Sandboxed proxy
   */
  createSandbox(tC: thinConsole): thinConsole.Sandbox;


  triggerGlobalHook(name: thinConsole.HookName, ...args: any[]): thinConsole;
  renderJSONTree(
    obj: any,
    key?: string,
    path?: string,
    chain?: any[],
    noProto?: boolean
  ): string;
  renderHTMLTree(
    element: Node,
    key?: string,
    path?: string,
    depth?: number
  ): string;
  renderElementTree(element: Node, depth: number): string;
  escapeHtml(str: string): string;
  captureConsole(type: string, ...args: any[]): void;

  /**
   * Format a count number into compact display.
   * - <= 999: returns the number as-is
   * - 1000-99999: returns K format with 1 decimal (e.g. "1K", "1.1K")
   * - >= 100000: returns "XK+" (e.g. "100K+")
   * @param n The exact count
   * @param plusK If true, append "+" for K values (used by network/storage)
   * @returns Object with filterCount (display string/number) and exactCount (raw number)
   */
  _fmtCount(n: number, plusK?: boolean): thinConsole.FilterCountResult;

  /**
   * Unified filter count updater for both built-in (console) and plugin tabs.
   * @param container Filter button container (filterButtons or plugin view container)
   * @param counts Count lookup object (type -> number | FilterCountResult)
   * @param isPlugin If true, use plugin rendering (icon + orig); else console (cached HTML)
   */
  _updateFilterCounts(
    container: HTMLElement | NodeListOf<Element> | null,
    counts: Record<string, number | thinConsole.FilterCountResult> | null,
    isPlugin: boolean
  ): void;

  /**
   * Apply custom CSS inside the Shadow DOM scope.
   * Plugin authors use this to add styles that won't leak to the host page
   * and won't be affected by host page styles.
   * @param css CSS string to inject into the shadow root
   * @returns The created <style> element (can be removed later if needed)
   */
  applyCSS(css: string): HTMLStyleElement;

  /**
   * Create a virtual scrolling list for efficient rendering of large datasets.
   * Only visible items (plus a small buffer) are rendered in the DOM.
   * Internally uses vsInit + vsUpdate + vsRender for the same smooth scrolling
   * experience as the built-in console, localStorage, and network panels.
   *
   * @param container The scrollable container element (plugin's own container)
   * @param options Configuration object
   * @param options.renderItem Function that creates a DOM element (or HTML string) for a data item
   * @param options.initialData Initial array of data items (default: [])
   * @param options.itemHeight Estimated item height in px (auto-measured if omitted)
   * @param options.emptyHTML HTML to show when items array is empty (default: "")
   * @param options.trackBy Key extraction function for precise item identity comparison
   *   (default: item => item.id). Avoids unnecessary full re-renders when data
   *   changes only partially.
   * @returns Virtual list controller with update/render/destroy methods
   */
  createVirtualList(
    container: HTMLElement,
    options: {
      renderItem: (item: any) => HTMLElement | string;
      initialData?: any[];
      itemHeight?: number;
      emptyHTML?: string;
      trackBy?: (item: any) => string | number;
    }
  ): {
    /** Update items (and optionally change renderFn). Empty items shows emptyHTML. */
    update(items: any[], renderFn?: (item: any) => HTMLElement | string): void;
    /** Force re-render (e.g. after tree expand/collapse or resize) */
    render(): void;
    /** Cleanup: remove scroll listener, delete _vs state, prevent memory leaks */
    destroy(): void;
  };

  /**
   * Initialize virtual scrolling infrastructure for a container.
   * Creates spacer elements, content element, and scroll listener.
   * Merges isNearBottom logic as an inline internal check.
   * @param container The container element to apply virtual scrolling to
   */
  vsInit(container: HTMLElement): void;

  /**
   * Core render loop for a virtual scroll container.
   * Calculates visible range, measures heights, renders items, updates spacers.
   * Merges vsRefreshHeights: re-measures rendered children on each call,
   * and updates spacers even when visible range is unchanged.
   * @param container The virtual scroll container
   */
  vsRender(container: HTMLElement): void;

  /**
   * Unified update entry for virtual scroll containers.
   * Merges vsSetItems + vsUpdateItems + vsShowMessage into one function.
   *
   * - If items is empty: shows emptyHTML (from opts), resets state.
   * - If opts.force: full reset (scroll to top, re-render).
   * - If user is at bottom: re-render and auto-scroll to bottom.
   * - If items grew (same first item key): incremental bottom spacer update.
   * - Otherwise: full re-render preserving scroll position.
   *
   * @param container The virtual scroll container
   * @param items The array of items to display
   * @param renderItem Function to render an item as HTML string (null when items is empty)
   * @param avgHeight Average item height (optional)
   * @param opts Options: { force?, emptyHTML?, trackBy?, preserveScroll? }
   */
  vsUpdate(
    container: HTMLElement,
    items: any[],
    renderItem: ((item: any, index: number) => string) | null,
    avgHeight?: number,
    opts?: {
      /** Force full reset (scroll to top, re-render) */
      force?: boolean;
      /** HTML to show when items array is empty */
      emptyHTML?: string;
      /** Key extraction function for item identity (default: item => item.id).
       *  Stored in _vs after first call; used to detect if first item changed. */
      trackBy?: (item: any) => string | number;
      /** Preserve current scroll position (don't scroll to top or bottom).
       *  Useful when loading more data or inserting items at the top. */
      preserveScroll?: boolean;
    }
  ): void;

  /** Shadow DOM host element (style isolation root) */
  host: HTMLDivElement;
  /** Shadow root for style isolation */
  shadowRoot: ShadowRoot;

  // ---- Static properties ----
  static readonly version: string;
  static tC: thinConsole | null;
  static plugins: Record<string, any>;
  static hooks: Record<thinConsole.HookName, thinConsole.HookCallback[]>;

  // ---- Static methods ----
  static show(tab?: string): typeof thinConsole;
  static hide(): typeof thinConsole;
  static destroy(): void;
  static log(...args: any[]): typeof thinConsole;
  static info(...args: any[]): typeof thinConsole;
  static warn(...args: any[]): typeof thinConsole;
  static error(...args: any[]): typeof thinConsole;
  static addPlugin(id: string, pluginClass: any): typeof thinConsole;
  static addTabs(
    tabs: thinConsole.TabConfig | thinConsole.TabConfig[]
  ): typeof thinConsole;
  static addHook(
    name: thinConsole.HookName,
    callback: thinConsole.HookCallback
  ): typeof thinConsole;
  static removeHook(
    name: thinConsole.HookName,
    callback: thinConsole.HookCallback
  ): typeof thinConsole;
  static setFilterCounts(
    counts: Record<string, number | thinConsole.FilterCountResult>
  ): typeof thinConsole;
}

declare namespace thinConsole {
  // ============= Options & Config =============

  interface Options {
    /** Button text (max 11 chars, no HTML special chars) */
    text?: string;
    /** Button background color */
    color?: string;
    /** Button width (CSS value) */
    width?: string;
    /** Button height (CSS value) */
    height?: string;
    /** Theme mode */
    theme?: "light" | "dark" | "auto";
    /** Enable plugin system */
    plugins?: boolean;
    /** List of disabled plugin IDs */
    disabledPlugins?: string[];
    /** Enable JS code execution via title click */
    jsExecute?: boolean;
    /** Floating button position */
    pos?: { x: number; y: number };
    /** Maximum number of log entries to retain (default: 1000) */
    maxLog?: number;
    /** Maximum number of network requests to retain (default: 1000) */
    maxNetwork?: number;
    /** Custom console filter definitions */
    filters?: Filter[];
    /**
     * Per-plugin options, keyed by plugin ID.
     * Values are passed through as-is (only object check).
     * Plugins can access their options via `this.tC.options.pluginOption[this.id]`.
     */
    pluginOption?: Record<string, Record<string, any>>;
  }

  interface Filter {
    id: string;
    name: string;
    icon?: string;
  }

  interface TabConfig {
    id: string;
    name: string;
    icon?: string;
    /** Static HTML content for the tab */
    html?: string;
    /** Dynamic render function for the tab content */
    render?: (container: HTMLElement) => void;
    /** Called when the tab is shown */
    onShow?: () => void;
  }

  interface PluginTab {
    id: string;
    name: string;
    icon: string;
    plugin?: tCPlugin;
    onShow?: () => void;
  }

  // ============= Data Interfaces =============

  interface NetworkRequest {
    id: number;
    url: string;
    method: string;
    status: number;
    statusText: string;
    reqHeaders: Record<string, string>;
    reqBody: any;
    resHeaders: Record<string, string>;
    resBody: any;
    startTime: number;
    endTime: number;
    duration: number;
    error: any;
  }

  interface LogEntry {
    id: number;
    type: string;
    args: any[];
    time: number;
    stack?: string;
    subType?: string;
    extra?: any;
  }

  interface ShadowRootInfo {
    root: ShadowRoot;
    mode: "open" | "closed";
  }

  // ============= Filter Count =============

  /**
   * Result of count formatting. Used by filter buttons to display
   * a compact count in parentheses and the exact value on hover.
   *
   * - `filterCount`: displayed inside () on active filters
   *   (string like "1K" / "1K+" / "100K+", or the raw number if <= 999)
   * - `exactCount`: shown in the title (tooltip) on hover
   *
   * For built-in tabs (console, network, storage) this is auto-generated
   * by `_fmtCount()`. For extension/plugin tabs, developers can pass
   * custom objects via `setFilterCounts()` to control both values.
   */
  interface FilterCountResult {
    filterCount: string | number;
    exactCount: number;
  }

  // ============= Hooks =============

  type HookName =
    | "beforeRender"
    | "afterRender"
    | "beforeLog"
    | "afterLog"
    | "beforeOpen"
    | "afterOpen"
    | "beforeClose"
    | "afterClose"
    | "beforeClear"
    | "afterClear"
    | "pluginMount"
    | "pluginUnmount";

  type HookCallback = (...args: any[]) => void;

  // ============= Virtual List =============

  // ============= Plugin Base Class =============

  class tCPlugin {
    /**
     * @param tC A sandboxed thinConsole instance. The sandbox blocks
     *   access to `options` and `pluginOption` on tC, preventing plugins
     *   from reading or modifying global configuration. Plugins should
     *   use `this.pluginOption` for their own config instead.
     */
    constructor(tC: thinConsole.Sandbox);
    /** Sandboxed thinConsole instance (options/pluginOption blocked) */
    tC: thinConsole.Sandbox;
    /**
     * This plugin's isolated config from options.pluginOption[pluginId].
     * Set automatically before init() is called.
     * Must be an object — non-object values are replaced with {}.
     * Mutable: plugins can freely read and modify their own config.
     * Default: {} if not configured or not an object.
     */
    pluginOption: Record<string, any>;
    /** Plugin ID (auto-derived from class name, lowercased) */
    id: string;
    /** Initialize plugin — override in subclass */
    init(): void;
    /** Whether the current language is Chinese */
    iszh(): boolean;
    /** Whether the current language is English */
    isen(): boolean;
    /** Whether running on a mobile device */
    isMobile(): boolean;
    /** Render plugin content into container — override in subclass */
    render(container: HTMLElement): void;
    /** Called when plugin tab becomes visible — override in subclass */
    onShow(): void;
    /** Called when plugin tab becomes hidden — override in subclass */
    onHide(): void;
    /** Cleanup when plugin is destroyed — override in subclass */
    destroy(): void;
    /** Define a tab for this plugin — override in subclass */
    addTab?(): PluginTab;
  }

  /**
   * Sandboxed thinConsole proxy. Blocks access to `options` and
   * `pluginOption` properties. All other methods work normally with
   * proper `this` binding. Attempts to set/delete `options` or
   * `pluginOption` are silently blocked; other property writes
   * trigger a console warning.
   */
  interface Sandbox {
    /** Marker: always true — check if a tC reference is sandboxed */
    __isSandbox: true;
    // All thinConsole instance methods are available except options/pluginOption
    [key: string]: any;
  }
}

export = thinConsole;
export as namespace thinConsole;

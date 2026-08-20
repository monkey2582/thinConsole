// Type definitions for thinConsole v1.3.5
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
  registerPlugin(id: string, pluginClass: any, config?: any): thinConsole;
  disablePlugin(id: string): thinConsole;
  enablePlugin(id: string): thinConsole;
  destroyPlugin(id: string): void;
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
  static addPlugin(id: string, pluginClass: any, config?: any): typeof thinConsole;
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

  // ============= Plugin Base Class =============

  class tCPlugin {
    constructor(tC: thinConsole, config?: any);
    /** The thinConsole instance this plugin is bound to */
    tC: thinConsole;
    /** Plugin configuration object */
    config: any;
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
}

export = thinConsole;
export as namespace thinConsole;

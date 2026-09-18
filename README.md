# thinConsole

一个轻量级、零依赖的网页调试控制台。以悬浮按钮 + 侧边抽屉的形式注入页面，提供控制台日志、网络请求、本地存储、元素检查四大面板，并支持插件、主题、Hooks 与共享 Store 的扩展体系。

· 🪶 轻量、零依赖，单文件引入
· 🎨 Shadow DOM 隔离，样式不污染页面
· 🖥️ 控制台 / 网络 / 存储 / 元素 四大内置面板
· 🌐 自动接管 console.*、fetch、XMLHttpRequest
· 🌳 强大的 JSON 树渲染（循环引用、Map/Set/WeakMap、Getter/Setter、[[Prototype]]）
· 🧩 完整的插件系统（class-based plugin + 独立 Store 命名空间）
· 🪝 全局 Hooks 体系（afterInit、beforeLog 等）
· 🎭 主题系统（内置 dark / light / auto，可自定义）
· 🖱️ 元素检查器：点选元素、复制 outerHTML、删除元素，支持 Shadow DOM
· 📦 TypeScript 类型定义（thinConsole.d.ts）

---

目录

· 安装
· 快速开始
· 配置项
· 面板说明
  · 控制台 Console
  · 网络 Network
  · 存储 Storage
  · 元素 Elements
· 实例 API
· 静态 API
· 插件系统
· 共享 Store
· Hooks
· 主题
· 图标
· TypeScript

---

安装

通过 <script> 引入

```html
<!-- 中文版 -->
<script src="https://unpkg.com/thinconsole/dist/thinConsole.min.js"></script>

<!-- 英文版 -->
<script src="https://unpkg.com/thinconsole/dist/en.thinConsole.min.js"></script>
```

引入后会自动挂载 window.thinConsole（以及 window.tCPlugin）。

通过 npm

```bash
npm install thinconsole
```

```js
import thinConsole from 'thinconsole';
// 或英文版
import thinConsole from 'thinconsole/en';
```

注意：thinConsole 是一个类，必须使用 new 调用；同一时间只允许存在一个实例（单例）。

---

快速开始

```js
import thinConsole from 'thinconsole';

const tc = new thinConsole({
  color: '#007aff',
  theme: 'auto',
  maxLog: 1e5,
  maxNetwork: 1000,
  jsExecute: true,
});

// 页面右下角会出现 "thinConsole" 悬浮按钮，点击即可打开控制台
tc.show('console', 'all');
```

之后所有 console.log / info / warn / error / table / time / count ... 都会被自动捕获并展示在控制台面板中，fetch / XHR 请求也会自动记录到网络面板。

---

配置项

选项 类型 默认值 说明
color string '#007aff' 悬浮按钮背景色
width string 'auto' 按钮宽度
height string 'auto' 按钮高度
theme string 'auto' 'light' / 'dark' / 'auto' / 自定义主题名
plugins boolean true 是否启用插件系统
disabledPlugins string[] [] 禁用的插件名列表（可用 enablePlugin() 恢复）
jsExecute boolean true 是否允许在标题栏输入并执行代码
pos {x, y} \| null null 悬浮按钮位置；null 表示使用/记忆上次拖动位置
maxLog number 100000 最大日志条数
maxNetwork number 1000 最大网络请求记录数
pluginOption Record<string, object> {} 按插件名传入的插件配置
filters {id, name}[] \| null null 自定义控制台过滤器（默认使用内置）
showComments boolean true 元素面板中是否显示 HTML 注释节点

---

面板说明

控制台 Console

· 自动接管并渲染 console.log / info / warn / error / debug / table / time / timeEnd / count / countReset / assert / trace / group / groupEnd / clear。
· 重复日志折叠：内容相同的连续日志会合并，并显示重复次数徽标。
· 日志级别过滤：全部 / 日志 / 信息 / 警告 / 错误。
· 搜索：
  · 普通文本：keyword
  · 正则：/pattern/flags
  · 强制文本（不解析正则）：#keyword
· 日志详情：点击日志右侧的 👁 图标打开单条日志详情页，可对内容再次搜索、复制、展开函数源码。
· 清空日志：点击右上角 🗑，或 console.clear()。
· 禁用某级别：通过 tc.ban('warn') 隐藏对应过滤器。

网络 Network

· 自动拦截 fetch 与 XMLHttpRequest（不影响页面原有行为）。
· 记录：请求方法、URL、请求头 / 请求体、响应头 / 响应体、状态码、耗时、错误信息。
· 过滤器：全部 / GET / POST / PUT / 成功 / 失败。
· 请求详情：URL、方法、状态、请求/响应头、请求/响应体、发送时间，均可单独复制。
· 重发请求：详情页右上角 ↻。
· 新建请求：网络标签页右上角 ➕，可手动构造 URL / Method / Body / Headers 发送。
· 禁用请求：点击 🚫 可禁止当前过滤类型下的请求发出。
· 清空记录：点击 🗑。

存储 Storage

· 支持 本地存储 / 会话存储 / Cookies 三类。
· 查看、编辑、复制、删除任意键值。
· 新建：点击右上角 ➕。
· 支持 JSON 美化显示（自动识别 JSON 字符串并渲染树）。
· 支持搜索（同控制台的 # 与 /regex/ 语法）。

元素 Elements

· 以树状结构展示 document.documentElement 的完整 DOM。
· 点选元素：点击顶部 🖱 图标后，鼠标移动到页面上高亮目标元素，点击即可定位。
· 复制元素：复制选中元素的 outerHTML。
· 删除元素：删除选中元素（含 Shadow DOM 支持，closed 模式除外）。
· 支持 Shadow DOM 展开：open 与 closed 模式均可查看（框架在运行时 hook 了 attachShadow）。
· DOM 变化时自动增量刷新。

---

实例 API

生命周期

```js
const tc = new thinConsole(options);

tc.show(tab?, filterName?);   // 显示控制台（可同时切换 tab / 过滤器）
tc.hide();                    // 隐藏
tc.destroy();                 // 销毁实例（移除 DOM、卸载插件）
const tc2 = tc.setOption({}); // 销毁并以新配置重建，返回新实例
tc.switch('network', 'all');  // 切换 tab，可选切换过滤器
```

插件管理

```js
tc.addPlugin('myPlugin', MyPlugin);
tc.enablePlugin('myPlugin');
tc.disablePlugin('myPlugin');
tc.destroyPlugin('myPlugin');
```

其他

```js
tc.ban('warn');          // 隐藏"警告"过滤器
tc.ban('warn', false);   // 恢复
tc.ban();                // 隐藏所有过滤器

tc.showNotification('已保存');
tc.showNotification('失败', 'warning');

tc.applyIcon({ copy: '448|M...' });
tc.applyCSS('.my-class { color: red; }');

tc.escapeHtml('<div>');
tc.safeStringify(obj, 2);
tc.icon('copy');
tc.triggerHook('myEvent', 1, 2);
```

storage

```js
tc.storage.local.get('key');
tc.storage.local.set('key', 'value');
tc.storage.local.remove('key');
tc.storage.local.clear();

tc.storage.session.get('key');
tc.storage.cookie.set('key', 'value', 7); // 7 天有效期
```

虚拟列表

```js
const vl = tc.createVirtualList(container, {
  initialData: list,
  itemHeight: 60,
  renderItem: (item) => `<div>${item.name}</div>`,
  emptyHTML: '<div class="nolog">暂无数据</div>',
  trackBy: (item) => item.id,
});

vl.update(newList);
vl.render();
vl.destroy();
```

---

静态 API

所有实例方法都有对应的静态快捷方式（作用于当前单例）：

```js
thinConsole.show('console', 'error');
thinConsole.hide();
thinConsole.switch('network', 'failed');
thinConsole.destroy();
thinConsole.setOption({ theme: 'dark' });

thinConsole.log('hello');
thinConsole.info('info');
thinConsole.warn('warn');
thinConsole.error('error');

thinConsole.ban('warn');

thinConsole.addTheme('myTheme', '--console:#000;--text:#fff;', { copy: '448|M...' });
thinConsole.addHeader('copy', 'my-btn', () => alert('hi'));

thinConsole.addHook('afterInit', function () {
  console.log('console 已初始化');
});
thinConsole.removeHook('afterInit', handler);
thinConsole.triggerHook('myEvent', payload);

thinConsole.addPlugin('myPlugin', MyPlugin);
thinConsole.enablePlugin('myPlugin');
thinConsole.disablePlugin('myPlugin');

thinConsole.setFilterCounts({ log: 10, warn: { filterCount: 3, exactCount: 3 } });
```

addHeader

```js
const btn = thinConsole.addHeader('copy', 'btn-copy', () => alert('hi'));

// 支持在返回的 controller 上继续绑定/解绑事件
btn.on('click', () => {});
btn.off('click');
btn.remove(); // 移除按钮并释放槽位
```

---

插件系统

插件必须是继承 tCPlugin 的类（函数式插件已废弃，请使用 Hooks）：

```js
class MyPlugin extends thinConsole.tCPlugin {
  constructor(tC) {
    super(tC);
    this.id = 'myPlugin';
  }

  init() {
    // 读取自己的 pluginOption
    console.log(this.pluginOption);

    // 使用独立的 store 命名空间（拥有者视图）
    this.store.set('counter', 0, false); // false 表示锁为私有
  }

  addTab() {
    return { id: 'myPlugin', name: '我的面板', icon: 'plug' };
  }

  render(container) {
    container.innerHTML = '<button id="inc">+1</button>';
    container.querySelector('#inc').onclick = () => {
      const next = (this.store.get('counter') || 0) + 1;
      this.store.set('counter', next);
    };
  }

  onShow() {}
  onHide() {}
  destroy() {}
}

thinConsole.addPlugin('myPlugin', MyPlugin);
```

实例化时传入 pluginOption：

```js
new thinConsole({
  pluginOption: {
    myPlugin: { foo: 'bar' },
  },
});
```

插件基类提供的工具方法：

· this.iszh() / this.isen() — 返回当前构建包的语言常量（中文包 / 英文包）
· this.isMobile() — 是否移动端 UA
· this.tC — 沙箱化的 thinConsole 实例（读取 OK，写入 options / pluginOption 会被拦截）
· this.store — 拥有者视图的 Store（见下）

---

共享 Store

用于在插件之间安全地共享可写状态（Hooks 只适合通知，不适合传状态）。

```js
// 共享视图（无归属）
tc.store.set('theme', 'dark');
tc.store.get('theme');
tc.store.remove('theme');

// 拥有者视图（在插件内部 this.store）
this.store.set('theme', 'dark', false); // false = 锁定为私有
this.store.set('theme', 'light', true); // true = 解锁
this.store.writeable('theme', false);   // 只改锁状态

// 订阅
const off = tc.store.subscribe('theme', (value, key, oldValue) => {
  console.log(key, oldValue, '->', value);
});
off();
```

要点：

· 键可以被 set(..., false) 锁定为某个插件私有，其他插件无法覆写/删除。
· 匿名写入（tc.store.set）的键是公共键，任何人均可写/删。
· remove(key) 会通知订阅者 (undefined, key, oldValue)，然后自动解绑该键的所有订阅。

---

Hooks

Hooks 是只读的事件通知机制，用于订阅 thinConsole 内部生命周期。

内置 Hooks：

Hook 触发时机 参数
afterInit 实例初始化完成 (tc)
beforeRender 每次渲染前 (tabId)
afterRender 每次渲染后 (tabId)
beforeLog 捕获日志前 (type, ...args)
afterLog 生成日志条目后 (logItem)
beforeOpen 打开控制台前 -
afterOpen 打开控制台后 -
beforeClose 关闭控制台前 -
afterClose 关闭控制台后 -
beforeClear 清空前 -
afterClear 清空后 -
pluginMount 插件挂载 (name, plugin)
pluginUnmount 插件卸载 (name)

```js
thinConsole.addHook('afterLog', (logItem) => {
  console.log('新日志：', logItem.type, logItem.args);
});

thinConsole.addHook('afterInit', onInit, true); // 一次性

thinConsole.removeHook('afterLog', handler);
```

Hooks 名称无需预注册，任意字符串都会自动创建。推荐命名空间写法：plugin:event。

---

主题

内置主题

theme: 'light' | 'dark' | 'auto'。auto 会跟随系统 prefers-color-scheme。

自定义主题

```js
thinConsole.addTheme(
  'nord',
  `
    --console:#2e3440;
    --header:#3b4252;
    --text:#eceff4;
    --filter-on:#88c0d0;
    --json-key:#8fbcbb;
  `,
  {
    copy: '448|M192 0c-35.3 ...',
  }
);

const tc = new thinConsole({ theme: 'nord' });
```

可覆盖的 CSS 变量（节选）：

变量 说明
--console / --header / --controls 背景色
--text 主文本色
--border 边框色
--log 日志条目背景
--filter-on 选中态颜色
--json-key / --json-str / --json-num / --json-bool / --json-null / --json-cmt JSON 树配色
--log-warn / --log-warn-i / --log-err-i / --log-info 日志级别配色

---

图标

图标格式为 "viewBox|path.d"。可通过 applyIcon 或 addTheme(name, styles, icons) 覆盖：

```js
tc.applyIcon({
  copy: '448|M192 0c-35.3 0-64 28.7-64 64v256...',
});
```

内置图标：angle-down、angle-right、arrow-left、ban、check、check-circle、chevron-down、chevron-up、code、copy、database、download、edit、exclamation、exclamation-triangle、eye、info、info-circle、list、mouse-pointer、pen、plug、plus、redo、search、table、terminal、times、times-circle、trash、upload、wifi、window-restore、cookie-bite。

---

TypeScript

包内提供完整的类型定义 thinConsole.d.ts：

```ts
import thinConsole = require('thinconsole');

const tc = new thinConsole({
  theme: 'auto',
  maxLog: 50000,
});

thinConsole.addHook('afterLog', function (logItem) {
  console.log(logItem.type);
});

class MyPlugin extends thinConsole.tCPlugin {
  init() {
    this.store.set('ready', true);
  }
}

thinConsole.addPlugin('my', MyPlugin);
```

switch 是保留字，被声明为带引号的静态成员：

```ts
thinConsole['switch']('network', 'all');
```

运行时 thinConsole.switch(...) 同样可用。

---

文件说明

文件 说明
thinConsole.min.js 中文版（默认）
en.thinConsole.min.js 英文版
thinConsole.d.ts 类型定义

两个构建包 API 完全一致，仅界面文案与 iszh() / isen() 返回值不同。

---

License

MIT

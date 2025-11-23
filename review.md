最核心的一句话：**浏览器把 HTML 解析成一棵“DOM 树”，JS 通过 `document` 这扇门去“找到节点 → 改节点 → 监听节点上的事件”，这就是这个项目里 HTML 和 JS 的交互本质。**

1. 浏览器到底干了啥（从 HTML 到 DOM 再到 JS）
2. DOM 是什么，以及你项目里是怎么“拿”和“改”的
3. 你这个项目的“交互链路”完整走一遍（从加载到点击、评论、烟花）

------

## 一、浏览器整个流程：从 HTML 到 JS

项目结构大概是这样：

```html
<link rel="stylesheet" href="style.css">
<script src="script.js"></script>
```

浏览器加载这个页面时，大致做这几步：

1. **下载 HTML 文件**

2. **HTML 解析器**一行一行读 HTML 标签，边读边构建一棵树

   - `<html>` → 建一个 `HTMLHtmlElement` 节点
   - `<body>` → 建一个 `HTMLBodyElement` 节点，挂在 html 下
   - `<header>...`、`<main>...`、`<section>`、`<div>`……统统变成 **DOM 节点**

3. 解析 `<link rel="stylesheet" href="style.css">`

   - 触发下载 `style.css`
   - CSS 解析器把 CSS 解析成 **CSSOM（CSS 对象模型）**

4. 解析 `<script src="script.js"></script>`

   - 下载 `script.js`
   - 交给 JS 引擎（比如 Chrome 的 V8）去执行
   - 在执行 JS 的时候，JS 引擎会把一个叫 **`document`** 的对象提供给你，这个 `document` 就是“DOM 树的入口”

5. 当 HTML 结构解析完（不等图片），浏览器触发 `DOMContentLoaded` 事件，
    在脚本末尾写的这一行就会被调用：

   ```js
   document.addEventListener("DOMContentLoaded", initApp);
   ```

   也就是：**DOM树建好 → 调用 `initApp()` → 初始化整个应用。**

------

## 二、DOM 是什么？JS 怎么“摸”到 HTML？

### 1. DOM：Document Object Model

DOM = 文档对象模型，本质是：

> 把 HTML 文本，变成在 JS 里可操作的 **对象树**。

比如这段 HTML：

```html
<section id="postDetail" class="post-detail hidden" aria-live="polite">
    <button id="backToList" class="back-button">← 返回文章列表</button>
    <h2 id="detailTitle"></h2>
    <div id="detailMeta" class="post-meta"></div>
    <div id="detailContent" class="post-content"></div>
    ...
</section>
```

解析后的 DOM 大致长这样（抽象示意）：

- `document`
  - `html`
    - `head`
    - `body`
      - `section#postDetail.post-detail.hidden`
        - `button#backToList.back-button`
        - `h2#detailTitle`
        - `div#detailMeta.post-meta`
        - `div#detailContent.post-content`
        - ...

这些“节点”在 JS 里就是对象，比如：

- `section` → `HTMLElement` 实例
- `button` → `HTMLButtonElement`
- `h2` → `HTMLHeadingElement`
- 等等…

在 JS 里拿它们，是这样拿的：

```js
postDetailEl = document.getElementById("postDetail");
backToListBtn = document.getElementById("backToList");
detailTitleEl = document.getElementById("detailTitle");
detailMetaEl  = document.getElementById("detailMeta");
detailContentEl = document.getElementById("detailContent");
```

### 2. JS 和 DOM 的“交互手段”只有三类

**（1）查：找到 DOM 节点**

常见 API：

- `document.getElementById("xxx")`
- `document.querySelector(".className")`
- `document.querySelectorAll("section.post")`
- …

在 `initDOMElements()` 里做的，就是把这些“查出来的节点对象”缓存到变量里，后面反复用。

------

**（2）改：修改 DOM 节点的内容/属性/样式**

比如切换列表和详情界面：

```js
postListEl.classList.add("hidden");      // 隐藏列表
postDetailEl.classList.remove("hidden"); // 显示详情
```

`classList` 是一个 DOM 提供的对象，用来操作 HTML 的 `class=""` 属性：

- `.add("hidden")` → 相当于给这个标签的 class 里加上 `hidden`

- `.remove("hidden")` → 去掉

- CSS 里写了：

  ```css
  .hidden {
      display: none;
  }
  ```

  所以加了 `hidden` 这个类，就不显示了。**这就是 JS → DOM → CSS → 视觉效果 的链条。**

再比如更新文章内容：

```js
detailTitleEl.textContent = post.title;
detailMetaEl.textContent  = `${post.date} · 分类：${post.categoryName}`;
detailContentEl.innerHTML = post.content;
```

- `textContent`：当纯文本设置
- `innerHTML`：把一段 HTML 字符串解析成 DOM 插进去（比如你 JSON 里的 `<h2>...<pre><code>`）

Prism 代码高亮也是改 DOM：

```js
setTimeout(() => {
    Prism.highlightAllUnder(detailContentEl);
}, 50);
```

Prism 内部会：

- 扫描 `detailContentEl` 下面的 `<pre><code class="language-cpp">...</code></pre>`
- 把代码里的关键字加 `<span class="token keyword">` 之类的标签
- 然后 CSS 根据这些类名上色

这全部是 **“JS 操作 DOM → 修改 HTML 结构 → 浏览器重新渲染”**。

------

**（3）听：监听 DOM 上的事件**

HTML 页面上的一切交互，本质都是 **事件**：

- 点击（`click`）
- 输入改变（`input`）
- 表单提交（`submit`）
- 滚动（`scroll`）
- 文档加载完成（`DOMContentLoaded`）
- …

通过 `addEventListener` 把“监听器”挂在某个 DOM 节点上，例如：

```js
postListEl.addEventListener("click", handlePostListClick);
commentFormEl.addEventListener("submit", handleCommentSubmit);
window.addEventListener("scroll", handleScroll);
document.addEventListener("click", handleClickFirework);
```

这些事件的底层机制大致是：

1. 用户点击鼠标 / 键盘 / 滚轮等，操作系统把事件交给浏览器；
2. 浏览器根据光标位置，找到“被点击的 DOM 节点”，构造一个 JS 的事件对象 `event`
3. 浏览器按 **事件流（三个阶段）** 分发：
   - 捕获阶段（从 `window` → `document` → `body` → ... → 目标）
   - 目标阶段（到达具体被点的那个元素）
   - 冒泡阶段（从目标往上返回 `parentNode` 链，直到 `document` / `window`）
4. 在每一层上，如果你添加过 `addEventListener("click", handler)`，就会触发对应的回调

利用的一个关键技巧叫 **事件委托**：

```js
function handlePostListClick(event) {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.classList.contains("post-title-button")) {
        const id = parseInt(target.dataset.id, 10);
        openPostDetail(id);
    }
}
```

- 不是给每个 `<button>` 单独加监听器，而是只给 `postListEl` 这一大块加一个 `click`；
- `event.target` 是 **真正被点击的那个子元素**；
- if 判断一下：是按钮并且有 `post-title-button` 类 → 认为这是文章标题按钮；然后读它的 `data-id`。
- 这就是经典“父节点代理子节点事件”，优点是：**列表项是动态生成的，但你不用每次都重新绑定事件。**

------

## 三、结合这个项目，按时间顺序走完整个交互流程

### 1. 页面加载阶段：HTML → DOM → JS 启动

1. 浏览器解析 `index.html`，构建 DOM 树

2. 解析到 `<link rel="stylesheet" href="style.css">`，加载 CSS，构建 CSSOM

3. 解析到 `<script src="script.js"></script>`，加载并执行 `script.js`：

   - 声明了一堆全局变量 / 函数（`posts`、`loadPosts`、`renderPostList`、`initApp` 等）

   - 注册：

     ```js
     document.addEventListener("DOMContentLoaded", initApp);
     ```

4. HTML 解析完成，**触发 `DOMContentLoaded` 事件** → 浏览器调用 `initApp()`。

------

### 2. `initApp()` 做的事：打通 HTML 和 JS 之间的所有“管道”

```js
function initApp() {
    initDOMElements();  // 把所有 id -> JS 变量
    initFireworks();    // 创建 canvas，开始动画循环

    // 注册事件监听
    postListEl.addEventListener("click", handlePostListClick);
    archiveListEl.addEventListener("click", handleArchiveClick);
    backToListBtn.addEventListener("click", backToList);
    searchInputEl.addEventListener("input", handleSearchInput);
    categoryFilterEl.addEventListener("change", handleCategoryChange);
    window.addEventListener("scroll", handleScroll);
    backToTopBtn.addEventListener("click", handleBackToTop);
    commentFormEl.addEventListener("submit", handleCommentSubmit);
    document.addEventListener("click", handleClickFirework);
    if (githubBtn) githubBtn.addEventListener("click", handleGithubClick);
    if (giteeBtn) giteeBtn.addEventListener("click", handleGiteeClick);
    if (mailBtn) mailBtn.addEventListener("click", handleMailClick);

    // 加载 JSON 文章
    loadPosts();
}
```

可以用一句话概括：

> **initApp = 拿到 DOM → 绑好事件 → 开启烟花 → 异步加载文章数据**

------

### 3. 加载 posts.json：异步 + DOM 更新

`loadPosts()`：

1. 用 `fetch("posts.json")` 发起 HTTP 请求（浏览器负责发送）
2. JS 这边不会卡死，继续空闲；等网络返回时，浏览器把“回调任务”丢进事件队列
3. 当前调用栈空了，事件循环把 `.then(...)` 的回调拿出来执行：
   - `posts = data;`
   - `renderPostList();` → 创建 `<article>`、`<button>` 等 DOM 元素，插入到 `postListEl`
   - `renderArchive();` → 创建归档 `<li><button>` 插入 `archiveListEl`

此时看到的首页列表，就是 JS **根据 JSON 动态往 DOM 里 appendChild** 的结果。

------

### 4. 用户点击标题 → JS 查到对应文章 → 更新 DOM → Prism 高亮

流程：

1. 用户在页面上点了一篇文章标题（`<button class="post-title-button" data-id="1">`）

2. 浏览器产生一个 `click` 事件对象，沿着事件流冒泡到 `postListEl`

3. 注册的 `handlePostListClick` 被调用：

   ```js
   function handlePostListClick(event) {
       const target = event.target;
       if (target instanceof HTMLButtonElement &&
           target.classList.contains("post-title-button")) {
           const id = parseInt(target.dataset.id, 10);
           openPostDetail(id);
       }
   }
   ```

4. `openPostDetail(id)`：

   - 在 `posts` 数组里 `find` 出对应的文章对象

   - 把文章的标题、时间、分类、HTML 内容写进对应 DOM 节点：

     ```js
     detailTitleEl.textContent = post.title;
     detailMetaEl.textContent = `${post.date} · 分类：${post.categoryName}`;
     detailContentEl.innerHTML = post.content;
     ```

   - 切换显示状态：

     ```js
     postListEl.classList.add("hidden");
     postDetailEl.classList.remove("hidden");
     ```

   - 调用 Prism 做局部代码高亮：

     ```js
     setTimeout(() => {
         Prism.highlightAllUnder(detailContentEl);
     }, 50);
     ```

   - 渲染评论 + 回到顶部

这一整套，就是 **“事件驱动 → JS 算出结果 → 操作 DOM → 浏览器渲染”** 的完整交互过程。

------

### 5. 评论、归档、滚动、烟花……全是这个模式

- **提交评论**：监听 `commentFormEl` 的 `submit` 事件 → JS 读取 input/textarea → 更新 `commentsStore` → `renderComments()` 用 DOM 重新生成 `<li>` 列表。
- **归档**：监听 `archiveListEl` 上的 `click` → 通过 `dataset.ym` 知道点的是哪个年月 → `filterByYearMonth()` 过滤数组 → 动态生成 DOM。
- **回到顶部**：监听 `window.scroll` → 根据 `window.scrollY` 控制 `backToTopBtn.style.display`。
- **烟花**：
  - `document.addEventListener("click", handleClickFirework);`
  - `handleClickFirework(e)` 使用 `e.clientX`, `e.clientY` 当做烟花爆炸中心；
  - `createFirework()` 往数组 `particles` 里塞粒子；
  - `requestAnimationFrame(animateFireworks)` 每一帧用 canvas API 在屏幕上画出来。

烟花这部分不直接操作 DOM 树，而是操作 `<canvas>` 里的像素，但事件源（`document` 的 click）、初始化 canvas 还是通过 DOM。

------

## 小结：可以在答辩时这样概括 HTML & JS 交互

可以整理成一段口述版本（大意）：

> 老师，这个项目的前端是典型的“HTML + CSS + JavaScript + DOM”模式。
>  浏览器先把 HTML 解析成一棵 DOM 树，JS 通过全局的 `document` 对象来访问这棵树。
>  在 `DOMContentLoaded` 事件触发时，我的入口函数 `initApp()` 会被调用，它做三件事：
>  第一，调用 `initDOMElements()`，通过 `document.getElementById` 把页面上所有需要操作的元素缓存为 JS 变量；
>  第二，统一为这些 DOM 元素注册事件监听器，比如列表点击、搜索输入、滚动、表单提交等；
>  第三，调用 `loadPosts()`，用 `fetch` 异步加载 `posts.json`，然后通过 `renderPostList()` 和 `renderArchive()` 动态创建文章列表和归档的 DOM 结构。
>
> 用户的所有操作（比如点击文章标题、提交评论、点击归档、滚动页面）都会触发相应的 DOM 事件，事件通过 `addEventListener` 绑定到 JS 的回调函数中。在回调里，我会根据当前状态计算需要展示的内容，然后通过修改 DOM 的 `innerHTML`、`textContent`、`classList` 等属性来更新页面。比如点击文章标题按钮时，我通过 `dataset.id` 找到对应文章对象，填充到详情区域的 DOM 节点中，并通过添加/移除 `hidden` 类来切换列表视图和详情视图。
>  代码高亮和烟花特效也是在 DOM 基础上的扩展：代码高亮使用 Prism.js 对详情区域的 DOM 节点进行二次处理，烟花则在一个全屏的 canvas DOM 节点上通过 `requestAnimationFrame` 进行绘制。
>
> 所以整体上，这个项目的核心就是：**HTML 提供结构，CSS 负责样式，JavaScript 通过 DOM 把用户的事件和页面的动态更新连接起来。**
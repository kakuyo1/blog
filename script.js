// script.js
"use strict"; // 启用严格模式, 以避免一些常见错误, 例如未声明变量，禁止使用保留字等

//! ============================================= 变量定义 ======================================== */
// 文章数据：从 posts.json 异步加载
let posts = [];
// 用于存储每篇文章的留言（仅保存在前端内存中）
const commentsStore = {}; // key: postId, value: [{name, text, time}, ...]
// 文章列表相关
let postListEl, postDetailEl, searchInputEl, categoryFilterEl, backToListBtn, backToTopBtn, archiveListEl;
// 文章详情/评论相关
let detailTitleEl, detailMetaEl, detailContentEl, commentFormEl, commentNameEl, commentTextEl, commentListEl;
// "关于我"卡片相关
let githubBtn, giteeBtn, mailBtn;
// 烟花特效相关
let fwCanvas, fwCtx, particles = [];
// 当前查看的文章 ID
let currentPostId = null;

//! ============================================= DOM相关函数定义 ======================================== */

/**
 * @brief 初始化 DOM 元素引用
 */
function initDOMElements() {
    postListEl       = document.getElementById("postList");
    postDetailEl     = document.getElementById("postDetail");
    searchInputEl    = document.getElementById("searchInput");
    categoryFilterEl = document.getElementById("categoryFilter");
    backToListBtn    = document.getElementById("backToList");
    backToTopBtn     = document.getElementById("backToTop");
    archiveListEl    = document.getElementById("archiveList");

    detailTitleEl    = document.getElementById("detailTitle");
    detailMetaEl     = document.getElementById("detailMeta");
    detailContentEl  = document.getElementById("detailContent");
    commentFormEl    = document.getElementById("commentForm");
    commentNameEl    = document.getElementById("commentName");
    commentTextEl    = document.getElementById("commentText");
    commentListEl    = document.getElementById("commentList");

    githubBtn        = document.getElementById("githubBtn");
    giteeBtn         = document.getElementById("giteeBtn");
    mailBtn          = document.getElementById("mailBtn");
}

/**
 * @brief 异步加载文章数据, 并初始化文章列表和归档, 处理加载错误
 */
function loadPosts() {
    fetch("posts.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("网络错误：" + response.status);
            }
            return response.json();
        })
        .then(data => {
            posts = data;
            renderPostList();
            renderArchive();
        })
        .catch(err => {
            console.error("加载文章失败：", err);
            postListEl.innerHTML =
                "<p style='color:#ffb3b3;font-size:14px;'>文章加载失败，请稍后重试。</p>";
        });
}

/**
 * @brief 渲染文章列表，根据搜索关键词和分类筛选
 */
function renderPostList() {
    const keyword = searchInputEl.value.trim().toLowerCase();
    const category = categoryFilterEl.value;

    postListEl.innerHTML = "";

    const filtered = posts.filter(post => {
        const matchCategory = category === "all" ? true : post.category === category;
        const target = (post.title + " " + post.content).toLowerCase();
        const matchKeyword = keyword === "" ? true : target.includes(keyword);
        return matchCategory && matchKeyword;
    });

    if (filtered.length === 0) {
        const emptyEl = document.createElement("p");
        emptyEl.textContent = "暂时没有符合条件的文章。";
        emptyEl.style.fontSize = "14px";
        emptyEl.style.color = "#777777";
        postListEl.appendChild(emptyEl);
        return;
    }

    filtered.forEach(post => {
        const articleEl = document.createElement("article");
        articleEl.className = "post";

        const titleEl = document.createElement("h2");
        titleEl.className = "post-title";

        const btnEl = document.createElement("button");
        btnEl.className = "post-title-button";
        btnEl.textContent = post.title;
        btnEl.dataset.id = String(post.id);
        titleEl.appendChild(btnEl);

        const metaEl = document.createElement("div");
        metaEl.className = "post-meta";
        metaEl.textContent = `${post.date} · 分类：${post.categoryName}`;

        const excerptEl = document.createElement("p");
        excerptEl.className = "post-excerpt";
        excerptEl.textContent = post.excerpt;

        articleEl.appendChild(titleEl);
        articleEl.appendChild(metaEl);
        articleEl.appendChild(excerptEl);

        postListEl.appendChild(articleEl);
    });
}

/**
 * @brief 打开文章详情, 渲染文章内容和评论
 * @param postId - 文章 ID
 */
function openPostDetail(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    currentPostId = postId;

    detailTitleEl.textContent = post.title;
    detailMetaEl.textContent = `${post.date} · 分类：${post.categoryName}`;
    detailContentEl.innerHTML = post.content;

    setTimeout(() => {
        Prism.highlightAllUnder(detailContentEl);
    }, 50);

    postListEl.classList.add("hidden");
    postDetailEl.classList.remove("hidden");

    renderComments();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * @brief 返回文章列表视图
 */
function backToList() {
    currentPostId = null;
    postDetailEl.classList.add("hidden");
    postListEl.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * @brief 渲染归档（按年月统计）
 */
function renderArchive() {
    const map = new Map();

    posts.forEach(post => {
        const ym = post.date.slice(0, 7);
        map.set(ym, (map.get(ym) || 0) + 1);
    });

    const entries = Array.from(map.entries()).sort((a, b) => a[0] < b[0] ? 1 : -1);
    archiveListEl.innerHTML = "";

    entries.forEach(([ym, count]) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.textContent = `${ym}（${count}）`;
        btn.dataset.ym = ym;
        li.appendChild(btn);
        archiveListEl.appendChild(li);
    });
}

/**
 * @brief 根据年月过滤文章列表
 * @param ym - 年月字符串，格式 "YYYY-MM"
 */
function filterByYearMonth(ym) {
    const originalRender = renderPostList;
    const keywordBackup = searchInputEl.value;
    const categoryBackup = categoryFilterEl.value;

    searchInputEl.value = "";
    categoryFilterEl.value = "all";

    postListEl.innerHTML = "";

    const filtered = posts.filter(post => post.date.startsWith(ym));
    if (filtered.length === 0) {
        const p = document.createElement("p");
        p.textContent = "该月份暂无文章。";
        postListEl.appendChild(p);
    } else {
        filtered.forEach(post => {
            const articleEl = document.createElement("article");
            articleEl.className = "post";

            const titleEl = document.createElement("h2");
            titleEl.className = "post-title";

            const btnEl = document.createElement("button");
            btnEl.className = "post-title-button";
            btnEl.textContent = post.title;
            btnEl.dataset.id = String(post.id);
            titleEl.appendChild(btnEl);

            const metaEl = document.createElement("div");
            metaEl.className = "post-meta";
            metaEl.textContent = `${post.date} · 分类：${post.categoryName}`;

            const excerptEl = document.createElement("p");
            excerptEl.className = "post-excerpt";
            excerptEl.textContent = post.excerpt;

            articleEl.appendChild(titleEl);
            articleEl.appendChild(metaEl);
            articleEl.appendChild(excerptEl);

            postListEl.appendChild(articleEl);
        });
    }

    searchInputEl.value = keywordBackup;
    categoryFilterEl.value = categoryBackup;
}

/**
 * @brief 渲染当前文章的留言列表
 */
function renderComments() {
    commentListEl.innerHTML = "";
    if (!currentPostId) return;

    const list = commentsStore[currentPostId] || [];
    list.forEach(comment => {
        const li = document.createElement("li");
        li.className = "comment-item";

        const header = document.createElement("div");
        header.className = "comment-item-header";
        header.textContent = `${comment.name} · ${comment.time}`;

        const text = document.createElement("div");
        text.textContent = comment.text;

        li.appendChild(header);
        li.appendChild(text);

        commentListEl.appendChild(li);
    });
}

/**
 * @brief 处理留言表单提交事件，添加新留言并重新渲染留言列表
 * @param event - 提交事件对象
 */
function handleCommentSubmit(event) {
    event.preventDefault();
    if (!currentPostId) return;

    const name = commentNameEl.value.trim() || "匿名";
    const text = commentTextEl.value.trim();
    if (!text) return;

    const now = new Date();
    const timeStr = now.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });

    if (!commentsStore[currentPostId]) {
        commentsStore[currentPostId] = [];
    }

    commentsStore[currentPostId].push({
        name,
        text,
        time: timeStr
    });

    commentTextEl.value = "";
    renderComments();
}

//! ============================================= 事件处理的回调函数 ======================================== */

/**
 * @brief 处理文章列表点击事件，打开文章详情
 * @param event - 点击事件对象
 */
function handlePostListClick(event) {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.classList.contains("post-title-button")) {
        const id = parseInt(target.dataset.id, 10);
        openPostDetail(id);
    }
}

/**
 * @brief 处理归档点击事件，根据年月筛选文章
 * @param event - 点击事件对象
 */
function handleArchiveClick(event) {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.dataset.ym) {
        const ym = target.dataset.ym;
        document.getElementById("home").scrollIntoView({ behavior: "smooth" });
        if (!postListEl.classList.contains("hidden")) {
            filterByYearMonth(ym);
        } else {
            backToList();
            filterByYearMonth(ym);
        }
    }
}

/**
 * @brief 处理搜索输入事件，更新文章列表
 */
function handleSearchInput() {
    if (!postDetailEl.classList.contains("hidden")) {
        backToList();
    }
    renderPostList();
}

/**
 * @brief 处理分类筛选变化事件，更新文章列表
 */
function handleCategoryChange() {
    if (!postDetailEl.classList.contains("hidden")) {
        backToList();
    }
    renderPostList();
}

/**
 * @brief 处理滚动事件，显示或隐藏返回顶部按钮
 */
function handleScroll() {
    if (window.scrollY > 200) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
}

/**
 * @brief 处理返回顶部按钮点击事件，平滑滚动到顶部
 */
function handleBackToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * @brief 处理 GitHub 按钮点击事件，打开 GitHub 主页
 */
function handleGithubClick() {
    window.open("https://github.com/kakuyo1", "_blank");
}

/**
 *  @brief 处理 Gitee 按钮点击事件，打开 Gitee 主页
 */
function handleGiteeClick() {
    window.open("https://gitee.com/ye-menga", "_blank");
}

/**
 * @brief 处理邮箱按钮点击事件，打开默认邮件客户端
 */
function handleMailClick() {
    window.location.href = "mailto:wdmzsym@gmail.com";
}

/**
 * @brief 初始化烟花特效画布和相关设置
 */
function initFireworks() {
    fwCanvas = document.createElement("canvas");
    fwCanvas.id = "fireworksCanvas";
    Object.assign(fwCanvas.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "999"
    });
    document.body.appendChild(fwCanvas);

    fwCtx = fwCanvas.getContext("2d");
    resizeFwCanvas();
    window.addEventListener("resize", resizeFwCanvas);
    animateFireworks();
}

/**
 *  @brief 调整烟花画布大小以适应窗口
 */
function resizeFwCanvas() {
    fwCanvas.width = window.innerWidth;
    fwCanvas.height = window.innerHeight;
}

/**
 * @brief 创建烟花粒子效果
 * @param x - 烟花爆炸的 x 坐标
 * @param y - 烟花爆炸的 y 坐标
 */
function createFirework(x, y) {
    const count = 45;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 2;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            radius: 2 + Math.random() * 1.5,
            decay: 0.015 + Math.random() * 0.02,
            hue: 200 + Math.random() * 80
        });
    }
}

/**
 * @brief 动画循环，更新和渲染烟花粒子
 */
function animateFireworks() {
    fwCtx.globalCompositeOperation = "destination-out";
    fwCtx.fillStyle = "rgba(0, 0, 0, 0.2)";
    fwCtx.fillRect(0, 0, fwCanvas.width, fwCanvas.height);

    fwCtx.globalCompositeOperation = "lighter";

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }

        fwCtx.save();
        fwCtx.globalAlpha = p.alpha;
        fwCtx.fillStyle = `hsl(${p.hue}, 80%, 60%)`;
        fwCtx.beginPath();
        fwCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        fwCtx.fill();
        fwCtx.restore();
    }

    requestAnimationFrame(animateFireworks);
}

/**
 * @brief 处理文档点击事件，触发烟花效果
 * @param e - 点击事件对象
 */
function handleClickFirework(e) {
    createFirework(e.clientX, e.clientY);
}

//! ============================================= 初始化应用 ======================================== */

/**
 * @brief 初始化应用，设置事件监听器并加载文章数据
 */
function initApp() {
    // 初始化 DOM 元素引用和烟花特效
    initDOMElements();
    initFireworks();

    // 注册回调函数
    postListEl.addEventListener("click", handlePostListClick);                  // 文章列表点击时触发
    archiveListEl.addEventListener("click", handleArchiveClick);                // 归档列表点击时触发
    backToListBtn.addEventListener("click", backToList);                        // 点击返回列表按钮时触发
    searchInputEl.addEventListener("input", handleSearchInput);                 // 搜索输入变化时触发
    categoryFilterEl.addEventListener("change", handleCategoryChange);          // 分类筛选变化时触发
    window.addEventListener("scroll", handleScroll);                            // 滚动时触发
    backToTopBtn.addEventListener("click", handleBackToTop);                    // 点击返回顶部按钮时触发
    commentFormEl.addEventListener("submit", handleCommentSubmit);              // 提交留言表单时触发
    document.addEventListener("click", handleClickFirework);                    // 在文档的任何位置点击时触发烟花效果
    if (githubBtn) githubBtn.addEventListener("click", handleGithubClick);      // 点击 GitHub 按钮时触发
    if (giteeBtn) giteeBtn.addEventListener("click", handleGiteeClick);         // 点击 Gitee 按钮时触发
    if (mailBtn) mailBtn.addEventListener("click", handleMailClick);            // 点击邮箱按钮时触发

    // 加载文章数据
    loadPosts();
}

// 启动应用（触发时机：当 HTML 文档完全被解析和加载完成时（不等待样式表、图片等外部资源））
document.addEventListener("DOMContentLoaded", initApp);

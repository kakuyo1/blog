// script.js
"use strict"; // 启用严格模式, 以避免一些常见错误, 例如未声明变量，禁止使用保留字等

// 文章数据：从 posts.json 异步加载
let posts = [];

// 用于存储每篇文章的留言（仅保存在前端内存中）
const commentsStore = {}; // key: postId, value: [{name, text, time}, ...]

// addEventListener 确保 DOM 加载完成后再执行脚本, DOM是指文档对象模型
document.addEventListener("DOMContentLoaded", () => {
    const postListEl = document.getElementById("postList");
    const postDetailEl = document.getElementById("postDetail");
    const searchInputEl = document.getElementById("searchInput");
    const categoryFilterEl = document.getElementById("categoryFilter");
    const backToListBtn = document.getElementById("backToList");
    const backToTopBtn = document.getElementById("backToTop");
    const archiveListEl = document.getElementById("archiveList");

    const detailTitleEl = document.getElementById("detailTitle");
    const detailMetaEl = document.getElementById("detailMeta");
    const detailContentEl = document.getElementById("detailContent");
    const commentFormEl = document.getElementById("commentForm");
    const commentNameEl = document.getElementById("commentName");
    const commentTextEl = document.getElementById("commentText");
    const commentListEl = document.getElementById("commentList");

    // 「关于我」卡片的社交按钮
    const githubBtn = document.getElementById("githubBtn");
    const giteeBtn = document.getElementById("giteeBtn");
    const mailBtn = document.getElementById("mailBtn");

    let currentPostId = null;

    /* ========== 从 posts.json 加载文章数据 ========== */
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

    // 渲染文章列表
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

    // 打开文章详情
    function openPostDetail(postId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        currentPostId = postId;

        detailTitleEl.textContent = post.title;
        detailMetaEl.textContent = `${post.date} · 分类：${post.categoryName}`;
        detailContentEl.innerHTML = post.content;

        // 切换显示
        postListEl.classList.add("hidden");
        postDetailEl.classList.remove("hidden");

        // 渲染当前文章的留言
        renderComments();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // 返回文章列表
    function backToList() {
        currentPostId = null;
        postDetailEl.classList.add("hidden");
        postListEl.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // 渲染归档（按年月统计）
    function renderArchive() {
        const map = new Map(); // key: "YYYY-MM", value: count

        posts.forEach(post => {
            const ym = post.date.slice(0, 7); // "YYYY-MM"
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

    // 根据归档年月筛选文章
    function filterByYearMonth(ym) {
        // 简单做法：把搜索框清空，把分类改为全部，在搜索关键字里加上年月
        // 这里我们直接在列表过滤逻辑中临时处理
        const originalRender = renderPostList;
        const keywordBackup = searchInputEl.value;
        const categoryBackup = categoryFilterEl.value;

        // 暂时用一个“特殊关键字逻辑”来实现
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

        // 恢复筛选条件（只是 UI 恢复，不会马上重新渲染，避免覆盖归档效果）
        searchInputEl.value = keywordBackup;
        categoryFilterEl.value = categoryBackup;
    }

    // 渲染当前文章的留言
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

    // 处理留言提交
    commentFormEl.addEventListener("submit", (event) => {
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
    });

    // 列表中的文章点击（事件委托）
    postListEl.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLButtonElement && target.classList.contains("post-title-button")) {
            const id = parseInt(target.dataset.id, 10);
            openPostDetail(id);
        }
    });

    // 归档点击（事件委托）
    archiveListEl.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLButtonElement && target.dataset.ym) {
            const ym = target.dataset.ym;
            // 回到首页位置
            document.getElementById("home").scrollIntoView({ behavior: "smooth" });
            // 返回列表模式
            if (!postListEl.classList.contains("hidden")) {
                filterByYearMonth(ym);
            } else {
                backToList();
                filterByYearMonth(ym);
            }
        }
    });

    // 返回文章列表按钮
    backToListBtn.addEventListener("click", () => {
        backToList();
    });

    // 搜索与分类筛选事件
    searchInputEl.addEventListener("input", () => {
        if (!postDetailEl.classList.contains("hidden")) {
            backToList();
        }
        renderPostList();
    });

    categoryFilterEl.addEventListener("change", () => {
        if (!postDetailEl.classList.contains("hidden")) {
            backToList();
        }
        renderPostList();
    });

    // 回到顶部按钮
    window.addEventListener("scroll", () => {
        if (window.scrollY > 200) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    });

    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // GitHub / Gitee / 邮箱 跳转逻辑
    if (githubBtn) {
        githubBtn.addEventListener("click", () => {
            window.open("https://github.com/kakuyo1", "_blank");
        });
    }

    if (giteeBtn) {
        giteeBtn.addEventListener("click", () => {
            window.open("https://gitee.com/ye-menga", "_blank");
        });
    }

    if (mailBtn) {
        mailBtn.addEventListener("click", () => {
            // 使用 mailto 跳转到邮箱客户端
            window.location.href = "mailto:wdmzsym@gmail.com";
        });
    }

        /* ================== 点击烟花特效 ================== */
    // 创建覆盖全屏的 canvas
    const fwCanvas = document.createElement("canvas");
    fwCanvas.id = "fireworksCanvas";
    Object.assign(fwCanvas.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none", // 不影响页面原有点击
        zIndex: "999"
    });
    document.body.appendChild(fwCanvas);

    const fwCtx = fwCanvas.getContext("2d");

    function resizeFwCanvas() {
        fwCanvas.width = window.innerWidth;
        fwCanvas.height = window.innerHeight;
    }
    resizeFwCanvas();
    window.addEventListener("resize", resizeFwCanvas);

    // 粒子数组
    const particles = [];

    // 创建一朵烟花
    function createFirework(x, y) {
        const count = 45; // 粒子数量，自己可以调
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
                hue: 200 + Math.random() * 80 // 偏冷色一点，不会太花
            });
        }
    }

    // 动画循环
    function animateFireworks() {
        // 轻微擦除，形成拖尾效果
        fwCtx.globalCompositeOperation = "destination-out";
        fwCtx.fillStyle = "rgba(0, 0, 0, 0.2)";
        fwCtx.fillRect(0, 0, fwCanvas.width, fwCanvas.height);

        fwCtx.globalCompositeOperation = "lighter";

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            // 速度和位置更新
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.03; // 模拟重力
            p.alpha -= p.decay;

            // 消失就移除
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
    animateFireworks();

    // 页面任意位置点击触发烟花
    document.addEventListener("click", (e) => {
        createFirework(e.clientX, e.clientY);
    });

    // 从 posts.json 加载文章
    loadPosts();
});

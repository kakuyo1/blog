// script.js
"use strict";

// 简单的文章数据，你可以根据需要自行增删改内容
const posts = [
    {
        id: 1,
        title: "搭建我的第一个个人博客",
        date: "2025-11-10",
        category: "tech",
        categoryName: "技术",
        excerpt: "记录一下从零开始搭建这个简单博客的过程。",
        content: `
            <p>这是一个示例文章，用来展示博客的基本布局和功能。</p>
            <p>目前整个项目只有三个文件：index.html、style.css 和 script.js。</p>
            <p>你可以在 <code>script.js</code> 中修改文章内容，也可以改成从后端获取数据。</p>
        `
    },
    {
        id: 2,
        title: "安静的一天",
        date: "2025-10-12",
        category: "life",
        categoryName: "生活",
        excerpt: "忙碌的日子里，偶尔也需要一段安静的时间。",
        content: `
            <p>今天没有发生什么特别的事情，只是平静的一天。</p>
            <p>有时候，平淡本身就是一种幸福。</p>
        `
    },
    {
        id: 3,
        title: "写博客对自己的意义",
        date: "2025-09-15",
        category: "note",
        categoryName: "随笔",
        excerpt: "为什么要写博客？其实是写给未来的自己看。",
        content: `
            <p>写博客的过程，也是和自己对话的过程。</p>
            <p>当过一段时间再回来看这些文字，或许会有不一样的感受。</p>
        `
    }
];

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

    // 初始化
    renderPostList();
    renderArchive();
});

/* ============================================================
   CityU 选课助手 · 课程评价中心（reviews.html）
   两个下拉菜单：学院 → 院系 → 该系课程列表；点击课程查看/
   提交云端共享评价。评价数据与 course.html 共用同一张
   Supabase course_reviews 表，单独评价与排课时评价全部收录。
   ============================================================ */
(function () {
  "use strict";

  const MSDS = window.MSDS || {};

  // 复用 shared.js 的国际化（MSDS.t / MSDS.applyLang），避免自建表覆盖全站文本
  function t(key) {
    return typeof MSDS.t === "function" ? MSDS.t(key) : key;
  }

  // 页面级统计
  let stats = { courses: 0, reviews: 0, avg: 0 };

  // 当前院系课程（含名称等元信息）
  let currentCourses = [];

  // ============ 构建 学院 → 院系 → 课程 层级 ============
  // 依据 programmes 中的 college / department 归类课程
  function buildHierarchy(data) {
    const colleges = new Map(); // college -> Map(dept -> [course, ...])
    (data.courses || []).forEach((course) => {
      const seen = new Set();
      (course.programmes || []).forEach((code) => {
        const prog = (data.programmes || []).find((p) => p.code === code);
        if (!prog) return;
        const college = prog.college || "其他学院";
        const dept = prog.department || "其他院系";
        const key = `${college}::${dept}`;
        if (seen.has(key)) return;
        seen.add(key);
        if (!colleges.has(college)) colleges.set(college, new Map());
        const deptMap = colleges.get(college);
        if (!deptMap.has(dept)) deptMap.set(dept, []);
        if (!deptMap.get(dept).some((c) => c.code === course.code)) {
          deptMap.get(dept).push(course);
        }
      });
    });
    return colleges;
  }

  function fillCollegeSelect(colleges) {
    const select = document.getElementById("college-select");
    if (!select) return;
    select.innerHTML = "";
    Array.from(colleges.keys()).sort().forEach((college) => {
      const option = document.createElement("option");
      option.value = college;
      option.textContent = college;
      select.appendChild(option);
    });
  }

  function fillDepartmentSelect(colleges, college) {
    const select = document.getElementById("department-select");
    if (!select) return;
    select.innerHTML = "";
    const deptMap = colleges.get(college);
    if (!deptMap) return;
    Array.from(deptMap.keys()).sort().forEach((dept) => {
      const option = document.createElement("option");
      option.value = dept;
      option.textContent = dept;
      select.appendChild(option);
    });
  }

  // ============ 课程卡片与统计 ============
  // 卡片同时展示：云端评价（平均分/条数）与本地整理的课程评价摘要（verdict 徽章/口碑分）
  function courseCard(course, codeReviews) {
    const rows = codeReviews || [];
    const count = rows.length;
    const avg = count ? rows.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count : 0;
    const rec = course.recommendation && course.recommendation.level !== "unknown"
      ? course.recommendation
      : null;
    // 云端有评价用云端平均分；否则用本地口碑分（3.5 等）
    const displayScore = avg || (rec && MSDS.ratingFor ? MSDS.ratingFor(rec) : null) || 0;
    const stars = displayScore
      ? "★".repeat(Math.round(displayScore)) + "☆".repeat(Math.max(0, 5 - Math.round(displayScore)))
      : "";
    const programmes = (course.programmes || []).join(" · ");
    const verdictBadge = rec && typeof MSDS.recommendationBadge === "function"
      ? MSDS.recommendationBadge(rec, true)
      : "";
    return `
      <article class="reviews-course-card" data-code="${MSDS.escapeHtml(course.code)}">
        <div class="reviews-course-card-head">
          <span class="reviews-course-code">${MSDS.escapeHtml(course.code)}</span>
          <span class="reviews-course-credit">${Number(course.credits) || "—"} 学分</span>
        </div>
        <h3 class="reviews-course-title">${MSDS.escapeHtml(course.programme_title || course.title || course.code)}</h3>
        <div class="reviews-course-meta">
          <span class="reviews-course-avg">${stars ? `${MSDS.escapeHtml(stars)} <b>${displayScore.toFixed(1)}</b>` : '<span class="reviews-course-avg-empty">暂无评分</span>'}</span>
          <span class="reviews-course-count">${count} ${MSDS.escapeHtml(t("reviews.reviews"))}</span>
        </div>
        ${verdictBadge ? `<div class="reviews-course-badges">${verdictBadge}</div>` : ""}
        <p class="reviews-course-programmes">${MSDS.escapeHtml(programmes)}</p>
      </article>`;
  }

  // 本地整理的课程评价摘要（学生经验摘要）：verdict + 口碑星级 + 摘要 + 标签
  function localExperienceBlock(course) {
    const rec = course?.recommendation;
    if (!rec || rec.level === "unknown" || (!rec.summary && !rec.verdict)) return "";
    const rating = typeof MSDS.ratingStars === "function" ? MSDS.ratingStars(rec, { withMeta: false }) : "";
    return `
      <div class="detail-section reviews-local-exp">
        <h3 class="reviews-block-title">${MSDS.escapeHtml(t("reviews.localExp"))}</h3>
        <div class="review-lead ${MSDS.escapeHtml(rec.level)}">
          <strong>${MSDS.escapeHtml(rec.verdict || "")}</strong>
          ${rating || ""}
          ${rec.summary ? `<p>${MSDS.escapeHtml(rec.summary)}</p>` : ""}
          ${rec.tags && rec.tags.length ? `<div class="tag-list detail-tags">${rec.tags.map((tag) => `<span class="tag">${MSDS.escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        </div>
        <p class="reviews-local-hint">${MSDS.escapeHtml(t("reviews.localHint"))}</p>
      </div>`;
  }

  function renderCourseList(courses, groupedReviews) {
    const container = document.getElementById("reviews-course-list");
    const empty = document.getElementById("reviews-course-empty");
    if (!container) return;
    if (!courses.length) {
      empty.hidden = false;
      empty.textContent = t("reviews.empty");
      container.innerHTML = "";
      return;
    }
    empty.hidden = true;
    container.innerHTML = courses
      .slice()
      .sort((a, b) => String(a.code).localeCompare(String(b.code)))
      .map((course) => courseCard(course, groupedReviews[String(course.code)] || []))
      .join("");
    // 绑定点击：展开评价详情
    container.querySelectorAll(".reviews-course-card").forEach((card) => {
      card.addEventListener("click", () => {
        const code = card.getAttribute("data-code");
        openCourseDetail(code);
      });
    });
  }

  // ============ 课程评价详情（复用云端评价能力） ============
  function cloudReviewCard(item) {
    const stars = "★".repeat(Math.max(0, Math.min(5, Number(item.rating) || 0))) + "☆".repeat(Math.max(0, 5 - Math.min(5, Number(item.rating) || 0)));
    const when = new Date(item.created_at).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    const isMine = MSDS.getUserKey && item.user_key === MSDS.getUserKey();
    const isAdmin = MSDS.isAdminLoggedIn && MSDS.isAdminLoggedIn();
    const canDelete = isMine || isAdmin;
    const deleteLabel = isAdmin && !isMine ? "管理员删除" : "删除";
    return `
      <article class="cloud-review-card" data-review-id="${MSDS.escapeHtml(String(item.id))}">
        <div class="cloud-review-head">
          <span class="cloud-review-stars" aria-label="${Number(item.rating)} 星">${stars}</span>
          <span class="cloud-review-score">${Number(item.rating)} 星</span>
          <span class="cloud-review-nickname">${MSDS.escapeHtml(item.nickname || "匿名")}${isMine ? '<span class="cloud-review-mine">我</span>' : ""}</span>
          <span class="cloud-review-time">${MSDS.escapeHtml(when)}</span>
          ${canDelete ? `<button class="cloud-review-delete" type="button" data-delete="${MSDS.escapeHtml(String(item.id))}">${deleteLabel}</button>` : ""}
        </div>
        ${item.comment ? `<p class="cloud-review-comment">${MSDS.escapeHtml(item.comment)}</p>` : '<p class="cloud-review-comment is-empty">（未填写评语）</p>'}
      </article>`;
  }

  function openCourseDetail(code) {
    const section = document.getElementById("reviews-detail");
    const body = document.getElementById("reviews-detail-body");
    if (!section || !body) return;
    section.hidden = false;
    body.innerHTML = `<div class="cloud-reviews-loading">正在加载课程评价…</div>`;
    // 滚动到详情区
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    // 找到课程元信息
    const course = currentCourses.find((c) => String(c.code) === String(code)) || { code, programme_title: code, credits: "" };
    const programmes = (course.programmes || []).join(" · ");

    body.innerHTML = `
      <div class="reviews-detail-head">
        <span class="reviews-course-code">${MSDS.escapeHtml(code)}</span>
        <span class="reviews-course-credit">${Number(course.credits) || "—"} 学分</span>
        <h2 class="reviews-detail-title">${MSDS.escapeHtml(course.programme_title || course.title || code)}</h2>
        ${programmes ? `<p class="reviews-course-programmes">${MSDS.escapeHtml(programmes)}</p>` : ""}
        <a class="text-link" href="course.html?code=${encodeURIComponent(code)}" target="_blank" rel="noopener">查看课程详情与班次 →</a>
      </div>
      ${localExperienceBlock(course)}
      <div class="admin-panel" id="reviews-admin-panel">
        <form class="admin-login-form" id="reviews-admin-login-form">
          <strong class="admin-panel-title">管理员登录</strong>
          <input id="reviews-admin-email" type="email" autocomplete="username" placeholder="管理员邮箱" required>
          <input id="reviews-admin-password" type="password" autocomplete="current-password" placeholder="密码" required>
          <button class="button button-primary button-small" type="submit">登录</button>
          <span class="admin-panel-status" id="reviews-admin-status"></span>
        </form>
        <div class="admin-logged" id="reviews-admin-logged" hidden>
          <strong class="admin-panel-title">管理员模式</strong>
          <span class="admin-panel-email" id="reviews-admin-email-label"></span>
          <button class="button button-quiet button-small" type="button" id="reviews-admin-logout">退出</button>
        </div>
      </div>
      <div class="reviews-review-block">
        <h3 class="reviews-block-title">${MSDS.escapeHtml(t("reviews.reviewTitle"))}</h3>
        <div id="reviews-cloud-reviews" class="cloud-reviews-list">
          <div class="cloud-reviews-loading">正在加载课程评价…</div>
        </div>
      </div>
      <div class="my-review-section">
        <h3 class="reviews-block-title">${MSDS.escapeHtml(t("reviews.myReview"))}</h3>
        <form id="reviews-submit-form" class="my-review-form">
          <div class="star-rating-row">
            <div class="star-rating" id="reviews-star-rating" role="radiogroup" aria-label="评分">
              ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star-btn" data-value="${n}" aria-label="${n} 星">★</button>`).join("")}
            </div>
            <span class="star-rating-hint" id="reviews-rating-hint">点击星星评分</span>
          </div>
          <input id="reviews-nickname" type="text" maxlength="20" placeholder="${MSDS.escapeHtml(t("reviews.nicknamePlaceholder"))}">
          <textarea id="reviews-comment" rows="3" maxlength="500" placeholder="${MSDS.escapeHtml(t("reviews.commentPlaceholder"))}"></textarea>
          <div class="my-review-actions">
            <button class="button button-primary" type="submit" id="reviews-submit-btn">${MSDS.escapeHtml(t("reviews.submit"))}</button>
          </div>
        </form>
      </div>`;

    let selectedRating = 0;
    const ratingBox = document.getElementById("reviews-star-rating");
    const hint = document.getElementById("reviews-rating-hint");
    ratingBox.querySelectorAll(".star-btn").forEach((btn) => {
      const val = Number(btn.getAttribute("data-value"));
      const update = () => {
        ratingBox.querySelectorAll(".star-btn").forEach((b) => {
          b.classList.toggle("is-active", Number(b.getAttribute("data-value")) <= val);
        });
      };
      btn.addEventListener("click", () => {
        selectedRating = val;
        update();
        hint.textContent = `${val} 星`;
      });
      btn.addEventListener("mouseenter", update);
      btn.addEventListener("mouseleave", () => {
        ratingBox.querySelectorAll(".star-btn").forEach((b) => {
          b.classList.toggle("is-active", Number(b.getAttribute("data-value")) <= selectedRating);
        });
      });
    });

    const form = document.getElementById("reviews-submit-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!selectedRating) {
        MSDS.showToast("请先点击星星选择评分");
        return;
      }
      const nickname = document.getElementById("reviews-nickname").value;
      const comment = document.getElementById("reviews-comment").value;
      const btn = document.getElementById("reviews-submit-btn");
      btn.disabled = true;
      btn.textContent = "提交中…";
      try {
        await MSDS.submitCloudReview(code, { rating: selectedRating, comment, nickname });
        MSDS.showToast("评价已同步到云端，感谢分享！");
        openCourseDetail(code);
        refreshStats();
        refreshCourseCards();
      } catch (error) {
        MSDS.showToast(`提交失败：${error.message}`);
        btn.disabled = false;
        btn.textContent = t("reviews.submit");
      }
    });

    // 管理员登录 / 退出
    const panel = document.getElementById("reviews-admin-panel");
    const loginForm = document.getElementById("reviews-admin-login-form");
    const statusEl = document.getElementById("reviews-admin-status");
    const loggedBox = document.getElementById("reviews-admin-logged");
    const emailLabel = document.getElementById("reviews-admin-email-label");
    const logoutBtn = document.getElementById("reviews-admin-logout");

    function updateAdminPanel() {
      const admin = MSDS.currentAdmin ? MSDS.currentAdmin() : null;
      if (admin) {
        loginForm.hidden = true;
        loggedBox.hidden = false;
        emailLabel.textContent = admin.email;
      } else {
        loginForm.hidden = false;
        loggedBox.hidden = true;
        emailLabel.textContent = "";
      }
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const emailInput = document.getElementById("reviews-admin-email");
      const passwordInput = document.getElementById("reviews-admin-password");
      statusEl.textContent = "登录中…";
      statusEl.classList.remove("is-error");
      try {
        const session = await MSDS.adminLogin(emailInput.value, passwordInput.value);
        if (MSDS.adminEmail && session.email !== MSDS.adminEmail()) {
          MSDS.showToast("该账号无管理员权限");
        } else {
          MSDS.showToast("管理员登录成功");
        }
        updateAdminPanel();
        loadCloudDetail();
        passwordInput.value = "";
      } catch (error) {
        statusEl.textContent = error.message;
        statusEl.classList.add("is-error");
      }
    });
    logoutBtn.addEventListener("click", () => {
      MSDS.adminLogout();
      updateAdminPanel();
      loadCloudDetail();
      MSDS.showToast("已退出管理员模式");
    });
    updateAdminPanel();

    // 加载云端评价
    function loadCloudDetail() {
      const container = document.getElementById("reviews-cloud-reviews");
      if (!container) return;
      if (!MSDS.cloudReviewsEnabled()) {
        container.innerHTML = `<div class="notice source-empty">${MSDS.escapeHtml(t("reviews.cloudDisabled"))}</div>`;
        return;
      }
      container.innerHTML = '<div class="cloud-reviews-loading">正在加载课程评价…</div>';
      MSDS.fetchCloudReviews(code, { force: true })
        .then((rows) => {
          if (!rows.length) {
            container.innerHTML = `<div class="notice source-empty">${MSDS.escapeHtml(t("reviews.noReviews"))}</div>`;
            return;
          }
          container.innerHTML = rows.map(cloudReviewCard).join("");
          container.querySelectorAll("[data-delete]").forEach((button) => {
            button.addEventListener("click", async () => {
              const id = button.getAttribute("data-delete");
              if (!id) return;
              const label = MSDS.isAdminLoggedIn() && button.textContent.includes("管理员") ? "删除这条评价" : "删除你提交的这条评价";
              if (!window.confirm(`确定${label}吗？该操作不可恢复。`)) return;
              button.disabled = true;
              button.textContent = "删除中…";
              try {
                await MSDS.deleteCloudReview(code, id);
                MSDS.showToast("评价已删除");
                loadCloudDetail();
                refreshStats();
                refreshCourseCards();
              } catch (error) {
                button.disabled = false;
                button.textContent = label;
                MSDS.showToast(`删除失败：${error.message}`);
              }
            });
          });
        })
        .catch((error) => {
          container.innerHTML = `<div class="notice source-empty">共享评价加载失败：${MSDS.escapeHtml(error.message)}</div>`;
        });
    }
    loadCloudDetail();
  }

  // ============ 统计与卡片刷新 ============
  function refreshCourseCards() {
    const dept = document.getElementById("department-select")?.value;
    if (!dept) return;
    loadDepartment(dept, true);
  }

  function refreshStats() {
    const c = document.getElementById("stat-courses");
    const r = document.getElementById("stat-reviews");
    const a = document.getElementById("stat-avg");
    if (c) c.textContent = stats.courses;
    if (r) r.textContent = stats.reviews;
    if (a) a.textContent = stats.avg ? stats.avg.toFixed(1) : "—";
  }

  // 加载某院系课程列表 + 批量云端评价
  function loadDepartment(dept, force) {
    const courses = currentCourses;
    const container = document.getElementById("reviews-course-list");
    if (!container) return;
    if (!MSDS.cloudReviewsEnabled()) {
      renderCourseList(courses, {});
      return;
    }
    container.innerHTML = `<div class="cloud-reviews-loading">${MSDS.escapeHtml(t("reviews.loading"))}</div>`;
    MSDS.fetchCloudReviewsBatch(courses.map((c) => c.code))
      .then((grouped) => {
        renderCourseList(courses, grouped);
        // 更新评价总数与全站平均分统计
        const all = Object.values(grouped).reduce((s, rows) => s + rows.length, 0);
        const sum = Object.values(grouped).reduce((s, rows) => s + rows.reduce((x, row) => x + (Number(row.rating) || 0), 0), 0);
        stats.reviews = all;
        stats.avg = all ? sum / all : 0;
        refreshStats();
      })
      .catch(() => {
        renderCourseList(courses, {});
      });
  }

  // ============ 初始化 ============
  async function init() {
    // 语言切换由 shared.js 的 initLangToggle 处理（含 applyLang），此处无需重复绑定；
    // 确保已保存的语言设置生效于静态 data-i18n 元素
    if (typeof MSDS.applyLang === "function") {
      MSDS.applyLang();
    }

    try {
      const data = await MSDS.loadCourseData();
      const hierarchy = buildHierarchy(data);
      stats.courses = (data.courses || []).length;
      refreshStats();

      fillCollegeSelect(hierarchy);
      const collegeSelect = document.getElementById("college-select");
      const deptSelect = document.getElementById("department-select");

      if (deptSelect) {
        deptSelect.addEventListener("change", () => {
          const dept = deptSelect.value;
          currentCourses = [];
          const deptMap = hierarchy.get(collegeSelect.value);
          if (deptMap && deptMap.has(dept)) {
            currentCourses = deptMap.get(dept).slice();
          }
          const section = document.getElementById("reviews-detail");
          if (section) section.hidden = true;
          loadDepartment(dept);
        });
      }

      if (collegeSelect && collegeSelect.options.length) {
        collegeSelect.addEventListener("change", () => {
          fillDepartmentSelect(hierarchy, collegeSelect.value);
          if (deptSelect && deptSelect.options.length) {
            deptSelect.dispatchEvent(new Event("change"));
          }
        });
        // 先填充默认学院（首个学院），触发系下拉填充
        fillDepartmentSelect(hierarchy, collegeSelect.value);
        if (deptSelect && deptSelect.options.length) {
          deptSelect.dispatchEvent(new Event("change"));
        }
      }
    } catch (error) {
      const empty = document.getElementById("reviews-course-empty");
      if (empty) {
        empty.hidden = false;
        empty.textContent = `课程数据加载失败：${error.message}`;
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ============================================================
   CityU 课程综合系统 · 登录页（login.html）
   双模式：学生登录（可注册，登录后提交评价）与管理员登录
   （登录后可删除任意云端评价）。登录成功后跳转到来源页面。
   ============================================================ */
(function () {
  "use strict";

  const MSDS = window.MSDS || {};

  function t(key) {
    return typeof MSDS.t === "function" ? MSDS.t(key) : key;
  }

  function showToast(message) {
    if (typeof MSDS.showToast === "function") MSDS.showToast(message);
  }

  // 登录成功后的跳转目标（支持 ?next=xxx 回跳）
  function getNextUrl() {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && /^(course|reviews|index|about|feedback)\.html/.test(next)) {
      return next;
    }
    return "reviews.html";
  }

  function goNext() {
    window.location.href = getNextUrl();
  }

  // ============ Tab 切换：学生 / 管理员 ============
  function initTabs() {
    const tabs = document.querySelectorAll(".login-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((x) => {
          x.classList.remove("is-active");
          x.setAttribute("aria-selected", "false");
        });
        document.querySelectorAll(".login-panel").forEach((p) => p.classList.remove("is-active"));
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        const panel = document.getElementById(`login-panel-${tab.getAttribute("data-login-mode")}`);
        if (panel) panel.classList.add("is-active");
      });
    });
  }

  // ============ 学生：登录 / 注册切换 ============
  function initStudentForm() {
    const form = document.getElementById("student-form");
    const emailInput = document.getElementById("student-email");
    const passwordInput = document.getElementById("student-password");
    const nicknameField = document.getElementById("student-nickname-field");
    const nicknameInput = document.getElementById("student-nickname");
    const submitBtn = document.getElementById("student-submit");
    const statusEl = document.getElementById("student-status");
    const switchBtn = document.getElementById("student-switch");
    const switchHint = document.getElementById("student-switch-hint");

    let mode = "login"; // login | register

    function setStatus(message, isError) {
      statusEl.textContent = message;
      statusEl.classList.toggle("is-error", Boolean(isError));
    }

    function setMode(next) {
      mode = next;
      if (mode === "register") {
        nicknameField.hidden = false;
        submitBtn.textContent = "注 册";
        switchHint.textContent = t("login.hasAccount") || "已有账号？";
        switchBtn.textContent = t("login.toLogin") || "直接登录";
      } else {
        nicknameField.hidden = true;
        submitBtn.textContent = "登 录";
        switchHint.textContent = t("login.noAccount") || "还没有账号？";
        switchBtn.textContent = t("login.toRegister") || "注册新账号";
      }
    }

    switchBtn.addEventListener("click", () => {
      setMode(mode === "login" ? "register" : "login");
      setStatus("", false);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!email || !password) {
        setStatus("请输入邮箱和密码", true);
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "请稍候…";
      try {
        if (mode === "register") {
          const result = await MSDS.studentRegister(email, password, nicknameInput.value.trim());
          if (result.needVerify) {
            setStatus("注册成功！请前往邮箱点击确认链接后再登录。", false);
          } else {
            showToast("注册成功，已自动登录");
            goNext();
          }
        } else {
          await MSDS.studentLogin(email, password);
          showToast("学生登录成功");
          goNext();
        }
      } catch (error) {
        setStatus(error.message, true);
        submitBtn.disabled = false;
        submitBtn.textContent = mode === "register" ? "注 册" : "登 录";
      }
    });

    // 默认显示登录模式
    setMode("login");
  }

  // ============ 管理员登录 ============
  function initAdminForm() {
    const form = document.getElementById("admin-form");
    const emailInput = document.getElementById("admin-email");
    const passwordInput = document.getElementById("admin-password");
    const submitBtn = document.getElementById("admin-submit");
    const statusEl = document.getElementById("admin-status");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!email || !password) {
        statusEl.textContent = "请输入邮箱和密码";
        statusEl.classList.add("is-error");
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "请稍候…";
      statusEl.textContent = "";
      statusEl.classList.remove("is-error");
      try {
        const session = await MSDS.adminLogin(email, password);
        if (MSDS.adminEmail() && session.email !== MSDS.adminEmail()) {
          MSDS.adminLogout();
          throw new Error("该账号无管理员权限");
        }
        showToast("管理员登录成功");
        goNext();
      } catch (error) {
        statusEl.textContent = error.message;
        statusEl.classList.add("is-error");
        submitBtn.disabled = false;
        submitBtn.textContent = "登 录";
      }
    });
  }

  // ============ 初始化 ============
  function init() {
    if (typeof MSDS.applyLang === "function") {
      MSDS.applyLang();
    }
    // 已登录学生/管理员：提示已登录，可前往课程评价
    const student = MSDS.currentStudent ? MSDS.currentStudent() : null;
    const admin = MSDS.currentAdmin ? MSDS.currentAdmin() : null;
    if (student || admin) {
      const hint = document.createElement("p");
      hint.className = "login-session-hint";
      hint.textContent = `当前已登录：${student ? student.email : admin.email}`;
      const card = document.querySelector(".login-card");
      if (card) card.prepend(hint);
    }

    initTabs();
    initStudentForm();
    initAdminForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

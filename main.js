/* =============================================================
   湯氣 -- main.js
   依存ライブラリなし（Vanilla JS）。
   各機能を小さな関数に分け、DOMContentLoaded でまとめて初期化する。
   対象ブラウザ: 最新の Chrome / Edge / Firefox / Safari, iOS Safari, Android Chrome
   ============================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1. モバイルナビの開閉
     - aria-expanded と .is-open を同期
     - リンク選択時・Escキー・幅が広がった時に閉じる
     --------------------------------------------------------- */
  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("primaryNav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!open);
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest(".nav__link")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    window.matchMedia("(min-width: 720px)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* ---------------------------------------------------------
     2. スクロールでヘッダーの背景を濃くする
     - rAF で間引いて処理負荷を抑える
     --------------------------------------------------------- */
  function initHeaderOnScroll() {
    var header = document.getElementById("siteHeader");
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------
     3. スクロールイン表示（[data-reveal]）
     - IntersectionObserver。未対応環境や reduce-motion では即表示
     --------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     4. FAQ アコーディオン
     - 1つ開くと他は閉じる（お好みで外せる仕様）
     - hidden 属性 + aria-expanded で状態を管理
     --------------------------------------------------------- */
  function initFaq() {
    var list = document.getElementById("faqList");
    if (!list) return;

    var buttons = list.querySelectorAll(".faq__question");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var expanded = btn.getAttribute("aria-expanded") === "true";
        var panel = document.getElementById(btn.getAttribute("aria-controls"));

        buttons.forEach(function (other) {
          if (other !== btn) {
            other.setAttribute("aria-expanded", "false");
            var p = document.getElementById(other.getAttribute("aria-controls"));
            if (p) p.hidden = true;
          }
        });

        btn.setAttribute("aria-expanded", String(!expanded));
        if (panel) panel.hidden = expanded;
      });
    });
  }

  /* ---------------------------------------------------------
     5. 予約フォームの簡易バリデーション
     - 送信はしない（サンプルのため preventDefault）
     - 必須・メール形式・日付をチェックし、エラー文を出し分ける
     --------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById("reserveForm");
    if (!form) return;

    var done = document.getElementById("formDone");
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    var rules = {
      name: function (v) {
        if (!v.trim()) return "お名前を入力してください。";
        return "";
      },
      email: function (v) {
        if (!v.trim()) return "メールアドレスを入力してください。";
        if (!emailPattern.test(v.trim())) return "メールアドレスの形式をご確認ください。";
        return "";
      },
      date: function (v) {
        if (!v) return "ご希望日を選択してください。";
        return "";
      }
    };

    function showError(field, message) {
      var input = form.elements[field];
      var box = form.querySelector('[data-error-for="' + field + '"]');
      if (!input || !box) return;
      input.classList.toggle("is-invalid", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
      box.textContent = message;
      box.hidden = !message;
    }

    // 入力し直したらエラー表示を消す
    Object.keys(rules).forEach(function (field) {
      var input = form.elements[field];
      if (input) {
        input.addEventListener("input", function () { showError(field, ""); });
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;

      Object.keys(rules).forEach(function (field) {
        var value = form.elements[field] ? form.elements[field].value : "";
        var message = rules[field](value);
        showError(field, message);
        if (message && !firstInvalid) firstInvalid = form.elements[field];
      });

      if (firstInvalid) {
        firstInvalid.focus();
        if (done) done.hidden = true;
        return;
      }

      form.reset();
      if (done) {
        done.hidden = false;
        done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    });
  }

  /* ---------------------------------------------------------
     6. フッターの西暦を自動更新
     --------------------------------------------------------- */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initHeaderOnScroll();
    initReveal();
    initFaq();
    initForm();
    initYear();
  });
})();

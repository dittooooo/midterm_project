// =============================================================
// 深色模式切換:
// 1. 讀取和儲存使用者的主題設定，不會隨者刷新或退出就變回預設。
// 2. 按下按鈕時會切換主體。
// =============================================================
(() => {
  const KEY = "bs-theme";
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");

  const apply = (mode) => {
    root.setAttribute("data-bs-theme", mode);
    if (icon) {
      if (mode === "dark") {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
      } else {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
      }
    }
  };

  const saved = localStorage.getItem(KEY);
  apply(saved === "dark" ? "dark" : "light");

  if (btn) {
    btn.addEventListener("click", () => {
      const cur = root.getAttribute("data-bs-theme") || "light";
      const next = cur === "dark" ? "light" : "dark";
      apply(next);
      localStorage.setItem(KEY, next);
    });
  }
})();

// ===================================================================
// 註冊和登入系統: 等 HTML 完全載入完後，再開始處理。
// 1. 註冊、登入、登出。
// 2. 註冊後儲存會員資料到 localStorage。
// 3. 表單驗證和顯示密碼強度。
// 4. 註冊送出成功以後倒數3秒自動登入。
// ===================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 變數
  const form = document.getElementById("signupForm");
  const strengthBar = document.querySelector("#passwordStrength .progress-bar");
  const strengthText = document.getElementById("strengthText");
  const submitBtn = document.getElementById("submitBtn");
  const registerView = document.getElementById("registerView");
  const loginView = document.getElementById("loginView");
  const logoutBtn = document.getElementById("logoutBtn");
  const navLoginLink = document.getElementById("navLogin");

  const MEMBER_KEY = "members";
  let currentMemberName = "";

  // Login Modal 相關變數
  const loginModalEl = document.getElementById("loginModal");
  const loginNameInput = document.getElementById("loginName");
  const loginPasswordInput = document.getElementById("loginPassword");
  const loginError = document.getElementById("loginError");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");

  let loginModal = null;
  if (loginModalEl && window.bootstrap && bootstrap.Modal) {
    loginModal = new bootstrap.Modal(loginModalEl);
  }

  // -------------------------------------------------
  // 儲存和讀取會員資料:
  // 1. saveMemberToStorage: 將新註冊的會員加到 members 中。
  // 2. getMemberFromStorage: 回傳所有註冊會員。
  // -------------------------------------------------
  function saveMemberToStorage() {
    const member = {
      fullname: document.getElementById("fullname").value.trim(),
      password: document.getElementById("password").value,
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
    };

    const raw = localStorage.getItem(MEMBER_KEY);
    const list = raw ? JSON.parse(raw) : [];

    list.push(member);

    localStorage.setItem(MEMBER_KEY, JSON.stringify(list));

    return member;
  }

  function getMemberFromStorage() {
    const raw = localStorage.getItem(MEMBER_KEY);
    if (!raw) return [];
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  // -------------------------------------------------
  // 切換註冊和登入畫面:
  // 1. switchView: 處理畫面切換時得過場動畫。
  // 2. showRegisterView: 顯示註冊畫面。
  // 3. showLoginView: 顯示登入畫面，並根據登入的帳號名稱顯示訊息。
  // -------------------------------------------------
  function switchView(showEl, hideEl) {
    if (!showEl || !hideEl) return;

    hideEl.classList.remove("is-active");
    hideEl.classList.add("d-none");

    showEl.classList.remove("d-none");

    showEl.classList.remove("is-active");
    void showEl.offsetWidth;
    showEl.classList.add("is-active");
  }

  function showRegisterView() {
    switchView(registerView, loginView);
  }

  function showLoginView() {
    const mes = document.getElementById("loginMes");
    if (mes) {
      if (currentMemberName) {
        mes.textContent = `${currentMemberName}，歡迎登入！`;
      } else {
        mes.textContent = "已成功登入系統。";
      }
    }

    switchView(loginView, registerView);
  }

  showRegisterView();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      currentMemberName = "";
      showRegisterView();
    });
  }

  // -------------------------------------------------
  // 登入按鈕
  // 1. 點右上角登入會打開 modal，讓使用者輸入姓名密碼。
  // 2. 送出時從已註冊過的帳號中找對應帳號。
  // -------------------------------------------------
  if (navLoginLink && loginModal) {
    navLoginLink.addEventListener("click", (e) => {
      e.preventDefault();

      if (loginError) loginError.classList.add("d-none");
      if (loginNameInput) loginNameInput.value = "";
      if (loginPasswordInput) loginPasswordInput.value = "";

      loginModal.show();
    });
  }

  if (loginSubmitBtn && loginModal) {
    loginSubmitBtn.addEventListener("click", () => {
      const members = getMemberFromStorage();

      const nameInput = loginNameInput.value.trim();
      const pwdInput = loginPasswordInput.value;

      if (!nameInput || !pwdInput) {
        loginError.textContent = "請輸入資料。";
        loginError.classList.remove("d-none");
        return;
      }

      const sameName = members.find((m) => m.fullname === nameInput);
      if (!sameName) {
        loginError.textContent = "目前沒有註冊資料，請先完成註冊。";
        loginError.classList.remove("d-none");
        return;
      }

      if (sameName.password !== pwdInput) {
        loginError.textContent = "姓名或密碼錯誤，請再試一次。";
        loginError.classList.remove("d-none");
        return;
      }

      currentMemberName = sameName.fullname;
      loginError.classList.add("d-none");
      loginModal.hide();
      showLoginView();
    });
  }

  // -------------------------------------------------
  // 表單驗證的狀態（紀錄欄位有沒有被輸入過）
  // -------------------------------------------------
  const validationState = {
    fullname: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    terms: false,
  };

  // -------------------------------------------------
  // 密碼強度:
  // 1. checkPasswordStrength: 根據長度、數字、大小寫、符號計算分數和訊息。
  // 2. updatePasswordStrength: 更新進度條的寬度、顏色和訊息。
  // -------------------------------------------------
  function checkPasswordStrength(password) {
    const hasNumber = /[0-9]/.test(password);
    const hasAlpha = /[A-Za-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    let score = 0;
    if (password.length >= 8) {
      score += 20;
      if (hasNumber || hasAlpha) score += 20;
      if ((hasNumber && hasAlpha) || (hasLower && hasUpper)) score += 20;
      if (hasUpper && hasLower && hasNumber) score += 20;
      if (hasUpper && hasLower && hasNumber && hasSymbol) score += 20;
    }

    let feedback = "";
    if (password.length === 0) feedback = "尚未輸入";
    else if (password.length > 0 && score === 0) {
      feedback = "檢測中...";
    } else {
      if (score === 20) feedback = "非常弱";
      else if (score === 40) feedback = "弱";
      else if (score === 60) feedback = "中等";
      else if (score === 80) feedback = "強";
      else feedback = "非常強";
    }

    return { score, feedback };
  }

  function updatePasswordStrength(password) {
    const { score, feedback } = checkPasswordStrength(password);

    strengthBar.style.width = score + "%";
    strengthBar.className = "progress-bar";

    if (score <= 20) {
      strengthBar.classList.add("bg-danger");
    } else if (score <= 40) {
      strengthBar.classList.add("bg-warning");
    } else if (score <= 60) {
      strengthBar.classList.add("bg-info");
    } else {
      strengthBar.classList.add("bg-success");
    }

    strengthText.textContent = "密碼強度: " + feedback;
  }

  // -------------------------------------------------
  // 表單欄位設定和即時驗證:
  // 1. fields: 處理各個欄位驗證時的規則和錯誤提示。
  // 2. 根據不同欄位去做驗證。
  // -------------------------------------------------
  const fields = {
    fullname: {
      input: document.getElementById("fullname"),
      error: document.getElementById("fullnameError"),
      validate: (value) => {
        if (!value) return "姓名為必填欄位";
        if (value.length < 2) return "姓名至少需要 2 個字";
        if (!/^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(value))
          return "姓名只能包含中文或英文字母";
        return "";
      },
    },
    email: {
      input: document.getElementById("email"),
      error: document.getElementById("emailError"),
      validate: (value) => {
        if (!value) return "Email 為必填欄位";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "請輸入有效的 Email 格式";
        return "";
      },
    },
    phone: {
      input: document.getElementById("phone"),
      error: document.getElementById("phoneError"),
      validate: (value) => {
        if (!value) return "手機號碼為必填欄位";
        if (!/^\d{10}$/.test(value)) return "手機號碼必須是 10 位數字";
        if (!/^09/.test(value)) return "手機號碼必須以 09 開頭";
        return "";
      },
    },
    password: {
      input: document.getElementById("password"),
      error: document.getElementById("passwordError"),
      validate: (value) => {
        if (!value) return "密碼為必填欄位";
        if (value.length < 8) return "密碼至少需要 8 個字元";
        if (!/[A-Za-z]/.test(value)) return "密碼需要包含英文字母";
        if (!/[0-9]/.test(value)) return "密碼需要包含數字";
        return "";
      },
    },
    confirmPassword: {
      input: document.getElementById("confirmPassword"),
      error: document.getElementById("confirmError"),
      validate: (value) => {
        const password = document.getElementById("password").value;
        const passwordField = fields.password;
        const passwordError = passwordField.validate(password);

        if (passwordError) {
          return "請先設定符合格式的密碼";
        }

        if (!value) return "請再次輸入密碼";
        if (value !== password) return "兩次輸入的密碼不相符";
        return "";
      },
    },
    terms: {
      input: document.getElementById("terms"),
      error: document.getElementById("termsError"),
      validate: (value) => {
        if (!value) return "請閱讀並同意服務條款";
        return "";
      },
    },
  };

  Object.keys(fields).forEach((fieldName) => {
    const field = fields[fieldName];

    field.input.addEventListener("blur", () => {
      validationState[fieldName] = true;
      validateField(fieldName);
    });

    if (fieldName === "confirmPassword") {
      field.input.addEventListener("input", () => {
        if (validationState[fieldName]) {
          validateField(fieldName);
        }
      });
    }

    if (fieldName === "password") {
      field.input.addEventListener("input", () => {
        updatePasswordStrength(field.input.value);

        if (
          validationState["confirmPassword"] &&
          fields.confirmPassword.input.value
        ) {
          validateField("confirmPassword");
        }
      });
    }

    if (field.input.type === "checkbox") {
      field.input.addEventListener("change", () => {
        validationState[fieldName] = true;
        validateField(fieldName);
      });
    }
  });

  // -------------------------------------------------
  // 單一欄位驗證與全部欄位驗證:
  // 1. validateField: 根據對應的規則去檢查欄位，標示是否通過。
  // 2. validateAllFields: 點擊送出時將沒驗證過的全部驗證一遍。
  // -------------------------------------------------
  function validateField(fieldName) {
    const field = fields[fieldName];
    const value =
      field.input.type === "checkbox" ? field.input.checked : field.input.value;
    const errorMessage = field.validate(value);

    if (errorMessage) {
      field.input.classList.add("is-invalid");
      field.input.classList.remove("is-valid");
      field.error.textContent = errorMessage;
      return false;
    } else {
      field.input.classList.add("is-valid");
      field.input.classList.remove("is-invalid");
      field.error.textContent = "\u00A0";
      return true;
    }
  }

  function validateAllFields() {
    let isValid = true;

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const inputEl = field.input;

      validationState[fieldName] = true;

      const alreadyValid = inputEl.classList.contains("is-valid");
      if (alreadyValid) {
        return;
      }

      if (!validateField(fieldName)) {
        isValid = false;
      }
    });

    return isValid;
  }

  // -------------------------------------------------
  // 表單送出流程（註冊 -> 模擬處理中 -> 倒數自動登入):
  // 1. 先做驗證，姓名是否已經註冊過了，或是有驗證失敗的就立刻停止。
  // 2. 通過後顯示處理中，讓送出按鈕不能被點擊，防止重複送出，再去儲存會員資訊。
  // 3. 顯示註冊成功後倒數3秒，自動切換到登入畫面。
  // -------------------------------------------------
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const busyMsg = document.getElementById("busyMsg");
    submitBtn.disabled = true;
    busyMsg.style.display = "block";

    const isValid = validateAllFields();

    if (!isValid) {
      busyMsg.style.display = "none";
      submitBtn.disabled = false;
      return;
    }

    const members = getMemberFromStorage();
    const fullnameValue = document.getElementById("fullname").value.trim();
    const duplicated = members.find((m) => m.fullname === fullnameValue);

    if (duplicated) {
      const fullnameField = fields.fullname;

      fullnameField.input.classList.add("is-invalid");
      fullnameField.input.classList.remove("is-valid");
      fullnameField.error.textContent =
        "此姓名已註冊，請直接登入或使用其他姓名";

      busyMsg.style.display = "none";
      submitBtn.disabled = false;
      return;
    }

    setTimeout(() => {
      busyMsg.style.display = "none";
      const newMember = saveMemberToStorage();
      currentMemberName = newMember.fullname;

      clearForm();

      const result = document.getElementById("result");
      const resultText = result.querySelector("p");

      let countdown = 3;

      resultText.textContent = `註冊成功！${countdown} 秒後自動登入…`;
      result.classList.remove("d-none");

      const timer = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          resultText.textContent = `註冊成功！${countdown} 秒後自動登入…`;
        } else {
          clearInterval(timer);
          result.classList.add("d-none");
          submitBtn.disabled = false;
          showLoginView();
        }
      }, 1000);
    }, 1000);
  });

  // -------------------------------------------------
  // 重置整個表單:
  // 註冊成功後，將所有欄位、驗證提示和密碼強度清空。
  // -------------------------------------------------
  function clearForm() {
    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      if (field.input.type === "checkbox") {
        field.input.checked = false;
      } else {
        field.input.value = "";
      }
      field.input.classList.remove("is-valid");
      field.error.textContent = "\u00A0";
    });

    strengthBar.style.width = 0;
    strengthText.textContent = "尚未輸入";

    Object.keys(validationState).forEach((field) => {
      validationState[field] = false;
    });
  }
});

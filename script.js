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

  // 1) 預設 light；若有使用者設定就以設定為準
  const saved = localStorage.getItem(KEY);
  apply(saved === "dark" ? "dark" : "light");

  // 2) 切換
  if (btn) {
    btn.addEventListener("click", () => {
      const cur = root.getAttribute("data-bs-theme") || "light";
      const next = cur === "dark" ? "light" : "dark";
      apply(next);
      localStorage.setItem(KEY, next);
    });
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const strengthBar = document.querySelector("#passwordStrength .progress-bar");
  const strengthText = document.getElementById("strengthText");
  const submitBtn = document.getElementById("submitBtn");
  const registerView = document.getElementById("registerView");
  const loginView = document.getElementById("loginView");
  const logoutBtn = document.getElementById("logoutBtn");

  function showRegisterView() {
    if (registerView && loginView) {
      registerView.classList.remove("d-none");
      loginView.classList.add("d-none");
    }
  }

  function showLoginView() {
    if (registerView && loginView) {
      registerView.classList.add("d-none");
      loginView.classList.remove("d-none");
    }
  }

  showRegisterView();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      showRegisterView();
    });
  }

  // 驗證功能
  const validationState = {
    fullname: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    terms: false,
  };
  // 密碼強度檢查函數
  function checkPasswordStrength(password) {
    const hasNumber = /[0-9]/.test(password);
    const hasAlpha = /[A-Za-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    let score = 0; // 以 20 為單位，最多 80
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

  // 更新密碼強度顯示
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

        // 如果密碼欄位無效，確認密碼也要顯示錯誤
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

  // 即時驗證：當離開輸入框或輸入時進行驗證
  Object.keys(fields).forEach((fieldName) => {
    const field = fields[fieldName];

    // 當離開輸入框時驗證
    field.input.addEventListener("blur", () => {
      validationState[fieldName] = true; // 標記此欄位已被驗證過
      validateField(fieldName);
    });

    // 特殊欄位的即時驗證
    if (fieldName === "confirmPassword") {
      field.input.addEventListener("input", () => {
        if (validationState[fieldName]) {
          // 只有在曾經驗證過才即時驗證
          validateField(fieldName);
        }
      });
    }

    // 密碼變更時重新驗證確認密碼
    if (fieldName === "password") {
      field.input.addEventListener("input", () => {
        // 更新密碼強度指示器
        updatePasswordStrength(field.input.value);

        // 重新驗證確認密碼

        if (
          validationState["confirmPassword"] &&
          fields.confirmPassword.input.value
        ) {
          validateField("confirmPassword");
        }
      });
    }

    // 對於 checkbox，改變時就要驗證
    if (field.input.type === "checkbox") {
      field.input.addEventListener("change", () => {
        validationState[fieldName] = true;
        validateField(fieldName);
      });
    }
  });

  // 單一欄位驗證
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

  // 驗證所有欄位並返回是否全部有效
  function validateAllFields() {
    let isValid = true;
    Object.keys(fields).forEach((fieldName) => {
      validationState[fieldName] = true;
      if (!validateField(fieldName)) {
        isValid = false;
      }
    });
    return isValid;
  }

  // 表單提交時驗證所有欄位
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

    // 模擬送出
    setTimeout(() => {
      busyMsg.style.display = "none";

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

  // 重設所有驗證狀態
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

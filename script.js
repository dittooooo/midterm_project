document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const submitBtn = document.getElementById("submitBtn");

  // 追蹤每個欄位是否已經被驗證過
  const validationState = {
    fullname: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    terms: false,
  };

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
        if (!/[a-z]/.test(value)) return "密碼需要包含英文字母";
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
      field.error.textContent = "";
      return true;
    }
  }

  // 驗證所有欄位並返回是否全部有效
  function validateAllFields() {
    let isValid = true;
    Object.keys(fields).forEach((fieldName) => {
      validationState[fieldName] = true; // 標記所有欄位為已驗證
      if (!validateField(fieldName)) {
        isValid = false;
      }
    });
    return isValid;
  }

  // 表單提交時驗證所有欄位
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // 停用提交按鈕，避免重複提交
    submitBtn.disabled = true;

    // 顯示處理中訊息
    const busyMsg = document.getElementById("busyMsg");
    busyMsg.style.display = "block";

    // 驗證所有欄位
    const isValid = validateAllFields();

    if (isValid) {
      // 模擬表單提交
      setTimeout(() => {
        document.getElementById("result").classList.remove("d-none");
        document.getElementById("result").textContent = "註冊成功！";
        busyMsg.style.display = "none";
        submitBtn.disabled = false;
      }, 1000);
    } else {
      // 立即重新啟用按鈕和隱藏處理中訊息
      busyMsg.style.display = "none";
      submitBtn.disabled = false;
    }
  });
});

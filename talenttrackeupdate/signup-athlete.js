import {
  registerUser,
  logoutUser
} from "./register.js";
import { showLoading, hideLoading, showSuccessModal } from "./ui-utils.js";
import { getTranslation } from "./i18n.js";

const form = document.getElementById("signupForm");
const errorText = document.getElementById("signupError");

function showError(message) {
  if (errorText) {
    errorText.textContent = message;
    errorText.classList.remove("hidden");
  } else {
    alert(message);
  }
}

function clearError() {
  if (errorText) {
    errorText.textContent = "";
    errorText.classList.add("hidden");
  }
}

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    const openPaths = togglePassword.querySelectorAll(".eye-open");
    const closedPath = togglePassword.querySelector(".eye-closed");
    if (type === "text") {
      openPaths.forEach(p => p.classList.add("hidden"));
      closedPath.classList.remove("hidden");
    } else {
      openPaths.forEach(p => p.classList.remove("hidden"));
      closedPath.classList.add("hidden");
    }
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const phone = document.getElementById("phone").value.trim();

  if (!username || !password || !phone) {
    showError(getTranslation("signup_err_missing_fields") || "Username, Phone, and Password are required.");
    return;
  }

  // Sri Lankan Phone Validation: Supports 07... , +947... , 947... , 7...
  const slPhoneRegex = /^(?:0|94|\+94)?7[01245678]\d{7}$/;
  if (!slPhoneRegex.test(phone)) {
    showError(getTranslation("signup_err_phone_invalid_sl") || "Please enter a valid Sri Lankan mobile number (e.g., 0771234567).");
    return;
  }

  if (username.length < 4) {
    showError(getTranslation("signup_err_username_len") || "Username must be at least 4 characters.");
    return;
  }
  // Simplifed Password Requirement: Only 8+ characters
  if (password.length < 8) {
    showError(getTranslation("signup_err_password_len") || "Password must be at least 8 characters long.");
    return;
  }

  try {
    showLoading();
    // Pass email as is (optional, might be empty string)
    await registerUser(email, password, username, "athlete", phone);
    await logoutUser();

    showSuccessModal(getTranslation("signup_msg_success") || "Account created successfully! Please login.", () => {
      window.location.href = "index.html";
    });

  } catch (err) {
    console.error(err);
    showError(err.message || getTranslation("signup_err_failed") || "Registration failed.");
  } finally {
    hideLoading();
  }
});



// ===============================
// IMPORT FIREBASE SERVICES
// ===============================
import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// GLOBAL STATE
// ===============================
let currentUserType = "user"; // user | admin
let currentAuthForm = "signin";

// ===============================
// SCROLL TO AUTH SECTION
// ===============================
window.scrollToAuth = function (formType) {
  const authSection = document.getElementById("authSection");
  if (!authSection) return;

  const offset = 100;
  const position =
    authSection.getBoundingClientRect().top +
    window.pageYOffset -
    offset;

  window.scrollTo({
    top: position,
    behavior: "smooth",
  });

  setTimeout(() => {
    window.switchAuthTab(formType);
  }, 500);
};

// ===============================
// SWITCH SIGNIN / SIGNUP
// ===============================
window.switchAuthTab = function (tab) {
  currentAuthForm = tab;

  document
    .querySelectorAll(".auth-tab")
    .forEach((t) => t.classList.remove("active"));

  if (tab === "signin") {
    document.querySelector(".auth-tab.signin")?.classList.add("active");
    document.getElementById("signInForm")?.classList.add("active");
    document.getElementById("signUpForm")?.classList.remove("active");
  } else {
    document.querySelector(".auth-tab.signup")?.classList.add("active");
    document.getElementById("signUpForm")?.classList.add("active");
    document.getElementById("signInForm")?.classList.remove("active");
  }

  clearAlert("signin");
  clearAlert("signup");
};

// ===============================
// USER / ADMIN TOGGLE
// ===============================
window.selectUserType = function (formType, userType) {
  currentUserType = userType;

  const prefix = formType === "signin" ? "#signInForm" : "#signUpForm";
  document
    .querySelectorAll(`${prefix} .toggle-option`)
    .forEach((opt) => {
      opt.classList.remove("active");
      if (opt.dataset.type === userType) opt.classList.add("active");
    });

  if (formType === "signup") {
    const collegeField = document.getElementById("college-field");
    const collegeInput = document.getElementById("signup-college");

    if (!collegeField || !collegeInput) return;

    if (userType === "admin") {
      collegeField.style.display = "none";
      collegeInput.removeAttribute("required");
      collegeInput.value = "";
    } else {
      collegeField.style.display = "block";
      collegeInput.setAttribute("required", "true");
    }
  }
};

// ===============================
// TOGGLE PASSWORD VISIBILITY  ✅ FIXED
// ===============================
window.togglePassword = function (inputId, toggleElement) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const icon = toggleElement.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon?.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";
    icon?.classList.replace("fa-eye-slash", "fa-eye");
  }
};

// ===============================
// ALERT HELPERS
// ===============================
function showAlert(type, message, kind) {
  const box = document.getElementById(`${type}-alert`);
  if (!box) return;

  box.innerHTML = `
    <div class="alert ${kind}">
      ${message}
    </div>
  `;
}

function clearAlert(type) {
  const box = document.getElementById(`${type}-alert`);
  if (box) box.innerHTML = "";
}

// ===============================
// SIGN IN
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");

  if (signInForm) {
    signInForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert("signin");

      const email = document.getElementById("signin-email")?.value.trim();
      const password = document.getElementById("signin-password")?.value;

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          await signOut(auth);
          throw new Error("User record not found");
        }

        const data = snap.data();

        if (data.userType !== currentUserType) {
          await signOut(auth);
          throw new Error(`Account is registered as ${data.userType}`);
        }

        sessionStorage.setItem(
          "currentUser",
          JSON.stringify({
            uid: user.uid,
            name: data.name,
            email: data.email,
            userType: data.userType,
          })
        );

        showAlert("signin", "Login successful. Redirecting...", "success");

        setTimeout(() => {
          window.location.href =
            data.userType === "admin"
              ? "admin-dashboard.html"
              : "user-dashboard.html";
        }, 1200);
      } catch (err) {
        showAlert("signin", err.message, "error");
        console.error(err);
      }
    });
  }

  // ===============================
  // SIGN UP
  // ===============================
  if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert("signup");

      const name = document.getElementById("signup-name")?.value.trim();
      const phone = document.getElementById("signup-phone")?.value.trim();
      const email = document.getElementById("signup-email")?.value.trim();
      const password = document.getElementById("signup-password")?.value;
      const confirm =
        document.getElementById("signup-confirm-password")?.value;

      const college =
        currentUserType === "user"
          ? document.getElementById("signup-college")?.value.trim()
          : "";

      if (password !== confirm) {
        showAlert("signup", "Passwords do not match", "error");
        return;
      }

      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await updateProfile(cred.user, { displayName: name });

        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          name,
          email,
          phone,
          college,
          userType: currentUserType,
          createdAt: serverTimestamp(),
        });

        sessionStorage.setItem(
          "currentUser",
          JSON.stringify({
            uid: cred.user.uid,
            name,
            email,
            userType: currentUserType,
          })
        );

        showAlert("signup", "Account created successfully", "success");

        setTimeout(() => {
          window.location.href =
            currentUserType === "admin"
              ? "admin-dashboard.html"
              : "user-dashboard.html";
        }, 1200);
      } catch (err) {
        showAlert("signup", err.message, "error");
        console.error(err);
      }
    });
  }

  // ===============================
  // DEFAULT STATE
  // ===============================
  window.selectUserType("signin", "user");
  window.selectUserType("signup", "user");
});

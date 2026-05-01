const USERS_STORAGE_KEY = "craveCultureUsers";
const CURRENT_USER_KEY = "craveCultureCurrentUser";

const loginForm = document.getElementById("userLoginForm");
const signupForm = document.getElementById("userSignupForm");
const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");
const showLoginBtn = document.getElementById("showLoginBtn");
const showSignupBtn = document.getElementById("showSignupBtn");

function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    return Array.isArray(users) ? users : [];
  } catch (_error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function setMessage(el, text, type = "neutral") {
  if (!el) return;
  el.textContent = text;
  if (type === "success") {
    el.style.color = "green";
  } else if (type === "error") {
    el.style.color = "red";
  } else {
    el.style.color = "#555";
  }
}

function toggleMode(mode) {
  const showLogin = mode === "login";

  if (loginForm) {
    loginForm.classList.toggle("hidden", !showLogin);
  }
  if (signupForm) {
    signupForm.classList.toggle("hidden", showLogin);
  }

  if (showLoginBtn) {
    showLoginBtn.classList.toggle("active", showLogin);
  }
  if (showSignupBtn) {
    showSignupBtn.classList.toggle("active", !showLogin);
  }
}

if (showLoginBtn) {
  showLoginBtn.addEventListener("click", () => toggleMode("login"));
}
if (showSignupBtn) {
  showSignupBtn.addEventListener("click", () => toggleMode("signup"));
}

if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirmPassword").value;

    if (!name || !email || !password || !confirmPassword) {
      setMessage(signupMessage, "Please complete all fields.", "error");
      return;
    }

    if (password.length < 6) {
      setMessage(signupMessage, "Password must be at least 6 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage(signupMessage, "Passwords do not match.", "error");
      return;
    }

    const users = getUsers();
    const exists = users.some((user) => user.email === email);
    if (exists) {
      setMessage(signupMessage, "Email already exists. Login instead.", "error");
      return;
    }

    users.push({
      id: Date.now(),
      name,
      email,
      password
    });
    saveUsers(users);

    setMessage(signupMessage, "Account created. You can login now.", "success");
    signupForm.reset();
    toggleMode("login");
    setMessage(loginMessage, "Signup successful. Please login.", "success");
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      setMessage(loginMessage, "Email and password are required.", "error");
      return;
    }

    const users = getUsers();
    const user = users.find((item) => item.email === email && item.password === password);

    if (!user) {
      setMessage(loginMessage, "Invalid email or password.", "error");
      return;
    }

    setCurrentUser({
      id: user.id,
      name: user.name,
      email: user.email,
      loggedInAt: Date.now()
    });

    setMessage(loginMessage, "Login successful. Redirecting...", "success");

    setTimeout(() => {
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      window.location.href = redirect || "index.html";
    }, 700);
  });
}

const API_BASE_URL =
  globalThis.CRAVE_CULTURE_API_BASE_URL ||
  "https://crave-culture.onrender.com/api";

const loginForm = document.getElementById("adminLoginForm");
const loginMessage = document.getElementById("adminLoginMessage");

function setMessage(element, message, type = "neutral") {
  if (!element) {
    return;
  }

  element.textContent = message;

  if (type === "success") {
    element.style.color = "green";
  } else if (type === "error") {
    element.style.color = "red";
  } else {
    element.style.color = "#555";
  }
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text || !text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    if (!email || !password) {
      setMessage(loginMessage, "Email and password are required.", "error");
      return;
    }

    setMessage(loginMessage, "Logging in...");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        setMessage(loginMessage, data.message || "Login failed.", "error");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("craveCultureToken", data.token);

      setMessage(loginMessage, "Login successful. Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 800);
    } catch (error) {
      console.error(error);
      setMessage(
        loginMessage,
        "Cannot connect to backend. Make sure backend is running.",
        "error"
      );
    }
  });
}
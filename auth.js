// Login logic moved from login.html
const VALID_USER = "admin";
const VALID_PASS = "admin@123";

function login() {
  const u = document.getElementById("username")?.value.trim() || "";
  const p = document.getElementById("password")?.value.trim() || "";
  const errorBox = document.getElementById("error");

  if (!errorBox) return;
  errorBox.style.display = "none";

  if (u === "" || p === "") {
    errorBox.innerText = "Please enter username and password";
    errorBox.style.display = "block";
    return;
  }

  if (u === VALID_USER && p === VALID_PASS) {
    window.location.href = "dashboard.html";
  } else {
    errorBox.innerText = "Invalid username or password";
    errorBox.style.display = "block";
    errorBox.style.animation = "shake 0.3s";

    setTimeout(() => {
      errorBox.style.animation = "";
    }, 300);
  }
}

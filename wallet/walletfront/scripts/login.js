const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();      // ✅ FIX
  const password = passwordInput.value.trim(); // ✅ FIX

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const res = await fetch("https://remj82.onrender.com/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    //  Save token
    localStorage.setItem("token", data.token);

    // Redirect to wallet
    window.location.href = "./wallet.html";

  } catch (err) {
    console.error(err);
    alert("Something went wrong. Try again.");
  }
});

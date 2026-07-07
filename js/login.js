const API_BASE = "http://localhost:5144/api";

document.addEventListener("DOMContentLoaded", () => {
  verificarLoginSalvo();
  exibirMensagemLogout();
  configurarLogin();
  configurarToggleSenha();
});

function configurarLogin() {
  const loginForm = document.getElementById("loginForm");
  const errorEl =
    document.getElementById("loginError") ||
    document.getElementById("loginErro");

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userInput = document.getElementById("loginUser");
    const passInput = document.getElementById("loginPass");

    const user = userInput ? userInput.value.trim() : "";
    const pass = passInput ? passInput.value.trim() : "";

    if (errorEl) {
      errorEl.textContent = "";
    }

    if (!user || !pass) {
      if (errorEl) {
        errorEl.textContent = "Preencha usuário e senha.";
      }
      return;
    }

    try {
      const data = await realizarLogin(user, pass);

      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", data.usuario || user);
      localStorage.setItem("logado", "true");

      window.location.href = "./html/app.html";
    } catch (error) {
      console.error("Erro no login:", error);

      if (errorEl) {
        errorEl.textContent = "Usuário ou senha inválidos.";
      }
    }
  });
}

async function realizarLogin(user, pass) {
  const response = await fetch(`${API_BASE}/Auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Email: user,
      Senha: pass,
    }),
  });

  if (!response.ok) {
    throw new Error("Usuário ou senha inválidos");
  }

  return await response.json();
}

function verificarLoginSalvo() {
  const token = localStorage.getItem("token");

  if (token) {
    window.location.href = "./html/app.html";
  }
}

function exibirMensagemLogout() {
  const mensagemLogout = localStorage.getItem("logoutMessage");
  const errorEl =
    document.getElementById("loginError") ||
    document.getElementById("loginErro");

  if (mensagemLogout && errorEl) {
    errorEl.textContent = mensagemLogout;
    localStorage.removeItem("logoutMessage");
  }
}

function configurarToggleSenha() {
  const toggleSenha = document.getElementById("toggleSenha");
  const senhaInput = document.getElementById("loginPass");

  if (!toggleSenha || !senhaInput) return;

  toggleSenha.addEventListener("click", () => {
    const mostrando = senhaInput.type === "text";

    senhaInput.type = mostrando ? "password" : "text";

    toggleSenha.innerHTML = mostrando
      ? '<i class="fa-solid fa-eye"></i>'
      : '<i class="fa-solid fa-eye-slash"></i>';

    toggleSenha.setAttribute(
      "aria-label",
      mostrando ? "Mostrar senha" : "Ocultar senha",
    );
  });
}

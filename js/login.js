document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = document.getElementById("loginUser").value;

  const senha = document.getElementById("loginPass").value;

  const erro = document.getElementById("loginError");

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Email: usuario,
        Senha: senha,
      }),
    });

    if (!response.ok) {
      erro.textContent = "Usuário ou senha inválidos";
      return;
    }

    const data = await response.json();

    // salva token
    localStorage.setItem("token", data.token);

    // salva usuário
    localStorage.setItem("usuario", data.usuario);

    // salva status login
    localStorage.setItem("logado", "true");

    // esconde login
    document.getElementById("loginPage").style.display = "none";

    // mostra sistema
    document.getElementById("app").style.display = "block";

    erro.textContent = "";
  } catch (error) {
    console.error("Erro no login:", error);

    erro.textContent = "Erro ao conectar com servidor";
  }
});

// VERIFICAR SESSÃO
window.addEventListener("load", () => {
  const logado = localStorage.getItem("logado");

  if (logado === "true") {
    document.getElementById("loginPage").style.display = "none";

    document.getElementById("app").style.display = "block";
  }
});

//botão sair
document.getElementById("sairButton").addEventListener("click", () => {
  localStorage.removeItem("logado");

  document.getElementById("app").style.display = "none";

  document.getElementById("loginPage").style.display = "flex";

  document.getElementById("loginForm").reset();
});

// =========================
// INICIAR
// =========================

document.addEventListener("DOMContentLoaded", () => {
  verificarLoginSalvo();
});

// =========================
// LOGIN JWT
// =========================

async function realizarLogin(user, pass) {
  const response = await fetch("http://localhost:5000/api/Auth/login", {
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

// =========================
// LOGIN FORM
// =========================

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = document.getElementById("loginUser").value;

  const pass = document.getElementById("loginPass").value;

  try {
    const data = await realizarLogin(user, pass);

    localStorage.setItem("token", data.token);

    localStorage.setItem("logado", "true");

    mostrarSistema();
  } catch (error) {
    document.getElementById("loginError").textContent =
      "Usuário ou senha inválidos";
  }
});

// =========================
// LOGIN
// =========================

function verificarLoginSalvo() {
  const token = localStorage.getItem("token");

  if (token) {
    mostrarSistema();
  } else {
    mostrarLogin();
  }
}

function mostrarSistema() {
  document.getElementById("loginPage").classList.remove("active");

  document.getElementById("app").style.display = "block";

  if (!window.gerenciador) {
    window.gerenciador = new GerenciadorEquipamentos();
  }
}

function mostrarLogin() {
  document.getElementById("loginPage").classList.add("active");

  document.getElementById("app").style.display = "none";
}

// =========================
// LOGOUT
// =========================

function logout() {
  localStorage.removeItem("token");

  localStorage.removeItem("logado");

  location.reload();
}

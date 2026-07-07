let timeoutInatividade;

document.addEventListener("DOMContentLoaded", () => {
  protegerRota();
  configurarLogout();
  iniciarControleInatividade();

  if (!window.gerenciador) {
    window.gerenciador = new GerenciadorEquipamentos();
  }
});

function protegerRota() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "../index.html";
  }
}

function configurarLogout() {
  const sairButton = document.getElementById("sairButton");

  if (!sairButton) return;

  sairButton.addEventListener("click", () => {
    logout("Logout realizado com sucesso.");
  });
}

function logout(mensagem = "") {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  localStorage.removeItem("logado");

  if (mensagem) {
    localStorage.setItem("logoutMessage", mensagem);
  }

  window.location.href = "../index.html";
}

function iniciarControleInatividade() {
  resetarTimerInatividade();

  const eventos = [
    "mousemove",
    "mousedown",
    "keypress",
    "scroll",
    "touchstart",
  ];

  eventos.forEach((evento) => {
    document.addEventListener(evento, resetarTimerInatividade);
  });
}

function resetarTimerInatividade() {
  clearTimeout(timeoutInatividade);

  timeoutInatividade = setTimeout(
    () => {
      logout("Sessão encerrada por inatividade.");
    },
    5 * 60 * 1000,
  ); // 5 minutos
}

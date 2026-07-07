// Sistema de Gerenciamento de Equipamentos TI
class GerenciadorEquipamentos {
  constructor() {
    this.apiUrl = "http://localhost:5000/api";
    this.equipamentos = [];
    this.currentSort = { column: null, direction: "asc" };
    this.init();
  }

  // =========================
  // INIT
  // =========================

  async init() {
    this.bindEvents();

    try {
      await this.carregarEquipamentos();
      this.atualizarDashboard();
      this.renderListagem();

    } catch (error) {
      console.error(error);
      this.mostrarToast("Erro ao carregar equipamentos", "error");
    }
  }

  // =========================
  // TOKEN
  // =========================

  getToken() {
    return localStorage.getItem("token");
  }

  // =========================
  // API REQUEST
  // =========================

  async apiRequest(endpoint, options = {}) {
    const token = this.getToken();

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...options,
    };

    const response = await fetch(`${this.apiUrl}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  }

  // =========================
  // CARREGAR EQUIPAMENTOS
  // =========================

  async carregarEquipamentos() {
    try {
      this.equipamentos = await this.apiRequest("/Equipamentos");
      this.equipamentos = this.equipamentos.map((e) => ({
        id: e.id || e.Id,
        tag: e.tag || e.Tag,
        tipo: e.tipo || e.Tipo,
        setor: e.setor || e.Setor,
        usuario: e.usuario || e.Usuario || "",
        dataChegada: e.dataChegada || e.DataChegada || "",
        modelo: e.modelo || e.Modelo || "",
        geracao: e.geracao || e.Geracao || "",
        valorAluguel: e.valorAluguel || e.ValorAluguel || 0,
        ativo: e.ativo !== undefined ? e.ativo : e.Ativo,
      }));
    } catch (error) {
      console.error(error);
      this.mostrarToast("Erro ao carregar equipamentos", "error");
    }
  }

  // =========================
  // BUSCAR POR TAG
  // =========================

  buscarEquipamentoPorTag(tag) {
    return this.equipamentos.find((e) => e.tag.toString() === tag.toString());
  }

  // =========================
  // BUSCANDO
  // =========================

  mostrarBuscando() {
    const el = document.getElementById("buscandoIndicator");
    if (el) el.style.display = "block";
  }

  esconderBuscando() {
    const el = document.getElementById("buscandoIndicator");
    if (el) el.style.display = "none";
  }

  // =========================
  // EVENTOS
  // =========================

  bindEvents() {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.mudarPagina(e.currentTarget.dataset.page)
      );
    });

    document
      .getElementById("exportCSV")
      .addEventListener("click", () => this.exportarCSV());

    document
      .getElementById("exportJSON")
      .addEventListener("click", () => this.exportarJSON());

    document
      .getElementById("equipamentoForm")
      .addEventListener("submit", (e) => this.salvarEquipamento(e));

    document.getElementById("openImportModal").addEventListener("click", () => {
      document.getElementById("importModal").classList.add("active");
    });

    document
      .getElementById("closeImportModal")
      .addEventListener("click", () => {
        this.fecharModal("importModal");
      });

    document.getElementById("importModal").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        this.fecharModal("importModal");
      }
    });

    document.getElementById("selectFileBtn").addEventListener("click", () => {
      document.getElementById("fileInput").click();
    });

    document.getElementById("fileInput").addEventListener("change", (e) => {
      this.handleImportFile(e);
    });

    document.getElementById("clearPreview").addEventListener("click", () => {
      this.limparPreview();
    });

    document.getElementById("confirmImport").addEventListener("click", () => {
      this.confirmarImportacao();
    });

    document
      .getElementById("equipamentoForm")
      .addEventListener("reset", () => this.limparErros());

    document
      .getElementById("searchTag")
      .addEventListener("input", () => this.renderListagem());

    document
      .getElementById("searchUsuario")
      .addEventListener("input", () => this.renderListagem());

    document
      .getElementById("searchSetor")
      .addEventListener("change", () => this.renderListagem());

    document
      .getElementById("clearFilters")
      .addEventListener("click", () => this.limparFiltros());

    document
      .querySelectorAll("#equipamentosTable th[data-sort]")
      .forEach((th) => {
        th.addEventListener("click", (e) =>
          this.ordenarTabela(e.currentTarget.dataset.sort),
        );
      });

    document.getElementById("tableBody").addEventListener("click", (e) => {
      const btnHistorico = e.target.closest(".btn-historico");
      const btnEdit = e.target.closest(".btn-edit");

      if (btnHistorico) {
        const id = btnHistorico.dataset.id;
        this.mostrarHistorico(id);
      }

      if (btnEdit) {
        const id = btnEdit.dataset.id;
        this.editarEquipamento(id);
      }
    });

    document.getElementById("sairButton").addEventListener("click", () => {
      localStorage.removeItem("logado");

      document.getElementById("app").style.display = "none";

      document.getElementById("loginPage").style.display = "flex";

      document.getElementById("loginForm").reset();
    });

    // =========================
    // MODAIS
    // =========================

    // fechar no X
    document.getElementById("closeHistorico").addEventListener("click", () => {
      this.fecharModal("historicoModal");
    });

    document.getElementById("closeEdit").addEventListener("click", () => {
      this.fecharModal("editModal");
    });

    // fechar clicando fora
    window.addEventListener("click", (e) => {
      const historicoModal = document.getElementById("historicoModal");

      const editModal = document.getElementById("editModal");

      if (e.target === historicoModal) {
        this.fecharModal("historicoModal");
      }

      if (e.target === editModal) {
        this.fecharModal("editModal");
      }
    });
  }

  // =========================
  // NAVEGAÇÃO
  // =========================

  mudarPagina(pagina) {
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));

    document
      .querySelectorAll(".nav-btn")
      .forEach((b) => b.classList.remove("active"));

    document.getElementById(pagina).classList.add("active");

    document.querySelector(`[data-page="${pagina}"]`).classList.add("active");

    if (pagina === "listagem") this.renderListagem();

    if (pagina === "dashboard" || pagina === "relatorios") {
      this.atualizarDashboard();
    }
  }

  // =========================
  // SALVAR EQUIPAMENTO
  // =========================

  async salvarEquipamento(e) {
    e.preventDefault();

    this.limparErros();

    const formData = this.getFormData();

    if (!this.validarDados(formData)) return;

    try {
      const novoEquipamento = await this.apiRequest("/Equipamentos", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      this.equipamentos.push(novoEquipamento);

      this.mostrarToast("Equipamento cadastrado com sucesso!");

      this.atualizarDashboard();
      this.renderListagem();

      document.getElementById("equipamentoForm").reset();
    } catch (error) {
      console.error(error);
      this.mostrarToast("Erro ao cadastrar equipamento", "error");
    }
  }

  // =========================
  // FORM DATA
  // =========================

  getFormData() {
    return {
      tag: document.getElementById("tag").value.trim().toUpperCase(),
      tipo: document.getElementById("tipo").value,
      geracao: document.getElementById("geracao").value.trim(),
      dataChegada: document.getElementById("dataChegada").value,
      modelo: document.getElementById("modelo").value.trim(),
      setor: document.getElementById("setor").value,
      usuario: document.getElementById("usuario").value.trim(),
      valorAluguel:
        parseFloat(document.getElementById("valorAluguel").value) || 0,
      ativo: document.getElementById("ativo").checked,
    };
  }

  // =========================
  // VALIDAÇÃO
  // =========================

  validarDados(data) {
    const camposObrigatorios = ["tag", "tipo", "dataChegada", "setor"];

    let valido = true;

    camposObrigatorios.forEach((campo) => {
      if (!data[campo]) {
        this.mostrarErro(campo, `${this.formatarLabel(campo)} é obrigatório`);
        valido = false;
      }
    });

    return valido;
  }

  formatarLabel(campo) {
    const labels = {
      tag: "Tag",
      tipo: "Tipo",
      dataChegada: "Data de Chegada",
      setor: "Setor",
    };

    return labels[campo] || campo;
  }

  mostrarErro(campo, mensagem) {
    const errorEl =
      document.getElementById(`${campo}Error`) ||
      document.createElement("span");

    errorEl.className = "error-message";
    errorEl.id = `${campo}Error`;
    errorEl.textContent = mensagem;

    const input = document.getElementById(campo);

    if (input) {
      input.parentNode.appendChild(errorEl);
      input.classList.add("error");
    }
  }

  limparErros() {
    document.querySelectorAll(".error-message").forEach((el) => el.remove());

    document.querySelectorAll("input, select").forEach((input) => {
      input.classList.remove("error");
    });
  }

  fecharModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
  }

  //importar CSV

  handleImportFile(e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const csv = event.target.result;

      const linhas = csv
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);

      const dados = linhas.slice(1);

      this.previewImportacao = dados.map((linha) => {
        const [tag, tipo, setor, usuario, dataChegada,modelo, geracao, valor, ativo] =
          linha.split(",");

        return {
          tag: tag?.trim(),
          tipo: tipo?.trim(),
          setor: setor?.trim(),
          usuario: usuario?.trim(),
          modelo: modelo?.trim(),
          geracao: geracao?.trim(),
          valorAluguel: parseFloat(valor) || 0,
          ativo: ativo?.trim()?.toLowerCase() === "true",
          dataChegada: dataChegada?.trim(),
        };
      });

      this.renderPreview();
    };

    reader.readAsText(file, "UTF-8");
  }

  //PREVIEW IMPORTAÇÃO CSV

  renderPreview() {
    const tbody = document.querySelector("#previewTable tbody");

    tbody.innerHTML = this.previewImportacao
      .map(
        (e) => `
        <tr>
          <td>${e.tag}</td>
          <td>${e.tipo}</td>
          <td>${e.setor}</td>
          <td>${e.usuario}</td>
          <td>${e.modelo}</td>
          <td>${e.geracao}</td>
          <td>${e.dataChegada}</td>
          <td>
            R$ ${Number(e.valorAluguel).toFixed(2)}
          </td>
          <td>
            ${e.ativo ? "Ativo" : "Inativo"}
          </td>
        </tr>
      `,
      )
      .join("");
  }

  //LIMPAR PREVIEW

  limparPreview() {
    this.previewImportacao = [];

    document.querySelector("#previewTable tbody").innerHTML = "";

    document.getElementById("fileInput").value = "";
  }

  //CONFIRMAR IMPORTAÇÃO

  async confirmarImportacao() {
    const input = document.getElementById("fileInput");

    const file = input.files[0];

    if (!file) {
      this.mostrarToast("Selecione um arquivo CSV", "error");

      return;
    }

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(`${this.apiUrl}/Importacao/csv`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao importar arquivo");
      }

      this.mostrarToast("Importação realizada com sucesso!");

      this.fecharModal("importModal");

      this.limparPreview();

      await this.carregarEquipamentos();

      this.renderListagem();

      this.atualizarDashboard();
    } catch (error) {
      console.error(error);

      this.mostrarToast("Erro ao importar CSV", "error");
    }
  }

  exportarJSON() {
    if (!this.equipamentos.length) {
      this.mostrarToast("Nenhum equipamento encontrado", "error");

      return;
    }

    const json = JSON.stringify(this.equipamentos, null, 2);

    const blob = new Blob([json], { type: "application/json" });

    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);

    link.href = url;

    link.download = "equipamentos.json";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  exportarCSV() {
    if (!this.equipamentos.length) {
      this.mostrarToast("Nenhum equipamento encontrado", "error");

      return;
    }

    const headers = [
      "Tag",
      "Tipo",
      "Setor",
      "Usuario",
      "Modelo",
      "Entrega",
      "Geracao",
      "Valor",
      "Status",
    ];

    const rows = this.equipamentos.map((eq) => [
      eq.tag,
      eq.tipo,
      eq.setor,
      eq.usuario || "",
      eq.modelo || "",
      eq.dataChegada || "",
      eq.geracao || "",
      eq.valorAluguel || 0,
      eq.ativo ? "Ativo" : "Inativo",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);

    link.href = url;

    link.download = "equipamentos.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  //Relatórios

  atualizarRelatorios() {
    //   console.log(this.equipamentos);

    const ativos = this.equipamentos.filter((e) => e.ativo);

    const total = ativos.length;

    const valorTotal = ativos.reduce(
      (s, e) => s + Number(e.valorAluguel || 0),
      0,
    );

    document.getElementById("reportTotal").textContent = total;

    document.getElementById("reportTotalValue").textContent = `R$ ${valorTotal
      .toFixed(2)
      .replace(".", ",")}`;

    const porTipo = {};

    ativos.forEach((e) => {
      const tipo = e.tipo || "Não informado";

      porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    });

    document.getElementById("reportByType").innerHTML = Object.entries(porTipo)
      .map(
        ([tipo, qtd]) => `
        <div class="report-item">
          <span>${tipo}</span>
          <span>${qtd}</span>
        </div>
      `,
      )
      .join("");

    const porSetor = {};

    ativos.forEach((e) => {
      const setor = e.setor || "Sem setor";

      porSetor[setor] = (porSetor[setor] || 0) + 1;
    });

    document.getElementById("reportBySetor").innerHTML = Object.entries(
      porSetor,
    )
      .map(
        ([setor, qtd]) => `
        <div class="report-item">
          <span>${setor}</span>
          <span>${qtd}</span>
        </div>
      `,
      )
      .join("");

    this.renderizarGraficoSetores(porSetor);
  }

  renderListagem() {
    const equipamentosFiltrados = this.aplicarFiltros();

    const equipamentosOrdenados = this.ordenarEquipamentos(
      equipamentosFiltrados,
    );

    const tbody = document.getElementById("tableBody");

    tbody.innerHTML = "";

    equipamentosOrdenados.forEach((equip) => {
      const row = this.criarLinhaTabela(equip);
      tbody.appendChild(row);
    });
  }

  aplicarFiltros() {
    const tag = document.getElementById("searchTag").value.toUpperCase();

    const usuario = document
      .getElementById("searchUsuario")
      .value.toUpperCase();

    const setor = document.getElementById("searchSetor").value;

    return this.equipamentos.filter((eq) => {
      return (
        (!tag || eq.tag.includes(tag)) &&
        (!usuario || eq.usuario.toUpperCase().includes(usuario)) &&
        (!setor || eq.setor === setor)
      );
    });
  }

  ordenarEquipamentos(equipamentos) {
    if (!this.currentSort.column) return equipamentos;

    return [...equipamentos].sort((a, b) => {
      let aVal = a[this.currentSort.column];
      let bVal = b[this.currentSort.column];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) {
        return this.currentSort.direction === "asc" ? -1 : 1;
      }

      if (aVal > bVal) {
        return this.currentSort.direction === "asc" ? 1 : -1;
      }

      return 0;
    });
  }

  ordenarTabela(coluna) {
    if (this.currentSort.column === coluna) {
      this.currentSort.direction =
        this.currentSort.direction === "asc" ? "desc" : "asc";
    } else {
      this.currentSort.column = coluna;
      this.currentSort.direction = "asc";
    }

    this.renderListagem();
  }

  formatarData(data) {

  if (!data || data.startsWith("0001"))
    return "Não cadastrado";

  return new Date(data)
    .toLocaleDateString("pt-BR");
}

  criarLinhaTabela(equip) {
    const row = document.createElement("tr");
    // console.log(equip);
    row.innerHTML = `
      <td>${equip.tag}</td>
      <td>${equip.tipo}</td>
      <td>${equip.setor}</td>
      <td>${equip.usuario || "-"}</td>
      <td>
  ${
    equip.dataChegada
      ? this.formatarData(equip.dataChegada)
      : "Não cadastrado"
  }
</td>
      <td>${equip.modelo || "-"}</td>
      <td>${equip.geracao || "-"}</td>
      <td>
        <span class="status-${equip.ativo ? "ativo" : "inativo"}">
          ${equip.ativo ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td>
        R$ ${Number(equip.valorAluguel).toFixed(2).replace(".", ",")}
      </td>
      <td>
        <button class="action-btn btn-historico" data-id="${equip.id}">
          <i class="fas fa-history"></i>
        </button>

        <button class="action-btn btn-edit" data-id="${equip.id}">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    `;

    return row;
  }

  limparFiltros() {
    document.getElementById("searchTag").value = "";
    document.getElementById("searchUsuario").value = "";
    document.getElementById("searchSetor").value = "";

    this.renderListagem();
  }

  // =========================
  // EDIÇÃO
  // =========================

  editarEquipamento(id) {
    const equip = this.equipamentos.find((e) => e.id == id);

    if (!equip) return;

    this.preencherFormEdicao(equip);

    document.getElementById("editModal").classList.add("active");

    document.getElementById("editForm").onsubmit = async (e) => {
      e.preventDefault();
      await this.salvarEdicao(id);
    };
  }

  preencherFormEdicao(equip) {
    const form = document.getElementById("editForm");

    form.innerHTML = `
      <div class="form-grid">

        <div class="form-group">
          <label>Tag</label>
          <input type="text" id="editTag" value="${equip.tag}" readonly disabled>
        </div>

        <div class="form-group">
          <label>Setor</label>

<select id="editSetor">
  <option value="Brava" ${equip.setor === "Brava" ? "selected" : ""}>Brava</option>

  <option value="Comercial" ${equip.setor === "Comercial" ? "selected" : ""}>
    Comercial
  </option>

  <option value="CRF" ${equip.setor === "CRF" ? "selected" : ""}>
    CRF
  </option>

  <option value="Davita" ${equip.setor === "Davita" ? "selected" : ""}>
    Davita
  </option>

  <option value="Financeiro" ${equip.setor === "Financeiro" ? "selected" : ""}>
    Financeiro
  </option>

  <option value="Diretoria" ${equip.setor === "Diretoria" ? "selected" : ""}>
    Diretoria
  </option>

  <option value="Newe Seguros" ${equip.setor === "Newe Seguros" ? "selected" : ""}>
    Newe Seguros
  </option>

  <option value="Planejamento" ${equip.setor === "Planejamento" ? "selected" : ""}>
    Planejamento
  </option>

  <option value="RH" ${equip.setor === "RH" ? "selected" : ""}>
    RH
  </option>

  <option value="TI" ${equip.setor === "TI" ? "selected" : ""}>
    TI
  </option>
</select>
        </div>

        <div class="form-group">
          <label>Usuário</label>
          <input type="text" id="editUsuario" value="${equip.usuario || ""}">
        </div>

        <div class="form-group">
          <label>Valor</label>
          <input type="number" id="editValorAluguel" value="${equip.valorAluguel}">
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" id="editAtivo"
              ${equip.ativo ? "checked" : ""}
            >
            Ativo
          </label>
        </div>

      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">
          Salvar
        </button>
      </div>
    `;
  }

  async salvarEdicao(id) {
    const equip = this.equipamentos.find((e) => e.id == id);

    if (!equip) return;

    const dadosNovos = {
      ...equip,
      setor: document.getElementById("editSetor").value,
      usuario: document.getElementById("editUsuario").value.trim(),
      valorAluguel:
        parseFloat(document.getElementById("editValorAluguel").value) || 0,
      ativo: document.getElementById("editAtivo").checked,
    };

    try {
      await this.apiRequest(`/Equipamentos/${id}`, {
        method: "PUT",
        body: JSON.stringify(dadosNovos),
      });

      Object.assign(equip, dadosNovos);

      this.fecharModal("editModal");

      this.renderListagem();

      this.atualizarDashboard();

      this.mostrarToast("Equipamento atualizado com sucesso!");
    } catch (error) {
      console.error(error);

      this.mostrarToast("Erro ao atualizar equipamento", "error");
    }
  }

  // =========================
  // HISTÓRICO
  // =========================

  async mostrarHistorico(id) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${this.apiUrl}/equipamentos/${id}/historico`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("logado");

        this.mostrarToast("Sessão expirada. Faça login novamente.", "error");

        document.getElementById("mainSystem").style.display = "none";

        document.getElementById("loginPage").style.display = "flex";

        return;
      }

      const historico = await response.json();

      const equip = this.equipamentos.find((e) => e.id === id);

      if (!equip) return;

      document.getElementById("modalTitle").textContent =
        `Histórico - ${equip.tag}`;

      const historicoContent = document.getElementById("historicoContent");

      if (!Array.isArray(historico) || historico.length === 0) {
        historicoContent.innerHTML = `
        <div class="historico-item">
          Nenhum histórico encontrado.
        </div>
      `;

        document.getElementById("historicoModal").classList.add("active");

        return;
      }

      historicoContent.innerHTML = historico
        .map((h) => {
          const antigos = h.dadosAntigos ? JSON.parse(h.dadosAntigos) : null;

          const novos = h.dadosNovos ? JSON.parse(h.dadosNovos) : null;

          return `
          <div class="historico-item">

            <div class="historico-header">
              <strong>
                ${this.formatarData(h.data)}
              </strong>

              <span>${h.acao}</span>
            </div>

            <div class="historico-detalhes">

            
              ${
                h.acao === "Entrada"
                  ? `

        <strong>Status:</strong>
        Equipamento entrou no estoque
        <br>

        <strong>Usuário vinculado:</strong>
        ${h.usuario || "-"}
        <br>
      `
                  : ""
              }

  ${
    h.acao === "Saída"
      ? `

        <strong>Status:</strong>
        Equipamento saiu do estoque
        <br>

        <strong>Data de saída:</strong> ${this.formatarData(h.data)}
        <br>

        <strong>Último usuário:</strong>
        ${h.usuario || "-"}
        <br>
      `
      : ""
  }

  ${
    h.acao === "Editado"
      ? `

        <strong>Usuário:</strong>
        ${antigos?.Usuario || "-"}
        →
        ${novos?.Usuario || "-"}
        <br>

        <strong>Setor:</strong>
        ${antigos?.Setor || 0}
        →
        ${novos?.Setor || 0}
        <br>

        <strong>Status:</strong>
        ${novos?.Ativo ? "Ativo" : "Inativo"}
        <br>
      `
      : ""
  }

            </div>

          </div>
        `;
        })
        .join("");

      document.getElementById("historicoModal").classList.add("active");
    } catch (error) {
      console.error(error);

      this.mostrarToast("Erro ao carregar histórico", "error");
    }
  }

  // =========================
  // DASHBOARD
  // =========================

  atualizarDashboard() {
    const ativos = this.equipamentos.filter((e) => e.ativo);

    const total = ativos.length;

    const valorTotal = ativos.reduce(
      (s, e) => s + Number(e.valorAluguel || 0),
      0,
    );

    // ======================
    // CONTAGEM POR TIPO
    // ======================

    const notebooks = ativos.filter((e) => e.tipo === "Notebook").length;

    const desktops = ativos.filter((e) => e.tipo === "Desktop").length;

    const monitores = ativos.filter((e) => e.tipo === "Monitor").length;

    // ======================
    // HEADER
    // ======================

    // document.getElementById("totalEquipments").textContent = total;

    // document.getElementById("totalValue").textContent =
    //   `R$ ${valorTotal.toFixed(2).replace(".", ",")}`;

    // ======================
    // DASHBOARD
    // ======================

    document.getElementById("dashNotebooks").textContent = notebooks;

    document.getElementById("dashDesktops").textContent = desktops;

    document.getElementById("dashMonitors").textContent = monitores;

    document.getElementById("dashTotalEquipments").textContent = total;

    document.getElementById("dashTotalValue").textContent =
      `R$ ${valorTotal.toFixed(2).replace(".", ",")}`;

    // ======================
    // SETORES
    // ======================

    const porSetor = {};

    ativos.forEach((e) => {
      porSetor[e.setor] = (porSetor[e.setor] || 0) + 1;
    });

    this.renderizarGraficoSetores(porSetor);
    this.atualizarRelatorios();
  }
  updateHeaderStats() {
    this.atualizarDashboard();
  }

  renderizarGraficoSetores(dados) {
    const container = document.getElementById("setorChart");

    const total = Object.values(dados).reduce((a, b) => a + b, 0);

    container.innerHTML = Object.entries(dados)
      .map(([setor, qtd]) => {
        const porcentagem = ((qtd / total) * 100).toFixed(1);

        return `
        <div class="setor-bar">
          <span>
            ${setor}: ${qtd} (${porcentagem}%)
          </span>

          <div
            class="bar"
            style="width:${porcentagem}%"
          ></div>
        </div>
      `;
      })
      .join("");
  }

  // =========================
  // MODAL
  // =========================

  fecharModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
  }

  // =========================
  // TOAST
  // =========================

  mostrarToast(mensagem, tipo = "success") {
    const toast = document.getElementById("toast");

    toast.textContent = mensagem;

    toast.className = `toast ${tipo}`;

    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
}

// LOGIN
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

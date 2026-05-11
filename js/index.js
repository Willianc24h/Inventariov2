// Sistema de Gerenciamento de Equipamentos TI
class GerenciadorEquipamentos {
  constructor() {
    this.equipamentos = this.carregarDados();
    this.currentSort = { column: null, direction: "asc" };
    this.init();
  }

  // Inicialização
  init() {
    this.bindEvents();
    this.atualizarDashboard();
    this.renderListagem();
    this.updateHeaderStats();
  }

  mostrarBuscando() {
    const el = document.getElementById("buscandoIndicator");
    if (el) el.style.display = "block";
  }

  esconderBuscando() {
    const el = document.getElementById("buscandoIndicator");
    if (el) el.style.display = "none";
  }

  // Vincular eventos
  bindEvents() {
    // Navegação
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.mudarPagina(e.target.dataset.page),
      );
    });

    // Formulário cadastro
    document
      .getElementById("equipamentoForm")
      .addEventListener("submit", (e) => this.salvarEquipamento(e));
    document
      .getElementById("equipamentoForm")
      .addEventListener("reset", () => this.limparErros());

    //importação de csv
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

    document.getElementById("clearPreview")
  .addEventListener("click", () => {
    this.limparPreview();
  });

  document.getElementById("fileInput").value = "";

    // Filtros e busca
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

    // Ordenação tabela
    document
      .querySelectorAll("#equipamentosTable th[data-sort]")
      .forEach((th) => {
        th.addEventListener("click", (e) =>
          this.ordenarTabela(e.currentTarget.dataset.sort),
        );
      });

    // Relatórios
    document
      .getElementById("exportCSV")
      .addEventListener("click", () => this.exportarCSV());
    document
      .getElementById("exportJSON")
      .addEventListener("click", () => this.exportarJSON());
    // document
    //   .getElementById("printReport")
    //   .addEventListener("click", () => this.imprimirRelatorio());

    // Modais
    document
      .getElementById("closeHistorico")
      .addEventListener("click", () => this.fecharModal("historicoModal"));
    document
      .getElementById("closeEdit")
      .addEventListener("click", () => this.fecharModal("editModal"));
    document.getElementById("historicoModal").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal"))
        this.fecharModal("historicoModal");
    });
    document.getElementById("editModal").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) this.fecharModal("editModal");
    });

    const pesquisaAutomatica = this.debounce(() => {
      this.renderListagem();
      this.esconderBuscando();
    }, 300);

    const triggerBusca = () => {
      this.mostrarBuscando();
      pesquisaAutomatica();
    };

    document.getElementById("confirmImport")
  .addEventListener("click", () => {
    this.confirmarImportacao();
  });

    document
      .getElementById("searchTag")
      .addEventListener("input", triggerBusca);
    document
      .getElementById("searchUsuario")
      .addEventListener("input", triggerBusca);
    document
      .getElementById("searchSetor")
      .addEventListener("change", triggerBusca);


    //evento de histórico e edição (delegação)
    document.getElementById("tableBody").addEventListener("click", (e) => {
  const btnHistorico = e.target.closest(".btn-historico");
  const btnEdit = e.target.closest(".btn-edit");

  if (btnHistorico) {
    const id = btnHistorico.dataset.id;
    window.gerenciador.mostrarHistorico(id);
  }

  if (btnEdit) {
    const id = btnEdit.dataset.id;
    window.gerenciador.editarEquipamento(id);
  }
});
  }


  // Navegação entre páginas
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
    if (pagina === "dashboard" || pagina === "relatorios")
      this.atualizarDashboard();
  }

  //resgistrar saída de equipamento
  registrarSaida(id) {
    const equip = this.equipamentos.find((e) => e.id === id);
    if (!equip) return;

    equip.historico.push({
      data: new Date().toISOString(),
      acao: "Saída",
      usuario: equip.usuario || "Sem usuário",
      dataSaida: new Date().toISOString(),
    });

    equip.usuario = ""; // limpa usuário
    equip.ativo = false;

    this.salvarDados();
    this.renderListagem();
    this.atualizarDashboard();
  }

  // Salvar equipamento
  salvarEquipamento(e) {
    e.preventDefault();
    this.limparErros();

    const formData = this.getFormData();
    if (!this.validarDados(formData)) return;

    if (this.tagExiste(formData.tag)) {
      this.mostrarToast("Tag já existe!", "error");
      return;
    }

    const equipamento = {
      ...formData,
      id: Date.now().toString(),
      historico: [
        {
          data: new Date().toISOString(),
          acao: "Entrada",
          usuario: formData.usuario || "Sem usuário",
          dataSaida: null,
        },
      ],
    };

    this.equipamentos.push(equipamento);
    this.salvarDados();
    this.mostrarToast("Equipamento cadastrado com sucesso!");

    this.atualizarDashboard();
    this.renderListagem();
    document.getElementById("equipamentoForm").reset();
  }

  // Obter dados do formulário
  getFormData() {
    return {
      tag: document.getElementById("tag").value.trim().toUpperCase(),
      tipo: document.getElementById("tipo").value,
      geracao: document.getElementById("geracao").value.trim(),
      dataChegada: document.getElementById("dataChegada").value,
      dataSaida: document.getElementById("dataSaida").value || null,
      modelo: document.getElementById("modelo").value.trim(),
      sn: document.getElementById("sn").value.trim(),
      setor: document.getElementById("setor").value,
      usuario: document.getElementById("usuario").value.trim(),
      valorAluguel:
        parseFloat(document.getElementById("valorAluguel").value) || 0,
      ativo: document.getElementById("ativo").checked,
    };
  }

  //importar CSV
  handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsText(file, "UTF-8");
    reader.onload = (event) => {
      const csv = event.target.result;

      const linhas = csv
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);

      // remove cabeçalho
      const dados = linhas.slice(1);

      this.previewImportacao = dados.map((linha) => {
        const [tag, tipo, setor, usuario, modelo, geracao, valor, ativo] = linha.split(",");

        return {
          id: (Date.now() + Math.random()).toString(),
          tag,
          tipo,
          setor,
          usuario,
          modelo,
          geracao,
          valorAluguel: parseFloat(valor) || 0,
          ativo: ativo?.toLowerCase() === "true",
          dataEntrada: new Date().toISOString(),
          dataSaida: null,
          historico: [],
        };
      });

      this.renderPreview();
    };

    reader.readAsText(file);
  }

  //Preview da importação
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
      <td>${e.valorAluguel}</td>
      <td>${e.ativo ? "Ativo" : "Inativo"}</td>
    </tr>
  `,
      )
      .join("");
  }

  limparPreview() {
  this.previewImportacao = [];

  document.querySelector("#previewTable tbody").innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center; opacity:0.6;">
        Nenhum dado carregado
      </td>
    </tr>
  `;

  document.getElementById("fileInput").value = "";
}

// Confirmar importação
confirmarImportacao() {
  if (!this.previewImportacao || this.previewImportacao.length === 0) {
    alert("Nenhum dado para importar.");
    return;
  }

  this.previewImportacao.forEach(equip => {
    // cria histórico inicial
   equip.historico.push({
  data: new Date().toISOString(),
  acao: equip.ativo ? "Entrada" : "Cadastro",
  usuario: equip.usuario || "Sem usuário",
  setor: equip.setor,
  dataSaida: null
});

    this.equipamentos.push(equip);
  });

  this.salvarDados();
  this.renderListagem();
  this.atualizarDashboard();

  this.limparPreview();
  this.fecharModal("importModal");

  this.mostrarToast("Importação realizada com sucesso!");
}

  // Validação
  validarDados(data) {
    const camposObrigatorios = ["tag", "tipo", "dataChegada", "setor"];
    let valido = true;

    camposObrigatorios.forEach((campo) => {
      if (!data[campo]) {
        this.mostrarErro(campo, `${this.formatarLabel(campo)} é obrigatório`);
        valido = false;
      }
    });

    if (data.dataSaida && data.dataSaida < data.dataChegada) {
      this.mostrarErro(
        "dataSaida",
        "Data de saída não pode ser anterior à data de chegada",
      );
      valido = false;
    }

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
    errorEl.style.display = "block";

    const input = document.getElementById(campo);
    if (input) {
      input.parentNode.appendChild(errorEl);
      input.classList.add("error");
    }
  }

  limparErros() {
    document.querySelectorAll(".error-message").forEach((el) => {
      el.remove();
    });
    document.querySelectorAll("input, select").forEach((input) => {
      input.classList.remove("error");
    });
  }

  // Verificar duplicidade de tag
  tagExiste(tag) {
    return this.equipamentos.some((eq) => eq.tag === tag);
  }

  // Renderizar listagem
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

      if (aVal < bVal) return this.currentSort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return this.currentSort.direction === "asc" ? 1 : -1;
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

    document
      .querySelectorAll("#equipamentosTable th[data-sort]")
      .forEach((th) => {
        th.querySelector("i").className = "fas fa-sort";
      });

    const thAtivo = document.querySelector(
      `#equipamentosTable th[data-sort="${coluna}"]`,
    );
    const icon = thAtivo.querySelector("i");
    icon.className =
      this.currentSort.direction === "asc"
        ? "fas fa-sort-up"
        : "fas fa-sort-down";

    this.renderListagem();
  }

  criarLinhaTabela(equip) {
    const row = document.createElement("tr");
    row.innerHTML = `
  <td>${equip.tag}</td>
  <td>${equip.tipo}</td>
  <td>${equip.setor}</td>
  <td>${equip.usuario || "-"}</td>
  <td>${equip.modelo || "-"}</td>
  <td>${equip.geracao || "-"}</td>
  <td>
    <span class="status-${equip.ativo ? "ativo" : "inativo"}">
      ${equip.ativo ? "Ativo" : "Inativo"}
    </span>
  </td>
  <td class="valor">R$ ${equip.valorAluguel.toFixed(2).replace(".", ",")}</td>
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

  // Edição de equipamento
  editarEquipamento(id) {
    const equip = this.equipamentos.find((e) => e.id === id);
    if (!equip) return;

    this.preencherFormEdicao(equip);
    document.getElementById("editModal").classList.add("active");

    document.getElementById("editForm").onsubmit = (e) => {
      e.preventDefault();
      this.salvarEdicao(id);
    };
  }

  atualizarDashboard() {
    const total = this.equipamentos.length;

    const ativos = this.equipamentos.filter((e) => e.ativo).length;
    const inativos = total - ativos;

    const valorTotal = this.equipamentos
      .filter((e) => e.ativo)
      .reduce((s, e) => s + e.valorAluguel, 0);

    const porSetor = {};
    this.equipamentos.forEach((e) => {
      porSetor[e.setor] = (porSetor[e.setor] || 0) + 1;
    });

    // Cards principais
    document.getElementById("totalEquipments").textContent = total;
    document.getElementById("totalValue").textContent =
      `R$ ${valorTotal.toFixed(2)}`;
    document.getElementById("ativos").textContent = ativos;
    document.getElementById("inativos").textContent = inativos;

    // Lista por setor (se existir no HTML)
    const setorContainer = document.getElementById("equipamentosPorSetor");
    if (setorContainer) {
      setorContainer.innerHTML = "";

      Object.keys(porSetor).forEach((setor) => {
        const div = document.createElement("div");
        div.textContent = `${setor}: ${porSetor[setor]}`;
        setorContainer.appendChild(div);
      });
    }
  }

  preencherFormEdicao(equip) {
    const form = document.getElementById("editForm");
    form.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label>Tag</label>
                    <input type="text" id="editTag" disabled value="${equip.tag}" readonly>
                </div>
                <div class="form-group">
                    <label>Tipo</label>
                    <select id="editTipo" disabled>
                        <option value="Notebook" ${equip.tipo === "Notebook" ? "selected" : ""}>Notebook</option>
                        <option value="Desktop" ${equip.tipo === "Desktop" ? "selected" : ""}>Desktop</option>
                        <option value="Monitor" ${equip.tipo === "Monitor" ? "selected" : ""}>Monitor</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Setor</label>
                    <select id="editSetor">
                        <option value="Brava" ${equip.setor === "Brava" ? "selected" : ""}>Brava</option>
                        <option value="Comercial" ${equip.setor === "Comercial" ? "selected" : ""}>Comercial</option>
                        <option value="CRF" ${equip.setor === "CRF" ? "selected" : ""}>CRF</option>
                        <option value="Davita" ${equip.setor === "Davita" ? "selected" : ""}>Davita</option>
                        <option value="Financeiro" ${equip.setor === "Financeiro" ? "selected" : ""}>Financeiro</option>
                        <option value="Diretoria" ${equip.setor === "Diretoria" ? "selected" : ""}>Diretoria</option>
                        <option value="Newe Seguros" ${equip.setor === "Newe Seguros" ? "selected" : ""}>Newe Seguros</option>
                        <option value="RH" ${equip.setor === "RH" ? "selected" : ""}>RH</option>
                        <option value="TI" ${equip.setor === "TI" ? "selected" : ""}>TI</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Usuário</label>
                    <input type="text" id="editUsuario" value="${equip.usuario || ""}">
                </div>
                <div class="form-group">
                    <label>Valor Aluguel (R$)</label>
                    <input type="number" id="editValorAluguel" step="0.01" value="${equip.valorAluguel}">
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="editAtivo" ${equip.ativo ? "checked" : ""}>
                        Ativo
                    </label>
                </div>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Salvar Alterações
                </button>
                <button type="button" class="btn btn-secondary" onclick="gerenciador.fecharModal('editModal')">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        `;
  }

  salvarEdicao(id) {
    const equipIndex = this.equipamentos.findIndex((e) => e.id === id);
    const equip = this.equipamentos[equipIndex];

    const dadosNovos = JSON.parse(
      JSON.stringify({
        tipo: document.getElementById("editTipo").value,
        setor: document.getElementById("editSetor").value,
        usuario: document.getElementById("editUsuario").value.trim(),
        valorAluguel:
          parseFloat(document.getElementById("editValorAluguel").value) || 0,
        ativo: document.getElementById("editAtivo").checked,
      }),
    );

    const dadosAntigos = JSON.parse(
      JSON.stringify({
        tipo: this.equipamentos[equipIndex].tipo,
        setor: this.equipamentos[equipIndex].setor,
        usuario: this.equipamentos[equipIndex].usuario,
        valorAluguel: this.equipamentos[equipIndex].valorAluguel,
        ativo: this.equipamentos[equipIndex].ativo,
      }),
    );

    // 🔥 DETECTAR SAÍDA
    if (equip.ativo && !dadosNovos.ativo) {
      equip.dataSaida = new Date().toISOString();

      equip.historico.unshift({
        data: new Date().toISOString(),
        acao: "Saída",
        usuario: equip.usuario || "Sem usuário",
        setor: equip.setor,
        dataSaida: equip.dataSaida,
      });
    }

    // 🔥 DETECTAR RETORNO (ENTRADA)
    if (!equip.ativo && dadosNovos.ativo) {
      equip.dataSaida = null;

      equip.historico.unshift({
        data: new Date().toISOString(),
        acao: "Entrada",
        usuario: dadosNovos.usuario || "Sem usuário",
        setor: dadosNovos.setor,
      });
    }

    // Histórico de edição (mantém)
    equip.historico.unshift({
      data: new Date().toISOString(),
      acao: "Editado",
      usuario: dadosNovos.usuario || "Sem usuário",
      setor: dadosNovos.setor,
      dadosAntigos,
      dadosNovos,
    });

    Object.assign(equip, dadosNovos);

    this.salvarDados();
    this.fecharModal("editModal");
    this.renderListagem();
    this.atualizarDashboard();
    this.mostrarToast("Equipamento atualizado com sucesso!");
  }

  // Histórico
  mostrarHistorico(id) {
    const equip = this.equipamentos.find((e) => e.id === id);
    if (!equip) return;

    document.getElementById("modalTitle").textContent =
      `Histórico - ${equip.tag}`;
    const historicoContent = document.getElementById("historicoContent");

    historicoContent.innerHTML = equip.historico
  .map((h) => `
  <div class="historico-item">
    <div class="historico-header">
      <strong>${this.formatarData(h.data)}</strong>
      <span>${h.acao}</span>
    </div>

    <div class="historico-detalhes">
      <strong>Usuário:</strong> ${h.usuario || "-"} <br>

      ${
        h.acao === "Status Atual"
          ? `
            <strong>Setor:</strong> ${equip.setor || "-"} <br>
            <strong>Data de entrada:</strong> ${this.formatarData(h.data)}
          `
          : ""
      }

      ${
        h.acao === "Saída"
          ? `
            <strong>Setor:</strong> ${equip.setor || "-"} <br>
            <strong>Data de saída:</strong> ${this.formatarData(h.dataSaida)}
          `
          : ""
      }

      ${
        h.acao === "Editado"
          ? `
            <strong>Setor:</strong> 
            ${h.dadosAntigos?.setor || "-"} → ${h.dadosNovos?.setor || "-"} <br>
            <strong>Usuário:</strong> 
            ${h.dadosAntigos?.usuario || "-"} → ${h.dadosNovos?.usuario || "-"}
          `
          : ""
      }

    </div>
  </div>
`)
.join("");

    document.getElementById("historicoModal").classList.add("active");
  }

  formatarData(isoString) {
    return new Date(isoString).toLocaleString("pt-BR");
  }

  formatarCampo(campo) {
    const map = {
      tipo: "Tipo",
      setor: "Setor",
      usuario: "Usuário",
      valorAluguel: "Valor Aluguel",
      ativo: "Status",
    };
    return map[campo] || campo;
  }

  // Excluir equipamento
  // excluirEquipamento(id) {
  //   if (confirm("Tem certeza que deseja excluir este equipamento?")) {
  //     this.equipamentos = this.equipamentos.filter((e) => e.id !== id);
  //     this.salvarDados();
  //     this.renderListagem();
  //     this.atualizarDashboard();
  //     this.mostrarToast("Equipamento excluído com sucesso!");
  //   }
  // }
  debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Dashboard e Relatórios
  atualizarDashboard() {
    const stats = this.calcularEstatisticas();

    // Header
    document.getElementById("totalEquipments").textContent = stats.total;
    document.getElementById("totalValue").textContent =
      `R$ ${stats.valorTotal.toFixed(2).replace(".", ",")}`;

    // Dashboard
    document.getElementById("dashTotalEquipments").textContent = stats.total;
    document.getElementById("dashTotalValue").textContent =
      `R$ ${stats.valorTotal.toFixed(2).replace(".", ",")}`;
    document.getElementById("dashNotebooks").textContent =
      stats.porTipo.Notebook || 0;
    document.getElementById("dashDesktops").textContent =
      stats.porTipo.Desktop || 0;
    document.getElementById("dashMonitors").textContent =
      stats.porTipo.Monitor || 0;

    // Gráfico setores (simulado)
    this.renderizarGraficoSetores(stats.porSetor);

    // Relatórios
    this.atualizarRelatorios(stats);
  }

  calcularEstatisticas() {
    const ativos = this.equipamentos.filter((e) => e.ativo);

    const stats = {
      total: ativos.length,
      valorTotal: 0,
      porTipo: {},
      porSetor: {},
    };
    ativos.forEach((eq) => {
      stats.valorTotal += eq.valorAluguel;

      stats.porTipo[eq.tipo] = (stats.porTipo[eq.tipo] || 0) + 1;
      stats.porSetor[eq.setor] = (stats.porSetor[eq.setor] || 0) + 1;
    });

    return stats;
  }

  renderizarGraficoSetores(dados) {
    const container = document.getElementById("setorChart");
    const total = Object.values(dados).reduce((a, b) => a + b, 0);

    container.innerHTML = Object.entries(dados)
      .map(([setor, qtd]) => {
        const porcentagem = ((qtd / total) * 100).toFixed(1);
        return `
                    <div class="setor-bar">
                        <span>${setor}: ${qtd} (${porcentagem}%)</span>
                        <div class="bar" style="width: ${porcentagem}%"></div>
                    </div>
                `;
      })
      .join("");
  }

  atualizarRelatorios(stats) {
    document.getElementById("reportTotal").textContent = stats.total;
    document.getElementById("reportTotalValue").textContent =
      `R$ ${stats.valorTotal.toFixed(2).replace(".", ",")}`;

    document.getElementById("reportByType").innerHTML = Object.entries(
      stats.porTipo,
    )
      .map(([tipo, qtd]) => `<div>${tipo}: ${qtd}</div>`)
      .join("");

    document.getElementById("reportBySetor").innerHTML = Object.entries(
      stats.porSetor,
    )
      .map(
        ([setor, qtd]) =>
          `<div class="report-item"><span>${setor}</span><span>${qtd}</span></div>`,
      )
      .join("");
  }

  updateHeaderStats() {
    const stats = this.calcularEstatisticas();
    document.getElementById("totalEquipments").textContent = stats.total;
    document.getElementById("totalValue").textContent =
      `R$ ${stats.valorTotal.toFixed(2).replace(".", ",")}`;
  }

  // Exportação
  exportarCSV() {
    const csv = this.gerarCSV();
    this.downloadFile(csv, "equipamentos.csv", "text/csv");
  }

  exportarJSON() {
    const json = JSON.stringify(this.equipamentos, null, 2);
    this.downloadFile(json, "equipamentos.json", "application/json");
  }

  gerarCSV() {
    const headers = [
      "Tag",
      "Tipo",
      "Geracao",
      "Data Chegada",
      "Data Saida",
      "Modelo",
      "S/N",
      "Setor",
      "Usuario",
      "Valor Aluguel",
      "Ativo",
    ];
    const rows = this.equipamentos.map((eq) => [
      `${eq.tag}`,
      eq.tipo,
      `${eq.geracao}`,
      eq.dataChegada,
      eq.dataSaida || "",
      `${eq.modelo}`,
      `${eq.sn}`,
      eq.setor,
      `${eq.usuario}`,
      eq.valorAluguel,
      eq.ativo ? "Sim" : "Não",
    ]);

    return [headers, ...rows]
      .map((row) =>
        row
          .map((cell) =>
            String(cell).includes(",") ||
            String(cell).includes('"') ||
            String(cell).includes("\n")
              ? `"${String(cell).replace(/"/g, '""')}"`
              : cell,
          )
          .join(","),
      )
      .join("\n");
  }

  imprimirRelatorio() {
    window.print();
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Modais
  fecharModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
  }

  // Toast notifications
  mostrarToast(mensagem, tipo = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = mensagem;
    toast.className = `toast ${tipo}`;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // Persistência LocalStorage
  salvarDados() {
    const seguro = JSON.parse(JSON.stringify(this.equipamentos));
    localStorage.setItem("equipamentosTI", JSON.stringify(seguro));
  }

  carregarDados() {
    const dados = localStorage.getItem("equipamentosTI");
    return dados ? JSON.parse(dados) : [];
  }
}

// Inicializar sistema quando DOM carregar
document.addEventListener("DOMContentLoaded", () => {
  window.gerenciador = new GerenciadorEquipamentos();
});

// Adicionar CSS para barras do gráfico
const style = document.createElement("style");
style.textContent = `
    .setor-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 0.5rem 0;
        font-size: 0.9rem;
    }
    .bar {
        height: 8px;
        background: linear-gradient(90deg, #667eea, #764ba2);
        border-radius: 4px;
        transition: width 0.5s ease;
    }
    .historico-item {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        background: #f8fafc;
    }
    .historico-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
    }
    .historico-detalhes {
        font-size: 0.85rem;
        color: #64748b;
        padding-left: 1rem;
    }
`;
document.head.appendChild(style);

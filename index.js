let membersData = [];
let templates = {};
let photos = {};

const BACK_FIELD_POSITIONS = {
  cpf: { x: 690, y: 110 },
  dataNascimento: { x: 230, y: 115 },
  dataBatismo: { x: 230, y: 230 },
  setor: { x: 690, y: 230 },
  validade: { x: 230, y: 350 },
};

// Função melhorada para abreviar nomes
function abbreviateName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';
  
  // Limpar espaços extras e normalizar
  const cleanName = fullName.trim().replace(/\s+/g, ' ');
  
  // Lista expandida de preposições e artigos que devem ser preservados
  const preserveWords = new Set([
    'da', 'de', 'dos', 'das', 'do', 'e', 'y',
    'del', 'la', 'le', 'di', 'von', 'van', 'el'
  ]);
  
  const nameParts = cleanName.split(' ').filter(part => part.length > 0);
  
  // Se o nome tem apenas uma ou duas partes, retorna completo
  if (nameParts.length <= 2) {
    return cleanName;
  }
  
  // Primeiro nome sempre completo
  const firstName = nameParts[0];
  
  // Último sobrenome sempre completo
  const lastName = nameParts[nameParts.length - 1];
  
  // Processar nomes do meio
  const middleNames = nameParts.slice(1, -1);
  const processedMiddleNames = middleNames.map(name => {
    const lowerName = name.toLowerCase();
    
    // Se é uma preposição/artigo, manter completo
    if (preserveWords.has(lowerName)) {
      return name;
    }
    
    // Se o nome é muito curto (2 caracteres ou menos), manter completo
    if (name.length <= 2) {
      return name;
    }
    
    // Caso contrário, abreviar
    return name.charAt(0).toUpperCase() + '.';
  });
  
  // Juntar tudo
  return [firstName, ...processedMiddleNames, lastName].join(' ');
}

// Função para validar tamanho do nome e sugerir abreviação
function validateNameLength(name, maxLength = 25) {
  if (!name) return { isValid: true, suggestion: '' };
  
  if (name.length <= maxLength) {
    return { isValid: true, suggestion: name };
  }
  
  const abbreviated = abbreviateName(name);
  return {
    isValid: abbreviated.length <= maxLength,
    suggestion: abbreviated,
    original: name
  };
}

function showStatus(message, type = "info") {
  const statusDiv = document.getElementById("statusDiv");
  statusDiv.className = `status ${type}`;
  statusDiv.textContent = message;
  statusDiv.style.display = "block";
}

function updateProgress(percent) {
  const progressDiv = document.getElementById("progressDiv");
  const progressFill = document.getElementById("progressFill");

  if (percent > 0) {
    progressDiv.classList.remove("hidden");
    progressFill.style.width = percent + "%";
  } else {
    progressDiv.classList.add("hidden");
  }
}

function formatCPF(cpf) {
  if (!cpf) return "";
  const numbers = cpf.toString().replace(/\D/g, "");
  
  // Validar se tem 11 dígitos
  if (numbers.length !== 11) {
    console.warn(`CPF inválido: ${cpf}`);
    return cpf; // Retorna original se inválido
  }
  
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatDate(date) {
  if (!date) return "";

  try {
    // Se a data for um número (Excel date serial)
    if (typeof date === "number") {
      // Conversão mais precisa para datas do Excel
      const excelDate = new Date((date - 25569) * 86400 * 1000);
      if (!isNaN(excelDate.getTime())) {
        return excelDate.toLocaleDateString("pt-BR");
      }
    }

    // Se for uma string
    if (typeof date === "string") {
      // Tentar parsing direto primeiro
      let parsedDate = new Date(date);
      
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString("pt-BR");
      }
      
      // Tentar formato brasileiro dd/mm/yyyy
      const brazilianMatch = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (brazilianMatch) {
        const [, day, month, year] = brazilianMatch;
        parsedDate = new Date(year, month - 1, day, 12); // meio-dia
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString("pt-BR");
        }
      }
      
      // Tentar formato ISO yyyy-mm-dd
      const isoMatch = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        parsedDate = new Date(year, month - 1, day, 12); // meio-dia
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString("pt-BR");
        }
      }
    }

    // Se for um objeto Date válido
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString("pt-BR");
    }

    // Se nada funcionar, retornar string vazia ou valor original
    console.warn(`Data inválida: ${date}`);
    return "";
  } catch (error) {
    console.error(`Erro ao formatar data: ${date}`, error);
    return "";
  }
}

// Função melhorada para buscar foto do membro
function findMemberPhoto(member, photos) {
  if (!member || !member.nome || !photos) return null;
  
  const memberName = member.nome.toLowerCase().trim();
  
  // 1. Busca exata pelo nome da foto especificado
  if (member.foto && photos[member.foto]) {
    return photos[member.foto];
  }
  
  // 2. Busca por nome completo
  const exactMatch = Object.keys(photos).find(key => 
    key.toLowerCase() === memberName
  );
  if (exactMatch) return photos[exactMatch];
  
  // 3. Busca por primeiro nome + último sobrenome
  const nameParts = memberName.split(' ');
  if (nameParts.length > 1) {
    const firstLast = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    const firstLastMatch = Object.keys(photos).find(key =>
      key.toLowerCase() === firstLast
    );
    if (firstLastMatch) return photos[firstLastMatch];
  }
  
  // 4. Busca parcial (contém o nome)
  const partialMatch = Object.keys(photos).find(key => {
    const keyLower = key.toLowerCase();
    return keyLower.includes(memberName) || memberName.includes(keyLower);
  });
  if (partialMatch) return photos[partialMatch];
  
  // 5. Busca por primeiro nome apenas
  if (nameParts.length > 0) {
    const firstNameMatch = Object.keys(photos).find(key =>
      key.toLowerCase().includes(nameParts[0])
    );
    if (firstNameMatch) return photos[firstNameMatch];
  }
  
  return null;
}

async function processFiles() {
  const excelFile = document.getElementById("excelFile").files[0];
  const templateFrontFile = document.getElementById("templateFront").files[0];
  const templateBackFile = document.getElementById("templateBack").files[0];
  const photoFiles = document.getElementById("photosFolder").files;

  if (!excelFile || !templateFrontFile || !templateBackFile) {
    showStatus("Por favor, selecione todos os arquivos obrigatórios.", "error");
    return;
  }

  const processButton = document.querySelector(".btn-primary");
  const processText = document.getElementById("processText");
  const processLoading = document.getElementById("processLoading");

  processButton.disabled = true;
  processText.classList.add("hidden");
  processLoading.classList.remove("hidden");

  try {
    showStatus("Carregando templates...", "info");
    updateProgress(20);

    // Carregar templates
    templates.front = await loadImage(templateFrontFile);
    templates.back = await loadImage(templateBackFile);

    updateProgress(40);
    showStatus("Carregando fotos...", "info");

    // Carregar fotos com melhor tratamento de nomes
    photos = {};
    for (let file of photoFiles) {
      try {
        // Remove extensão e normaliza o nome
        const name = file.name.replace(/\.[^/.]+$/, "").trim();
        const normalizedName = name.replace(/[_-]/g, ' '); // Substitui _ e - por espaços
        photos[normalizedName] = await loadImage(file);
      } catch (error) {
        console.warn(`Erro ao carregar foto ${file.name}:`, error);
      }
    }

    updateProgress(60);
    showStatus("Processando planilha Excel...", "info");

    // Processar Excel
    const data = await readExcelFile(excelFile);
    membersData = data;

    updateProgress(80);
    showStatus("Gerando pré-visualização...", "info");

    // Gerar pré-visualização do primeiro membro
    if (membersData.length > 0) {
      await generatePreview(membersData[0]);
    }

    // Mostrar lista de membros
    displayMembersList();

    updateProgress(100);
    showStatus(
      `✅ Processamento concluído! ${membersData.length} membros carregados.`,
      "success"
    );

    // Habilitar botões de geração
    document.getElementById("generateAllBtn").disabled = false;
    document.getElementById("generateIndividualBtn").disabled = false;

    setTimeout(() => updateProgress(0), 2000);
  } catch (error) {
    console.error("Erro no processamento:", error);
    showStatus(`❌ Erro: ${error.message}`, "error");
    updateProgress(0);
  } finally {
    processButton.disabled = false;
    processText.classList.remove("hidden");
    processLoading.classList.add("hidden");
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error(`Erro ao carregar imagem: ${file.name}`));
      img.src = e.target.result;
    };
    reader.onerror = () =>
      reject(new Error(`Erro ao ler arquivo: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Mapear campos com mais flexibilidade
        const mappedData = jsonData.map((row, index) => {
          try {
            return {
              nome: (row["Nome Completo"] || row.nome || row.Nome || "").toString().trim(),
              cpf: (row.CPF || row.cpf || row.Cpf || "").toString().trim(),
              funcao: (row.Função || row.função || row.Funcao || row.funcao || "Membro").toString().trim(),
              dataNascimento: formatDate(
                row["Data Nascimento"] ||
                row["data Nascimento"] ||
                row["Data de Nascimento"] ||
                row["DataNascimento"] ||
                ""
              ),
              dataBatismo: formatDate(
                row["Data Batismo"] || 
                row["DataBatismo"] || 
                row["Data de Batismo"] ||
                ""
              ),
              setor: (row.Setor || row.setor || "").toString().trim(),
              validade: "",
              foto: (row.Foto || row.foto || "").toString().trim(),
            };
          } catch (error) {
            console.warn(`Erro ao processar linha ${index + 1}:`, error);
            return null;
          }
        }).filter(member => member && member.nome); // Remove entradas inválidas

        resolve(mappedData);
      } catch (error) {
        reject(new Error("Erro ao processar planilha Excel: " + error.message));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo Excel"));
    reader.readAsArrayBuffer(file);
  });
}

function displayMembersList() {
  const container = document.getElementById("membersContainer");
  const listDiv = document.getElementById("membersList");

  container.innerHTML = "";

  membersData.forEach((member, index) => {
    const memberDiv = document.createElement("div");
    memberDiv.className = "member-item";
    
    // Validar nome para exibição
    const nameValidation = validateNameLength(member.nome);
    const displayName = nameValidation.isValid ? member.nome : nameValidation.suggestion;
    
    memberDiv.innerHTML = `
      <div class="member-info">
        <div class="member-name" title="${member.nome}">
          ${displayName}
          ${!nameValidation.isValid ? '<span style="color: orange;">⚠️</span>' : ''}
        </div>
        <div class="member-details">
          ${member.funcao} | CPF: ${formatCPF(member.cpf)} | ${member.setor}
        </div>
      </div>
      <button class="btn btn-primary" style="padding: 8px 16px; font-size: 14px;" 
              onclick="generatePreview(membersData[${index}])">
        👁️ Visualizar
      </button>
      <button class="btn btn-success" style="padding: 8px 16px; font-size: 14px; margin-left: 8px;" 
          onclick="downloadCarteirinha(membersData[${index}])">
        📥 Baixar Carteirinha
      </button>
    `;
    container.appendChild(memberDiv);
  });

  listDiv.classList.remove("hidden");
}

async function downloadCarteirinha(member) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape", "px", [1004, 649]);

  // Gerar a frente e o verso da carteirinha
  const pages = await generateCarteirinha(member, true);

  // Adicionar a frente no PDF
  const frontImage = pages[0];
  const frontWidth = 1004;
  const frontHeight = 649;
  doc.addImage(frontImage, "PNG", 0, 0, frontWidth, frontHeight);

  // Adicionar uma nova página para o verso
  if (pages[1]) {
    doc.addPage();
    const backImage = pages[1];
    const backWidth = 1004;
    const backHeight = 649;
    doc.addImage(backImage, "PNG", 0, 0, backWidth, backHeight);
  }

  // Criar nome de arquivo seguro
  const safeFileName = member.nome.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  doc.save(`${safeFileName}-carteirinha.pdf`);
}

async function generatePreview(member) {
  const frontCanvas = document.getElementById("previewCanvasFront");
  const backCanvas = document.getElementById("previewCanvasBack");

  const ctxFront = frontCanvas.getContext("2d");
  const ctxBack = backCanvas.getContext("2d");

  // Limpar canvas
  ctxFront.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
  ctxBack.clearRect(0, 0, backCanvas.width, backCanvas.height);

  // ========== FRENTE ==========
  if (templates.front) {
    ctxFront.drawImage(templates.front, 0, 0, 1004, 649);

    // Buscar foto do membro usando função melhorada
    const memberPhoto = findMemberPhoto(member, photos);

    // Desenhar foto ou placeholder
    if (memberPhoto) {
       ctxFront.drawImage(memberPhoto, 31, 26, 331, 327);
      } else {
      ctxFront.fillStyle = "#cccccc";
      ctxFront.fillRect(31, 26, 331, 327);
      ctxFront.fillStyle = "#666666";
      ctxFront.font = "bold 20px Arial";
      ctxFront.textAlign = "center";
      ctxFront.fillText("Sem Foto", 31 + 331 / 2, 26 + 327 / 2);
    }

    // Configurar texto com nome abreviado
    ctxFront.fillStyle = "black";
    ctxFront.textAlign = "center";
    ctxFront.font = "bold 28px Arial";
    
    const abbreviatedName = abbreviateName(member.nome);
    ctxFront.fillText(abbreviatedName, 260, 460);
    ctxFront.fillText(member.funcao, 250, 590);
  }

  // ========== VERSO ==========
  if (templates.back) {
    ctxBack.drawImage(templates.back, 0, 0, 1004, 649);

    // Buscar a validade inserida manualmente
    const validadeInput = document.getElementById("validade").value;
    const validadeValue = validadeInput || member.validade;

    ctxBack.fillStyle = "black";
    ctxBack.textAlign = "center";
    ctxBack.font = "32px Arial";

    ctxBack.fillText(
      formatCPF(member.cpf),
      BACK_FIELD_POSITIONS.cpf.x,
      BACK_FIELD_POSITIONS.cpf.y
    );
    ctxBack.fillText(
      member.dataNascimento,
      BACK_FIELD_POSITIONS.dataNascimento.x,
      BACK_FIELD_POSITIONS.dataNascimento.y
    );
    ctxBack.fillText(
      member.dataBatismo,
      BACK_FIELD_POSITIONS.dataBatismo.x,
      BACK_FIELD_POSITIONS.dataBatismo.y
    );
    ctxBack.fillText(
      member.setor,
      BACK_FIELD_POSITIONS.setor.x,
      BACK_FIELD_POSITIONS.setor.y
    );
    ctxBack.fillText(
      validadeValue,
      BACK_FIELD_POSITIONS.validade.x,
      BACK_FIELD_POSITIONS.validade.y
    );
  }

  showStatus(`Pré-visualização gerada para: ${member.nome}`, "success");
}

async function generateCarteirinha(member, includeBack = true) {
  const canvas = document.createElement("canvas");
  canvas.width = 1004;
  canvas.height = 649;
  const ctx = canvas.getContext("2d");

  const pages = [];

  // Gerar frente
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (templates.front) {
    ctx.drawImage(templates.front, 0, 0, 1004, 649);

    // Buscar e desenhar foto
    let memberPhoto = null;
    if (member.foto && photos[member.foto]) {
      memberPhoto = photos[member.foto];
    } else {
      const photoKeys = Object.keys(photos);
      const matchingKey = photoKeys.find(
        (key) =>
          key.toLowerCase().includes(member.nome.toLowerCase()) ||
          member.nome.toLowerCase().includes(key.toLowerCase())
      );
      if (matchingKey) {
        memberPhoto = photos[matchingKey];
      }
    }

    if (memberPhoto) {
      ctx.drawImage(memberPhoto, 31, 26, 331, 327);
    } else {
      ctx.fillStyle = "#cccccc";
      ctx.fillRect(31, 26, 331, 327);
      ctx.fillStyle = "#666666";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Sem Foto", 196, 189);
    }

    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.font = "bold 28px Arial";

    // Usar nome abreviado
    const abbreviatedName = abbreviateName(member.nome);
    ctx.fillText(abbreviatedName, 260, 460);
    ctx.fillText(member.funcao, 250, 590);
  }

  pages.push(canvas.toDataURL("image/png"));

  // Gerar verso se solicitado
  if (includeBack) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (templates.back) {
      ctx.drawImage(templates.back, 0, 0, 1004, 649);

      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.font = "32px Arial";

      // Buscar validade manual do input
      const validadeInput = document.getElementById("validade").value;
      const validadeValue = validadeInput || member.validade;

      ctx.fillText(
        formatCPF(member.cpf),
        BACK_FIELD_POSITIONS.cpf.x,
        BACK_FIELD_POSITIONS.cpf.y
      );
      ctx.fillText(
        member.dataNascimento,
        BACK_FIELD_POSITIONS.dataNascimento.x,
        BACK_FIELD_POSITIONS.dataNascimento.y
      );
      ctx.fillText(
        member.dataBatismo,
        BACK_FIELD_POSITIONS.dataBatismo.x,
        BACK_FIELD_POSITIONS.dataBatismo.y
      );
      ctx.fillText(
        member.setor,
        BACK_FIELD_POSITIONS.setor.x,
        BACK_FIELD_POSITIONS.setor.y
      );
      ctx.fillText(
        validadeValue,
        BACK_FIELD_POSITIONS.validade.x,
        BACK_FIELD_POSITIONS.validade.y
      );

      pages.push(canvas.toDataURL("image/png"));
    }
  }

  return pages;
}

async function generateAllPDF() {
  if (membersData.length === 0) {
    showStatus("Nenhum membro carregado.", "error");
    return;
  }

  try {
    showStatus("Gerando PDF completo...", "info");
    updateProgress(0);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [1004, 649],
    });

    let isFirstPage = true;

    for (let i = 0; i < membersData.length; i++) {
      const member = membersData[i];
      const pages = await generateCarteirinha(member, true);

      for (let j = 0; j < pages.length; j++) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        pdf.addImage(pages[j], "PNG", 0, 0, 1004, 649);
        isFirstPage = false;
      }

      updateProgress(((i + 1) / membersData.length) * 100);
    }

    const fileName = `Carteirinhas_Completo_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    pdf.save(fileName);

    showStatus(`✅ PDF completo gerado: ${fileName}`, "success");
    updateProgress(0);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    showStatus(`❌ Erro ao gerar PDF: ${error.message}`, "error");
    updateProgress(0);
  }
}

async function generateIndividualPDFs() {
  if (membersData.length === 0) {
    showStatus("Nenhum membro carregado.", "error");
    return;
  }

  try {
    showStatus("Gerando PDFs individuais...", "info");
    updateProgress(0);

    for (let i = 0; i < membersData.length; i++) {
      const member = membersData[i];
      const pages = await generateCarteirinha(member, true);

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1004, 649],
      });

      // Adicionar frente
      pdf.addImage(pages[0], "PNG", 0, 0, 1004, 649);

      // Adicionar verso se existir
      if (pages[1]) {
        pdf.addPage();
        pdf.addImage(pages[1], "PNG", 0, 0, 1004, 649);
      }

      const safeFileName = member.nome.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const fileName = `Carteirinha_${safeFileName}.pdf`;
      pdf.save(fileName);

      updateProgress(((i + 1) / membersData.length) * 100);
    }

    showStatus(
      `✅ ${membersData.length} PDFs individuais gerados com sucesso!`,
      "success"
    );
    updateProgress(0);
  } catch (error) {
    console.error("Erro:", error);
    showStatus(`❌ Erro ao gerar PDFs individuais: ${error.message}`, "error");
    updateProgress(0);
  }
}

function resetSystem() {
  if (
    confirm(
      "Tem certeza que deseja resetar o sistema? Todos os dados serão perdidos."
    )
  ) {
    // Limpar dados
    membersData = [];
    templates = {};
    photos = {};

    // Limpar campos de arquivo
    document.getElementById("excelFile").value = "";
    document.getElementById("templateFront").value = "";
    document.getElementById("templateBack").value = "";
    document.getElementById("photosFolder").value = "";
    document.getElementById("validade").value = "";

    // Desabilitar botões
    document.getElementById("generateAllBtn").disabled = true;
    document.getElementById("generateIndividualBtn").disabled = true;

    // Limpar canvas frente
    const frontCanvas = document.getElementById("previewCanvasFront");
    const frontCtx = frontCanvas.getContext("2d");
    frontCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);

    // Limpar canvas verso
    const backCanvas = document.getElementById("previewCanvasBack");
    const backCtx = backCanvas.getContext("2d");
    backCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);

    // Ocultar lista de membros
    document.getElementById("membersList").classList.add("hidden");

    // Limpar status
    document.getElementById("statusDiv").style.display = "none";
    updateProgress(0);

    showStatus("✅ Sistema resetado com sucesso!", "success");
  }
}

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  showStatus(
    "💡 Sistema pronto! Faça upload dos arquivos para começar.",
    "info"
  );
});

// Atualiza o ano atual no rodapé
document.getElementById(
  "anoAtual"
).innerHTML = `&copy; ${new Date().getFullYear()} Todos os direitos reservados.`;


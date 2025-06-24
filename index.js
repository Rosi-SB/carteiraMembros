let membersData = [];
let templates = {};
let photos = {};

const BACK_FIELD_POSITIONS = {
    cpf: { x: 690, y: 110 },
    dataNascimento: { x: 230, y: 115 },
    dataBatismo: { x: 230, y: 230 },
    congregacao: { x: 690, y: 230 },
    validade: { x: 230, y: 350 },
};

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
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatDate(date) {
    if (!date) return "";

    // Se a data for um número (como um valor numérico de data do Excel)
    if (typeof date === "number") {
        // Se for um número, o Excel armazena a data como número de dias desde 1900
        // Vamos criar uma data a partir disso
        const excelDate = new Date((date - 25569) * 86400 * 1000); // Conversão para JS Date
        return excelDate.toLocaleDateString("pt-BR");
    }

    // Se for uma string, tentamos convertê-la para uma data
    if (typeof date === "string") {
        const parsedDate = new Date(date);
        // Se a data não for válida, tentamos uma conversão usando o formato 'dd/mm/yyyy'
        if (isNaN(parsedDate)) {
            const parts = date.split('/');
            if (parts.length === 3) {
                // Formato 'dd/mm/yyyy'
                const day = parts[0].padStart(2, '0');
                const month = (parseInt(parts[1], 10) - 1).toString().padStart(2, '0');
                const year = parts[2];
                const dateString = `${year}-${month}-${day}`;
                return new Date(dateString).toLocaleDateString("pt-BR");
            }
        }
    }

    // Se a data for um objeto Date válido
    if (date instanceof Date && !isNaN(date)) {
        return date.toLocaleDateString("pt-BR");
    }

    // Se nada funcionar, retornamos a string original
    return date.toString();
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

        // Carregar fotos
        photos = {};
        for (let file of photoFiles) {
            const name = file.name.replace(/\.[^/.]+$/, ""); // Remove extensão
            photos[name] = await loadImage(file);
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

                // Mapear campos esperados
                const mappedData = jsonData.map((row) => ({
                    nome: 
                        row.Nome ||
                        row.nome ||
                        "",
                    cpf: 
                        row.CPF ||
                        row.cpf ||
                        "",
                    funcao: 
                        row.Funcao ||
                        row.funcao ||
                        "Membro",
                    dataNascimento: 
                        formatDate(
                            row.DataNascimento ||
                            row.dataNascimento ||
                            row["Data Nascimento"] ||
                            ""
                        ),
                    dataBatismo: 
                        formatDate(
                            row.DataBatismo || 
                            row.dataBatismo || 
                            row["DataBatismo"] ||
                            ""
                        ),
                    congregacao: 
                        row.Congregacao ||
                        row.congregacao ||
                        "",
                    validade: 
                        formatDate(
                            row.Validade ||
                            row.validade ||
                            "31/12/2025"
                        ),
                    foto: 
                        row.Foto ||
                        row.foto ||
                        "",
                }));

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
        memberDiv.innerHTML = `
                    <div class="member-info">
                        <div class="member-name">${member.nome}</div>
                        <div class="member-details">
                            ${member.funcao} | CPF: ${formatCPF(
            member.cpf
        )} | ${member.congregacao}
                        </div>
                    </div>
                    <button class="btn btn-primary" style="padding: 8px 16px; font-size: 14px;" 
                            onclick="generatePreview(membersData[${index}])">
                        👁️ Visualizar
                    </button>
                `;
        container.appendChild(memberDiv);
    });

    listDiv.classList.remove("hidden");
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

        // Buscar foto do membro
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

        // Configurar texto
        ctxFront.fillStyle = "black";
        ctxFront.textAlign = "center";
        ctxFront.font = "bold 32px Arial";
        ctxFront.fillText(member.nome, 250, 460);
        ctxFront.fillText(member.funcao, 250, 590);
    }

    // ========== VERSO ==========
    if (templates.back) {
        ctxBack.drawImage(templates.back, 0, 0, 1004, 649);

        ctxBack.fillStyle = "black";
        ctxBack.textAlign = "center";
        ctxBack.font = "32px Arial";

        ctxBack.fillText(formatCPF(member.cpf), BACK_FIELD_POSITIONS.cpf.x, BACK_FIELD_POSITIONS.cpf.y);
        ctxBack.fillText(formatDate(member.dataNascimento), BACK_FIELD_POSITIONS.dataNascimento.x, BACK_FIELD_POSITIONS.dataNascimento.y);
        ctxBack.fillText(formatDate(member.dataBatismo), BACK_FIELD_POSITIONS.dataBatismo.x, BACK_FIELD_POSITIONS.dataBatismo.y);
        ctxBack.fillText(member.congregacao, BACK_FIELD_POSITIONS.congregacao.x, BACK_FIELD_POSITIONS.congregacao.y);
        ctxBack.fillText(member.validade, BACK_FIELD_POSITIONS.validade.x, BACK_FIELD_POSITIONS.validade.y);
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
        ctx.font = "bold 32px Arial";
        ctx.fillText(member.nome, 250, 460);
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

            ctx.fillText(formatCPF(member.cpf), BACK_FIELD_POSITIONS.cpf.x, BACK_FIELD_POSITIONS.cpf.y);
            ctx.fillText(formatDate(member.dataNascimento), BACK_FIELD_POSITIONS.dataNascimento.x, BACK_FIELD_POSITIONS.dataNascimento.y);
            ctx.fillText(formatDate(member.dataBatismo), BACK_FIELD_POSITIONS.dataBatismo.x, BACK_FIELD_POSITIONS.dataBatismo.y);
            ctx.fillText(member.congregacao, BACK_FIELD_POSITIONS.congregacao.x, BACK_FIELD_POSITIONS.congregacao.y);
            ctx.fillText(member.validade, BACK_FIELD_POSITIONS.validade.x, BACK_FIELD_POSITIONS.validade.y);

            pages.push(canvas.toDataURL("image/png"));
        }

        return pages;
    }
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

            const fileName = `Carteirinhas_Completo_${new Date().toISOString().split("T")[0]
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

                const fileName = `Carteirinha_${member.nome.replace(
                    /[^a-zA-Z0-9]/g,
                    "_"
                )}.pdf`;
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


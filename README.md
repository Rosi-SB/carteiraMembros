# 🛠️ Sistema de Geração Automática de Carteirinhas para Igreja

Sistema desenvolvido para automatizar a geração de carteirinhas em PDF para os membros da **Igreja Assembleia de Deus – Ministério de Belém (Catanduva-SP)**. A aplicação lê dados de uma planilha Excel, processa fotos dos membros e gera documentos profissionais prontos para impressão – tudo diretamente no **navegador**, sem necessidade de servidor.

---

## 🎯 Objetivo do Projeto

Automatizar um processo manual e repetitivo, gerando carteirinhas personalizadas com padronização visual e informacional, por meio de uma interface **100% web, intuitiva e acessível**.

---

## ⚙️ Principais Funcionalidades

### 📊 Processamento de Dados

- Leitura de planilhas Excel `.xlsx`
- Extração automática dos seguintes dados:
  - Nome
  - Função
  - CPF
  - Data de nascimento
  - Data de batismo
  - Congregação
  - Validade
  - Nome do arquivo de foto

### 🎨 Geração Visual das Carteirinhas

- Uso de templates personalizados (frente e verso)
- Inserção automática da **foto do membro**
- Posicionamento e formatação precisa dos textos
- Desenho direto com **Canvas API**
- Pré-visualização em tempo real

### 📄 Exportação de Documentos

- Geração de **PDFs individuais** por membro
- Geração de **PDF em lote** (com todas as carteirinhas)
- Nomeação automática dos arquivos:
  - Exemplo: `Carteirinha_Joao_Silva.pdf`

---

## 🌐 Interface Gráfica Web

- Desenvolvida com **HTML + CSS + JS puro**
- Executa localmente, **sem servidor**
- Upload de:
  - Planilha Excel
  - Templates de frente e verso (imagem)
  - Fotos dos membros
- Visualização dos membros em lista
- Botões de ação:
  - Gerar carteirinhas individuais
  - Gerar carteirinhas em lote
- Painéis de status com feedback de progresso

---

## 🧱 Estrutura Técnica

| Camada     | Tecnologia                 |
|------------|----------------------------|
| Frontend   | HTML, CSS, JavaScript (Canvas API) |
| Planilhas  | [SheetJS (xlsx)](https://github.com/SheetJS/sheetjs) |
| PDF        | [jsPDF](https://github.com/parallax/jsPDF) |
| Imagens    | FileReader + `<canvas>`    |

---

## 🔁 Fluxo de Utilização

```mermaid
graph LR
A[Abrir a Página Web] --> B[Fazer Upload da Planilha]
B --> C[Fazer Upload dos Templates]
C --> D[Fazer Upload das Fotos]
D --> E[Visualizar membros na tela]
E --> F[Escolher: Geração Individual ou em Lote]
F --> G[Pré-visualizar ou Gerar PDFs]
G --> H[Download automático dos arquivos]

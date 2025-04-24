🛠️ Sistema de Geração Automática de Carteirinhas para Igreja

Sistema desenvolvido para automatizar a geração de carteirinhas em PDF para os membros da Igreja Assembleia de Deus – Ministério de Belém (Catanduva-SP). A aplicação lê dados de uma planilha Excel, processa fotos dos membros e gera documentos profissionais prontos para impressão.
🎯 Objetivo do Projeto

Automatizar um processo manual e repetitivo, gerando carteirinhas personalizadas com padronização visual e informacional, através de uma interface intuitiva e acessível.
⚙️ Principais Funcionalidades
📊 Processamento de Dados

    Leitura da planilha Excel SEDE-Cadastro-Membros.xlsx

    Extração automática dos seguintes dados:

        Nome

        Função

        CPF

        Data de nascimento

        Data de batismo

        Congregação

🎨 Geração Visual das Carteirinhas

    Uso de templates personalizados (frente e verso)

    Inserção automática da foto do membro

    Posicionamento e formatação precisa dos textos

    Inclusão de:

        Assinatura do pastor

        Textos institucionais

        QR Codes (opcional)

📄 Exportação de Documentos

    Geração de PDFs individuais

    Geração em lote (um único PDF com todas as carteirinhas)

    Nomeação automática dos arquivos:
    Exemplo: João_Silva_Carteirinha.pdf

🌐 Interface Gráfica Web

    Desenvolvida com Express.js e EJS

    Upload de:

        Planilha de dados

        Templates (frente e verso)

        Fotos dos membros

    Visualização em tabela dos dados carregados

    Botões para ações:

        Gerar carteirinhas individuais

        Gerar carteirinhas em lote

    Painéis de status com feedback do progresso

🧱 Estrutura Técnica
Camada	Tecnologia
Backend	Node.js
Leitura Excel	xlsx
Geração PDF	pdfkit, canvas
Frontend	Express, EJS, Bootstrap
Armazenamento	Sistema de arquivos
🔁 Fluxo de Utilização

graph LR
A[Acesso à Interface Web] --> B[Upload da Planilha]
B --> C[Upload dos Templates]
C --> D[Upload das Fotos]
D --> E[Escolha: Geração Individual ou em Lote]
E --> F[Processamento dos Dados]
F --> G[Geração dos PDFs]
G --> H[Download dos Arquivos]

✅ Benefícios

    ⏱️ Economia de tempo: substitui um processo 100% manual

    🖋️ Padronização visual e informacional

    👨‍💻 Interface amigável sem necessidade de conhecimento técnico

    🔁 Atualização fácil: altere dados e gere novos PDFs rapidamente

    🧩 Flexível: geração individual ou em lote

📁 Estrutura de Pastas (Exemplo)

/uploads
  ├── fotos/
  ├── templates/
  └── planilhas/

/output
  ├── individuais/
  └── lote/

🚀 Tecnologias Utilizadas

    Node.js

    Express.js

    EJS

    Bootstrap

    pdfkit

    canvas

    xlsx

💡 Considerações Finais

Este projeto foi criado para facilitar o trabalho administrativo da igreja, trazendo automação, organização e eficiência ao processo de emissão de carteirinhas.

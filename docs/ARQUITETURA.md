\# Arquitetura do Sistema NAVE — Curadoria Pedagógica ENEM



\## Visão geral



O sistema organiza o fluxo de curadoria pedagógica de questões do ENEM, da busca e classificação até a validação, governança e editoração.



\## Camadas



\### 1. Base de dados

Google Sheets



Principais abas:

\- QUESTOES\_GERAL

\- USUARIOS

\- VALIDACAO\_DOCENTE

\- FILA\_COORDENACAO\_V05

\- SEQUENCIAS\_SALVAS

\- ITENS\_SEQUENCIAS

\- SEQUENCIAS\_WEB\_ATUAIS

\- PROJETOS\_EDITORIAIS

\- ITENS\_EDITORACAO

\- FONTES\_PDF



\### 2. Backend

Google Apps Script



Responsabilidades:

\- autenticação e permissões;

\- busca de questões;

\- cadastro manual;

\- sequências;

\- validação docente;

\- governança da coordenação;

\- editoração;

\- performance e cache.



\### 3. Frontend

HTML, CSS e JavaScript servidos pelo Google Apps Script.



Principais módulos da aplicação:

1\. Início

2\. Buscar questões

3\. Cadastrar questão

4\. Sequência atual

5\. Minhas sequências

6\. Validações

7\. Usuários

8\. Coordenação

9\. Editoração



\### 4. Editoração

Fluxo híbrido Apps Script + RStudio.



O Web App:

\- organiza projetos editoriais;

\- relaciona fontes PDF;

\- registra gabaritos;

\- gera pacote técnico CSV.



O RStudio:

\- baixa PDFs originais;

\- localiza páginas;

\- executa recortes;

\- reutiliza coordenadas;

\- gera caderno do estudante;

\- gera caderno do professor.



\## Versionamento



\### Apps Script

Sincronização local:

\- clasp pull

\- clasp push



\### Git

Controle de versões local.



\### GitHub

Repositório remoto:

nave-curadoria-pedagogica-enem



\### Primeira versão estável registrada

v1.9.2



\## Fluxo de desenvolvimento



Apps Script online

↕ clasp



Código local

↕ Git



GitHub



\## Regra de segurança



Nunca executar clasp push sem antes:



git status

git diff



Se houver dúvida sobre qual versão é mais recente, executar primeiro:



clasp pull



e revisar as diferenças antes de qualquer envio.


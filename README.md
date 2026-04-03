# Finova: Sistema de Gestão Financeira Premium

**Finova** é um sistema web responsivo e de interface moderna para gerenciamento pessoal de patrimônio e controle de finanças. Desenvolvido com **React** + **Vite**, **Tailwind CSS v4** e plataforma serverless com **Supabase**.

## 🚀 Funcionalidades Principais

- **Autenticação Segura (Supabase Auth)**: O sistema exige criação de conta. Todos possuem as próprias partições de dados invisíveis entre si via *Row Level Security (RLS)*.
- **Dashboard Interativo (React + Recharts)**: 
  - Exibição totalizadora e em tempo real do **Saldo Atual**, **Receitas** e **Despesas**.
  - **Gráficos de Evolução Mensal**: Acompanhamento assíncrono para mapeamento de gastos ao longo dos meses.
  - **Gráfico de Donut por Categoria**: Visualização colorida que respeita as "hashtags" de cores das próprias categorias definidas por cada usuário.
- **Transações Dinâmicas (Módulo CRUD)**: Aba completa ("Transações") com busca inteligente via digitação (instant search), inserção, edição paramétrica e exclusão de receitas/despesas conectadas nativamente à tabela de 'Categorias'.
- **Gerenciador de Categorias Personalizadas ("Settings")**: Aba de Configurações contendo "Catálogo Padrão", capaz de injetar dezenas de categorias comuns automaticamente com base em grupos + Emojis (🏠 Moradia, 🍔 Alimentação). Você também pode criar, colorir e deletá-las.
- **Modo Claro / Escuro (Light/Dark Mode)**: Sistema contextual que herda a preferência do Sistema Operacional, e permite alteração manual. Inclui gravação de preferência de perfil diretamente no `localStorage` do navegador para acessos futuros.
- **📱 Híbrido Nativo (Android via Capacitor)**: A infraestrutura possuí wrapper oficial da engine do Google compilada `(android/)`, possibilitando exportar o mesmo código-fonte em React diretamente para o Android Studio e gerar APKs instaláveis perfeitamente responsivos em celulares Android.

## 🔐 Níveis de Acesso e Segurança

O projeto segue estritos padrões de modelagem web:
- **Proteção de Variáveis**: Quaisquer dados sensíveis de acesso ao banco (API Keys e URLs) são blindados através de um arquivo `.env` ocultado do controle de versão pelo `.gitignore`.
- **Acesso Privado às Rotas**: O usuário **obrigatoriamente** precisa estar logado para visualizar o Dashboard e fazer transações. Visitantes deslogados são redirecionados de volta à tela inicial de Login.

## 💻 Instalação e Execução

### 1. Requisitos Prévios

Você precisará do `Node.js` instalado na sua máquina contendo o NPM contido no LTS, e uma conta base ativa e gratuita no [Supabase Platform](https://supabase.com).

### 2. Configurando o Banco de Dados Nuvem

Entrando no projeto pelo Supabase (Aba **SQL Editor**):
1. Copie o conteúdo inteiro originário do arquivo estático `supabase-schema.sql` (enviado nesse repositório) e mande executar.
2. Todo o framework relacional do seu projeto `(profiles, categories e transactions)` já nascerá com permissões blindadas contra vândalos injetada!

### 3. Váriaveis de Ambiente Local

Renomeie ou crie um arquivo `.env` na pasta raiz (junto do package.json) utilizando suas chaves geradas em the Supabase *Project Settings* > *API*:

\`\`\`env
VITE_SUPABASE_URL=sua_url_https_aqui
VITE_SUPABASE_ANON_KEY=sua_anon_key_giant_aqui
\`\`\`

### 4. Rodando a Aplicação Localmente (Web)

Dentro da pasta do projeto via seu terminal (`Bash / CMD`):

\`\`\`bash
# Instalar a montanha de dependências (Recharts, Lucide, Tailwind, React-Dom)
npm install

# Startar Vite Dev Server Portátil
npm run dev
\`\`\`

Acesse \`http://localhost:5173\` num navegador em tempo real para visualizar o sistema no ar e crie um login de teste na mesma hora!

### 5. Compilando o App de Celular (Mobile APK)

Para gerar e extrair o arquivo Mobile na sua máquina que já possui integração gerada na pasta \`android/\`, siga as etapas:

1. Gere um novo Build da web minificado garantido: \`npm run build\`
2. Sincronize a nova web atualizada aos scripts do celular via Capacitor: \`npx cap sync android\`
3. Abra a pasta raiz do projeto \`android/\` pelo software **Android Studio**.
4. Deixe o *"Gradle"* sincronizar internamente (levará alguns minutos) e em seguida no topo do programa, vá em `Build > Build Bundle(s) / APK(s) > Build APK(s)`. O app será ejetado 100% nativo!

## 🛠️ Stack Tecnológica

- **React 18** com Renderizações baseadas no vite.
- Estilização super-otimizada feita à mãos na recém-lançada biblioteca do **Tailwind CSS v4** (Utilizando `.dark` variants customizadas).
- BaaS (Backend) hospedado via **Supabase**.
- Gráficos renderizados e responsivos via matemática vetorial com a **Recharts**.
- Ícones em peso leve pela **Lucide React**.

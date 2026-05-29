# FIT 2026 — XIII Fórum de Inovação e Tecnologia

![Logo FIT 2026](assets/img/logo-fit-2026.svg)

**Design (Figma):** https://www.figma.com/design/G9g2X63V1NWueLViuVeemw/FIT-2026?node-id=0-1&t=vCJauIb6DqxANiBX-1

**Tema:** Inteligência Artificial: suas Aplicações e Desafios  
**Data:** 04 a 08 de Outubro de 2026  
**Local:** UFC — Campus Crateús, Ceará

---

## Visão Geral do Sistema

Este projeto é o site oficial do FIT 2026, o maior evento universitário de tecnologia do Sertão de Crateús. O sistema é composto por:

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Página principal pública do evento |
| `coming-soon.html` | Página de pré-lançamento/antecipação |
| `auth/admin.html` | Painel administrativo (CRUD de palestrantes/patrocinadores) |

---

## Arquitetura

```
fit-2026-main/
├── index.html              # Página principal do evento
├── coming-soon.html        # Página "Em Breve" (pré-evento)
├── auth/
│   ├── admin.html          # Painel administrativo
│   ├── admin.js           # Lógica do painel admin
│   └── admin.css         # Estilos do painel admin
└── assets/
    ├── css/
    │   └── style.css      # Estilos globais do site
    ├── js/
    │   ├── script.js       # JavaScript do site principal
    │   └── firebase-config.js  # Configuração Firebase
    ├── data/
    │   └── programacao.json    # Programação do evento (5 dias)
    └── img/               # Imagens e logos
```

---

## Tecnologias Utilizadas

| Tecnologia | Finalidade |
|------------|------------|
| **HTML5** | Estrutura semântica das páginas |
| **Tailwind CSS** | Framework CSS utilitário (via CDN) |
| **CSS Customizado** | Estilos específicos do tema IA |
| **JavaScript (ES6)** | Interatividade e lógica |
| **Firebase Firestore** | Banco de dados NoSQL (palestrantes/patrocinadores) |
| **Firebase Auth** | Sistema de autenticação do painel admin |
| **Font Awesome 7** | Ícones |
| **Google Fonts (Inter)** | Tipografia |

---

## Páginas

### 1. Página Principal (`index.html`)

#### Seções:
- **Header/Navbar**: Navegação fixa com menu responsivo (mobile)
- **Hero**: Apresentação do evento com countdown e ilustração animada de IA
- **Countdown**: Timer regressivo para o evento
- **Programação**: Abas por dia com cards das atividades
- **Palestrantes**: Grid de cards (carregados do Firebase)
- **Patrocinadores**: Seções por categoria (Diamante, Prata, Apoio de Mídia)
- **Sobre o Evento**: História do FIT e edições anteriores
- **Organizadores**: Logos das instituições realizadoras
- **Footer**: Contato, redes sociais e créditos

#### Funcionalidades JavaScript:
- **Countdown**: Atualização em tempo real (dias, horas, minutos, segundos)
- **Menu Mobile**: Toggle de abertura/fechamento
- **Scroll Suave**: Navegação por âncoras
- **Header Scroll**: Efeito de background ao rolar
- **Fade-in Animations**: Animações de entrada ao scroll
- **Programação Dinâmica**: Carregamento do JSON
- **Palestrantes/Patrocinadores**: Carregamento do Firebase Firestore

---

### 2. Página "Em Breve" (`coming-soon.html`)

Página minimalista para o período pré-evento, contendo:
- Logo animado FIT 2026
- Tagline do tema
- Countdown regressivo
- Botões: Voluntário (link para formulário) e Edição 2025
- Seção de organizadores com logos
- Partículas animadas de fundo
- Ícone de cérebro IA com animação de desenho SVG

---

### 3. Painel Administrativo (`auth/admin.html`)

Sistema de gerenciamento para organizadores do evento.

#### Autenticação:
- Login com email/senha
- Login com Google (OAuth)
- Proteção de rotas (páginas só acessíveis após login)

#### Funcionalidades:

##### Palestrantes (CRUD):
| Campo | Descrição |
|-------|-----------|
| `nome` | Nome completo |
| `cargo` | Função/título |
| `tema` | Tema da palestra |
| `foto` | URL da foto (opcional) |
| `ordem` | Posição de exibição |

##### Patrocinadores (CRUD):
| Campo | Descrição |
|-------|-----------|
| `nome` | Nome da empresa |
| `tier` | Categoria (diamante/prata/midia) |
| `logo` | URL do logo (opcional) |
| `ordem` | Posição de exibição |

#### Interface:
- Tabela listando itens com ações (Editar/Excluir)
- Modais para adicionar/editar registros
- Notificações toast para feedback
- Badges coloridos por categoria de patrocinador

---

## Banco de Dados (Firebase Firestore)

### Collections:

#### `palestrantes`
```javascript
{
  nome: "Nome Completo",
  cargo: "Professor/Pesquisador",
  tema: "IA Generativa e o Futuro",
  foto: "https://url-da-foto.com/foto.jpg", // opcional
  ordem: 1 // número para ordenação
}
```

#### `patrocinadores`
```javascript
{
  nome: "Empresa XYZ",
  tier: "diamante" | "prata" | "midia",
  logo: "https://url-do-logo.com/logo.png", // opcional
  ordem: 1 // número para ordenação
}
```

---

## Programação (JSON)

O arquivo `programacao.json` contém a estrutura de 5 dias de evento:

```json
{
  "dias": [
    {
      "id": "day1",
      "label": "Dia 1",
      "data": "04/10",
      "diaSemana": "Domingo",
      "atividades": [
        {
          "horario": "08:00 - 09:00",
          "titulo": "Credenciamento",
          "palestrante": "Diretoria",
          "local": "Pátio da UFC",
          "tipo": "abertura",
          "tipoLabel": "Abertura"
        }
      ]
    }
  ]
}
```

#### Tipos de Atividade:
| Tipo | Cor | Descrição |
|------|-----|-----------|
| `abertura` | Roxo | Cerimônias, aberturas, encerramento |
| `palestra` | Laranja | Palestras principais |
| `minicurso` | Rosa | Workshops e minicursos |
| `coffee` | Verde | Intervalos e coffee breaks |
| `startufc` | Azul | Competições e eventos especiais |

---

## Configuração Firebase

O projeto utiliza Firebase Realtime Database (Firestore) com as seguintes credenciais:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAOGVRFFgUoYA8MvDkaIjGumNzEkGzcEHY",
  authDomain: "fit-crateus.firebaseapp.com",
  projectId: "fit-crateus",
  storageBucket: "fit-crateus.firebasestorage.app",
  messagingSenderId: "88037686885",
  appId: "1:88037686885:web:53e6860fa068e003ac908c"
};
```

---

## Tema Visual

### Paleta de Cores:
| Cor | Hex | Uso |
|-----|-----|-----|
| Laranja | `#FF6A00` | Acentos primários |
| Vermelho | `#FF3700` | Alertas, destaques |
| Verde Neon | `#00FF09` | Sucesso, online |
| Verde Escuro | `#009405` | Secundário |
| Azul Escuro | `#021031` | Background principal |
| Azul Claro | `#00C7F8` | Links, interativos |
| Preto | `#000000` | Fundos, contraste |

### Elementos Visuais:
- Gradientes diagonais em background
- Cards com bordas sutis
- Ícones flutuantes animados
- Chip de IA central na hero
- Circuitos neurais em SVG
- Efeitos de glow em elementos interativos

---

## Responsividade

O site é totalmente responsivo com breakpoints em:
- **Desktop**: > 1024px (layout completo)
- **Tablet**: 768px - 1024px (grid adaptado)
- **Mobile**: < 768px (menu hamburger, cards empilhados)

---

## SEO

### Meta Tags:
- Description e Keywords otimizadas
- Open Graph para redes sociais
- Twitter Cards
- Schema.org (Event e WebSite)
- Canonical URL

---

## Fluxo de Uso

### Visitante Comum:
1. Acessa o site → vê informações completas do evento
2. Navega pela programação
3. Conhece palestrantes e patrocinadores
4. Clica em "Inscreva-se" → redirecionamento para formulário externo

### Administrador:
1. Acessa `/auth/admin.html`
2. Faz login (email/senha ou Google)
3. Gerencia palestrantes (CRUD)
4. Gerencia patrocinadores (CRUD)
5. Alterações refletem automaticamente no site público

---

## Segurança

- Autenticação Firebase para painel admin
- Credenciais Firebase expostas (apenas leitura pública)
- Firestore Rules devem ser configuradas para permitir apenas write autenticado
- Página admin com `noindex, nofollow` para não aparecer em buscas

---

## Próximos Passos para Produção

1. **Firestore Rules**: Configurar regras de segurança
2. **Formulário de Inscrição**: Criar/vincular formulário externo (Google Forms, Typeform, etc.)
3. **Hospedagem**: Deploy em Firebase Hosting ou similar
4. **SSL**: Garantir HTTPS (obrigatório para Firebase)
5. **Domínio**: Configurar domínio customizado (fit.crateus.ufc.br)

---

## Equipe de Desenvolvimento

**Núcleo de Comunicação do FIT — UFC Crateús**

- Vicente Neto

---

## Edições Anteriores

- FIT 2025 — Internet das Coisas
- FIT 2024 — Segurança em Redes
- FIT 2023 — Otimização
- FIT 2022 — Era dos Dados
- FIT 2021 — Empreendedorismo
- FIT 2020 — Cloud Computing
- FIT 2019 — Inteligência Artificial
- FIT 2018 — Eu amo Inovação
- FIT 2017 — 4ª Edição

---

*FIT 2026 — XIII Fórum de Inovação e Tecnologia*
*Universidade Federal do Ceará — Campus Crateús*

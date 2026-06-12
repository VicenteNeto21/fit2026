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

---

## Arquitetura

```
fit-2026-main/
├── index.html              # Página principal do evento
├── coming-soon.html        # Página "Em Breve" (pré-evento)
└── assets/
    ├── css/
    │   └── style.css      # Estilos globais do site
    ├── js/
    │   └── script.js       # JavaScript do site principal
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
| **Font Awesome 6** | Ícones |
| **Google Fonts (Inter)** | Tipografia |

---

## Páginas

### 1. Página Principal (`index.html`)

#### Seções:
- **Header/Navbar**: Navegação fixa com menu responsivo (mobile)
- **Hero**: Apresentação do evento com logo, informações, botões de ação e ilustração da Raposa FIT
- **Countdown**: Timer regressivo para o evento
- **Programação**: Abas por dia com cards das atividades
- **Palestrantes**: Grid de cards estáticos
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
- **Palestrantes/Patrocinadores**: Dados embutidos na interface estática

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
- Fundo com grid e padrões de background (radial-gradient)
- Ilustração central da Raposa FIT na hero
- Efeitos de glow e drop-shadow na raposa e elementos de destaque
- Efeitos de glow em elementos interativos

---

## Responsividade

O site é totalmente responsivo com breakpoints em:
- **Desktop**: > 1024px (layout completo e espaçado)
- **Tablet**: 768px - 1024px (grid adaptado, gap reduzido)
- **Mobile**: 480px - 768px (menu hamburger, hero em coluna, cards e countdown empilhados)
- **Mobile Pequeno**: < 480px (grids de 1 coluna, tamanho de fontes e componentes otimizados)

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

---

## Segurança

- Interface estática sem backend conectado

---

## Próximos Passos para Produção

1. **Formulário de Inscrição**: Criar/vincular formulário externo (Google Forms, Typeform, etc.)
2. **Hospedagem**: Deploy em GitHub Pages, Vercel ou similar
3. **Domínio**: Configurar domínio customizado (fit.crateus.ufc.br)

---

## Pendências e Tarefas

### Design/UI
- [x] **Atualizar tema visual**: Aplicar nova paleta de cores e estilo
- [x] **Logo na Hero**: Substituir ilustração do chip de IA pela logo oficial e ilustração da raposa
- [ ] **OG Image**: Criar imagem Open Graph (1200x630px)
- [ ] **Favicon SVG**: Atualizar favicon com nova identidade visual

### Funcionalidades
- [ ] **Link de Inscrição**: Configurar URL real do formulário de inscrição
- [ ] **Formulário Voluntários**: Atualizar link do Google Forms
- [ ] **Contagem Regressiva**: Data correta configurada (04/10/2026)

### Dados
- [x] **Cadastrar Palestrantes**: Adicionar dados reais dos palestrantes localmente
- [x] **Cadastrar Patrocinadores**: Adicionar empresas e logos localmente
- [ ] **Verificar Programação**: Confirmar atividades e horários do JSON

### Imagens
- [ ] **Logos Organizadores**: Adicionar logos de:
  - [ ] FIT Crateús
  - [ ] UFC
  - [ ] Sebra
  - [ ] GSIPP
  - [ ] EngineLab
  - [ ] SPARC
- [x] **Fotos Palestrantes**: Fotos inseridas no diretório `assets/img/speakers`
- [x] **Logo Patrocinadores**: Logos inseridas no diretório `assets/img/sponsors`

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

# FIT 2026 — Specification Document

## Overview

**FIT** (Fórum de Inovação e Tecnologia) é o maior evento de tecnologia e inovação do Ceará, organizado pela UFC Crateús. Este repositório contém o site da edição XIII (2026).

- **Website:** https://fit.crateus.ufc.br
- **Tema:** Inteligência Artificial: suas Aplicações e Desafios
- **Data:** 04 a 08 de Outubro de 2026
- **Edição:** XIII

---

## Branding

### Nome do Evento
- **Nome completo:** FIT — XIII Fórum de Inovação e Tecnologia
- **Versão curta:** FIT 2026

### Descrição
O maior fórum tecnológico da região, reunindo estudantes, profissionais e entusiastas de tecnologia para discutir tendências, inovações e desafios da Inteligência Artificial.

---

## Identidade Visual

### Paleta de Cores

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| **Orange** | `#FF5F17` | rgb(255, 95, 23) | Cor primária, destaques, CTAs |
| **Yellow/Gold** | `#FFC800` | rgb(255, 200, 0) | Acentos, gradientes |
| **Red** | `#DC2626` | rgb(220, 38, 38) | Tags "Encerradas" |
| **Black** | `#000000` | rgb(0, 0, 0) | Background principal |
| **White** | `#FFFFFF` | rgb(255, 255, 255) | Textos principais |
| **Gray Light** | `#888888` | rgb(136, 136, 136) | Textos secundários |
| **Gray Dark** | `#333333` | rgb(51, 51, 51) | Textos em backgrounds claros |

### Tipografia

| Fonte | Peso | Uso |
|-------|------|-----|
| **Encode Sans** | 400-900 | Font principal do site (títulos, corpo) |
| **Sofia Sans** | 400-900 | Font secundária |
| **Inter** | 400-900 | Fallback geral |

---

## Estrutura do Site

### Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Página principal com speakers, programação, etc. |
| `coming-soon.html` | Landing page de contagem regressiva |
| `links.html` | Página de links úteis |
| `auth/admin.html` | Painel administrativo |

### Organizadores (Logos)
- `assets/img/organizers/logo-fit-oficial.svg` — Logo oficial FIT
- `assets/img/organizers/logo-ufc.png` — Logo UFC
- `assets/img/organizers/gsipp.png` — GSIPP
- `assets/img/organizers/enginelab.png` — EngineLab
- `assets/img/organizers/sparc.png` — SPARC

---

## Componentes — coming-soon.html

### Layout
- Fundo: Gradiente com radial gradients laranja/amarelo + linear black
- Grid pattern sutil (80x80px) em rgba branco
- Container centralizado com z-index 10

### Título Principal
```html
<h1 style="font-size: clamp(2.5rem, 10vw, 5rem); font-weight: 900;">
    <span style="color: #ffffff">FIT</span>
    <span style="color: #FF5F17"> 2026</span>
</h1>
```
- FIT: branco (#FFFFFF)
- 2026: laranja (#FF5F17)

### Countdown
- Layout: Grid 4 colunas (Dias, Horas, Min, Seg)
- Cards com fundo semi-transparente e borda sutil
- Números em gradiente branco
- Labels em cinza claro, uppercase
- Responsivo: tamanhos adaptam com breakpoints sm/md/lg

### Botões de Inscrição

**Encerrados (não clicáveis):**
```html
<div class="relative">
    <span class="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-gray-300">
        <i class="fas fa-gamepad"></i>
        Perfil Gamer
    </span>
    <span class="absolute -top-2 -right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
        Encerradas
    </span>
</div>
```
- Botão: fundo branco/5, borda branca/10, texto cinza claro
- Tag: fundo vermelho (#DC2626), posicionada no canto superior direito

**Status das Inscrições:**
| Link | Status |
|------|--------|
| Perfil Gamer | ❌ Encerradas |
| Voluntário | ❌ Encerradas |
| Edição 2025 | ✅ Ativo |

### Organizadores
- Logos em row horizontal, centrados
- Efeito grayscale por padrão, cor no hover
- Espaçamento responsivo (gap-4 a gap-8)

---

## Links Importantes

| Link | URL | Status |
|------|-----|--------|
| **Perfil Gamer** | https://forms.gle/perfil-gamer-fit2026 | Encerrado |
| **Voluntários** | https://forms.gle/WrNpp3KVtz7iWyfe7 | Encerrado |
| **Edição 2025** | https://fit.crateus.ufc.br/ano/2025 | Ativo |
| **Instagram** | https://www.instagram.com/fitcrateus/ | — |
| **Email** | fit@crateus.ufc.br | — |

---

## Convenções de Código

### HTML
- Idioma: `pt-BR`
- Charset: `UTF-8`
- Viewport: `width=device-width, initial-scale=1.0`
- Favicon: `assets/img/favicon.svg`

### CSS/Tailwind
- Usar classes utilitárias do Tailwind quando possível
- Estilos customizados no `<style>` inline ou em `assets/css/`
- Background sempre preto (#000000)

### JavaScript
- Countdown usa `setInterval` de 1 segundo
- Event date: `2026-10-04T08:00:00-03:00`

---

## Histórico de Decisões

### coming-soon.html (v2 — Atual)
- Layout minimalista e limpo
- Contagem regressiva centralizada
- Título "FIT 2026" com FIT branco e 2026 laranja
- Botões "Encerradas" em vermelho para inscrições fechadas
- Organizadores em row horizontal com hover grayscale
- Fundo: gradiente + grid pattern sutil
- Responsivo com breakpoints sm/md/lg

### coming-soon.html (v1)
- Layout split 60/40 com painel HUD
- Rede neural animada (experimental — removida)
- Estilo brutalista/game

---

*Última atualização: Maio 2026*
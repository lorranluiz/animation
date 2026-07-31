# Resumo do Projeto "Animation Studio"

## Contexto

SVG-based animation tool com câmera (zoom, blur, rotação 3D, translação), keyframes múltiplos, timeline interativa, caneta marcadora, gravação de vídeo, exportação.

## Estrutura do Projeto

```
/home/lorranluiz/animation/
  server.js              # Servidor HTTP local (node, porta 3000)
  start.sh / stop.sh     # Scripts para iniciar/parar servidor
  convert.py             # Conversão WebM→MP4 (imageio+ffmpeg)
  .venv/                 # Virtual env Python com imageio
  library/
    svg-animation-lib.js # Biblioteca principal (bundled)
    modules/             # Módulos individuais:
      svg-helpers.js, camera.js, physics-engine.js,
      parallax.js, perspective-lines.js, trajectory.js,
      ruler.js, vertical-ruler.js, input-manager.js,
      ui-manager.js, keyframe.js, timeline.js, highlighter.js
    README.md
  test/
    zoom-imagem.svg      # Aplicação principal (tudo em um SVG)
    simulacao-teste.svg  # SVG de teste da simulação física
  mapa brasil 1.jpg      # Imagem padrão
```

## Biblioteca (classes principais)

- `SVGAnim.Helpers` — utilitários, `easeInOut(t)`
- `SVGAnim.Camera` — zoom, blur, rotação 3D, translação, perspectiva
- `SVGAnim.Keyframe` — unidade de keyframe com `lerp(other, t)`, `clone()`
- `SVGAnim.Timeline` — duração, `kfToScreenX(tempo)`, `syncDuracaoSlider()`
- `SVGAnim.Highlighter` — marcador de caneta, `addMark()`, `computeFactor()`

## Funcionalidades do SVG Principal

### Câmera
- Zoom (0.1–∞ via slider/number input + Ctrl+scroll)
- Blur (Gaussian, 0–15px)
- Rotação 3D: Pitch (rotateX), Yaw (rotateY), Roll (rotateZ)
- Translação: Tx, Ty (pixels)
- Perspectiva (fixa 800px)
- Easing: `H.easeInOut(t)` = Hermite cúbica assimétrica

### Keyframes
- Múltiplos keyframes, cada um com todos os parâmetros da câmera
- Adicionar/remover KFs via botões +/-
- Arrastar KFs na timeline (exceto KF0 fixo em t=0)
- Navegação: setas ← →, Home, End
- Animação: interpolação linear entre segmentos, com easing
- Pause/Resume (Espaço/Play toggle)

### Timeline
- Duração total configurável (slider + number input)
- Cada KF tem tempo próprio (posição na barra)
- Barra de progresso durante reprodução
- Tempo mínimo = tempo do último KF

### Caneta Marcadora (Highlights)
- Botão 🖊️ toggle: ativa modo de marcação (câmera neutralizada)
- Desenho: clique-arraste com botão esquerdo
- Borracha 🧹: alterna modo, clique apaga traço existente
- Botão direito: pan (arrastar imagem) no modo de marcação
- Cursor: bolinha colorida sobre a imagem, some sobre toolbars
- Tecla Tab: alterna ordem das camadas (imagem/toolbars)
- Cor personalizável (color picker) + opacidade (0.05–1.0)
- Espessura configurável (1–20px)
- Marcas aparecem/desaparecem com timing animado entre KFs
- Camada única: dentro de `camadaZoom` (segue câmera)

### Barra de Ferramentas
- Botões na barra superior: 📁 Upload, 📂 Open Projeto, ▶ Play, 💾 Save, 🖊️ Caneta, 🧹 Borracha, ● Gravar, 🗑 Reset
- Painel inferior com sliders/inputs numéricos para todos os parâmetros
- Sliders + number inputs sincronizados bidirecionalmente
- Timeline + painel arrastável via alça (modo marcação)
- Modo Exibição (checkbox) — esconde barras durante play

### Resolução
- Select: Full / YouTube 16:9 / Instagram 9:16 (label, render 9:18)
- Letterbox: barras pretas opacas durante play, guias tracejadas na edição
- Barras estendem-se 10.000px além do viewBox

### Gravação
- Screen Capture API (getDisplayMedia + MediaRecorder)
- Auto: clica Gravar → fullscreen → play → auto-stop → download
- Conversão WebM→MP4 via servidor (POST /convert → convert.py → ffmpeg)

### Persistência
- localStorage (chave `SVG_ZOOM_STATE`)
- Salva: keyframes, highlights, checkboxes, imagem (data URL), modo exibição, resolução
- Save/Open projeto: download/upload de arquivo .json
- Reset: limpa localStorage + confirmação

### Controles
- Zoom: slider + Ctrl+scroll sobre imagem
- Translação: arrastar imagem (fora de modo caneta)
- Keyframes: arrastar na timeline, setas navegação
- Play/Pause: botão ou Espaço
- Home/End: primeiro/último KF

## Problema Atual (NÃO RESOLVIDO)

**Persistência quebrada** — ao recarregar (F5), o projeto volta ao estado padrão (2 KFs, zoom 1.0, blur 7, etc). O `salvarEstado()` e `carregarEstado()` existem e são chamados, mas algo falha no ciclo.

Possíveis causas investigadas (todas descartadas):
1. `timeline.keyframes` não atualizado → já corrigido com `timeline.keyframes = keyframes`
2. Duplicate `salvarEstado`/`carregarEstado` → não há
3. Array reassignment em Reset/carregarEstado → já corrigido com `.length = 0` + `.push()`
4. Erro no `highlighter.toJSON()` → retorna `{}`, seguro
5. Slider `input` event disparando `salvarEstado` durante restore → sim, mas os dados são os mesmos

**Hipótese provável:** o localStorage pode conter dados de formato antigo (zoom salvo como 10-30 ao invés de 1.0-3.0) que corrompem o restore e fazem `salvarEstado` subsequente sobrescrever com defaults.

**Sugestão para debug:** abrir console e executar:
```javascript
localStorage.getItem('SVG_ZOOM_STATE')
JSON.parse(localStorage.getItem('SVG_ZOOM_STATE'))
```
Verificar se os dados estão lá e se o formato está correto.

## Comandos Úteis

```bash
cd /home/lorranluiz/animation
./start.sh    # inicia servidor em http://localhost:3000/
./stop.sh     # para servidor
```

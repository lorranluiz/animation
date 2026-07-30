# SVG Animation Library (`svg-animation-lib.js`)

Biblioteca JavaScript para animações e simulações físicas em arquivos SVG. Projetada para ser importada diretamente dentro de documentos SVG via tag `<script>`.

## Estrutura de Arquivos

```
library/
  svg-animation-lib.js     ← Arquivo único com tudo (recomendado para produção)
  modules/
    svg-helpers.js          ← Utilitários SVG (criação de elementos, coordenadas)
    physics-engine.js       ← Motor de física com passo fixo
    camera.js               ← Sistema de câmera com suavização
    parallax.js             ← Fundo com efeito paralaxe
    perspective-lines.js    ← Linhas de perspectiva convergindo ao ponto de fuga
    trajectory.js           ← Gravador/renderizador de trajetória tracejada
    ruler.js                ← Régua horizontal dinâmica
    input-manager.js        ← Gerenciador de entrada de teclado
    ui-manager.js           ← Binding de inputs HTML ↔ displays SVG
test/
  simulacao-teste.svg       ← SVG de exemplo que reproduz a simulação original
```

## Como Importar em um Arquivo SVG

Adicione a tag `<script>` com o caminho para a biblioteca **antes** do seu código:

```xml
<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" tabindex="0" id="svgRaiz">
  <!-- ... elementos visuais ... -->

  <script type="text/javascript" href="caminho/para/svg-animation-lib.js" />
  <script type="text/javascript"><![CDATA[
    // Seu código aqui - todos os módulos estão em SVGAnim.*
    var engine = new SVGAnim.PhysicsEngine({ gravity: 9.8 });
    var camera = new SVGAnim.Camera({ smoothness: 0.08 });
    // ...
  ]]></script>
</svg>
```

**Importante:** O SVG deve ser aberto diretamente no navegador (não como `<img>` em HTML), pois scripts não executam em contexto de imagem.

---

## Módulos

### 1. `SVGAnim.Helpers` — Utilitários SVG

Funções auxiliares para criação e manipulação de elementos SVG.

| Método | Descrição |
|---|---|
| `Helpers.createElement(tag, attrs, children)` | Cria elemento SVG com namespace correto |
| `Helpers.clearElement(el)` | Remove todos os filhos de um elemento |
| `Helpers.worldToScreenX(worldX, cameraX, scale)` | Converte X do mundo para X da tela |
| `Helpers.worldToScreenY(worldY, groundY, scale)` | Converte Y do mundo para Y da tela |
| `Helpers.worldToScreen(worldX, worldY, cameraX, groundY, scale)` | Converte (x,y) do mundo para tela |
| `Helpers.get(id)` | Atalho para `document.getElementById(id)` |
| `Helpers.setViewportSize(w, h)` | Define largura/altura do viewport |

**Sistema de Coordenadas:**
- **Mundo (world):** X e Y em metros. Y=0 é o chão, Y positivo é para cima.
- **Tela (screen):** X e Y em pixels. Y=0 é o topo, Y positivo é para baixo.

Conversão usada pela câmera: `screenX = CENTRO + (worldX - cameraX) * SCALE`

---

### 2. `SVGAnim.PhysicsEngine` — Motor de Física

Simulação física com passo fixo, gravidade, colisão com o chão, restituição e atrito.

```javascript
var engine = new SVGAnim.PhysicsEngine({
  gravity: 9.8,           // Aceleração gravitacional (m/s²)
  mass: 1.0,              // Massa do objeto (kg)
  scale: 40,              // Escala pixels/metro
  groundY: 0,             // Posição Y do chão no mundo (metros)
  restituicaoBase: 0.75,  // Coeficiente de restituição base
  atritoQuiqueBase: 0.85, // Atrito de quique (perda de Vx na colisão)
  muRolamento: 0.5,       // Coeficiente de atrito de rolamento
  fixedTimestep: 1/120,   // Passo fixo de física (segundos)
  maxDelta: 0.1,          // Delta máximo por frame (evita espiral da morte)
  alturaMaximaTela: 400   // Altura máxima Y da tela para clip
});
```

#### Métodos

| Método | Descrição |
|---|---|
| `launch(vx, vy)` | Lança a bola com velocidades iniciais. Reseta posição e câmera. |
| `step(timestamp)` | Avança a física. Deve ser chamado a cada `requestAnimationFrame`. |
| `reset()` | Reseta posição, velocidade e acumulador. |
| `getState()` | Retorna `{x, y, vx, vy, animando}`. |
| `isRunning()` | Retorna `true` se a simulação está ativa. |
| `setMass(m)` | Altera a massa. |
| `setGravity(g)` | Altera a gravidade. |
| `setScale(s)` | Altera a escala. |
| `getRestituicao()` | Coeficiente de restituição efetivo (depende da massa). |
| `getAtritoQuique()` | Atrito de quique efetivo. |
| `getAceleracaoRolamento()` | Aceleração de rolamento atual. |

#### Callbacks

```javascript
engine.onUpdate = function(state) {
  // Chamado a cada frame, após todos os sub-passos de física
  // Atualize a cena aqui (posição da bola, câmera, sombra, etc.)
};

engine.onStep = function(state) {
  // Chamado a cada sub-passo de física (1/120s)
  // Ideal para registrar pontos de trajetória
};

engine.onGroundCollision = function(state) {
  // Chamado quando a bola colide com o chão
};

engine.onStop = function(state) {
  // Chamado quando a simulação para (bola imóvel no chão)
};

engine.onLaunch = function(state) {
  // Chamado quando `launch()` é executado
};
```

#### Como Funciona a Física

1. **Integração:** Semi-implícita de Euler com passo fixo de 1/120s.
2. **Acumulador de tempo:** Garante consistência independente do framerate.
3. **Colisão com o chão:** Quando `y <= groundY`, inverte `vy` com restituição e reduz `vx` com atrito.
4. **Restituição depende da massa:** `restituicao = restituicaoBase / (1 + 0.5*massa)`. Massas maiores quicam menos.
5. **Atrito de quique:** `atrito = atritoQuiqueBase / (1 + 0.3*massa)`. Reduz velocidade horizontal na colisão.
6. **Atrito de rolamento:** Quando a bola está no chão (`y==0, vy==0`), aplica desaceleração horizontal.
7. **Parada:** A simulação para quando `|vx| < 0.05` E `|vy| < 0.05` E `y == groundY`.

---

### 3. `SVGAnim.Camera` — Sistema de Câmera

Câmera com suavização exponencial que segue um alvo. Também suporta zoom suave com centro configurável.

```javascript
var camera = new SVGAnim.Camera({
  smoothness: 0.08,       // Fator de suavização (0=lento, 1=instantâneo)
  scale: 40,              // Escala pixels/metro
  groundY: 0,             // Posição Y do chão no mundo
  screenCenterX: 400,     // Centro X da tela (pixels)
  screenGroundY: 420,     // Posição Y do chão na tela (pixels)
  maxY: 400,              // Altura máxima Y na tela

  // Zoom (opcional)
  zoom: 1.0,              // Nível de zoom atual (1.0 = sem zoom, 1.5 = 50%)
  zoomSmoothness: 0.05,   // Velocidade da suavização do zoom
  zoomCenterX: 400,       // Centro X do zoom na tela (pixels)
  zoomCenterY: 250        // Centro Y do zoom na tela (pixels)
});
```

| Método | Descrição |
|---|---|
| `follow(targetX, targetY)` | Define o alvo e aplica suavização |
| `getX()` | Retorna a posição X atual da câmera no mundo |
| `worldToScreenX(worldX)` | Converte X do mundo para X da tela |
| `worldToScreenY(worldY)` | Converte Y do mundo para Y da tela |
| `worldToScreen(worldX, worldY)` | Converte (x,y) do mundo para tela |
| `isOnScreen(screenX, margin)` | Verifica se uma coordenada X está visível |
| `reset()` | Reseta câmera e zoom para origem |
| `setSmoothness(s)` | Altera o fator de suavização do follow |
| `setZoomTarget(z)` | Define o zoom alvo (ex: `1.5` = 50% de zoom) |
| `setZoomCenter(cx, cy)` | Define o centro do zoom (coordenadas da tela) |
| `setZoomSpeed(s)` | Altera a velocidade da suavização do zoom |
| `update()` | Atualiza follow E zoom com suavização (um único método) |
| `getZoomTransform()` | Retorna string `translate(cx,cy) scale(z) translate(-cx,-cy)` para usar no atributo `transform` do SVG |

**Fórmula de suavização:**
```
cameraX += (targetX - cameraX) * smoothness
zoom    += (targetZoom - zoom) * zoomSmoothness
```

**Exemplo de uso com zoom em uma imagem:**

```javascript
var camera = new SVGAnim.Camera({ zoom: 1.0, zoomSmoothness: 0.02 });
camera.setZoomTarget(1.5);        // 50% de zoom
camera.setZoomCenter(400, 250);   // centro da tela

function animar() {
  camera.update();
  camada.setAttribute('transform', camera.getZoomTransform());
  if (Math.abs(camera.zoom - 1.5) > 0.001) {
    requestAnimationFrame(animar);
  }
}
requestAnimationFrame(animar);
```

---

### 4. `SVGAnim.ParallaxBackground` — Fundo com Paralaxe

Renderiza elementos de fundo (ex: nuvens) que se movem com velocidade diferente da câmera, criando sensação de profundidade.

```javascript
var nuvens = new SVGAnim.ParallaxBackground({
  container: document.getElementById('nuvensContainer'), // Elemento SVG container
  modelId: '#nuvemModelo',     // ID do <use> no <defs>
  numItems: 14,                // Quantidade de itens
  camera: camera,              // Instância de SVGAnim.Camera
  parallaxFactor: 0.6,         // 0 = fixo, 1 = move com câmera
  scale: 40,                   // Escala pixels/metro
  screenWidth: 800,            // Largura da tela
  margin: 200                  // Margem para wrap-around
});
```

| Método | Descrição |
|---|---|
| `init()` | Inicializa e renderiza itens |
| `update()` | Atualiza posições (wrap-around) e renderiza |
| `render()` | Renderiza todos os itens no container |
| `reset()` | Reinicia com novos itens aleatórios |
| `generateItems()` | Gera array de configurações de itens (sobrescrevível) |

**Wrap-around:** Quando um item sai da tela, ele reaparece do outro lado em posição aleatória.

**Sobrescrevendo `generateItems()` para customizar itens:**

```javascript
nuvens.generateItems = function() {
  var items = [];
  for (var i = 0; i < 10; i++) {
    items.push({
      posX: i * 5,              // Posição X no mundo
      posY: 50 + i * 20,        // Posição Y na tela
      scale: 0.8,               // Escala
      opacity: 0.9              // Opacidade
    });
  }
  return items;
};
```

---

### 5. `SVGAnim.PerspectiveLines` — Linhas de Perspectiva

Desenha linhas no chão que convergem a um ponto de fuga, criando efeito de perspectiva 3D.

```javascript
var perspectiva = new SVGAnim.PerspectiveLines({
  container: document.getElementById('linhasPerspectiva'),
  camera: camera,
  scale: 40,
  screenWidth: 800,
  screenHeight: 500,
  groundY: 420,                 // Y do chão na tela
  vanishY: 200,                 // Y do ponto de fuga
  step: 1.0,                    // Espaçamento entre linhas (metros)
  range: 10,                    // Alcance (metros para cada lado)
  strokeColor: 'rgba(0,80,0,0.25)',
  strokeWidth: '1.8'
});
```

| Método | Descrição |
|---|---|
| `update()` | Redesenha as linhas conforme a posição da câmera |

Use um `clipPath` no SVG para manter as linhas visíveis apenas no chão:

```xml
<clipPath id="clipChao">
  <rect x="0" y="420" width="800" height="80" />
</clipPath>
<g clip-path="url(#clipChao)" id="linhasPerspectiva"></g>
```

---

### 6. `SVGAnim.TrajectoryTracer` — Trajetória Tracejada

Registra pontos por onde o objeto passa e desenha um caminho tracejado.

```javascript
var trajetoria = new SVGAnim.TrajectoryTracer({
  pathElement: document.getElementById('trajetoriaPath'), // Elemento <path>
  camera: camera,
  scale: 40,
  groundY: 420,                 // Y do chão na tela
  active: true,                 // Ativa/desativa
  recordEvery: 2,               // Registrar a cada N passos
  minDistance: 0.01,            // Distância mínima entre pontos (evita duplicatas)
  strokeColor: '#FF4500',
  strokeWidth: '2',
  strokeDasharray: '6,4',
  opacity: '0.9'
});
```

| Método | Descrição |
|---|---|
| `addPoint(x, y)` | Adiciona ponto no sistema de mundo |
| `clear()` | Limpa todos os pontos |
| `redraw()` | Redesenha o caminho no elemento `<path>` |
| `setActive(bool)` | Ativa/desativa a trajetória |
| `isActive()` | Verifica se está ativa |
| `getPoints()` | Retorna cópia dos pontos registrados |

**Exemplo de uso com `onStep`:**

```javascript
engine.onStep = function(state) {
  trajetoria.addPoint(state.x, state.y);
};
```

**Elemento path necessário no SVG:**

```xml
<g clip-path="url(#clipTrajetoria)">
  <path id="trajetoriaPath" d="" fill="none" stroke="#FF4500"
        stroke-width="2" stroke-dasharray="6,4" opacity="0.9" />
</g>
```

---

### 7. `SVGAnim.DynamicRuler` — Régua Horizontal Dinâmica

Régua horizontal com marcações de metro que se move com a câmera.

```javascript
var regua = new SVGAnim.DynamicRuler({
  container: document.getElementById('reguaDinamica'),
  camera: camera,
  scale: 40,
  groundY: 420,                 // Y do chão na tela
  screenWidth: 800,
  range: 5,                     // Metros para cada lado
  unitLabel: 'm',               // Rótulo da unidade
  tickColor: '#333',
  tickWidth: '1.5',
  tickHeight: 10,               // Altura dos traços (pixels)
  labelOffset: 15               // Distância do número até o chão
});
```

| Método | Descrição |
|---|---|
| `update()` | Redesenha a régua conforme a posição da câmera |

---

### 8. `SVGAnim.VerticalRuler` — Régua Vertical Fixa

Régua vertical graduada em metros, fixa na tela, para visualizar a altura de objetos na simulação.

```javascript
var vRuler = new SVGAnim.VerticalRuler({
  container: document.getElementById('reguaVertical'),
  groundY: 420,                 // Y do chão (0m) na tela
  maxHeight: 10,                // Altura máxima em metros
  scale: 40,                    // Escala pixels/metro
  x: 10,                        // Posição X do fundo
  width: 18,                    // Largura do fundo
  bgColor: 'rgba(255,255,255,0.6)',
  borderColor: '#333',
  borderWidth: 1.5,
  borderRadius: 2,
  tickColor: '#333',
  tickWidthLong: '2',           // Traços nas extremidades (0 e max)
  tickWidthShort: '1.5',        // Traços intermediários
  tickLengthLong: 7,            // Comprimento traços extremos
  tickLengthShort: 5,           // Comprimento traços intermediários
  textOffsetX: 22,              // Distância X do texto
  textAnchor: 'end',            // Alinhamento do texto
  fontFamily: 'Arial, sans-serif',
  fontSize: '10',
  labelFontSize: 12,            // Tamanho do rótulo "m"
  unitLabel: 'm',               // Rótulo da unidade no topo
  labelOffsetY: 5               // Distância do rótulo ao topo
});
vRuler.render();
```

| Método | Descrição |
|---|---|
| `render()` | Renderiza a régua uma vez (não precisa de update, é fixa) |

---

### 9. `SVGAnim.InputManager` — Gerenciador de Teclado

Gerencia eventos de teclado com suporte a verificação de estado (pressionada/solta), ignorando inputs quando o foco está em campos de texto.

```javascript
var input = new SVGAnim.InputManager({
  svgElement: document.getElementById('svgRaiz'), // SVG raiz para foco
  ignoreTags: ['INPUT', 'TEXTAREA', 'SELECT'],    // Tags ignoradas
  preventDefaultDefault: true                     // Previne scroll em setas/espaço
});
```

| Método | Descrição |
|---|---|
| `onKey(key, callback)` | Callback ao pressionar (keydown, dispara uma vez) |
| `onKeyDown(key, callback)` | Callback ao pressionar (keydown) |
| `onKeyUp(key, callback)` | Callback ao soltar (keyup) |
| `isPressed(key)` | Verifica se a tecla está pressionada agora |
| `destroy()` | Remove todos os listeners |

**Teclas usam `event.code`:** `'Space'`, `'ArrowRight'`, `'ArrowLeft'`, `'ArrowUp'`, `'ArrowDown'`, `'KeyA'`, etc.

```javascript
// Lançar bola ao pressionar espaço (ignora se foco em input)
input.onKey('Space', function() {
  engine.launch(vx, vy);
  requestAnimationFrame(animar);
});

// Verificar se seta direita está pressionada durante o lançamento
var vx = input.isPressed('ArrowRight') ? v0_horizontal : 0;
```

**Importante:** O SVG precisa ter `tabindex="0"` e foco para receber eventos:

```xml
<svg ... tabindex="0" id="svgRaiz">
```

---

### 10. `SVGAnim.UIManager` — Gerenciador de Interface

Sincroniza campos HTML (`<input>`, `<checkbox>`) dentro de `foreignObject` com displays SVG (`<tspan>`, `<text>`).

```javascript
var ui = new SVGAnim.UIManager();
```

#### `bindInput(inputEl, displayEl, onChange, options)`

Vincula um campo numérico a um display e callback.

```javascript
ui.bindInput('massaInput', 'massaDisplay', function(val) {
  engine.setMass(val);
}, {
  format: '1f',    // '1f' = 1 decimal, '2f' = 2 decimais, '0f' = inteiro
  min: 0.1,        // Valor mínimo (opcional)
  max: 10.0        // Valor máximo (opcional)
});
```

#### `bindCheckbox(checkboxEl, onChange)`

Vincula um checkbox a um callback.

```javascript
ui.bindCheckbox('mostrarTrajetoria', function(checked) {
  trajetoria.setActive(checked);
});
```

#### `syncAll()`

Dispara todos os handlers para sincronizar valores iniciais.

#### `setValue(inputEl, value)`

Define o valor de um input programaticamente.

```javascript
ui.setValue('massaInput', 2.0);
```

**HTML no SVG via `foreignObject`:**

```xml
<foreignObject x="50" y="80" width="700" height="100">
  <div xmlns="http://www.w3.org/1999/xhtml" style="...">
    <label>Massa (kg): <input type="number" id="massaInput" value="1.0" step="0.1" /></label>
    <label><input type="checkbox" id="mostrarTrajetoria" checked="checked" /> Mostrar</label>
  </div>
</foreignObject>
```

---

## Exemplo Completo

Veja `test/simulacao-teste.svg` para um exemplo funcional completo que reproduz a simulação de lançamento de projétil com:
- Motor de física com gravidade, quique, atrito
- Câmera que segue a bola com suavização
- Nuvens com paralaxe
- Linhas de perspectiva no chão
- Trajetória tracejada
- Régua horizontal dinâmica
- Controles de massa, gravidade, velocidades iniciais
- Lançamento com Espaço + seta direita para impulso horizontal

---

## Fluxo Típico de uma Simulação

```
1. Criar instâncias dos módulos (engine, camera, cena)
2. Configurar callbacks (onUpdate, onStep, onStop)
3. Configurar InputManager (onKey para lançamento)
4. Configurar UIManager (bindInput, bindCheckbox)
5. Inicializar cena (parallax.init(), atualizarCena())
6. Ao lançar: trajetoria.clear() → engine.launch(vx, vy)
7. Loop de animação:
   while (rodando) {
     engine.step(timestamp)  → dispara onStep/onUpdate/onStop
     requestAnimationFrame(loop)
   }
```

---

## Licença

MIT — Livre para uso, modificação e distribuição.

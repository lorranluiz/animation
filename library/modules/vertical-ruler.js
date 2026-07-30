/**
 * VerticalRuler - Régua vertical fixa com marcações de metro.
 *
 * Renderiza uma régua vertical graduada em metros (sistema de mundo Y),
 * útil para visualizar a altura de objetos na simulação.
 * Por ser fixa, usa `render()` uma vez na inicialização.
 *
 * Uso:
 *   var vRuler = new SVGAnim.VerticalRuler({
 *     container: document.getElementById('reguaVertical'),
 *     groundY: 420,
 *     maxHeight: 10,
 *     scale: 40
 *   });
 *   vRuler.render();
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.VerticalRuler = (function () {
  'use strict';

  var Helpers = SVGAnim.Helpers;

  /**
   * @constructor
   * @param {Object} config
   * @param {Element} config.container - Elemento SVG container
   * @param {number} [config.groundY=420] - Posição Y do chão (0m) na tela em pixels
   * @param {number} [config.maxHeight=10] - Altura máxima em metros
   * @param {number} [config.scale=40] - Escala pixels/metro
   * @param {number} [config.x=10] - Posição X do fundo da régua
   * @param {number} [config.width=18] - Largura do fundo
   * @param {string} [config.bgColor='rgba(255,255,255,0.6)'] - Cor do fundo
   * @param {string} [config.borderColor='#333'] - Cor da borda do fundo
   * @param {number} [config.borderWidth=1.5] - Largura da borda
   * @param {number} [config.borderRadius=2] - Arredondamento da borda
   * @param {string} [config.tickColor='#333'] - Cor dos traços
   * @param {string} [config.tickWidthLong='2'] - Largura dos traços nas extremidades
   * @param {string} [config.tickWidthShort='1.5'] - Largura dos traços intermediários
   * @param {number} [config.tickLengthLong=7] - Comprimento dos traços nas extremidades
   * @param {number} [config.tickLengthShort=5] - Comprimento dos traços intermediários
   * @param {number} [config.textOffsetX=22] - Offset X do texto em relação à origem
   * @param {string} [config.textAnchor='end'] - Alinhamento do texto
   * @param {string} [config.fontFamily='Arial, sans-serif'] - Fonte
   * @param {string} [config.fontSize='10'] - Tamanho da fonte
   * @param {number} [config.labelFontSize=12] - Tamanho da fonte do rótulo da unidade
   * @param {string} [config.unitLabel='m'] - Rótulo da unidade no topo
   * @param {number} [config.labelOffsetY=5] - Offset Y do rótulo acima do topo
   */
  function VerticalRuler(config) {
    config = config || {};

    this.container = config.container;
    this.groundY = config.groundY !== undefined ? config.groundY : 420;
    this.maxHeight = config.maxHeight !== undefined ? config.maxHeight : 10;
    this.scale = config.scale !== undefined ? config.scale : 40;
    this.x = config.x !== undefined ? config.x : 10;
    this.width = config.width !== undefined ? config.width : 18;
    this.bgColor = config.bgColor || 'rgba(255,255,255,0.6)';
    this.borderColor = config.borderColor || '#333';
    this.borderWidth = config.borderWidth !== undefined ? config.borderWidth : 1.5;
    this.borderRadius = config.borderRadius !== undefined ? config.borderRadius : 2;
    this.tickColor = config.tickColor || '#333';
    this.tickWidthLong = config.tickWidthLong || '2';
    this.tickWidthShort = config.tickWidthShort || '1.5';
    this.tickLengthLong = config.tickLengthLong !== undefined ? config.tickLengthLong : 7;
    this.tickLengthShort = config.tickLengthShort !== undefined ? config.tickLengthShort : 5;
    this.textOffsetX = config.textOffsetX !== undefined ? config.textOffsetX : 22;
    this.textAnchor = config.textAnchor || 'end';
    this.fontFamily = config.fontFamily || 'Arial, sans-serif';
    this.fontSize = config.fontSize || '10';
    this.labelFontSize = config.labelFontSize !== undefined ? config.labelFontSize : 12;
    this.unitLabel = config.unitLabel || 'm';
    this.labelOffsetY = config.labelOffsetY !== undefined ? config.labelOffsetY : 5;

    this._svgNS = Helpers ? Helpers.SVG_NS : 'http://www.w3.org/2000/svg';
  }

  /**
   * Renderiza a régua vertical no container.
   * Chamado uma vez na inicialização, pois a régua é fixa.
   */
  VerticalRuler.prototype.render = function () {
    if (!this.container) return;

    Helpers.clearElement(this.container);

    var ns = this._svgNS;
    var groundY = this.groundY;
    var scale = this.scale;
    var maxH = this.maxHeight;
    var tickX = this.x + this.width;
    var topY = groundY - maxH * scale;

    var bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('x', this.x);
    bg.setAttribute('y', topY);
    bg.setAttribute('width', this.width);
    bg.setAttribute('height', maxH * scale);
    bg.setAttribute('fill', this.bgColor);
    bg.setAttribute('rx', this.borderRadius);
    this.container.appendChild(bg);

    var border = document.createElementNS(ns, 'rect');
    border.setAttribute('x', this.x);
    border.setAttribute('y', topY);
    border.setAttribute('width', this.width);
    border.setAttribute('height', maxH * scale);
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', this.borderColor);
    border.setAttribute('stroke-width', this.borderWidth);
    border.setAttribute('rx', this.borderRadius);
    this.container.appendChild(border);

    for (var m = 0; m <= maxH; m++) {
      var y = groundY - m * scale;
      var isEnd = (m === 0 || m === maxH);
      var tickWidth = isEnd ? this.tickWidthLong : this.tickWidthShort;
      var tickLen = isEnd ? this.tickLengthLong : this.tickLengthShort;

      var line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', tickX);
      line.setAttribute('y1', y);
      line.setAttribute('x2', tickX + tickLen);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', this.tickColor);
      line.setAttribute('stroke-width', tickWidth);
      this.container.appendChild(line);

      var text = document.createElementNS(ns, 'text');
      text.setAttribute('x', this.textOffsetX);
      text.setAttribute('y', y);
      text.setAttribute('font-family', this.fontFamily);
      text.setAttribute('font-size', this.fontSize);
      text.setAttribute('fill', this.tickColor);
      text.setAttribute('text-anchor', this.textAnchor);
      text.setAttribute('dominant-baseline', 'middle');
      text.textContent = String(m);
      this.container.appendChild(text);
    }

    var label = document.createElementNS(ns, 'text');
    label.setAttribute('x', this.x + this.width / 2);
    label.setAttribute('y', topY - this.labelOffsetY);
    label.setAttribute('font-family', this.fontFamily);
    label.setAttribute('font-size', this.labelFontSize);
    label.setAttribute('fill', this.tickColor);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-weight', 'bold');
    label.textContent = this.unitLabel;
    this.container.appendChild(label);
  };

  return VerticalRuler;
})();

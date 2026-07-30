/**
 * DynamicRuler - Régua horizontal dinâmica que se move com a câmera.
 *
 * Desenha marcações de metro com números ao longo do eixo horizontal,
 * atualizando conforme a câmera se move.
 *
 * Uso:
 *   var ruler = new SVGAnim.DynamicRuler({
 *     container: document.getElementById('reguaDinamica'),
 *     camera: camera,
 *     scale: 40,
 *     groundY: 420
 *   });
 *   ruler.update();
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.DynamicRuler = (function () {
  'use strict';

  var Helpers = SVGAnim.Helpers;

  /**
   * @constructor
   * @param {Object} config
   * @param {Element} config.container - Elemento SVG container
   * @param {Object} config.camera - Instância de SVGAnim.Camera
   * @param {number} [config.scale=40] - Escala pixels/metro
   * @param {number} [config.groundY=420] - Posição Y do chão na tela
   * @param {number} [config.screenWidth=800] - Largura da tela
   * @param {number} [config.range=5] - Alcance da régua (metros para cada lado)
   * @param {string} [config.unitLabel='m'] - Rótulo da unidade
   * @param {string} [config.tickColor='#333'] - Cor das marcações
   * @param {string} [config.tickWidth='1.5'] - Largura das marcações
   * @param {number} [config.tickHeight=10] - Altura das marcações (pixels)
   * @param {number} [config.labelOffset=15] - Distância do rótulo até o chão (pixels)
   */
  function DynamicRuler(config) {
    config = config || {};

    this.container = config.container;
    this.camera = config.camera;
    this.scale = config.scale !== undefined ? config.scale : 40;
    this.groundY = config.groundY !== undefined ? config.groundY : 420;
    this.screenWidth = config.screenWidth !== undefined ? config.screenWidth : 800;
    this.range = config.range !== undefined ? config.range : 5;
    this.unitLabel = config.unitLabel || 'm';
    this.tickColor = config.tickColor || '#333';
    this.tickWidth = config.tickWidth || '1.5';
    this.tickHeight = config.tickHeight !== undefined ? config.tickHeight : 10;
    this.labelOffset = config.labelOffset !== undefined ? config.labelOffset : 15;

    this._svgNS = Helpers ? Helpers.SVG_NS : 'http://www.w3.org/2000/svg';
  }

  /**
   * Atualiza e renderiza a régua horizontal.
   */
  DynamicRuler.prototype.update = function () {
    if (!this.container || !this.camera) return;

    Helpers.clearElement(this.container);

    var cameraX = this.camera.getX();
    var inicio = cameraX - this.range;
    var fim = cameraX + this.range;
    var primeiroMetro = Math.floor(inicio);
    var ns = this._svgNS;

    for (var m = primeiroMetro; m <= fim; m++) {
      var xTela = this.camera.worldToScreenX(m);

      if (xTela < 0 || xTela > this.screenWidth) continue;

      var line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', xTela);
      line.setAttribute('y1', this.groundY);
      line.setAttribute('x2', xTela);
      line.setAttribute('y2', this.groundY - this.tickHeight);
      line.setAttribute('stroke', this.tickColor);
      line.setAttribute('stroke-width', this.tickWidth);
      this.container.appendChild(line);

      var text = document.createElementNS(ns, 'text');
      text.setAttribute('x', xTela);
      text.setAttribute('y', this.groundY - this.labelOffset);
      text.setAttribute('font-family', 'Arial, sans-serif');
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', this.tickColor);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'bottom');
      text.textContent = Math.round(m);
      this.container.appendChild(text);
    }
  };

  return DynamicRuler;
})();

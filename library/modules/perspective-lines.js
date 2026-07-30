/**
 * PerspectiveLines - Linhas de perspectiva no chão convergindo a um ponto de fuga.
 *
 * Desenha linhas verticais no chão que convergem para um ponto de fuga
 * no horizonte, criando efeito de perspectiva. As linhas se movem com a câmera.
 *
 * Uso:
 *   var perspective = new SVGAnim.PerspectiveLines({
 *     container: document.getElementById('linhasPerspectiva'),
 *     camera: camera,
 *     scale: 40
 *   });
 *   perspective.update();
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.PerspectiveLines = (function () {
  'use strict';

  var Helpers = SVGAnim.Helpers;

  /**
   * @constructor
   * @param {Object} config
   * @param {Element} config.container - Elemento SVG container
   * @param {Object} config.camera - Instância de SVGAnim.Camera
   * @param {number} [config.scale=40] - Escala pixels/metro
   * @param {number} [config.screenWidth=800] - Largura da tela
   * @param {number} [config.screenHeight=500] - Altura da tela
   * @param {number} [config.groundY=420] - Posição Y do chão na tela
   * @param {number} [config.vanishY=200] - Posição Y do ponto de fuga
   * @param {number} [config.step=1.0] - Espaçamento entre linhas (metros)
   * @param {number} [config.range=10] - Alcance de linhas para cada lado da câmera (metros)
   * @param {string} [config.strokeColor='rgba(0,80,0,0.25)'] - Cor do traço
   * @param {string} [config.strokeWidth='1.8'] - Largura do traço
   */
  function PerspectiveLines(config) {
    config = config || {};

    this.container = config.container;
    this.camera = config.camera;
    this.scale = config.scale !== undefined ? config.scale : 40;
    this.screenWidth = config.screenWidth !== undefined ? config.screenWidth : 800;
    this.screenHeight = config.screenHeight !== undefined ? config.screenHeight : 500;
    this.groundY = config.groundY !== undefined ? config.groundY : 420;
    this.vanishY = config.vanishY !== undefined ? config.vanishY : 200;
    this.step = config.step !== undefined ? config.step : 1.0;
    this.range = config.range !== undefined ? config.range : 10;
    this.strokeColor = config.strokeColor || 'rgba(0,80,0,0.25)';
    this.strokeWidth = config.strokeWidth || '1.8';

    this._svgNS = Helpers ? Helpers.SVG_NS : 'http://www.w3.org/2000/svg';
  }

  /**
   * Atualiza e renderiza as linhas de perspectiva.
   */
  PerspectiveLines.prototype.update = function () {
    if (!this.container || !this.camera) return;

    Helpers.clearElement(this.container);

    var cameraX = this.camera.getX();
    var vanishX = this.screenWidth / 2;
    var ns = this._svgNS;
    var inicio = cameraX - this.range;
    var fim = cameraX + this.range;

    for (var m = Math.floor(inicio); m <= Math.ceil(fim); m += this.step) {
      var xChao = this.camera.worldToScreenX(m);

      if (xChao < -10 || xChao > this.screenWidth + 10) continue;

      var line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', xChao);
      line.setAttribute('y1', this.groundY + 80);
      line.setAttribute('x2', vanishX);
      line.setAttribute('y2', this.vanishY);
      line.setAttribute('stroke', this.strokeColor);
      line.setAttribute('stroke-width', this.strokeWidth);

      this.container.appendChild(line);
    }
  };

  return PerspectiveLines;
})();

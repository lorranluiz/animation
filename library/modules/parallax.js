/**
 * ParallaxBackground - Fundo com efeito de paralaxe.
 *
 * Renderiza um conjunto de elementos que se movem com velocidades diferentes
 * da câmera, criando sensação de profundidade. Os elementos reaparecem do
 * outro lado quando saem da tela (wrap-around).
 *
 * Uso:
 *   var clouds = new SVGAnim.ParallaxBackground({
 *     container: document.getElementById('nuvensContainer'),
 *     modelId: '#nuvemModelo',
 *     numItems: 14,
 *     camera: camera,
 *     parallaxFactor: 0.6,
 *     scale: 40
 *   });
 *   clouds.init();
 *   clouds.update();
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.ParallaxBackground = (function () {
  'use strict';

  var Helpers = SVGAnim.Helpers;

  /**
   * @constructor
   * @param {Object} config
   * @param {Element} config.container - Elemento SVG onde os itens serão renderizados
   * @param {string} config.modelId - ID do elemento no <defs> a ser clonado via <use> (ex: '#nuvemModelo')
   * @param {number} [config.numItems=14] - Quantidade de itens
   * @param {Object} config.camera - Instância de SVGAnim.Camera
   * @param {number} [config.parallaxFactor=0.6] - Fator de paralaxe (0 = fixo, 1 = move com câmera)
   * @param {number} [config.scale=40] - Escala pixels/metro
   * @param {number} [config.screenWidth=800] - Largura da tela em pixels
   * @param {number} [config.margin=200] - Margem para wrap-around (pixels)
   */
  function ParallaxBackground(config) {
    config = config || {};

    this.container = config.container;
    this.modelId = config.modelId || '#itemModelo';
    this.numItems = config.numItems !== undefined ? config.numItems : 14;
    this.camera = config.camera;
    this.parallaxFactor = config.parallaxFactor !== undefined ? config.parallaxFactor : 0.6;
    this.scale = config.scale !== undefined ? config.scale : 40;
    this.screenWidth = config.screenWidth !== undefined ? config.screenWidth : 800;
    this.margin = config.margin !== undefined ? config.margin : 200;

    this._items = [];
    this._svgNS = Helpers ? Helpers.SVG_NS : 'http://www.w3.org/2000/svg';
  }

  /**
   * Inicializa os itens do fundo com posições aleatórias.
   * Sobrescreva este método para distribuição personalizada.
   * @returns {Array<Object>} Array de configurações de itens
   */
  ParallaxBackground.prototype.generateItems = function () {
    var items = [];
    for (var i = 0; i < this.numItems; i++) {
      items.push({
        posX: (Math.random() - 0.5) * 30,
        posY: 40 + Math.random() * 200,
        scale: 0.6 + Math.random() * 0.8,
        opacity: 0.7 + Math.random() * 0.3
      });
    }
    return items;
  };

  /**
   * Inicializa e renderiza os itens pela primeira vez.
   */
  ParallaxBackground.prototype.init = function () {
    this._items = this.generateItems();
    this.render();
  };

  /**
   * Atualiza posições (wrap-around) e renderiza os itens.
   */
  ParallaxBackground.prototype.update = function () {
    if (!this.camera) return;

    var cameraX = this.camera.getX();
    var halfW = this.screenWidth / 2;
    var paraX = cameraX * this.parallaxFactor;

    for (var i = 0; i < this._items.length; i++) {
      var item = this._items[i];
      var screenX = halfW + (item.posX - paraX) * this.scale;

      if (screenX < -this.margin) {
        item.posX = paraX + (this.screenWidth + this.margin + Math.random() * 200) / this.scale;
      } else if (screenX > this.screenWidth + this.margin) {
        item.posX = paraX - (this.screenWidth + this.margin + Math.random() * 200) / this.scale;
      }
    }

    this.render();
  };

  /**
   * Renderiza todos os itens no container.
   * Cria elementos <use> referenciando o modelId.
   */
  ParallaxBackground.prototype.render = function () {
    if (!this.container) return;

    Helpers.clearElement(this.container);

    var cameraX = this.camera.getX();
    var paraX = cameraX * this.parallaxFactor;
    var halfW = this.screenWidth / 2;
    var ns = this._svgNS;

    for (var i = 0; i < this._items.length; i++) {
      var item = this._items[i];
      var screenX = halfW + (item.posX - paraX) * this.scale;

      var useEl = document.createElementNS(ns, 'use');
      useEl.setAttribute('href', this.modelId);
      useEl.setAttribute('x', screenX);
      useEl.setAttribute('y', item.posY);
      if (item.scale !== 1) {
        useEl.setAttribute('transform', 'scale(' + item.scale + ')');
      }
      useEl.setAttribute('opacity', item.opacity);

      this.container.appendChild(useEl);
    }
  };

  /**
   * Reinicia com novos itens aleatórios.
   */
  ParallaxBackground.prototype.reset = function () {
    this._items = this.generateItems();
    this.render();
  };

  return ParallaxBackground;
})();

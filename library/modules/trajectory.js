/**
 * TrajectoryTracer - Gravador e renderizador de trajetória tracejada.
 *
 * Registra pontos por onde o objeto passa e desenha um caminho tracejado.
 * Os pontos são armazenados no sistema de mundo e convertidos para tela
 * considerando a posição da câmera.
 *
 * Uso:
 *   var tracer = new SVGAnim.TrajectoryTracer({
 *     pathElement: document.getElementById('trajetoriaPath'),
 *     camera: camera,
 *     scale: 40,
 *     groundY: 420
 *   });
 *   tracer.addPoint(bolaX, bolaY);
 *   tracer.redraw();
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.TrajectoryTracer = (function () {
  'use strict';

  var Helpers = SVGAnim.Helpers;

  /**
   * @constructor
   * @param {Object} config
   * @param {Element} config.pathElement - Elemento SVG <path>
   * @param {Object} config.camera - Instância de SVGAnim.Camera
   * @param {number} [config.scale=40] - Escala pixels/metro
   * @param {number} [config.groundY=420] - Posição Y do chão na tela
   * @param {boolean} [config.active=true] - Se a trajetória está ativa
   * @param {number} [config.recordEvery=2] - Registrar ponto a cada N passos
   * @param {number} [config.minDistance=0.01] - Distância mínima quadrada entre pontos
   * @param {string} [config.strokeColor='#FF4500'] - Cor do traço
   * @param {string} [config.strokeWidth='2'] - Largura do traço
   * @param {string} [config.strokeDasharray='6,4'] - Padrão tracejado
   * @param {string} [config.opacity='0.9'] - Opacidade
   */
  function TrajectoryTracer(config) {
    config = config || {};

    this.pathElement = config.pathElement;
    this.camera = config.camera;
    this.scale = config.scale !== undefined ? config.scale : 40;
    this.groundY = config.groundY !== undefined ? config.groundY : 420;
    this.active = config.active !== undefined ? config.active : true;
    this.recordEvery = config.recordEvery !== undefined ? config.recordEvery : 2;
    this.minDistance = config.minDistance !== undefined ? config.minDistance : 0.01;
    this.strokeColor = config.strokeColor || '#FF4500';
    this.strokeWidth = config.strokeWidth || '2';
    this.strokeDasharray = config.strokeDasharray || '6,4';
    this.opacity = config.opacity || '0.9';

    this._points = [];
    this._stepCounter = 0;
  }

  /**
   * Adiciona um ponto à trajetória no sistema de mundo.
   * @param {number} x - Posição X no mundo (metros)
   * @param {number} y - Posição Y no mundo (metros)
   */
  TrajectoryTracer.prototype.addPoint = function (x, y) {
    if (!this.active) return;

    this._stepCounter++;
    if (this._stepCounter % this.recordEvery !== 0) return;

    if (this._points.length > 0) {
      var last = this._points[this._points.length - 1];
      var dx = x - last.x;
      var dy = y - last.y;
      if (dx * dx + dy * dy < this.minDistance) return;
    }

    this._points.push({ x: x, y: y });
  };

  /**
   * Limpa todos os pontos da trajetória.
   */
  TrajectoryTracer.prototype.clear = function () {
    this._points = [];
    this._stepCounter = 0;
    if (this.pathElement) {
      this.pathElement.setAttribute('d', '');
    }
  };

  /**
   * Redesenha o caminho da trajetória no elemento path.
   * Usa a posição da câmera para calcular coordenadas de tela.
   */
  TrajectoryTracer.prototype.redraw = function (referenceX) {
    if (!this.pathElement || this._points.length === 0) {
      if (this.pathElement) this.pathElement.setAttribute('d', '');
      return;
    }

    var refX = (referenceX !== undefined)
      ? referenceX
      : (this.camera ? this.camera.getX() : 0);

    var screenCenter = this.camera ? this.camera.screenCenterX : 400;
    var scale = this.scale;
    var d = '';

    for (var i = 0; i < this._points.length; i++) {
      var xTela = screenCenter + (this._points[i].x - refX) * scale;
      var yTela = this.camera.worldToScreenY(this._points[i].y);

      if (i === 0) {
        d += 'M' + xTela.toFixed(1) + ',' + yTela.toFixed(1);
      } else {
        d += ' L' + xTela.toFixed(1) + ',' + yTela.toFixed(1);
      }
    }

    this.pathElement.setAttribute('d', d);
  };

  /**
   * Ativa/desativa a trajetória.
   * @param {boolean} val
   */
  TrajectoryTracer.prototype.setActive = function (val) {
    this.active = val;
    if (this.pathElement) {
      this.pathElement.style.display = val ? 'block' : 'none';
    }
  };

  /**
   * Verifica se a trajetória está ativa.
   * @returns {boolean}
   */
  TrajectoryTracer.prototype.isActive = function () {
    return this.active;
  };

  /**
   * Retorna os pontos registrados (apenas leitura).
   * @returns {Array<{x: number, y: number}>}
   */
  TrajectoryTracer.prototype.getPoints = function () {
    return this._points.slice();
  };

  return TrajectoryTracer;
})();

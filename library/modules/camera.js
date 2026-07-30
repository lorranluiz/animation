/**
 * Camera - Sistema de câmera com suavização exponencial.
 *
 * A câmera segue um alvo (geralmente a bola) com um atraso suave.
 * A suavização é controlada pelo parâmetro smoothness (0 = sem movimento,
 * 1 = segue instantaneamente). Valores entre 0.05 e 0.15 são recomendados.
 *
 * Uso:
 *   var camera = new SVGAnim.Camera({ smoothness: 0.08, scale: 40 });
 *   camera.follow(bolaX, bolaY);
 *   var telaX = camera.worldToScreenX(worldX);
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.Camera = (function () {
  'use strict';

  /**
   * @constructor
   * @param {Object} config - Configuração da câmera
   * @param {number} [config.smoothness=0.08] - Fator de suavização (0 a 1)
   * @param {number} [config.scale=40] - Escala pixels/metro
   * @param {number} [config.groundY=0] - Posição Y do chão no mundo (metros)
   * @param {number} [config.screenCenterX=400] - Centro X da tela em pixels
   * @param {number} [config.screenGroundY=420] - Posição Y do chão na tela em pixels
   * @param {number} [config.maxY=400] - Altura máxima de Y na tela
   */
  function Camera(config) {
    config = config || {};

    this.smoothness = config.smoothness !== undefined ? config.smoothness : 0.08;
    this.scale = config.scale !== undefined ? config.scale : 40;
    this.groundY = config.groundY !== undefined ? config.groundY : 0;
    this.screenCenterX = config.screenCenterX !== undefined ? config.screenCenterX : 400;
    this.screenGroundY = config.screenGroundY !== undefined ? config.screenGroundY : 420;
    this.maxY = config.maxY !== undefined ? config.maxY : 400;

    this.zoom = config.zoom !== undefined ? config.zoom : 1.0;
    this.zoomSmoothness = config.zoomSmoothness !== undefined ? config.zoomSmoothness : 0.05;
    this.zoomCenterX = config.zoomCenterX !== undefined ? config.zoomCenterX : 400;
    this.zoomCenterY = config.zoomCenterY !== undefined ? config.zoomCenterY : 250;

    this._cameraX = 0;
    this._targetX = 0;
    this._targetZoom = this.zoom;
  }

  /**
   * Retorna a posição X atual da câmera no mundo.
   * @returns {number}
   */
  Camera.prototype.getX = function () {
    return this._cameraX;
  };

  /**
   * Define o alvo que a câmera deve seguir e atualiza a posição.
   * @param {number} targetX - Posição X do alvo no mundo (metros)
   * @param {number} [targetY] - Posição Y do alvo (reservado para uso futuro)
   */
  Camera.prototype.follow = function (targetX, targetY) {
    this._targetX = targetX;
    var dx = targetX - this._cameraX;
    this._cameraX += dx * this.smoothness;
  };

  /**
   * Converte coordenada X do mundo para X da tela.
   * @param {number} worldX - Coordenada X no mundo (metros)
   * @returns {number} Coordenada X na tela (pixels)
   */
  Camera.prototype.worldToScreenX = function (worldX) {
    return this.screenCenterX + (worldX - this._cameraX) * this.scale;
  };

  /**
   * Converte coordenada Y do mundo para Y da tela.
   * @param {number} worldY - Coordenada Y no mundo (metros)
   * @returns {number} Coordenada Y na tela (pixels)
   */
  Camera.prototype.worldToScreenY = function (worldY) {
    return this.screenGroundY - worldY * this.scale;
  };

  /**
   * Converte posição do mundo para coordenadas de tela.
   * @param {number} worldX
   * @param {number} worldY
   * @returns {{x: number, y: number}}
   */
  Camera.prototype.worldToScreen = function (worldX, worldY) {
    return {
      x: this.worldToScreenX(worldX),
      y: this.worldToScreenY(worldY)
    };
  };

  /**
   * Verifica se uma coordenada X de tela está dentro dos limites visíveis.
   * @param {number} screenX
   * @param {number} [margin=0] - Margem adicional
   * @returns {boolean}
   */
  Camera.prototype.isOnScreen = function (screenX, margin) {
    margin = margin || 0;
    return screenX >= -margin && screenX <= (this.screenCenterX * 2 + margin);
  };

  /**
   * Reseta a câmera para a origem.
   */
  Camera.prototype.reset = function () {
    this._cameraX = 0;
    this._targetX = 0;
    this.zoom = 1.0;
    this._targetZoom = 1.0;
  };

  /**
   * Define o fator de suavização.
   * @param {number} s - Novo fator (0 a 1)
   */
  Camera.prototype.setSmoothness = function (s) {
    this.smoothness = s;
  };

  Camera.prototype.setZoomTarget = function (z) {
    this._targetZoom = z;
  };

  Camera.prototype.setZoomCenter = function (cx, cy) {
    this.zoomCenterX = cx;
    this.zoomCenterY = cy;
  };

  Camera.prototype.setZoomSpeed = function (s) {
    this.zoomSmoothness = s;
  };

  Camera.prototype.update = function () {
    var dx = this._targetX - this._cameraX;
    this._cameraX += dx * this.smoothness;

    var dz = this._targetZoom - this.zoom;
    this.zoom += dz * this.zoomSmoothness;
  };

  Camera.prototype.getZoomTransform = function () {
    return 'translate(' + this.zoomCenterX + ',' + this.zoomCenterY + ') ' +
           'scale(' + this.zoom + ') ' +
           'translate(' + (-this.zoomCenterX) + ',' + (-this.zoomCenterY) + ')';
  };

  return Camera;
})();

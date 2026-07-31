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

    this.blur = config.blur !== undefined ? config.blur : 0;
    this.blurSmoothness = config.blurSmoothness !== undefined ? config.blurSmoothness : 0.02;
    this.blurFilterId = config.blurFilterId || null;

    this.rotationX = config.rotationX !== undefined ? config.rotationX : 0;
    this.rotationY = config.rotationY !== undefined ? config.rotationY : 0;
    this.rotationZ = config.rotationZ !== undefined ? config.rotationZ : 0;
    this.rotationSmoothness = config.rotationSmoothness !== undefined ? config.rotationSmoothness : 0.02;
    this.perspective = config.perspective !== undefined ? config.perspective : 800;

    this.tx = config.tx !== undefined ? config.tx : 0;
    this.ty = config.ty !== undefined ? config.ty : 0;
    this.translateSmoothness = config.translateSmoothness !== undefined ? config.translateSmoothness : 0.02;

    this._cameraX = 0;
    this._targetX = 0;
    this._targetZoom = this.zoom;
    this._targetBlur = this.blur;
    this._targetRotationX = this.rotationX;
    this._targetRotationY = this.rotationY;
    this._targetRotationZ = this.rotationZ;
    this._targetTx = this.tx;
    this._targetTy = this.ty;
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
    this.blur = 0;
    this._targetBlur = 0;
    this.rotationX = 0;
    this.rotationY = 0;
    this.rotationZ = 0;
    this._targetRotationX = 0;
    this._targetRotationY = 0;
    this._targetRotationZ = 0;
    this.tx = 0;
    this.ty = 0;
    this._targetTx = 0;
    this._targetTy = 0;
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

  Camera.prototype.setBlurTarget = function (b) {
    this._targetBlur = b;
  };

  Camera.prototype.setBlurSpeed = function (s) {
    this.blurSmoothness = s;
  };

  Camera.prototype.getBlur = function () {
    return this.blur;
  };

  Camera.prototype.setRotationTarget = function (rx, ry, rz) {
    if (rx !== undefined) this._targetRotationX = rx;
    if (ry !== undefined) this._targetRotationY = ry;
    if (rz !== undefined) this._targetRotationZ = rz;
  };

  Camera.prototype.setRotationSpeed = function (s) {
    this.rotationSmoothness = s;
  };

  Camera.prototype.getRotation = function () {
    return { rx: this.rotationX, ry: this.rotationY, rz: this.rotationZ };
  };

  Camera.prototype.setTranslationTarget = function (tx, ty) {
    if (tx !== undefined) this._targetTx = tx;
    if (ty !== undefined) this._targetTy = ty;
  };

  Camera.prototype.setTranslationSpeed = function (s) {
    this.translateSmoothness = s;
  };

  Camera.prototype.getTranslation = function () {
    return { tx: this.tx, ty: this.ty };
  };

  Camera.prototype.update = function () {
    var dx = this._targetX - this._cameraX;
    this._cameraX += dx * this.smoothness;

    var dz = this._targetZoom - this.zoom;
    this.zoom += dz * this.zoomSmoothness;

    var db = this._targetBlur - this.blur;
    this.blur += db * this.blurSmoothness;

    var drx = this._targetRotationX - this.rotationX;
    var dry = this._targetRotationY - this.rotationY;
    var drz = this._targetRotationZ - this.rotationZ;
    this.rotationX += drx * this.rotationSmoothness;
    this.rotationY += dry * this.rotationSmoothness;
    this.rotationZ += drz * this.rotationSmoothness;

    var dtx = this._targetTx - this.tx;
    var dty = this._targetTy - this.ty;
    this.tx += dtx * this.translateSmoothness;
    this.ty += dty * this.translateSmoothness;

    if (this.blurFilterId) {
      var filterEl = document.getElementById(this.blurFilterId);
      if (filterEl) {
        filterEl.setAttribute('stdDeviation', this.blur.toFixed(2));
      }
    }
  };

  Camera.prototype.getZoomTransform = function () {
    return 'translate(' + this.zoomCenterX + ',' + this.zoomCenterY + ') ' +
           'scale(' + this.zoom + ') ' +
           'translate(' + (-this.zoomCenterX) + ',' + (-this.zoomCenterY) + ')';
  };

  Camera.prototype.getCameraTransform = function () {
    return 'perspective(' + this.perspective + 'px) ' +
           'rotateX(' + this.rotationX.toFixed(2) + 'deg) ' +
           'rotateY(' + this.rotationY.toFixed(2) + 'deg) ' +
           'rotateZ(' + this.rotationZ.toFixed(2) + 'deg) ' +
           'translate(' + this.zoomCenterX + 'px,' + this.zoomCenterY + 'px) ' +
           'scale(' + this.zoom + ') ' +
           'translate(' + (-this.zoomCenterX) + 'px,' + (-this.zoomCenterY) + 'px) ' +
           'translate(' + this.tx.toFixed(2) + 'px,' + this.ty.toFixed(2) + 'px)';
  };

  return Camera;
})();

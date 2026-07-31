/**
 * Keyframe - Unidade de keyframe com propriedades de todos os efeitos da câmera.
 *
 * Cada keyframe armazena um instante na timeline e os valores de zoom, blur,
 * rotação 3D (Pitch/Yaw/Roll), translação (tx/ty) e perspectiva.
 *
 * Suporta clonagem e interpolação linear (lerp) entre dois keyframes.
 *
 * Uso:
 *   var kf1 = new SVGAnim.Keyframe({ tempo: 0, zoom: 1.0, blur: 7 });
 *   var kf2 = new SVGAnim.Keyframe({ tempo: 5, zoom: 1.5, blur: 0 });
 *   var meio = kf1.lerp(kf2, 0.5); // interpola no meio do caminho
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.Keyframe = (function () {
  'use strict';

  function Keyframe(config) {
    config = config || {};

    this.tempo = config.tempo !== undefined ? config.tempo : 0;

    this.zoom = config.zoom !== undefined ? config.zoom : 1.0;
    this.blur = config.blur !== undefined ? config.blur : 0;
    this.rotationX = config.rotationX !== undefined ? config.rotationX : 0;
    this.rotationY = config.rotationY !== undefined ? config.rotationY : 0;
    this.rotationZ = config.rotationZ !== undefined ? config.rotationZ : 0;
    this.tx = config.tx !== undefined ? config.tx : 0;
    this.ty = config.ty !== undefined ? config.ty : 0;
    this.perspective = config.perspective !== undefined ? config.perspective : 800;
  }

  /**
   * Retorna uma cópia profunda do keyframe.
   * @returns {Keyframe}
   */
  Keyframe.prototype.clone = function () {
    return new Keyframe(this);
  };

  /**
   * Interpola linearmente entre este keyframe (t=0) e `other` (t=1).
   * @param {Keyframe} other
   * @param {number} t - Fator de interpolação (0 a 1)
   * @returns {Keyframe}
   */
  Keyframe.prototype.lerp = function (other, t) {
    return new Keyframe({
      tempo: this.tempo + (other.tempo - this.tempo) * t,
      zoom: this.zoom + (other.zoom - this.zoom) * t,
      blur: this.blur + (other.blur - this.blur) * t,
      rotationX: this.rotationX + (other.rotationX - this.rotationX) * t,
      rotationY: this.rotationY + (other.rotationY - this.rotationY) * t,
      rotationZ: this.rotationZ + (other.rotationZ - this.rotationZ) * t,
      tx: this.tx + (other.tx - this.tx) * t,
      ty: this.ty + (other.ty - this.ty) * t,
      perspective: this.perspective + (other.perspective - this.perspective) * t
    });
  };

  return Keyframe;
})();

/**
 * Highlighter - Gerenciador de marcações (highlights) sobre a imagem.
 *
 * Cada marcação é um traço de caneta marcadora (path SVG) associado
 * a um keyframe. Durante a animação, as marcas aparecem, sustentam-se
 * e desaparecem com timing automático.
 *
 * Uso:
 *   var hl = new SVGAnim.Highlighter();
 *   hl.addMark(kfIdx, "M100,200 L150,180", 5, 180);
 *   var factor = hl.computeFactor(t, keyframes, kfIdx);
 *   // fator 0→1 controla stroke-dashoffset para revelar/ocultar
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.Highlighter = (function () {
  'use strict';

  function Highlighter() {
    this.marks = {};
  }

  /**
   * Adiciona uma marcação a um keyframe.
   * @param {number} kfIdx - Índice do keyframe de ancoragem
   * @param {string} path - String de path SVG (ex: "M100,200 L150,180")
   * @param {number} thickness - Espessura da caneta (px)
   * @param {number} totalLength - Comprimento total do path (para dasharray)
   */
  Highlighter.prototype.addMark = function (kfIdx, path, thickness, totalLength) {
    if (!this.marks[kfIdx]) this.marks[kfIdx] = [];
    this.marks[kfIdx].push({
      path: path,
      thickness: thickness,
      color: 'rgba(255,255,0,0.4)',
      totalLength: totalLength || 100
    });
  };

  /**
   * Computa o fator de visibilidade (0 a 1) para marcas ancoradas em kfIdx
   * no instante t, dados os keyframes.
   *
   * @param {number} t - Tempo absoluto (segundos)
   * @param {Array<Keyframe>} keyframes - Array de keyframes
   * @param {number} kfIdx - Índice do keyframe alvo
   * @returns {number} Fator 0 a 1
   */
  Highlighter.prototype.computeFactor = function (t, keyframes, kfIdx) {
    var markKf = keyframes[kfIdx];
    var last = keyframes[keyframes.length - 1];

    if (kfIdx === 0) {
      if (keyframes.length === 1) return 1;
      var segLen = keyframes[1].tempo - markKf.tempo;
      if (segLen <= 0) return 1;
      var susEnd = markKf.tempo + segLen * 0.5;
      var shrEnd = markKf.tempo + segLen * 0.75;
      if (t <= susEnd) return 1;
      if (t <= shrEnd) return 1 - (t - susEnd) / (shrEnd - susEnd);
      return 0;
    }

    var prev = keyframes[kfIdx - 1];
    var curr = keyframes[kfIdx];
    var segLen = curr.tempo - prev.tempo;
    if (segLen <= 0) return (t >= curr.tempo ? 1 : 0);
    var appearStart = prev.tempo + segLen * 0.9;

    if (t < appearStart) return 0;

    if (t <= curr.tempo) {
      return Math.min(1, (t - appearStart) / (curr.tempo - appearStart));
    }

    if (kfIdx === keyframes.length - 1) return 1;

    var next = keyframes[kfIdx + 1];
    var nextSeg = next.tempo - curr.tempo;
    if (nextSeg <= 0) return 1;
    var susEnd2 = curr.tempo + nextSeg * 0.5;
    var shrEnd2 = curr.tempo + nextSeg * 0.75;
    if (t <= susEnd2) return 1;
    if (t <= shrEnd2) return 1 - (t - susEnd2) / (shrEnd2 - susEnd2);
    return 0;
  };

  /**
   * Retorna marcas do keyframe.
   * @param {number} kfIdx
   * @returns {Array}
   */
  Highlighter.prototype.getMarks = function (kfIdx) {
    return this.marks[kfIdx] || [];
  };

  /**
   * Serializa para JSON (para persistência).
   * @returns {Object}
   */
  Highlighter.prototype.toJSON = function () {
    return this.marks;
  };

  /**
   * Reconstrói a partir de JSON.
   * @param {Object} data
   */
  Highlighter.prototype.fromJSON = function (data) {
    this.marks = data || {};
  };

  return Highlighter;
})();

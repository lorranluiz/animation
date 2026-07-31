/**
 * Timeline - Linha do tempo com duração e posicionamento de keyframes.
 *
 * Encapsula a duração máxima da timeline e as conversões entre
 * tempo (segundos) e posição na barra (pixels). Sincroniza com
 * os elementos DOM da duração e barra de progresso.
 *
 * Uso:
 *   var tl = new SVGAnim.Timeline({
 *     duracao: 10,
 *     keyframes: keyframes,
 *     durLabel: document.getElementById('durLabel'),
 *     progressBar: document.getElementById('progressBar')
 *   });
 *   var px = tl.kfToScreenX(5); // posição de 5s na barra
 *   tl.setDuracao(8);           // ajusta e sincroniza
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.Timeline = (function () {
  'use strict';

  function Timeline(config) {
    config = config || {};

    this.duracao = config.duracao !== undefined ? config.duracao : 10;
    this.keyframes = config.keyframes || [];
    this.durLabel = config.durLabel || null;
    this.progressBar = config.progressBar || null;
    this.T_BAR_X = 40;
    this.T_BAR_W = 720;
  }

  /**
   * Retorna o tempo do último keyframe (duração mínima).
   * @returns {number}
   */
  Timeline.prototype.getMinDuracao = function () {
    if (this.keyframes.length === 0) return 0;
    return this.keyframes[this.keyframes.length - 1].tempo;
  };

  /**
   * Retorna o maior valor entre a duração configurada e o tempo do último keyframe.
   * @returns {number}
   */
  Timeline.prototype.maxTempo = function () {
    return Math.max(this.getMinDuracao(), this.duracao);
  };

  /**
   * Converte um instante de tempo (segundos) para posição X na barra (pixels).
   * @param {number} tempo
   * @returns {number}
   */
  Timeline.prototype.kfToScreenX = function (tempo) {
    var max = this.maxTempo();
    return this.T_BAR_X + (tempo / Math.max(max, 1)) * this.T_BAR_W;
  };

  /**
   * Garante que a duração não seja menor que o tempo do último keyframe.
   */
  Timeline.prototype.validarDuracao = function () {
    var min = this.getMinDuracao();
    if (this.duracao < min) {
      this.duracao = min;
    }
  };

  /**
   * Sincroniza o slider de duração com o estado atual.
   * Atualiza min, value e labels associados.
   * @param {Element} sliderEl - Input range do slider de duração
   * @param {Element} lblVal - Span com o valor exibido do slider
   */
  Timeline.prototype.syncDuracaoSlider = function (sliderEl, lblVal) {
    if (!sliderEl) return;
    var minDur = this.getMinDuracao();
    sliderEl.min = minDur;
    var val = parseInt(sliderEl.value);
    if (val < minDur) {
      sliderEl.value = minDur;
      val = minDur;
    }
    if (lblVal) lblVal.textContent = val + 's';
    if (this.durLabel) {
      this.durLabel.textContent = 'Duração máx: ' + this.duracao + 's | KFs: ' + this.keyframes.length;
    }
  };

  /**
   * Define a duração, validando contra o mínimo.
   * @param {number} d
   */
  Timeline.prototype.setDuracao = function (d) {
    this.duracao = d;
    this.validarDuracao();
  };

  return Timeline;
})();

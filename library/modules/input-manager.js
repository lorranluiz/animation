/**
 * InputManager - Gerenciador de entrada de teclado e outros inputs.
 *
 * Fornece uma API para registrar callbacks de teclas, verificar se teclas
 * estão pressionadas, e ignora inputs quando o foco está em campos de texto.
 *
 * Uso:
 *   var input = new SVGAnim.InputManager({ svgElement: svgEl });
 *   input.onKey('Space', function() { lancarBola(); });
 *   input.onKeyDown('ArrowRight', function() { seta = true; });
 *   input.onKeyUp('ArrowRight', function() { seta = false; });
 *   if (input.isPressed('ArrowRight')) { ... }
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.InputManager = (function () {
  'use strict';

  /**
   * @constructor
   * @param {Object} config
   * @param {Element} [config.svgElement] - Elemento SVG raiz para foco
   * @param {Array<string>} [config.ignoreTags=['INPUT','TEXTAREA','SELECT']] - Tags ignoradas para eventos
   * @param {boolean} [config.preventDefaultDefault=true] - Se deve prevenir comportamento padrão
   */
  function InputManager(config) {
    config = config || {};

    this.svgElement = config.svgElement || null;
    this.ignoreTags = config.ignoreTags || ['INPUT', 'TEXTAREA', 'SELECT'];
    this.preventDefaultDefault = config.preventDefaultDefault !== undefined ? config.preventDefaultDefault : true;

    this._pressed = {};
    this._keyDownCallbacks = {};
    this._keyUpCallbacks = {};
    this._keyCallbacks = {};

    this._boundKeyDown = this._handleKeyDown.bind(this);
    this._boundKeyUp = this._handleKeyUp.bind(this);

    this._setup();
  }

  /**
   * Configura os event listeners.
   * @private
   */
  InputManager.prototype._setup = function () {
    var self = this;

    document.addEventListener('keydown', this._boundKeyDown);
    document.addEventListener('keyup', this._boundKeyUp);

    if (this.svgElement) {
      if (this.svgElement.getAttribute('tabindex') === null) {
        this.svgElement.setAttribute('tabindex', '0');
      }
      this.svgElement.addEventListener('click', function () {
        self.svgElement.focus();
      });
      this.svgElement.focus();
    }
  };

  /**
   * Verifica se o evento deve ser ignorado (foco em input).
   * @param {Event} event
   * @returns {boolean}
   * @private
   */
  InputManager.prototype._shouldIgnore = function (event) {
    var active = document.activeElement;
    if (active && this.ignoreTags.indexOf(active.tagName) !== -1) {
      return true;
    }
    return false;
  };

  /**
   * Manipulador de keydown.
   * @private
   */
  InputManager.prototype._handleKeyDown = function (event) {
    if (this._shouldIgnore(event)) return;

    var key = event.code || event.key;
    this._pressed[key] = true;

    if (this.preventDefaultDefault) {
      if (event.code === 'Space' || event.key === 'ArrowRight' ||
          event.key === 'ArrowLeft' || event.key === 'ArrowUp' ||
          event.key === 'ArrowDown') {
        event.preventDefault();
      }
    }

    if (this._keyDownCallbacks[key]) {
      event.preventDefault();
      this._keyDownCallbacks[key](event);
    }

    if (this._keyCallbacks[key]) {
      event.preventDefault();
      this._keyCallbacks[key](event);
    }
  };

  /**
   * Manipulador de keyup.
   * @private
   */
  InputManager.prototype._handleKeyUp = function (event) {
    if (this._shouldIgnore(event)) return;

    var key = event.code || event.key;
    this._pressed[key] = false;

    if (this._keyUpCallbacks[key]) {
      event.preventDefault();
      this._keyUpCallbacks[key](event);
    }
  };

  /**
   * Registra callback para quando uma tecla for pressionada (keydown).
   * @param {string} key - Código da tecla (ex: 'Space', 'ArrowRight', 'KeyA')
   * @param {function} callback - Função a ser chamada
   */
  InputManager.prototype.onKeyDown = function (key, callback) {
    this._keyDownCallbacks[key] = callback;
  };

  /**
   * Registra callback para quando uma tecla for solta (keyup).
   * @param {string} key
   * @param {function} callback
   */
  InputManager.prototype.onKeyUp = function (key, callback) {
    this._keyUpCallbacks[key] = callback;
  };

  /**
   * Registra callback de keydown (alias para onKeyDown).
   * Útil para ações disparadas uma vez ao pressionar (ex: Space para lançar).
   * @param {string} key
   * @param {function} callback
   */
  InputManager.prototype.onKey = function (key, callback) {
    this._keyCallbacks[key] = callback;
  };

  /**
   * Verifica se uma tecla está pressionada no momento.
   * @param {string} key - Código da tecla
   * @returns {boolean}
   */
  InputManager.prototype.isPressed = function (key) {
    return !!this._pressed[key];
  };

  /**
   * Remove todos os listeners e limpa estado.
   */
  InputManager.prototype.destroy = function () {
    document.removeEventListener('keydown', this._boundKeyDown);
    document.removeEventListener('keyup', this._boundKeyUp);
    this._pressed = {};
    this._keyDownCallbacks = {};
    this._keyUpCallbacks = {};
    this._keyCallbacks = {};
  };

  return InputManager;
})();

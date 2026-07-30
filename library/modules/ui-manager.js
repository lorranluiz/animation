/**
 * UIManager - Gerenciador de inputs, displays e controles de interface.
 *
 * Sincroniza campos de entrada HTML (via foreignObject) com elementos
 * de exibição SVG (<tspan>, <text>), e fornece bindings bidirecionais.
 *
 * Uso:
 *   var ui = new SVGAnim.UIManager();
 *   ui.bindInput('massaInput', 'massaDisplay', function(val) {
 *     engine.setMass(val);
 *   }, { format: '1f' });
 *   ui.bindCheckbox('mostrarTrajetoria', function(checked) {
 *     tracer.setActive(checked);
 *   });
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.UIManager = (function () {
  'use strict';

  /**
   * @constructor
   * @param {Object} [config] - Configuração opcional
   */
  function UIManager(config) {
    config = config || {};
    this._bindings = [];
  }

  /**
   * Vincula um campo <input> a um elemento de exibição (display).
   * Quando o input mudar, o display é atualizado e o callback onChange é chamado.
   *
   * @param {string|Element} inputEl - ID ou elemento DOM do input
   * @param {string|Element} displayEl - ID ou elemento DOM do display (ex: tspan)
   * @param {function} onChange - Callback(value, displayEl). Recebe o valor parseado.
   * @param {Object} [options]
   * @param {string} [options.format='2f'] - Formato: '1f' (1 decimal), '2f' (2 decimais), '1i' (inteiro)
   * @param {number} [options.min] - Valor mínimo
   * @param {number} [options.max] - Valor máximo
   * @param {number} [options.defaultValue] - Valor padrão se inválido
   */
  UIManager.prototype.bindInput = function (inputEl, displayEl, onChange, options) {
    options = options || {};
    var format = options.format || '2f';
    var min = options.min;
    var max = options.max;
    var defaultValue = options.defaultValue;

    if (typeof inputEl === 'string') inputEl = document.getElementById(inputEl);
    if (typeof displayEl === 'string') displayEl = document.getElementById(displayEl);

    if (!inputEl) return;

    var self = this;
    var lastValid = parseFloat(inputEl.value) || 1.0;

    var decimals = format === '1f' ? 1 : (format === '2f' ? 2 : 0);

    var handler = function () {
      var val = parseFloat(inputEl.value);
      if (isNaN(val) || val <= 0) {
        inputEl.value = lastValid.toFixed(decimals);
        return;
      }
      if (min !== undefined && val < min) val = min;
      if (max !== undefined && val > max) val = max;
      lastValid = val;

      if (displayEl) {
        displayEl.textContent = val.toFixed(decimals);
      }

      if (typeof onChange === 'function') {
        onChange(val);
      }
    };

    inputEl.addEventListener('input', handler);
    inputEl.addEventListener('change', handler);

    this._bindings.push({ inputEl: inputEl, handler: handler, type: 'input' });
  };

  /**
   * Vincula um checkbox a uma propriedade/callback.
   *
   * @param {string|Element} checkboxEl - ID ou elemento do checkbox
   * @param {function} onChange - Callback(checked)
   */
  UIManager.prototype.bindCheckbox = function (checkboxEl, onChange) {
    if (typeof checkboxEl === 'string') checkboxEl = document.getElementById(checkboxEl);
    if (!checkboxEl) return;

    var handler = function () {
      if (typeof onChange === 'function') {
        onChange(checkboxEl.checked);
      }
    };

    checkboxEl.addEventListener('change', handler);
    this._bindings.push({ inputEl: checkboxEl, handler: handler, type: 'checkbox' });
  };

  /**
   * Sincroniza os valores iniciais (dispara todos os handlers).
   */
  UIManager.prototype.syncAll = function () {
    for (var i = 0; i < this._bindings.length; i++) {
      var b = this._bindings[i];
      b.handler();
    }
  };

  /**
   * Atualiza o valor de um input (útil para set programático).
   * @param {string|Element} inputEl
   * @param {number|boolean} value
   */
  UIManager.prototype.setValue = function (inputEl, value) {
    if (typeof inputEl === 'string') inputEl = document.getElementById(inputEl);
    if (!inputEl) return;

    if (inputEl.type === 'checkbox') {
      inputEl.checked = !!value;
    } else {
      inputEl.value = value;
    }
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  };

  return UIManager;
})();

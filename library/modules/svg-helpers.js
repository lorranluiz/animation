/**
 * SVGHelpers - Utilitários para criação e manipulação de elementos SVG.
 *
 * Este módulo fornece funções auxiliares para criar elementos SVG com
 * namespace correto, converter coordenadas entre sistema de mundo e tela,
 * e outras operações comuns em animações SVG.
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.Helpers = (function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var SVG_WIDTH = 800;
  var SVG_HEIGHT = 500;

  /**
   * Define as dimensões do viewport SVG para cálculos de coordenadas.
   * @param {number} w - Largura
   * @param {number} h - Altura
   */
  function setViewportSize(w, h) {
    SVG_WIDTH = w;
    SVG_HEIGHT = h;
  }

  /**
   * Cria um elemento SVG com namespace, atributos e filhos opcionais.
   * @param {string} tag - Tag SVG (ex: 'circle', 'rect', 'g')
   * @param {Object} attrs - Atributos como {cx: 100, cy: 50, r: 20, fill: 'red'}
   * @param {Array<Element>|string|Element} children - Filhos opcionais
   * @returns {Element} Elemento SVG criado
   */
  function createElement(tag, attrs, children) {
    var el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) {
          el.setAttribute(key, attrs[key]);
        }
      }
    }
    if (children) {
      if (typeof children === 'string') {
        el.textContent = children;
      } else if (Array.isArray(children)) {
        for (var i = 0; i < children.length; i++) {
          el.appendChild(children[i]);
        }
      } else {
        el.appendChild(children);
      }
    }
    return el;
  }

  /**
   * Remove todos os filhos de um elemento SVG.
   * @param {Element} el - Elemento SVG
   */
  function clearElement(el) {
    if (!el) return;
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  /**
   * Converte coordenada X do mundo para X da tela (levando em conta câmera).
   * Fórmula: screenX = centerX + (worldX - cameraX) * scale
   * @param {number} worldX - Coordenada X no mundo (metros)
   * @param {number} cameraX - Posição X da câmera no mundo (metros)
   * @param {number} scale - Escala pixels/metro
   * @returns {number} Coordenada X na tela
   */
  function worldToScreenX(worldX, cameraX, scale) {
    return (SVG_WIDTH / 2) + (worldX - cameraX) * scale;
  }

  /**
   * Converte coordenada Y do mundo para Y da tela.
   * O Y do mundo cresce para cima; o Y da tela cresce para baixo.
   * Fórmula: screenY = groundY - worldY * scale
   * @param {number} worldY - Coordenada Y no mundo (metros)
   * @param {number} groundY - Posição Y do chão na tela (pixels)
   * @param {number} scale - Escala pixels/metro
   * @returns {number} Coordenada Y na tela
   */
  function worldToScreenY(worldY, groundY, scale) {
    return groundY - worldY * scale;
  }

  /**
   * Converte posição do mundo para tela (x e y).
   * @param {number} worldX
   * @param {number} worldY
   * @param {number} cameraX
   * @param {number} groundY
   * @param {number} scale
   * @returns {{x: number, y: number}}
   */
  function worldToScreen(worldX, worldY, cameraX, groundY, scale) {
    return {
      x: worldToScreenX(worldX, cameraX, scale),
      y: worldToScreenY(worldY, groundY, scale)
    };
  }

  /**
   * Obtém um elemento SVG pelo ID.
   * @param {string} id
   * @returns {Element|null}
   */
  function get(id) {
    return document.getElementById(id);
  }

  /**
   * Smoothstep ease-in-out: mapeia t (0→1) com suavização cúbica.
   * f(0)=0, f(1)=1, f'(0)=0, f'(1)=0.
   * @param {number} t - Valor linear entre 0 e 1
   * @returns {number} Valor suavizado entre 0 e 1
   */
  function easeInOut(t) {
    return -1.945 * t * t * t + 2.94 * t * t + 0.005 * t;
  }

  return {
    SVG_NS: SVG_NS,
    SVG_WIDTH: SVG_WIDTH,
    SVG_HEIGHT: SVG_HEIGHT,
    setViewportSize: setViewportSize,
    createElement: createElement,
    clearElement: clearElement,
    worldToScreenX: worldToScreenX,
    worldToScreenY: worldToScreenY,
    worldToScreen: worldToScreen,
    get: get,
    easeInOut: easeInOut
  };
})();

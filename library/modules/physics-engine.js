/**
 * PhysicsEngine - Motor de simulação física com passo fixo.
 *
 * Implementa:
 *   - Integração semi-implícita de Euler com passo fixo (padrão 1/120s)
 *   - Acumulador de tempo para consistência independente de framerate
 *   - Gravidade configurável
 *   - Colisão com o chão (restituição dependente de massa)
 *   - Atrito de quique (perda de velocidade horizontal na colisão)
 *   - Atrito de rolamento (desaceleração horizontal quando no chão)
 *   - Limiar de velocidade para parada
 *
 * Uso:
 *   var engine = new SVGAnim.PhysicsEngine({
 *     gravity: 9.8, mass: 1.0, scale: 40, groundY: 0
 *   });
 *   engine.onUpdate = function(state) { ... };
 *   engine.launch(1.0, 6.26);
 *   engine.start(function(timestamp) { engine.step(timestamp); requestAnimationFrame(arguments.callee); });
 */
var SVGAnim = typeof SVGAnim !== 'undefined' ? SVGAnim : {};

SVGAnim.PhysicsEngine = (function () {
  'use strict';

  /**
   * @constructor
   * @param {Object} config - Configuração do motor de física
   * @param {number} [config.gravity=9.8] - Aceleração gravitacional (m/s²)
   * @param {number} [config.mass=1.0] - Massa do objeto (kg)
   * @param {number} [config.scale=40] - Escala pixels/metro
   * @param {number} [config.groundY=0] - Posição Y do chão no sistema de mundo (metros)
   * @param {number} [config.restituicaoBase=0.75] - Coeficiente de restituição base
   * @param {number} [config.atritoQuiqueBase=0.85] - Coeficiente de atrito de quique base
   * @param {number} [config.muRolamento=0.5] - Coeficiente de atrito de rolamento
   * @param {number} [config.fixedTimestep=1/120] - Passo fixo de física (segundos)
   * @param {number} [config.maxDelta=0.1] - Delta máximo por frame para evitar espiral da morte
   * @param {number} [config.velocidadeMinima=0.01] - Velocidade abaixo da qual se considera parado
   * @param {number} [config.alturaMaximaTela=400] - Altura máxima Y da tela para clip
   */
  function PhysicsEngine(config) {
    config = config || {};

    this.gravity = config.gravity !== undefined ? config.gravity : 9.8;
    this.mass = config.mass !== undefined ? config.mass : 1.0;
    this.scale = config.scale !== undefined ? config.scale : 40;
    this.groundY = config.groundY !== undefined ? config.groundY : 0;
    this.restituicaoBase = config.restituicaoBase !== undefined ? config.restituicaoBase : 0.75;
    this.atritoQuiqueBase = config.atritoQuiqueBase !== undefined ? config.atritoQuiqueBase : 0.85;
    this.muRolamento = config.muRolamento !== undefined ? config.muRolamento : 0.5;
    this.fixedTimestep = config.fixedTimestep !== undefined ? config.fixedTimestep : 1 / 120;
    this.maxDelta = config.maxDelta !== undefined ? config.maxDelta : 0.1;
    this.velocidadeMinima = config.velocidadeMinima !== undefined ? config.velocidadeMinima : 0.01;
    this.alturaMaximaTela = config.alturaMaximaTela !== undefined ? config.alturaMaximaTela : 400;

    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;

    this.animando = false;
    this.ultimoTimestamp = null;
    this.acumulador = 0;

    this.onUpdate = null;
    this.onStep = null;
    this.onGroundCollision = null;
    this.onStop = null;
    this.onLaunch = null;
  }

  /**
   * Calcula o coeficiente de restituição efetivo (depende da massa).
   * Objetos mais pesados quicam menos.
   * @returns {number}
   */
  PhysicsEngine.prototype.getRestituicao = function () {
    return this.restituicaoBase / (1.0 + 0.5 * this.mass);
  };

  /**
   * Calcula o atrito de quique efetivo (depende da massa).
   * @returns {number}
   */
  PhysicsEngine.prototype.getAtritoQuique = function () {
    return this.atritoQuiqueBase / (1.0 + 0.3 * this.mass);
  };

  /**
   * Calcula a aceleração de rolamento (desaceleração horizontal no chão).
   * @returns {number}
   */
  PhysicsEngine.prototype.getAceleracaoRolamento = function () {
    return -this.muRolamento * this.gravity * (1.0 + 0.2 * this.mass);
  };

  /**
   * Retorna o estado atual da simulação.
   * @returns {{x: number, y: number, vx: number, vy: number, animando: boolean}}
   */
  PhysicsEngine.prototype.getState = function () {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      animando: this.animando
    };
  };

  /**
   * Define a massa e notifica.
   * @param {number} m - Nova massa (kg)
   */
  PhysicsEngine.prototype.setMass = function (m) {
    if (isNaN(m) || m <= 0) return;
    this.mass = m;
  };

  /**
   * Define a gravidade.
   * @param {number} g - Nova gravidade (m/s²)
   */
  PhysicsEngine.prototype.setGravity = function (g) {
    if (isNaN(g) || g <= 0) return;
    this.gravity = g;
  };

  /**
   * Define a escala.
   * @param {number} s - Nova escala (pixels/metro)
   */
  PhysicsEngine.prototype.setScale = function (s) {
    if (isNaN(s) || s <= 0) return;
    this.scale = s;
  };

  /**
   * Reseta toda a simulação (posição, velocidade, acumulador, animação).
   */
  PhysicsEngine.prototype.reset = function () {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.animando = false;
    this.ultimoTimestamp = null;
    this.acumulador = 0;
  };

  /**
   * Lança a bola com velocidades iniciais.
   * @param {number} vx - Velocidade horizontal inicial (m/s)
   * @param {number} vy - Velocidade vertical inicial (m/s)
   */
  PhysicsEngine.prototype.launch = function (vx, vy) {
    if (this.animando) return;
    this.reset();
    this.vx = vx;
    this.vy = vy;
    this.animando = true;
    this.ultimoTimestamp = null;
    if (typeof this.onLaunch === 'function') {
      this.onLaunch(this.getState());
    }
  };

  /**
   * Verifica se a simulação está rodando.
   * @returns {boolean}
   */
  PhysicsEngine.prototype.isRunning = function () {
    return this.animando;
  };

  /**
   * Avança a física com o tempo real decorrido.
   * Deve ser chamado a cada frame de animação.
   * @param {number} timestamp - Timestamp do requestAnimationFrame (ms)
   */
  PhysicsEngine.prototype.step = function (timestamp) {
    if (!this.animando) return;

    if (this.ultimoTimestamp === null) {
      this.ultimoTimestamp = timestamp;
      return;
    }

    var deltaReal = (timestamp - this.ultimoTimestamp) / 1000;
    this.ultimoTimestamp = timestamp;

    if (deltaReal > this.maxDelta) {
      deltaReal = this.maxDelta;
    }

    this.acumulador += deltaReal;

    while (this.acumulador >= this.fixedTimestep) {
      this._integrate(this.fixedTimestep);
      this.acumulador -= this.fixedTimestep;
      if (typeof this.onStep === 'function') {
        this.onStep(this.getState());
      }
    }

    if (typeof this.onUpdate === 'function') {
      this.onUpdate(this.getState());
    }

    if (this._isStopped()) {
      this.animando = false;
      this.ultimoTimestamp = null;
      if (typeof this.onStop === 'function') {
        this.onStop(this.getState());
      }
    }
  };

  /**
   * Passo de integração semi-implícita de Euler.
   * @param {number} dt - Passo de tempo (segundos)
   * @private
   */
  PhysicsEngine.prototype._integrate = function (dt) {
    this.vy += -this.gravity * dt;
    this.vx += 0 * dt; // sem aceleração horizontal (arrasto desprezível no ar)

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y <= this.groundY) {
      this.y = this.groundY;
      this.vy = -this.vy * this.getRestituicao();
      this.vx *= this.getAtritoQuique();

      if (Math.abs(this.vy) < 0.2) {
        this.vy = 0;
      }

      if (typeof this.onGroundCollision === 'function') {
        this.onGroundCollision(this.getState());
      }
    }

    if (this.y <= this.groundY && this.vy === 0 && Math.abs(this.vx) > 0.01) {
      this.vx += this.getAceleracaoRolamento() * dt;
      if (Math.abs(this.vx) < 0.05) {
        this.vx = 0;
      }
    }

    if (this.y * this.scale > this.alturaMaximaTela) {
      this.y = this.alturaMaximaTela / this.scale;
      this.vy = 0;
    }
  };

  /**
   * Verifica se a simulação parou completamente.
   * @returns {boolean}
   * @private
   */
  PhysicsEngine.prototype._isStopped = function () {
    return Math.abs(this.vx) < 0.05 &&
           Math.abs(this.vy) < 0.05 &&
           this.y === this.groundY;
  };

  return PhysicsEngine;
})();

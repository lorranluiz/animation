/**
 * SVG Animation Library v1.0.0
 * ==============================
 *
 * Biblioteca para animações e simulações físicas em SVG.
 * Fornece módulos para:
 *   - Motor de física com passo fixo (PhysicsEngine)
 *   - Câmera com suavização (Camera)
 *   - Fundo com paralaxe (ParallaxBackground)
 *   - Linhas de perspectiva (PerspectiveLines)
 *   - Trajetória tracejada (TrajectoryTracer)
 *   - Régua horizontal dinâmica (DynamicRuler)
 *   - Gerenciamento de entrada de teclado (InputManager)
 *   - Gerenciamento de interface (UIManager)
 *   - Utilitários SVG (Helpers)
 *
 * Uso básico:
 *   <svg ...>
 *     <script type="text/javascript" href="svg-animation-lib.js" />
 *     <script type="text/javascript"><![CDATA[
 *       var engine = new SVGAnim.PhysicsEngine({ gravity: 9.8 });
 *       var camera = new SVGAnim.Camera({ smoothness: 0.08 });
 *       var input  = new SVGAnim.InputManager({ svgElement: svgRoot });
 *       ...
 *     ]]></script>
 *   </svg>
 *
 * Licença: MIT
 */
var SVGAnim = (function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  // ========================================================================
  // Helpers - Utilitários SVG
  // ========================================================================

  var Helpers = {
    SVG_NS: SVG_NS,
    SVG_WIDTH: 800,
    SVG_HEIGHT: 500,

    setViewportSize: function (w, h) {
      Helpers.SVG_WIDTH = w;
      Helpers.SVG_HEIGHT = h;
    },

    createElement: function (tag, attrs, children) {
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
    },

    clearElement: function (el) {
      if (!el) return;
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    },

    worldToScreenX: function (worldX, cameraX, scale) {
      return (Helpers.SVG_WIDTH / 2) + (worldX - cameraX) * scale;
    },

    worldToScreenY: function (worldY, groundY, scale) {
      return groundY - worldY * scale;
    },

    worldToScreen: function (worldX, worldY, cameraX, groundY, scale) {
      return {
        x: Helpers.worldToScreenX(worldX, cameraX, scale),
        y: Helpers.worldToScreenY(worldY, groundY, scale)
      };
    },

    easeInOut: function (t) {
      return -1.945 * t * t * t + 2.94 * t * t + 0.005 * t;
    },

    get: function (id) {
      return document.getElementById(id);
    }
  };

  // ========================================================================
  // PhysicsEngine - Motor de simulação física
  // ========================================================================

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

  PhysicsEngine.prototype.getRestituicao = function () {
    return this.restituicaoBase / (1.0 + 0.5 * this.mass);
  };

  PhysicsEngine.prototype.getAtritoQuique = function () {
    return this.atritoQuiqueBase / (1.0 + 0.3 * this.mass);
  };

  PhysicsEngine.prototype.getAceleracaoRolamento = function () {
    return -this.muRolamento * this.gravity * (1.0 + 0.2 * this.mass);
  };

  PhysicsEngine.prototype.getState = function () {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      animando: this.animando
    };
  };

  PhysicsEngine.prototype.setMass = function (m) {
    if (isNaN(m) || m <= 0) return;
    this.mass = m;
  };

  PhysicsEngine.prototype.setGravity = function (g) {
    if (isNaN(g) || g <= 0) return;
    this.gravity = g;
  };

  PhysicsEngine.prototype.setScale = function (s) {
    if (isNaN(s) || s <= 0) return;
    this.scale = s;
  };

  PhysicsEngine.prototype.reset = function () {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.animando = false;
    this.ultimoTimestamp = null;
    this.acumulador = 0;
  };

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

  PhysicsEngine.prototype.isRunning = function () {
    return this.animando;
  };

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

  PhysicsEngine.prototype._integrate = function (dt) {
    this.vy += -this.gravity * dt;
    this.vx += 0 * dt;

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

  PhysicsEngine.prototype._isStopped = function () {
    return Math.abs(this.vx) < 0.05 &&
           Math.abs(this.vy) < 0.05 &&
           this.y === this.groundY;
  };

  // ========================================================================
  // Camera - Sistema de câmera com suavização
  // ========================================================================

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

  Camera.prototype.getX = function () {
    return this._cameraX;
  };

  Camera.prototype.follow = function (targetX, targetY) {
    this._targetX = targetX;
    var dx = targetX - this._cameraX;
    this._cameraX += dx * this.smoothness;
  };

  Camera.prototype.worldToScreenX = function (worldX) {
    return this.screenCenterX + (worldX - this._cameraX) * this.scale;
  };

  Camera.prototype.worldToScreenY = function (worldY) {
    return this.screenGroundY - worldY * this.scale;
  };

  Camera.prototype.worldToScreen = function (worldX, worldY) {
    return {
      x: this.worldToScreenX(worldX),
      y: this.worldToScreenY(worldY)
    };
  };

  Camera.prototype.isOnScreen = function (screenX, margin) {
    margin = margin || 0;
    return screenX >= -margin && screenX <= (this.screenCenterX * 2 + margin);
  };

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

  // ========================================================================
  // ParallaxBackground - Fundo com paralaxe
  // ========================================================================

  function ParallaxBackground(config) {
    config = config || {};

    this.container = config.container;
    this.modelId = config.modelId || '#itemModelo';
    this.numItems = config.numItems !== undefined ? config.numItems : 14;
    this.camera = config.camera;
    this.parallaxFactor = config.parallaxFactor !== undefined ? config.parallaxFactor : 0.6;
    this.scale = config.scale !== undefined ? config.scale : 40;
    this.screenWidth = config.screenWidth !== undefined ? config.screenWidth : 800;
    this.margin = config.margin !== undefined ? config.margin : 200;

    this._items = [];
  }

  ParallaxBackground.prototype.generateItems = function () {
    var items = [];
    for (var i = 0; i < this.numItems; i++) {
      items.push({
        posX: (Math.random() - 0.5) * 30,
        posY: 40 + Math.random() * 200,
        scale: 0.6 + Math.random() * 0.8,
        opacity: 0.7 + Math.random() * 0.3
      });
    }
    return items;
  };

  ParallaxBackground.prototype.init = function () {
    this._items = this.generateItems();
    this.render();
  };

  ParallaxBackground.prototype.update = function () {
    if (!this.camera) return;

    var cameraX = this.camera.getX();
    var halfW = this.screenWidth / 2;
    var paraX = cameraX * this.parallaxFactor;

    for (var i = 0; i < this._items.length; i++) {
      var item = this._items[i];
      var screenX = halfW + (item.posX - paraX) * this.scale;

      if (screenX < -this.margin) {
        item.posX = paraX + (this.screenWidth + this.margin + Math.random() * 200) / this.scale;
      } else if (screenX > this.screenWidth + this.margin) {
        item.posX = paraX - (this.screenWidth + this.margin + Math.random() * 200) / this.scale;
      }
    }

    this.render();
  };

  ParallaxBackground.prototype.render = function () {
    if (!this.container) return;

    Helpers.clearElement(this.container);

    var cameraX = this.camera.getX();
    var paraX = cameraX * this.parallaxFactor;
    var halfW = this.screenWidth / 2;

    for (var i = 0; i < this._items.length; i++) {
      var item = this._items[i];
      var screenX = halfW + (item.posX - paraX) * this.scale;

      var useEl = document.createElementNS(SVG_NS, 'use');
      useEl.setAttribute('href', this.modelId);
      useEl.setAttribute('x', screenX);
      useEl.setAttribute('y', item.posY);
      if (item.scale !== 1) {
        useEl.setAttribute('transform', 'scale(' + item.scale + ')');
      }
      useEl.setAttribute('opacity', item.opacity);

      this.container.appendChild(useEl);
    }
  };

  ParallaxBackground.prototype.reset = function () {
    this._items = this.generateItems();
    this.render();
  };

  // ========================================================================
  // PerspectiveLines - Linhas de perspectiva do chão
  // ========================================================================

  function PerspectiveLines(config) {
    config = config || {};

    this.container = config.container;
    this.camera = config.camera;
    this.scale = config.scale !== undefined ? config.scale : 40;
    this.screenWidth = config.screenWidth !== undefined ? config.screenWidth : 800;
    this.screenHeight = config.screenHeight !== undefined ? config.screenHeight : 500;
    this.groundY = config.groundY !== undefined ? config.groundY : 420;
    this.vanishY = config.vanishY !== undefined ? config.vanishY : 200;
    this.step = config.step !== undefined ? config.step : 1.0;
    this.range = config.range !== undefined ? config.range : 10;
    this.strokeColor = config.strokeColor || 'rgba(0,80,0,0.25)';
    this.strokeWidth = config.strokeWidth || '1.8';
  }

  PerspectiveLines.prototype.update = function () {
    if (!this.container || !this.camera) return;

    Helpers.clearElement(this.container);

    var cameraX = this.camera.getX();
    var vanishX = this.screenWidth / 2;
    var inicio = cameraX - this.range;
    var fim = cameraX + this.range;

    for (var m = Math.floor(inicio); m <= Math.ceil(fim); m += this.step) {
      var xChao = this.camera.worldToScreenX(m);

      if (xChao < -10 || xChao > this.screenWidth + 10) continue;

      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', xChao);
      line.setAttribute('y1', this.groundY + 80);
      line.setAttribute('x2', vanishX);
      line.setAttribute('y2', this.vanishY);
      line.setAttribute('stroke', this.strokeColor);
      line.setAttribute('stroke-width', this.strokeWidth);

      this.container.appendChild(line);
    }
  };

  // ========================================================================
  // TrajectoryTracer - Trajetória tracejada
  // ========================================================================

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

  TrajectoryTracer.prototype.clear = function () {
    this._points = [];
    this._stepCounter = 0;
    if (this.pathElement) {
      this.pathElement.setAttribute('d', '');
    }
  };

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

  TrajectoryTracer.prototype.setActive = function (val) {
    this.active = val;
    if (this.pathElement) {
      this.pathElement.style.display = val ? 'block' : 'none';
    }
  };

  TrajectoryTracer.prototype.isActive = function () {
    return this.active;
  };

  TrajectoryTracer.prototype.getPoints = function () {
    return this._points.slice();
  };

  // ========================================================================
  // DynamicRuler - Régua horizontal dinâmica
  // ========================================================================

  function DynamicRuler(config) {
    config = config || {};

    this.container = config.container;
    this.camera = config.camera;
    this.scale = config.scale !== undefined ? config.scale : 40;
    this.groundY = config.groundY !== undefined ? config.groundY : 420;
    this.screenWidth = config.screenWidth !== undefined ? config.screenWidth : 800;
    this.range = config.range !== undefined ? config.range : 5;
    this.unitLabel = config.unitLabel || 'm';
    this.tickColor = config.tickColor || '#333';
    this.tickWidth = config.tickWidth || '1.5';
    this.tickHeight = config.tickHeight !== undefined ? config.tickHeight : 10;
    this.labelOffset = config.labelOffset !== undefined ? config.labelOffset : 15;
  }

  DynamicRuler.prototype.update = function () {
    if (!this.container || !this.camera) return;

    Helpers.clearElement(this.container);

    var cameraX = this.camera.getX();
    var inicio = cameraX - this.range;
    var fim = cameraX + this.range;
    var primeiroMetro = Math.floor(inicio);

    for (var m = primeiroMetro; m <= fim; m++) {
      var xTela = this.camera.worldToScreenX(m);

      if (xTela < 0 || xTela > this.screenWidth) continue;

      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', xTela);
      line.setAttribute('y1', this.groundY);
      line.setAttribute('x2', xTela);
      line.setAttribute('y2', this.groundY - this.tickHeight);
      line.setAttribute('stroke', this.tickColor);
      line.setAttribute('stroke-width', this.tickWidth);
      this.container.appendChild(line);

      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', xTela);
      text.setAttribute('y', this.groundY - this.labelOffset);
      text.setAttribute('font-family', 'Arial, sans-serif');
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', this.tickColor);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'bottom');
      text.textContent = Math.round(m);
      this.container.appendChild(text);
    }
  };

  // ========================================================================
  // VerticalRuler - Régua vertical fixa
  // ========================================================================

  function VerticalRuler(config) {
    config = config || {};

    this.container = config.container;
    this.groundY = config.groundY !== undefined ? config.groundY : 420;
    this.maxHeight = config.maxHeight !== undefined ? config.maxHeight : 10;
    this.scale = config.scale !== undefined ? config.scale : 40;
    this.x = config.x !== undefined ? config.x : 10;
    this.width = config.width !== undefined ? config.width : 18;
    this.bgColor = config.bgColor || 'rgba(255,255,255,0.6)';
    this.borderColor = config.borderColor || '#333';
    this.borderWidth = config.borderWidth !== undefined ? config.borderWidth : 1.5;
    this.borderRadius = config.borderRadius !== undefined ? config.borderRadius : 2;
    this.tickColor = config.tickColor || '#333';
    this.tickWidthLong = config.tickWidthLong || '2';
    this.tickWidthShort = config.tickWidthShort || '1.5';
    this.tickLengthLong = config.tickLengthLong !== undefined ? config.tickLengthLong : 7;
    this.tickLengthShort = config.tickLengthShort !== undefined ? config.tickLengthShort : 5;
    this.textOffsetX = config.textOffsetX !== undefined ? config.textOffsetX : 22;
    this.textAnchor = config.textAnchor || 'end';
    this.fontFamily = config.fontFamily || 'Arial, sans-serif';
    this.fontSize = config.fontSize || '10';
    this.labelFontSize = config.labelFontSize !== undefined ? config.labelFontSize : 12;
    this.unitLabel = config.unitLabel || 'm';
    this.labelOffsetY = config.labelOffsetY !== undefined ? config.labelOffsetY : 5;
  }

  VerticalRuler.prototype.render = function () {
    if (!this.container) return;

    Helpers.clearElement(this.container);

    var groundY = this.groundY;
    var scale = this.scale;
    var maxH = this.maxHeight;
    var tickX = this.x + this.width;
    var topY = groundY - maxH * scale;

    var bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', this.x);
    bg.setAttribute('y', topY);
    bg.setAttribute('width', this.width);
    bg.setAttribute('height', maxH * scale);
    bg.setAttribute('fill', this.bgColor);
    bg.setAttribute('rx', this.borderRadius);
    this.container.appendChild(bg);

    var border = document.createElementNS(SVG_NS, 'rect');
    border.setAttribute('x', this.x);
    border.setAttribute('y', topY);
    border.setAttribute('width', this.width);
    border.setAttribute('height', maxH * scale);
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', this.borderColor);
    border.setAttribute('stroke-width', this.borderWidth);
    border.setAttribute('rx', this.borderRadius);
    this.container.appendChild(border);

    for (var m = 0; m <= maxH; m++) {
      var y = groundY - m * scale;
      var isEnd = (m === 0 || m === maxH);
      var tickWidth = isEnd ? this.tickWidthLong : this.tickWidthShort;
      var tickLen = isEnd ? this.tickLengthLong : this.tickLengthShort;

      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', tickX);
      line.setAttribute('y1', y);
      line.setAttribute('x2', tickX + tickLen);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', this.tickColor);
      line.setAttribute('stroke-width', tickWidth);
      this.container.appendChild(line);

      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', this.textOffsetX);
      text.setAttribute('y', y);
      text.setAttribute('font-family', this.fontFamily);
      text.setAttribute('font-size', this.fontSize);
      text.setAttribute('fill', this.tickColor);
      text.setAttribute('text-anchor', this.textAnchor);
      text.setAttribute('dominant-baseline', 'middle');
      text.textContent = String(m);
      this.container.appendChild(text);
    }

    var label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', this.x + this.width / 2);
    label.setAttribute('y', topY - this.labelOffsetY);
    label.setAttribute('font-family', this.fontFamily);
    label.setAttribute('font-size', this.labelFontSize);
    label.setAttribute('fill', this.tickColor);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-weight', 'bold');
    label.textContent = this.unitLabel;
    this.container.appendChild(label);
  };

  // ========================================================================
  // InputManager - Gerenciador de entrada
  // ========================================================================

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

  InputManager.prototype._shouldIgnore = function (event) {
    var active = document.activeElement;
    if (active && this.ignoreTags.indexOf(active.tagName) !== -1) {
      return true;
    }
    return false;
  };

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

  InputManager.prototype._handleKeyUp = function (event) {
    if (this._shouldIgnore(event)) return;

    var key = event.code || event.key;
    this._pressed[key] = false;

    if (this._keyUpCallbacks[key]) {
      event.preventDefault();
      this._keyUpCallbacks[key](event);
    }
  };

  InputManager.prototype.onKeyDown = function (key, callback) {
    this._keyDownCallbacks[key] = callback;
  };

  InputManager.prototype.onKeyUp = function (key, callback) {
    this._keyUpCallbacks[key] = callback;
  };

  InputManager.prototype.onKey = function (key, callback) {
    this._keyCallbacks[key] = callback;
  };

  InputManager.prototype.isPressed = function (key) {
    return !!this._pressed[key];
  };

  InputManager.prototype.destroy = function () {
    document.removeEventListener('keydown', this._boundKeyDown);
    document.removeEventListener('keyup', this._boundKeyUp);
    this._pressed = {};
    this._keyDownCallbacks = {};
    this._keyUpCallbacks = {};
    this._keyCallbacks = {};
  };

  // ========================================================================
  // UIManager - Gerenciador de interface
  // ========================================================================

  function UIManager(config) {
    config = config || {};
    this._bindings = [];
  }

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

  UIManager.prototype.syncAll = function () {
    for (var i = 0; i < this._bindings.length; i++) {
      this._bindings[i].handler();
    }
  };

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

  // ========================================================================
  // API Pública
  // ========================================================================

  // ========================================================================
  // Keyframe - Unidade de keyframe
  // ========================================================================

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

  Keyframe.prototype.clone = function () {
    return new Keyframe(this);
  };

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

  // ========================================================================
  // Timeline - Linha do tempo
  // ========================================================================

  function Timeline(config) {
    config = config || {};
    this.duracao = config.duracao !== undefined ? config.duracao : 10;
    this.keyframes = config.keyframes || [];
    this.durLabel = config.durLabel || null;
    this.progressBar = config.progressBar || null;
    this.T_BAR_X = 40;
    this.T_BAR_W = 720;
  }

  Timeline.prototype.getMinDuracao = function () {
    if (this.keyframes.length === 0) return 0;
    return this.keyframes[this.keyframes.length - 1].tempo;
  };

  Timeline.prototype.maxTempo = function () {
    return Math.max(this.getMinDuracao(), this.duracao);
  };

  Timeline.prototype.kfToScreenX = function (tempo) {
    var max = this.maxTempo();
    return this.T_BAR_X + (tempo / Math.max(max, 1)) * this.T_BAR_W;
  };

  Timeline.prototype.validarDuracao = function () {
    var min = this.getMinDuracao();
    if (this.duracao < min) this.duracao = min;
  };

  Timeline.prototype.syncDuracaoSlider = function (sliderEl, lblVal) {
    if (!sliderEl) return;
    var minDur = this.getMinDuracao();
    sliderEl.min = minDur;
    var val = parseInt(sliderEl.value);
    if (val < minDur) { sliderEl.value = minDur; val = minDur; }
    if (lblVal) lblVal.textContent = val + 's';
    if (this.durLabel) this.durLabel.textContent = 'Duração máx: ' + this.duracao + 's | KFs: ' + this.keyframes.length;
  };

  Timeline.prototype.setDuracao = function (d) {
    this.duracao = d;
    this.validarDuracao();
  };

  // ========================================================================
  // Highlighter - Marcador de highlights sobre a imagem
  // ========================================================================

  function Highlighter() {
    this.marks = {};
  }

  Highlighter.prototype.addMark = function (kfIdx, path, thickness, totalLength) {
    if (!this.marks[kfIdx]) this.marks[kfIdx] = [];
    this.marks[kfIdx].push({
      path: path, thickness: thickness,
      color: 'rgba(255,255,0,0.4)', totalLength: totalLength || 100
    });
  };

  Highlighter.prototype.computeFactor = function (t, keyframes, kfIdx) {
    var markKf = keyframes[kfIdx], last = keyframes[keyframes.length - 1];
    if (kfIdx === 0) {
      if (keyframes.length === 1) return 1;
      var sl = keyframes[1].tempo - markKf.tempo; if (sl <= 0) return 1;
      var se = markKf.tempo + sl * 0.5, sh = markKf.tempo + sl * 0.75;
      if (t <= se) return 1; if (t <= sh) return 1 - (t - se) / (sh - se); return 0;
    }
    var prev = keyframes[kfIdx - 1], curr = keyframes[kfIdx];
    var sl2 = curr.tempo - prev.tempo; if (sl2 <= 0) return (t >= curr.tempo ? 1 : 0);
    var as = prev.tempo + sl2 * 0.9;
    if (t < as) return 0;
    if (t <= curr.tempo) return Math.min(1, (t - as) / (curr.tempo - as));
    if (kfIdx === keyframes.length - 1) return 1;
    var next = keyframes[kfIdx + 1], ns = next.tempo - curr.tempo;
    if (ns <= 0) return 1;
    var se2 = curr.tempo + ns * 0.5, sh2 = curr.tempo + ns * 0.75;
    if (t <= se2) return 1; if (t <= sh2) return 1 - (t - se2) / (sh2 - se2); return 0;
  };

  Highlighter.prototype.getMarks = function (kfIdx) { return this.marks[kfIdx] || []; };

  Highlighter.prototype.toJSON = function () { return this.marks; };

  Highlighter.prototype.fromJSON = function (data) { this.marks = data || {}; };

  // ========================================================================
  // API Pública
  // ========================================================================

  return {
    version: '1.0.0',
    Helpers: Helpers,
    PhysicsEngine: PhysicsEngine,
    Camera: Camera,
    ParallaxBackground: ParallaxBackground,
    PerspectiveLines: PerspectiveLines,
    TrajectoryTracer: TrajectoryTracer,
    DynamicRuler: DynamicRuler,
    VerticalRuler: VerticalRuler,
    InputManager: InputManager,
    UIManager: UIManager,
    Keyframe: Keyframe,
    Timeline: Timeline,
    Highlighter: Highlighter
  };

})();

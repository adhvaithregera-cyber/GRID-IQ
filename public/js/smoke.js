/* ============================================================
   GridIQ — WebGL Smoke Background  |  smoke.js
   Adapted from SmokeBackground WebGL component (WebGL2)
   ============================================================ */

const SMOKE_FRAG_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2  resolution;
uniform vec3  u_color;
uniform vec3  u_bg;

#define FC gl_FragCoord.xy
#define R  resolution
#define T  (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);

  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);

  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);

  col=mix(col,u_color,dot(col,vec3(.21,.71,.07)));

  col=mix(u_bg,col,min(time*.08,1.0));
  col=clamp(col,min(u_bg.r,min(u_bg.g,u_bg.b)),1.0);
  O=vec4(col,1);
}`;

const SMOKE_VERT_SRC = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

class SmokeRenderer {
  constructor(canvas) {
    this.canvas  = canvas;
    this.gl      = canvas.getContext('webgl2');
    if (!this.gl) return;
    this._verts  = new Float32Array([-1,1,-1,-1,1,1,1,-1]);
    this._color  = [0.50, 0.07, 0.04];  // dark red smoke tint
    this._bg     = [0.03, 0.03, 0.03];  // near-black bg
    this._setup();
    this._init();
  }

  setColors(color, bg) {
    this._color = color;
    this._bg    = bg;
  }

  updateScale() {
    if (!this.gl) return;
    const dpr  = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = Math.round(rect.width  * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  _compile(shader, src) {
    const { gl } = this;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      console.error('[GridIQ smoke] shader:', gl.getShaderInfoLog(shader));
  }

  _setup() {
    const { gl } = this;
    this._vs      = gl.createShader(gl.VERTEX_SHADER);
    this._fs      = gl.createShader(gl.FRAGMENT_SHADER);
    this._program = gl.createProgram();
    this._compile(this._vs, SMOKE_VERT_SRC);
    this._compile(this._fs, SMOKE_FRAG_SRC);
    gl.attachShader(this._program, this._vs);
    gl.attachShader(this._program, this._fs);
    gl.linkProgram(this._program);
    if (!gl.getProgramParameter(this._program, gl.LINK_STATUS))
      console.error('[GridIQ smoke] program:', gl.getProgramInfoLog(this._program));
  }

  _init() {
    const { gl } = this;
    const p = this._program;
    this._buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buf);
    gl.bufferData(gl.ARRAY_BUFFER, this._verts, gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(p, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    p._uRes   = gl.getUniformLocation(p, 'resolution');
    p._uTime  = gl.getUniformLocation(p, 'time');
    p._uColor = gl.getUniformLocation(p, 'u_color');
    p._uBg    = gl.getUniformLocation(p, 'u_bg');
  }

  render(now = 0) {
    const { gl, _program: p, _buf, canvas } = this;
    if (!gl || !p || !gl.isProgram(p)) return;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, _buf);
    gl.uniform2f(p._uRes,   canvas.width, canvas.height);
    gl.uniform1f(p._uTime,  now * 1e-3);
    gl.uniform3fv(p._uColor, this._color);
    gl.uniform3fv(p._uBg,   this._bg);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  destroy() {
    const { gl, _program: p, _vs, _fs } = this;
    if (!p) return;
    gl.detachShader(p, _vs); gl.deleteShader(_vs);
    gl.detachShader(p, _fs); gl.deleteShader(_fs);
    gl.deleteProgram(p);
    if (this._buf) gl.deleteBuffer(this._buf);
  }
}

/* ── Module state ──────────────────────────────────────────── */
let _smokeRenderer = null;
let _smokeRaf      = null;

function _smokeColors() {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  return light
    ? { color: [0.78, 0.76, 0.77], bg: [0.96, 0.96, 0.97] }   // soft gray wisps on white
    : { color: [0.52, 0.07, 0.04], bg: [0.03, 0.03, 0.03] };  // dark red smoke on black
}

function initSmoke() {
  const canvas = document.getElementById('smoke-canvas');
  if (!canvas) return;

  const r = new SmokeRenderer(canvas);
  if (!r.gl) { canvas.style.display = 'none'; return; } // no WebGL2 support

  _smokeRenderer = r;
  const { color, bg } = _smokeColors();
  r.setColors(color, bg);
  r.updateScale();

  window.addEventListener('resize', () => r.updateScale());

  const loop = (now) => {
    r.render(now);
    _smokeRaf = requestAnimationFrame(loop);
  };
  loop(0);
}

function updateSmokeTheme() {
  if (!_smokeRenderer) return;
  const { color, bg } = _smokeColors();
  _smokeRenderer.setColors(color, bg);
}

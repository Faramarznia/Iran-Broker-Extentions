/* Background animations: WebGL shader + sparkles strip */

export function initShaderBg() {
  const canvas = document.getElementById('shader-bg-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.style.display = 'none'; return; }

  const vertSrc = 'attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.,1.);}';
  const fragSrc = [
    'precision highp float;',
    'uniform vec2 resolution;',
    'uniform float time;',
    'void main(void){',
    '  vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);',
    '  float t=time*0.05;',
    '  float lw=0.002;',
    '  vec3 color=vec3(0.);',
    '  for(int j=0;j<3;j++){',
    '    for(int i=0;i<5;i++){',
    '      color[j]+=lw*float(i*i)/abs(fract(t-0.01*float(j)+float(i)*0.01)*5.-length(uv)+mod(uv.x+uv.y,0.2));',
    '    }',
    '  }',
    '  gl_FragColor=vec4(color[0],color[1],color[2],1.);',
    '}'
  ].join('');

  function mkShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,-1, 1,1, -1,1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const timeLoc = gl.getUniformLocation(prog, 'time');
  const resLoc = gl.getUniformLocation(prog, 'resolution');
  let t = 0, rafId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function draw() {
    t += 0.05;
    gl.uniform1f(timeLoc, t);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    rafId = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else rafId = requestAnimationFrame(draw);
  });
}

export function initSparkles() {
  const canvas = document.getElementById('sp-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, particles = [], rafId;

  function newParticle(randomY) {
    return {
      x: Math.random() * W,
      y: randomY ? Math.random() * H : H + 2,
      r: Math.random() * 1.0 + 0.4,
      phase: Math.random() * Math.PI * 2,
      freq: 0.012 + Math.random() * 0.022,
      maxOp: 0.25 + Math.random() * 0.75,
      vx: (Math.random() - 0.5) * 0.28,
      vy: -(0.05 + Math.random() * 0.18)
    };
  }

  function resize() {
    W = canvas.parentElement.offsetWidth;
    H = canvas.parentElement.offsetHeight;
    canvas.width = W;
    canvas.height = H;
    particles = [];
    const count = Math.min(Math.floor(W / 3.5), 300);
    for (let i = 0; i < count; i++) particles.push(newParticle(true));
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    const isLight = document.body.getAttribute('data-theme') === 'light';
    const rc = isLight ? 24 : 255, gc = isLight ? 90 : 255, bc = isLight ? 219 : 255;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.phase += p.freq;
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -4 || p.x < -6 || p.x > W + 6) { particles[i] = newParticle(false); continue; }
      const op = p.maxOp * ((Math.sin(p.phase) + 1) / 2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + rc + ',' + gc + ',' + bc + ',' + op.toFixed(2) + ')';
      ctx.fill();
    }
    rafId = requestAnimationFrame(tick);
  }

  resize();
  tick();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else rafId = requestAnimationFrame(tick);
  });
}

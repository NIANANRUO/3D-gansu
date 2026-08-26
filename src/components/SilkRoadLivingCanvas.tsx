import { useEffect, useRef } from "react";

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform vec2 u_imageResolution;
uniform float u_time;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; ++i) {
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 s = u_resolution;
  vec2 i = u_imageResolution;
  float rs = s.x / s.y;
  float ri = i.x / i.y;
  vec2 uv = v_uv;
  if (rs > ri) {
    float scale = ri / rs;
    uv.y = (uv.y - 0.5) * scale + 0.5;
  } else {
    float scale = rs / ri;
    uv.x = (uv.x - 0.5) * scale + 0.5;
  }

  vec4 origCol = texture2D(u_image, uv);

  // 1. 提取左下角碧波河流区域
  bool inRiverZone = (uv.x < 0.42 && uv.y > 0.65);
  float blueDelta = origCol.b - (origCol.r * 0.48 + origCol.g * 0.52);
  float isWater = smoothstep(0.01, 0.14, blueDelta) * float(inRiverZone);

  // 2. 真实河流液态流体波动
  vec2 waterDistort = vec2(0.0);
  if (isWater > 0.005) {
    float waveX = sin(uv.y * 58.0 - u_time * 3.8 + uv.x * 28.0) * 0.0075;
    float waveY = cos(uv.x * 72.0 - u_time * 3.2 - uv.y * 36.0) * 0.006;
    float turbulent = noise(uv * 50.0 - vec2(u_time * 2.2, u_time * 1.6)) * 0.005;
    waterDistort = vec2(waveX + turbulent, waveY + turbulent) * isWater;
  }

  // 3. 大漠沙丘微热浪扰动
  float heatHaze = sin(uv.y * 70.0 + u_time * 3.5) * 0.0016 * smoothstep(0.35, 0.95, uv.y) * (1.0 - isWater);
  vec2 finalUV = uv + waterDistort + vec2(heatHaze, 0.0);

  vec4 col = texture2D(u_image, finalUV);

  // 4. 绿洲河面波光高光
  if (isWater > 0.02) {
    float caustics1 = pow(max(0.0, sin(finalUV.y * 95.0 - u_time * 4.6 + finalUV.x * 60.0)), 10.0) * 0.7;
    float caustics2 = pow(max(0.0, cos(finalUV.x * 85.0 + u_time * 3.8 - finalUV.y * 45.0)), 8.0) * 0.5;
    float sparkle = pow(noise(finalUV * 75.0 + vec2(u_time * 2.8, u_time * 2.0)), 6.0) * 1.6;
    vec3 waterGlow = vec3(0.55, 0.85, 1.0) * (caustics1 + caustics2 + sparkle) * isWater;
    col.rgb += waterGlow;
  }

  // 5. 祁连雪山与晨曦柔光
  vec2 sunOrigin = vec2(0.12, 0.16);
  vec2 sunDir = uv - sunOrigin;
  float sunDist = length(sunDir);
  float sunAngle = atan(sunDir.y, sunDir.x);
  float godRays = sin(sunAngle * 6.0 + u_time * 0.16) * 0.5 + 0.5;
  godRays *= sin(sunAngle * 11.0 - u_time * 0.1) * 0.5 + 0.5;
  godRays *= smoothstep(1.2, 0.15, sunDist);
  col.rgb += vec3(0.92, 0.84, 0.70) * godRays * 0.038;

  // 6. 大漠流沙与沙雾烟岚
  vec2 smokeUV1 = uv * 2.8 - vec2(u_time * 0.42, u_time * 0.14);
  vec2 smokeUV2 = uv * 5.5 - vec2(u_time * 0.78, u_time * 0.28);
  float sandSmoke1 = fbm(smokeUV1);
  float sandSmoke2 = fbm(smokeUV2);
  float totalSandSmoke = smoothstep(0.32, 0.88, (sandSmoke1 * 0.6 + sandSmoke2 * 0.4)) * smoothstep(0.08, 0.75, uv.y);
  vec3 sandColor = vec3(0.86, 0.73, 0.52);
  col.rgb = mix(col.rgb, sandColor, totalSandSmoke * 0.28);

  // 7. 祁连山脉流云浮岚
  if (uv.y < 0.42) {
    vec2 cloudUV = uv * vec2(1.8, 5.2) - vec2(u_time * 0.07, 0.0);
    float cloud = fbm(cloudUV) * smoothstep(0.42, 0.08, uv.y) * smoothstep(0.0, 0.18, uv.y);
    col.rgb += vec3(0.95, 0.92, 0.86) * cloud * 0.22;
  }

  // 电影级暗角与焦段色彩加深 (Cinematic Vignette)
  vec2 vigUV = v_uv * (1.0 - v_uv.yx);
  float vig = vigUV.x * vigUV.y * 15.0;
  vig = clamp(pow(vig, 0.25), 0.0, 1.0);
  col.rgb *= mix(0.72, 1.0, vig);

  gl_FragColor = col;
}
`;

export function SilkRoadLivingCanvas() {
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!glCanvasRef.current) return;
    const canvas = glCanvasRef.current;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uImgRes = gl.getUniformLocation(program, "u_imageResolution");
    const uTime = gl.getUniformLocation(program, "u_time");

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([230, 218, 198, 255]),
    );

    let imgW = 1920;
    let imgH = 1080;

    const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
    const img = new Image();
    img.src = `${baseUrl}silk-road-bg.jpg`;
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      imgW = img.naturalWidth || 1920;
      imgH = img.naturalHeight || 1080;
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    const startTime = performance.now();

    const render = () => {
      const now = performance.now();
      const elapsed = (now - startTime) * 0.001;

      gl.useProgram(program);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uImgRes, imgW, imgH);
      gl.uniform1f(uTime, elapsed);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(program);
      gl.deleteTexture(texture);
    };
  }, []);

  // 电影级空气微尘与飞沙景深粒子群
  useEffect(() => {
    if (!particleCanvasRef.current) return;
    const canvas = particleCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    const count = width < 768 ? 80 : 140;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 1.5 + Math.random() * 3.5,
      vy: (Math.random() - 0.45) * 1.5,
      size: 1 + Math.random() * 2.8,
      alpha: 0.15 + Math.random() * 0.65,
      depth: Math.random() > 0.4 ? (Math.random() > 0.7 ? 3 : 2) : 1,
    }));

    const drawParticles = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x > width + 50 || p.y > height + 50 || p.y < -50) {
          p.x = -20 - Math.random() * 40;
          p.y = Math.random() * height;
        }

        if (p.depth === 1) {
          ctx.fillStyle = `rgba(215, 185, 135, ${p.alpha * 0.12})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.depth === 2) {
          ctx.fillStyle = `rgba(240, 215, 160, ${p.alpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = `rgba(255, 235, 180, ${p.alpha * 0.6})`;
          ctx.lineWidth = p.size * 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2.0, p.y - p.vy * 2.0);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(drawParticles);
    };

    drawParticles();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={glCanvasRef}
        className="silk-road-webgl-canvas"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          objectFit: "cover",
        }}
        aria-hidden="true"
      />
      <canvas
        ref={particleCanvasRef}
        className="silk-road-particle-canvas"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
    </>
  );
}

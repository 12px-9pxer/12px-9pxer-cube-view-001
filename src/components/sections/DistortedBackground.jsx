import { useEffect, useRef } from "react";

const vertexSource = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fragmentSource = `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  uniform float uTime;

  varying vec2 vUv;

  vec2 coverUv(vec2 uv, vec2 screen, vec2 image) {
    float screenRatio = screen.x / screen.y;
    float imageRatio = image.x / image.y;
    vec2 scale = vec2(1.0);

    if (screenRatio > imageRatio) {
      scale.y = imageRatio / screenRatio;
    } else {
      scale.x = screenRatio / imageRatio;
    }

    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float dist = length(center);
    float breath = sin(uTime * 0.62) * 0.5 + 0.5;
    float edgeMask = smoothstep(0.02, 0.14, uv.x)
      * smoothstep(0.02, 0.14, 1.0 - uv.x)
      * smoothstep(0.02, 0.14, uv.y)
      * smoothstep(0.02, 0.14, 1.0 - uv.y);
    float radial = sin(dist * 18.0 - uTime * 1.18) * 0.0018;
    float horizontal = sin((uv.y * 8.0) + uTime * 0.56) * 0.0022;
    float vertical = cos((uv.x * 6.0) - uTime * 0.48) * 0.0016;

    uv += normalize(center + 0.0001) * radial * edgeMask * (0.45 + breath * 0.55);
    uv.x += horizontal * edgeMask;
    uv.y += vertical * edgeMask;

    vec2 imageUv = coverUv(uv, uResolution, uImageResolution);

    vec4 color = texture2D(uTexture, imageUv);
    color.rgb *= 0.99 + breath * 0.01;

    gl_FragColor = color;
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl) {
  const program = gl.createProgram();
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

export default function DistortedBackground({ src }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      return undefined;
    }

    let animationFrame = 0;
    let disposed = false;
    let time = 0;

    try {
      const program = createProgram(gl);
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );

      const positionLocation = gl.getAttribLocation(program, "aPosition");
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const texture = gl.createTexture();
      const uTexture = gl.getUniformLocation(program, "uTexture");
      const uResolution = gl.getUniformLocation(program, "uResolution");
      const uImageResolution = gl.getUniformLocation(
        program,
        "uImageResolution",
      );
      const uTime = gl.getUniformLocation(program, "uTime");

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        gl.viewport(0, 0, width, height);
        gl.uniform2f(uResolution, width, height);
      };

      const render = () => {
        if (disposed) {
          return;
        }

        time += 0.016;

        gl.uniform1i(uTexture, 0);
        gl.uniform1f(uTime, time);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        animationFrame = requestAnimationFrame(render);
      };

      const image = new Image();
      image.src = src;
      image.onload = () => {
        if (disposed) {
          return;
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.uniform2f(uImageResolution, image.width, image.height);
        resize();
        canvas.style.opacity = "1";
        render();
      };

      window.addEventListener("resize", resize);

      return () => {
        disposed = true;
        cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", resize);
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      };
    } catch (error) {
      console.error("Failed to initialize distorted background", error);
      return undefined;
    }
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500"
    />
  );
}

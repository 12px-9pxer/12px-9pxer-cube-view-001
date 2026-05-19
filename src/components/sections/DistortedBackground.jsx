import { useEffect, useRef } from "react";

export const IDLE_DISTORTION_PARAMS = {
  edgeStart: 0.02,
  edgeEnd: 0.14,
  breathSpeed: 1.0,
  radialFrequency: 18.0,
  radialSpeed: 1.18,
  radialStrength: 0.018,
  horizontalFrequency: 4.0,
  horizontalSpeed: 1.00,
  horizontalStrength: 0.01,
  verticalFrequency: 6.0,
  verticalSpeed: 1.0,
  verticalStrength: 0.0016,
  brightnessBase: 0.99,
  brightnessPulse: 0.01,
};

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
  uniform float uEdgeStart;
  uniform float uEdgeEnd;
  uniform float uBreathSpeed;
  uniform float uRadialFrequency;
  uniform float uRadialSpeed;
  uniform float uRadialStrength;
  uniform float uHorizontalFrequency;
  uniform float uHorizontalSpeed;
  uniform float uHorizontalStrength;
  uniform float uVerticalFrequency;
  uniform float uVerticalSpeed;
  uniform float uVerticalStrength;
  uniform float uBrightnessBase;
  uniform float uBrightnessPulse;

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
    float breath = sin(uTime * uBreathSpeed) * 0.5 + 0.5;
    float edgeMask = smoothstep(uEdgeStart, uEdgeEnd, uv.x)
      * smoothstep(uEdgeStart, uEdgeEnd, 1.0 - uv.x)
      * smoothstep(uEdgeStart, uEdgeEnd, uv.y)
      * smoothstep(uEdgeStart, uEdgeEnd, 1.0 - uv.y);
    float radial =
      sin(dist * uRadialFrequency - uTime * uRadialSpeed) * uRadialStrength;
    float horizontal =
      sin((uv.y * uHorizontalFrequency) + uTime * uHorizontalSpeed)
      * uHorizontalStrength;
    float vertical =
      cos((uv.x * uVerticalFrequency) - uTime * uVerticalSpeed)
      * uVerticalStrength;

    uv += normalize(center + 0.0001) * radial * edgeMask * (0.45 + breath * 0.55);
    uv.x += horizontal * edgeMask;
    uv.y += vertical * edgeMask;

    vec2 imageUv = coverUv(uv, uResolution, uImageResolution);

    vec4 color = texture2D(uTexture, imageUv);
    color.rgb *= uBrightnessBase + breath * uBrightnessPulse;

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
      const uEdgeStart = gl.getUniformLocation(program, "uEdgeStart");
      const uEdgeEnd = gl.getUniformLocation(program, "uEdgeEnd");
      const uBreathSpeed = gl.getUniformLocation(program, "uBreathSpeed");
      const uRadialFrequency = gl.getUniformLocation(
        program,
        "uRadialFrequency",
      );
      const uRadialSpeed = gl.getUniformLocation(program, "uRadialSpeed");
      const uRadialStrength = gl.getUniformLocation(
        program,
        "uRadialStrength",
      );
      const uHorizontalFrequency = gl.getUniformLocation(
        program,
        "uHorizontalFrequency",
      );
      const uHorizontalSpeed = gl.getUniformLocation(
        program,
        "uHorizontalSpeed",
      );
      const uHorizontalStrength = gl.getUniformLocation(
        program,
        "uHorizontalStrength",
      );
      const uVerticalFrequency = gl.getUniformLocation(
        program,
        "uVerticalFrequency",
      );
      const uVerticalSpeed = gl.getUniformLocation(program, "uVerticalSpeed");
      const uVerticalStrength = gl.getUniformLocation(
        program,
        "uVerticalStrength",
      );
      const uBrightnessBase = gl.getUniformLocation(
        program,
        "uBrightnessBase",
      );
      const uBrightnessPulse = gl.getUniformLocation(
        program,
        "uBrightnessPulse",
      );

      gl.uniform1f(uEdgeStart, IDLE_DISTORTION_PARAMS.edgeStart);
      gl.uniform1f(uEdgeEnd, IDLE_DISTORTION_PARAMS.edgeEnd);
      gl.uniform1f(uBreathSpeed, IDLE_DISTORTION_PARAMS.breathSpeed);
      gl.uniform1f(
        uRadialFrequency,
        IDLE_DISTORTION_PARAMS.radialFrequency,
      );
      gl.uniform1f(uRadialSpeed, IDLE_DISTORTION_PARAMS.radialSpeed);
      gl.uniform1f(uRadialStrength, IDLE_DISTORTION_PARAMS.radialStrength);
      gl.uniform1f(
        uHorizontalFrequency,
        IDLE_DISTORTION_PARAMS.horizontalFrequency,
      );
      gl.uniform1f(uHorizontalSpeed, IDLE_DISTORTION_PARAMS.horizontalSpeed);
      gl.uniform1f(
        uHorizontalStrength,
        IDLE_DISTORTION_PARAMS.horizontalStrength,
      );
      gl.uniform1f(
        uVerticalFrequency,
        IDLE_DISTORTION_PARAMS.verticalFrequency,
      );
      gl.uniform1f(uVerticalSpeed, IDLE_DISTORTION_PARAMS.verticalSpeed);
      gl.uniform1f(uVerticalStrength, IDLE_DISTORTION_PARAMS.verticalStrength);
      gl.uniform1f(uBrightnessBase, IDLE_DISTORTION_PARAMS.brightnessBase);
      gl.uniform1f(uBrightnessPulse, IDLE_DISTORTION_PARAMS.brightnessPulse);

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

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);

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
        requestAnimationFrame(resize);
        canvas.style.opacity = "1";
        render();
      };

      window.addEventListener("resize", resize);

      return () => {
        disposed = true;
        cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", resize);
        resizeObserver.disconnect();
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

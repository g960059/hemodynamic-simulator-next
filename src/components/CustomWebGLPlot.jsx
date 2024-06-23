import React, { useRef, useEffect, useState } from 'react';


const CustomWebGLPlot= ({ series, width, height, timeWindow }) => {
  const canvasRef = useRef(null);
  const [gl, setGl] = useState(null);

  useEffect(() => {
    if (canvasRef.current) {
      const glContext = canvasRef.current.getContext('webgl');
      setGl(glContext);

      if (glContext) {
        initWebGL(glContext);
      }
    }
  }, []);

  useEffect(() => {
    if (gl) {
      drawPlot(gl);
    }
  }, [series, gl]);

  const initWebGL = (gl) => {
    const vertexShaderSource = `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec4 u_color;
      void main() {
        gl_FragColor = u_color;
      }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = createProgram(gl, vertexShader, fragmentShader);

    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const colorUniformLocation = gl.getUniformLocation(program, "u_color");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // ここでcolorUniformLocationを保存
    gl.colorUniformLocation = colorUniformLocation;
  };

  const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('シェーダーの作成に失敗しました');
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('シェーダーのコンパイルエラー:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const createProgram = (gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    if (!program) throw new Error('プログラムの作成に失敗しました');
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('プログラムのリンクエラー:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  };

  const drawPlot = (gl) => {
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    series.forEach((s) => {
      const positions = s.data.flatMap((d) => [d.x, d.y]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

      const color = hexToRgb(s.color);
      gl.uniform4f(gl.colorUniformLocation, color.r / 255, color.g / 255, color.b / 255, 1);

      gl.drawArrays(gl.LINE_STRIP, 0, s.data.length);
    });
  };
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

export default CustomWebGLPlot;

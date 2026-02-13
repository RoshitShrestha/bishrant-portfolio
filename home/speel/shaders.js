/**
 * GLSL shader source strings for hero gradient (Three.js).
 */

export const heroGradientVertex = `
  precision mediump float;
  varying vec2 v_objectUV;
  void main() {
      v_objectUV = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const heroGradientFragment = `
  precision mediump float;
  uniform float u_time;
  uniform vec4 u_colors[4];
  uniform float u_colorsCount;
  uniform float u_distortion;
  uniform float u_swirl;
  uniform float u_grainMixer;
  uniform float u_grainOverlay;
  uniform float u_rotation;
  uniform float u_offsetX;
  uniform float u_offsetY;
  uniform float u_speed;
  uniform float u_opacity;
  uniform float u_isPaused;
  varying vec2 v_objectUV;

  vec2 rotate(vec2 uv, float th) {
      return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
  }

  float hash21(vec2 p) {
      p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
      p += dot(p, p + 19.19);
      return fract(p.x * p.y);
  }

  float valueNoise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      vec2 u = f*f*(3.0-2.0*f);
      float x1 = mix(a,b,u.x);
      float x2 = mix(c,d,u.x);
      return mix(x1,x2,u.y);
  }

  float noise(vec2 n, vec2 seedOffset) {
      return valueNoise(n + seedOffset);
  }

  vec2 getPosition(int i, float t) {
      float a = float(i) * .37;
      float b = .6 + fract(float(i) / 3.0) * .9;
      float c = .8 + fract(float(i + 1) / 4.0);
      float x = sin(t * b + a);
      float y = cos(t * c + a * 1.5);
      return .5 + .5 * vec2(x,y);
  }

  void main() {
      vec2 uv = v_objectUV + 0.5 + vec2(u_offsetX,u_offsetY);
      vec2 grainUV = uv*1000.0;
      float grain = noise(grainUV, vec2(0.0));
      float mixerGrain = .4*u_grainMixer*(grain-0.5);

      // float t = 0.5*(u_time*u_speed + 41.5);
      float t = 0.5 * ((u_time * u_speed + 41.5) * (1.0 - u_isPaused));
      float radius = smoothstep(0.0,1.0,length(uv-0.5));
      float center = 1.0 - radius;

      for (float i=1.0;i<=2.0;i++){
      uv.x += u_distortion*center/i*sin(t + i*0.4*smoothstep(0.,1.,uv.y))*cos(0.2*t + i*2.4*smoothstep(0.,1.,uv.y));
      uv.y += u_distortion*center/i*cos(t + i*2.0*smoothstep(0.,1.,uv.x));
      }

      vec2 uvRotated = uv-0.5;
      uvRotated = rotate(uvRotated,u_rotation - 3.0*u_swirl*radius);
      uvRotated += 0.5;

      vec3 color = vec3(0.0);
      float opacity = 0.0;
      float totalWeight = 0.0;

      for(int i=0;i<4;i++){
      vec2 pos = getPosition(i,t)+mixerGrain;
      vec3 colorFraction = u_colors[i].rgb*u_colors[i].a;
      float opacityFraction = u_colors[i].a;
      float dist = length(uvRotated-pos);
      dist = max(pow(dist, 3.5), 1e-4);
      float weight = 1.0/(dist+1e-3);
      color += colorFraction*weight;
      opacity += opacityFraction*weight;
      totalWeight += weight;
      }

      color /= max(1e-4,totalWeight);
      opacity /= max(1e-4,totalWeight);

      float grainOverlay = valueNoise(rotate(grainUV,1.0)+vec2(3.0));
      grainOverlay = pow(grainOverlay,1.3);
      float grainOverlayV = grainOverlay*2.0-1.0;
      vec3 grainOverlayColor = vec3(step(0.0,grainOverlayV));
      float grainOverlayStrength = u_grainOverlay*abs(grainOverlayV);
      grainOverlayStrength = pow(grainOverlayStrength,0.8);
      color = mix(color,grainOverlayColor,0.35*grainOverlayStrength);
      opacity += 0.5*grainOverlayStrength;
      opacity = clamp(opacity,0.0,1.0);

      gl_FragColor = vec4(color,opacity * u_opacity);
  }
`;

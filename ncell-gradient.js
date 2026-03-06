import * as THREE from "three";

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 0);

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      1000
    );

    // this.camera.position.set(-0.4, -0.05, 1.5);
    this.camera.position.set(0, -0.2, 2);

    this.isPlaying = true;

    this.clock = new THREE.Clock();

    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    this.uniforms = {
      u_time: { value: 0 },
      u_colors: {
        value: [
          new THREE.Vector4(1.0, 1.0, 1.0, 1.0), // #FFFFFF
          new THREE.Vector4(0.7804, 0.2078, 0.7843, 1.0), // #C735C8
          new THREE.Vector4(0.3686, 0.2431, 0.8392, 1.0), // #5E3ED6
          new THREE.Vector4(0.9961, 0.0196, 0.2314, 1.0), // #FE053B
        ],
      },
      u_colorsCount: { value: 4 },
      u_distortion: { value: 0.05 },
      u_swirl: { value: 0.3 },
      u_grainMixer: { value: 0.02 },
      u_grainOverlay: { value: 0.01 },
      u_rotation: { value: 0 },
      u_offsetX: { value: 0 },
      u_offsetY: { value: 0 },
      u_speed: { value: 0.8 },
      u_scale: { value: 0.5 },
      u_maskRadius: { value: 0.25 },
      u_maskBlur: { value: 0.03 },
      u_blobAmount: { value: 0.02 }, // How much irregularity (0.02-0.05 for subtle)
      u_blobAnimSpeed: { value: 0.8 }, // How fast the irregularities move
      u_verSpeed: { value: 0.3 },
      u_verAmplitude: { value: 0.2 },
    };

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives: enable",
      },
      side: THREE.DoubleSide,
      uniforms: this.uniforms,
      transparent: true,
      vertexShader: `
        #define PI 3.1415926535897932384626433832795

        precision mediump float;
        varying vec2 v_objectUV;
        uniform float u_time;
        uniform float u_verSpeed;
        uniform float u_verAmplitude;

        //	Simplex 3D Noise 
        //	by Ian McEwan, Stefan Gustavson (https://github.com/stegu/webgl-noise)
        //
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

        float snoise(vec3 v){ 
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 =   v - i + dot(i, C.xxx) ;

        // Other corners
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );

          //  x0 = x0 - 0. + 0.0 * C 
          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1. + 3.0 * C.xxx;

        // Permutations
          i = mod(i, 289.0 ); 
          vec4 p = permute( permute( permute( 
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        // Gradients
        // ( N*N points uniformly over a square, mapped onto an octahedron.)
          float n_ = 1.0/7.0; // N=7
          vec3  ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );

          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);

        //Normalise gradients
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

        // Mix final noise value
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
            v_objectUV = uv;
            //gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);


            vec2 modifiedCoord = uv * vec2(3., 4.);
            vec3 newPosition = position;
            float distortion = snoise(vec3(modifiedCoord.x + u_time * u_verSpeed, modifiedCoord.y, u_time*u_verSpeed)) * u_verAmplitude;
            distortion = max(0., distortion);
            newPosition.z += distortion;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        #define PI 3.1415926535897932384626433832795

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
        uniform float u_scale;
        uniform float u_maskRadius;
        uniform float u_maskBlur;
        uniform float u_blobAmount;
        uniform float u_blobAnimSpeed;

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

        // Subtle organic distortion
        float getDistortion(vec2 pos, float time) {
            float angle = atan(pos.y, pos.x);
            
            // Layer 1: Slow, smooth waves
            float distortion = sin(angle * 4.0 + time * u_blobAnimSpeed) * 0.4;
            
            // Layer 2: Different frequency for complexity
            distortion += sin(angle * 7.0 - time * u_blobAnimSpeed * 0.7) * 0.3;
            
            // Layer 3: Very subtle noise
            float noiseVal = valueNoise(vec2(angle * 3.0, time * u_blobAnimSpeed * 0.5));
            distortion += (noiseVal - 0.5) * 0.3;
            
            return distortion * u_blobAmount;
        }

        void main() {
            // Apply scale first - zoom in/out from center
            vec2 uv = v_objectUV;
            uv = (uv - 0.5) / u_scale + 0.5;
            
            // Then apply offset
            uv = uv + vec2(u_offsetX, u_offsetY);
            
            vec2 grainUV = uv*1000.0;
            float grain = noise(grainUV, vec2(0.0));
            float mixerGrain = .4*u_grainMixer*(grain-0.5);

            float t = 0.5*(u_time*u_speed + 41.5);
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

            for(int i=0;i<10;i++){
                if(i>=int(u_colorsCount)) break;
                vec2 pos = getPosition(i,t)+mixerGrain;
                vec3 colorFraction = u_colors[i].rgb*u_colors[i].a;
                float opacityFraction = u_colors[i].a;
                float dist = length(uvRotated-pos);
                dist = pow(dist,3.5);
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

            // Circular mask with subtle organic distortion
            vec2 center_pos = v_objectUV - 0.5;
            float dist_from_center = length(center_pos);
            
            // Add subtle distortion to the radius
            float distortion = getDistortion(center_pos, u_time);
            float effectiveRadius = u_maskRadius + distortion;
            
            float mask = 1.0 - smoothstep(effectiveRadius - u_maskBlur, effectiveRadius + u_maskBlur, dist_from_center);
            
            // Apply mask to opacity
            opacity *= mask;

            gl_FragColor = vec4(color, opacity);
        }
      `,
    });

    this.geometry = new THREE.PlaneGeometry(4, 4, 400, 400);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.plane.rotation.x = -0.5;
    this.scene.add(this.plane);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.render();
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.uniforms.u_time.value = this.clock.getElapsedTime() + 100;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("ncell-gradient"),
});
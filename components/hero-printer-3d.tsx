"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The hero's figure: an enclosed 3D printer, drawn in real 3D with three.js,
 * printing a robot in the brand's gold.
 *
 * The story, on an 18s loop (see `timeline` below):
 *   - the print: the bed steps down as each layer goes on and the toolhead
 *     works over it, while the front screen counts the job up to 100%
 *   - the bed lowers to the floor of the chamber and the door swings open
 *   - the robot wakes (eyes, then the antenna), walks out, hops down to the
 *     table and waves
 *   - the door closes, the bed comes back up, and the next print starts
 *
 * The printed robot is revealed by a clipping plane fixed at the nozzle's
 * height: the robot rides down on the bed, so every frame a little more of it
 * is below the plane. That is how a printer that drops its bed really builds.
 *
 * three.js is loaded only after the page is interactive, so it costs the first
 * paint nothing; until then the figure holds its space. The loop renders only
 * while the figure is on screen and the tab is visible. Under
 * prefers-reduced-motion it renders one still frame: the finished robot, awake,
 * on the bed. Without WebGL the space simply stays empty.
 *
 * The look is an enclosed CoreXY machine of the kind Bambu Lab makes popular,
 * dark body, glass door and lid, a lit chamber, a filament box on top, but it
 * carries the VoltCraft name and nobody else's.
 */
export function HeroPrinter3D() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      // ------------------------------------------------------------ renderer
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        return; // no WebGL: leave the space empty
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.localClippingEnabled = true;
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.setAttribute("aria-hidden", "true");
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      scene.environmentIntensity = 0.55;

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
      const target = new THREE.Vector3(0.04, 0.56, 0.12);

      // -------------------------------------------------------------- lights
      scene.add(new THREE.HemisphereLight(0xfff6e8, 0x2a2318, 0.55));
      const key = new THREE.DirectionalLight(0xfff1dc, 2.1);
      key.position.set(2.4, 3.6, 2.6);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -1.6;
      key.shadow.camera.right = 1.6;
      key.shadow.camera.top = 1.6;
      key.shadow.camera.bottom = -1.6;
      key.shadow.bias = -0.0004;
      key.shadow.normalBias = 0.02;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xffd59a, 0.8);
      rim.position.set(-2.5, 2, -2);
      scene.add(rim);

      // ----------------------------------------------------------- materials
      const disposables: { dispose: () => void }[] = [envTex, pmrem];
      const mat = <T extends { dispose: () => void }>(m: T) => (disposables.push(m), m);
      const geo = <T extends { dispose: () => void }>(g: T) => (disposables.push(g), g);

      const shell = mat(new THREE.MeshStandardMaterial({ color: 0x202226, roughness: 0.42, metalness: 0.15 }));
      const shellEdge = mat(new THREE.MeshStandardMaterial({ color: 0x34373c, roughness: 0.35, metalness: 0.3 }));
      const inner = mat(new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.8, metalness: 0.05 }));
      const steel = mat(new THREE.MeshStandardMaterial({ color: 0xb9bcc2, roughness: 0.25, metalness: 0.9 }));
      const glass = mat(
        new THREE.MeshPhysicalMaterial({
          color: 0xdfe6ea,
          roughness: 0.04,
          metalness: 0,
          transparent: true,
          opacity: 0.14,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          envMapIntensity: 1.6,
          depthWrite: false,
        }),
      );
      const smoked = mat(
        new THREE.MeshPhysicalMaterial({ color: 0x2b2d31, roughness: 0.1, transparent: true, opacity: 0.45, clearcoat: 1, depthWrite: false }),
      );
      // the textured PEI plate is gold, which is a gift for a gold brand
      const plateTex = stripeTexture(THREE, "#b98a3e", "#a87a31", 64, 6);
      plateTex.repeat.set(3, 3);
      const plate = mat(new THREE.MeshStandardMaterial({ color: 0xffffff, map: plateTex, roughness: 0.55, metalness: 0.35 }));
      disposables.push(plateTex);

      // the robot is printed in the brand gold; layer lines are a bump map
      const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10);
      const layerTex = stripeTexture(THREE, "#ffffff", "#9a9a9a", 4, 2);
      layerTex.repeat.set(1, 26);
      disposables.push(layerTex);
      const pla = mat(
        new THREE.MeshStandardMaterial({
          color: 0xf0ae45,
          roughness: 0.48,
          metalness: 0.05,
          bumpMap: layerTex,
          bumpScale: 0.6,
          clippingPlanes: [clip],
          clipShadows: true,
          side: THREE.DoubleSide,
        }),
      );
      const plaDark = mat(new THREE.MeshStandardMaterial({ color: 0x2a2317, roughness: 0.6, clippingPlanes: [clip], side: THREE.DoubleSide }));
      const eyeMat = mat(
        new THREE.MeshStandardMaterial({ color: 0x2a2317, emissive: 0xffbd59, emissiveIntensity: 0, roughness: 0.3, clippingPlanes: [clip] }),
      );
      const boltMat = mat(new THREE.MeshStandardMaterial({ color: 0xffbd59, emissive: 0xffbd59, emissiveIntensity: 0.25, clippingPlanes: [clip] }));

      const rbox = (w: number, h: number, d: number, r: number, m: InstanceType<typeof THREE.Material>) => {
        const mesh = new THREE.Mesh(geo(new RoundedBoxGeometry(w, h, d, 3, r)), m);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      };
      const at = <O extends InstanceType<typeof THREE.Object3D>>(o: O, x: number, y: number, z: number) => (o.position.set(x, y, z), o);

      // -------------------------------------------------------------- printer
      const printer = new THREE.Group();
      scene.add(printer);

      // base plinth, two side walls, back, top frame
      printer.add(at(rbox(1.04, 0.17, 1.02, 0.03, shell), 0, 0.085, 0));
      printer.add(at(rbox(0.05, 0.9, 1.02, 0.02, shell), -0.495, 0.62, 0));
      printer.add(at(rbox(0.05, 0.9, 1.02, 0.02, shell), 0.495, 0.62, 0));
      printer.add(at(rbox(0.94, 0.9, 0.04, 0.012, inner), 0, 0.62, -0.49));
      printer.add(at(rbox(1.04, 0.07, 1.02, 0.025, shell), 0, 1.085, 0));
      // the chamber floor, darker than the shell
      printer.add(at(new THREE.Mesh(geo(new THREE.BoxGeometry(0.94, 0.01, 0.96)), inner), 0, 0.175, 0));
      // front pillars, a shade lighter, catching the light like machined edges
      printer.add(at(rbox(0.035, 0.9, 0.04, 0.012, shellEdge), -0.485, 0.62, 0.495));
      printer.add(at(rbox(0.035, 0.9, 0.04, 0.012, shellEdge), 0.485, 0.62, 0.495));
      // the glass lid in the top frame
      printer.add(at(new THREE.Mesh(geo(new THREE.BoxGeometry(0.86, 0.008, 0.86)), glass), 0, 1.122, 0));

      // a warm LED bar along the inside of the top front, and the light it throws
      const ledMat = mat(new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xfff1d6, emissiveIntensity: 1.6 }));
      printer.add(at(new THREE.Mesh(geo(new THREE.BoxGeometry(0.82, 0.012, 0.02)), ledMat), 0, 1.04, 0.43));
      const chamber = new THREE.SpotLight(0xfff0d8, 7, 2.2, Math.PI / 3.2, 0.6, 1.4);
      chamber.position.set(0, 1.03, 0.38);
      chamber.target.position.set(0, 0.2, -0.05);
      chamber.castShadow = true;
      chamber.shadow.mapSize.set(512, 512);
      printer.add(chamber, chamber.target);

      // the door: hinged on its left edge, glass in a slim frame, a short grip
      // set into the free edge
      const door = new THREE.Group();
      door.position.set(-0.47, 0.62, 0.515);
      printer.add(door);
      door.add(at(new THREE.Mesh(geo(new THREE.BoxGeometry(0.92, 0.85, 0.01)), glass), 0.465, 0, 0));
      door.add(at(rbox(0.94, 0.026, 0.02, 0.008, shellEdge), 0.465, 0.432, 0));
      door.add(at(rbox(0.94, 0.026, 0.02, 0.008, shellEdge), 0.465, -0.432, 0));
      door.add(at(rbox(0.022, 0.89, 0.02, 0.008, shellEdge), 0.006, 0, 0));
      door.add(at(rbox(0.022, 0.89, 0.02, 0.008, shellEdge), 0.924, 0, 0));
      door.add(at(rbox(0.014, 0.13, 0.02, 0.006, shell), 0.9, 0, 0.016));

      // the front screen on the base, drawn to a canvas every frame
      const screenCanvas = document.createElement("canvas");
      screenCanvas.width = 256;
      screenCanvas.height = 96;
      const screenTex = new THREE.CanvasTexture(screenCanvas);
      screenTex.colorSpace = THREE.SRGBColorSpace;
      disposables.push(screenTex);
      const screenMat = mat(new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
      printer.add(at(rbox(0.25, 0.1, 0.012, 0.006, inner), -0.3, 0.09, 0.513));
      printer.add(at(new THREE.Mesh(geo(new THREE.PlaneGeometry(0.23, 0.083)), screenMat), -0.3, 0.09, 0.5205));
      // the maker's mark on the base
      const markTex = labelTexture(THREE, "VOLTCRAFT");
      disposables.push(markTex);
      const markMat = mat(new THREE.MeshBasicMaterial({ map: markTex, transparent: true, toneMapped: false }));
      printer.add(at(new THREE.Mesh(geo(new THREE.PlaneGeometry(0.26, 0.04)), markMat), 0.3, 0.09, 0.5215));

      // filament box on top: four spools behind a smoked lid
      const ams = new THREE.Group();
      ams.position.set(0, 1.12, -0.04);
      printer.add(ams);
      ams.add(at(rbox(0.94, 0.06, 0.5, 0.02, shell), 0, 0.03, 0));
      ams.add(at(rbox(0.94, 0.17, 0.05, 0.015, shell), 0, 0.115, -0.225));
      ams.add(at(new THREE.Mesh(geo(new THREE.BoxGeometry(0.92, 0.012, 0.46)), smoked), 0, 0.205, 0.01));
      ams.add(at(new THREE.Mesh(geo(new THREE.BoxGeometry(0.012, 0.15, 0.46)), smoked), -0.464, 0.13, 0.01));
      ams.add(at(new THREE.Mesh(geo(new THREE.BoxGeometry(0.012, 0.15, 0.46)), smoked), 0.464, 0.13, 0.01));
      const spoolColors = [0xf0ae45, 0xeeeeea, 0x2e3035, 0xb83a2e];
      const spools: InstanceType<typeof THREE.Group>[] = [];
      const flangeG = geo(new THREE.CylinderGeometry(0.086, 0.086, 0.006, 40));
      const flangeMat = mat(
        new THREE.MeshPhysicalMaterial({ color: 0x3a3d42, roughness: 0.15, transparent: true, opacity: 0.32, clearcoat: 1, depthWrite: false }),
      );
      const hubG = geo(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 24));
      const spokeG = geo(new THREE.BoxGeometry(0.056, 0.008, 0.004));
      // each spool turns on a front-to-back axle; the spin lives on an inner
      // group so the turn is always about that axle
      spoolColors.forEach((c, i) => {
        const spool = new THREE.Group();
        spool.position.set(-0.33 + i * 0.22, 0.13, 0.02);
        const spin = new THREE.Group();
        spool.add(spin);
        const fil = mat(new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));
        const body = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 40)), fil);
        body.rotation.x = Math.PI / 2;
        // clear flanges, as on a real spool, so the filament's colour shows
        const f1 = new THREE.Mesh(flangeG, flangeMat);
        f1.rotation.x = Math.PI / 2;
        f1.position.z = 0.065;
        const f2 = f1.clone();
        f2.position.z = -0.065;
        const hubM = new THREE.Mesh(hubG, inner);
        hubM.rotation.x = Math.PI / 2;
        // spokes in the hub, so the turning reads
        const spoke = at(new THREE.Mesh(spokeG, shellEdge), 0, 0, 0.071);
        const spoke2 = spoke.clone();
        spoke2.rotation.z = Math.PI / 2;
        spin.add(body, f1, f2, hubM, spoke, spoke2);
        ams.add(spool);
        spools.push(spin);
      });

      // ------------------------------------------------- bed and the print on it
      const PRINT_H = 0.355;
      const NOZZLE_Y = 0.72;
      const BED_TOP = NOZZLE_Y - 0.002;
      const BED_LOW = 0.19;
      const bed = new THREE.Group();
      printer.add(bed);
      bed.add(at(rbox(0.66, 0.03, 0.66, 0.008, inner), 0, -0.022, 0));
      const plateMesh = at(rbox(0.62, 0.012, 0.62, 0.004, plate), 0, -0.003, 0);
      bed.add(plateMesh);
      // the Z screws the bed rides on, at the back corners
      [-0.38, 0.38].forEach((x) => {
        const rod = at(new THREE.Mesh(geo(new THREE.CylinderGeometry(0.008, 0.008, 0.88, 12)), steel), x, 0.62, -0.4);
        printer.add(rod);
      });

      const robot = new THREE.Group();
      bed.add(robot);
      const legL = new THREE.Group();
      const legR = new THREE.Group();
      legL.position.set(-0.04, 0.075, 0);
      legR.position.set(0.04, 0.075, 0);
      legL.add(at(rbox(0.045, 0.06, 0.05, 0.008, pla), 0, -0.033, 0));
      legL.add(at(rbox(0.06, 0.022, 0.075, 0.008, pla), 0, -0.064, 0.008));
      legR.add(at(rbox(0.045, 0.06, 0.05, 0.008, pla), 0, -0.033, 0));
      legR.add(at(rbox(0.06, 0.022, 0.075, 0.008, pla), 0, -0.064, 0.008));
      robot.add(legL, legR);
      const torso = new THREE.Group();
      torso.position.y = 0.075;
      robot.add(torso);
      torso.add(at(rbox(0.18, 0.125, 0.12, 0.022, pla), 0, 0.064, 0));
      torso.add(at(rbox(0.08, 0.06, 0.012, 0.006, plaDark), 0, 0.066, 0.062));
      torso.add(at(new THREE.Mesh(geo(boltGeometry(THREE)), boltMat), 0, 0.066, 0.069));
      const armL = new THREE.Group();
      const armR = new THREE.Group();
      armL.position.set(-0.112, 0.11, 0);
      armR.position.set(0.112, 0.11, 0);
      armL.add(at(rbox(0.036, 0.1, 0.048, 0.016, pla), 0, -0.04, 0));
      armR.add(at(rbox(0.036, 0.1, 0.048, 0.016, pla), 0, -0.04, 0));
      torso.add(armL, armR);
      torso.add(at(rbox(0.045, 0.022, 0.045, 0.006, pla), 0, 0.137, 0));
      const head = new THREE.Group();
      head.position.y = 0.15;
      torso.add(head);
      head.add(at(rbox(0.16, 0.105, 0.115, 0.026, pla), 0, 0.052, 0));
      const eyeG = geo(new THREE.SphereGeometry(0.017, 20, 14));
      head.add(at(new THREE.Mesh(eyeG, eyeMat), -0.037, 0.058, 0.055));
      head.add(at(new THREE.Mesh(eyeG, eyeMat), 0.037, 0.058, 0.055));
      head.add(at(rbox(0.05, 0.008, 0.008, 0.003, plaDark), 0, 0.028, 0.058));
      head.add(at(new THREE.Mesh(geo(new THREE.CylinderGeometry(0.006, 0.006, 0.035, 10)), pla), 0, 0.12, 0));
      const tipMat = mat(new THREE.MeshStandardMaterial({ color: 0xf0ae45, emissive: 0xffbd59, emissiveIntensity: 0, clippingPlanes: [clip] }));
      head.add(at(new THREE.Mesh(geo(new THREE.SphereGeometry(0.015, 16, 12)), tipMat), 0, 0.142, 0));
      robot.traverse((o) => {
        if ((o as InstanceType<typeof THREE.Mesh>).isMesh) o.castShadow = true;
      });

      // ------------------------------------------------- the CoreXY gantry
      const GANTRY_Y = 0.875;
      [-0.43, 0.43].forEach((x) => printer.add(at(new THREE.Mesh(geo(new THREE.BoxGeometry(0.02, 0.02, 0.86)), steel), x, GANTRY_Y, 0)));
      const xRail = new THREE.Group();
      printer.add(xRail);
      xRail.add(at(rbox(0.88, 0.028, 0.035, 0.008, shellEdge), 0, GANTRY_Y, 0));
      const tool = new THREE.Group();
      xRail.add(tool);
      tool.add(at(rbox(0.12, 0.13, 0.1, 0.018, shell), 0, GANTRY_Y - 0.045, 0.02));
      const cover = mat(new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.4, metalness: 0.1 }));
      tool.add(at(rbox(0.104, 0.1, 0.014, 0.012, cover), 0, GANTRY_Y - 0.04, 0.074));
      const toolLed = mat(new THREE.MeshStandardMaterial({ color: 0xffbd59, emissive: 0xffbd59, emissiveIntensity: 1.2 }));
      tool.add(at(new THREE.Mesh(geo(new THREE.BoxGeometry(0.05, 0.006, 0.004)), toolLed), 0, GANTRY_Y - 0.072, 0.082));
      const nozzle = at(new THREE.Mesh(geo(new THREE.ConeGeometry(0.014, 0.035, 16)), steel), 0, NOZZLE_Y + 0.018, 0.02);
      nozzle.rotation.x = Math.PI;
      tool.add(nozzle);
      const hot = new THREE.PointLight(0xffb347, 0, 0.35, 2);
      hot.position.set(0, NOZZLE_Y + 0.01, 0.02);
      tool.add(hot);

      // ------------------------------------------------- the table it stands on
      const floor = new THREE.Mesh(geo(new THREE.PlaneGeometry(8, 8)), mat(new THREE.ShadowMaterial({ opacity: 0.2 })));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      printer.traverse((o) => {
        const m = o as InstanceType<typeof THREE.Mesh>;
        if (m.isMesh && m.material !== glass && m.material !== smoked) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });

      // ------------------------------------------------------------ the story
      const LOOP = 18;
      const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
      const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
      const ease = (v: number) => v * v * (3 - 2 * v);
      const lerp = (a: number, b: number, v: number) => a + (b - a) * v;
      const toolHome = { x: 0.3, z: -0.3 };

      const drawScreen = (label: string, pct: number) => {
        const c = screenCanvas.getContext("2d");
        if (!c) return;
        c.fillStyle = "#0e0f12";
        c.fillRect(0, 0, 256, 96);
        c.fillStyle = "#ffbd59";
        c.font = "600 20px ui-monospace, Menlo, monospace";
        c.fillText(label, 16, 34);
        c.fillStyle = "#f0ece5";
        c.font = "600 26px ui-monospace, Menlo, monospace";
        c.textAlign = "right";
        c.fillText(`${Math.round(pct * 100)}%`, 240, 36);
        c.textAlign = "left";
        c.fillStyle = "#2b2d31";
        c.fillRect(16, 58, 224, 12);
        c.fillStyle = "#ffbd59";
        c.fillRect(16, 58, 224 * pct, 12);
        screenTex.needsUpdate = true;
      };

      let lastLabel = "";
      let lastPct = -1;
      const timeline = (time: number) => {
        const t = time % LOOP;
        // 0.6-10.5s print; 10.5-11.4 park; 11.4-12.4 bed down; 12.2-13.1 door open
        // 12.8-13.8 wake; 13.8-15.6 walk out and hop down; 15.6-16.6 wave;
        // 16.4-17.2 door shuts; 17.2-18 bed back up
        const p = span(t, 0.6, 10.5);
        const printing = t >= 0.6 && t < 10.5;
        const bedDown = ease(span(t, 11.4, 12.4));
        const bedUp = ease(span(t, 17.2, 18));
        const bedY = t < 11.4 ? BED_TOP - p * PRINT_H : t < 17.2 ? lerp(BED_TOP - PRINT_H, BED_LOW, bedDown) : lerp(BED_LOW, BED_TOP, bedUp);
        bed.position.y = bedY;

        // the reveal: everything above the nozzle's height is not printed yet
        clip.constant = t < 10.5 ? NOZZLE_Y : 10;
        robot.visible = t < 16.9;

        // the toolhead works the layer, then parks at the back
        const park = ease(span(t, 10.5, 11.4));
        const home = ease(span(t, 17.2, 18));
        let tx = toolHome.x;
        let tz = toolHome.z;
        if (printing) {
          const w = t * 6.2;
          const width = 0.1 - 0.035 * Math.max(0, (p - 0.55) / 0.45);
          tx = Math.sin(w) * width + Math.sin(w * 3.1) * 0.012;
          tz = Math.sin(w * 1.37 + 0.6) * 0.055;
        } else if (t >= 10.5 && t < 17.2) {
          tx = lerp(0, toolHome.x, park);
          tz = lerp(0, toolHome.z, park);
        } else if (t >= 17.2) {
          tx = lerp(toolHome.x, 0, home);
          tz = lerp(toolHome.z, 0, home);
        } else {
          const start = ease(span(t, 0, 0.6));
          tx = lerp(toolHome.x, 0, start);
          tz = lerp(toolHome.z, 0, start);
        }
        tool.position.x = tx;
        xRail.position.z = tz;
        hot.intensity = printing ? 0.6 + Math.sin(t * 40) * 0.08 : 0;
        toolLed.emissiveIntensity = printing ? 1.4 : 0.35;

        // spools: the gold one feeds while it prints
        spools[0].rotation.z = -t * (printing ? 1.6 : 0.2);

        // the door
        const open = ease(span(t, 12.2, 13.1)) * (1 - ease(span(t, 16.4, 17.2)));
        door.rotation.y = -open * 1.75;

        // wake: eyes, a blink, then the antenna
        const eyesOn = t > 12.8 && t < 16.9 && !(t > 13.2 && t < 13.32);
        eyeMat.emissiveIntensity = eyesOn ? 2.2 : 0;
        tipMat.emissiveIntensity = t > 13.25 && t < 16.9 ? 2.5 + Math.sin(t * 9) * 0.6 : 0;

        // the walk: the robot stays parented to the bed, so offsets are
        // bed-local. Out across the plate to the lip of the base (13.8-14.8),
        // a hop down to the table (14.8-15.15), a step on (to 15.5), then it
        // turns to the camera, waves, and blinks out of existence.
        let rz = 0;
        let ry = 0;
        if (t >= 13.8) {
          if (t < 14.8) rz = lerp(0, 0.55, span(t, 13.8, 14.8));
          else if (t < 15.15) {
            const h = span(t, 14.8, 15.15);
            rz = lerp(0.55, 0.72, h);
            ry = Math.sin(h * Math.PI) * 0.07 - ease(h) * BED_LOW;
          } else {
            rz = lerp(0.72, 0.8, ease(span(t, 15.15, 15.5)));
            ry = -BED_LOW;
          }
        }
        // once down, it drifts toward the middle of the frame as it steps on
        const rx = ease(span(t, 14.8, 15.5)) * 0.14;
        robot.position.set(rx, ry, rz);
        robot.rotation.y = ease(span(t, 15.5, 15.85)) * 0.55;
        const gone = ease(span(t, 16.6, 16.9));
        robot.scale.setScalar(Math.max(0.001, 1 - gone));
        const stepping = (t > 13.8 && t < 14.8) || (t > 15.15 && t < 15.5);
        const stride = stepping ? Math.sin(t * 15) : 0;
        legL.rotation.x = stride * 0.45;
        legR.rotation.x = -stride * 0.45;
        armL.rotation.x = -stride * 0.35;
        torso.position.y = 0.075 + (stepping ? Math.abs(Math.sin(t * 15)) * 0.008 : 0);
        // the wave, with the arm on the camera's side
        const waving = span(t, 15.7, 16.6);
        const wavingNow = waving > 0 && waving < 1;
        armR.rotation.x = stepping ? stride * 0.35 : 0;
        armR.rotation.z = wavingNow ? 2.5 * Math.sin(waving * Math.PI) + Math.sin(waving * Math.PI * 6) * 0.25 : 0;
        head.rotation.z = wavingNow ? Math.sin(waving * Math.PI * 3) * 0.1 : 0;

        // the screen
        const label = printing ? "PRINTING" : t < 0.6 || t >= 17.2 ? "READY" : "DONE";
        const pct = printing ? p : t < 0.6 || t >= 17.2 ? 0 : 1;
        if (label !== lastLabel || Math.abs(pct - lastPct) > 0.004) {
          drawScreen(label, pct);
          lastLabel = label;
          lastPct = pct;
        }
      };

      // ------------------------------------------------------- sizing, camera
      const pointer = { x: 0, y: 0 };
      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const placeCamera = (time: number) => {
        const az = 0.62 + Math.sin(time * 0.18) * 0.07 + pointer.x * 0.16;
        const el2 = 0.27 + pointer.y * 0.05;
        const dist = 3.35;
        camera.position.set(
          target.x + Math.sin(az) * Math.cos(el2) * dist,
          target.y + Math.sin(el2) * dist,
          target.z + Math.cos(az) * Math.cos(el2) * dist,
        );
        camera.lookAt(target);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      const onPointer = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        pointer.x = clamp01((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.y = clamp01((e.clientY - r.top) / r.height) * 2 - 1;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let raf = 0;
      let running = false;
      let onScreen = true;
      const t0 = performance.now();
      const frame = () => {
        const time = (performance.now() - t0) / 1000;
        timeline(time);
        placeCamera(time);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      const start = () => {
        if (running || still || !onScreen || document.hidden) return;
        running = true;
        raf = requestAnimationFrame(frame);
      };
      const stop = () => {
        running = false;
        cancelAnimationFrame(raf);
      };

      if (still) {
        // the finished print, awake, door shut
        timeline(13.5);
        door.rotation.y = 0;
        placeCamera(0);
        renderer.render(scene, camera);
      } else {
        start();
      }
      setReady(true);

      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else stop();
      });
      io.observe(el);
      const onVisibility = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        stop();
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVisibility);
        for (const d of disposables) d.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={host}
      role="img"
      aria-label="A 3D printer prints a small gold robot, which wakes up, walks out of the printer and waves"
      className={`relative mx-auto aspect-[1/1] w-full max-w-[560px] transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}

/** Two-tone horizontal stripes: the PEI plate's texture, and the print's layer lines. */
function stripeTexture(THREE: typeof import("three"), a: string, b: string, size: number, band: number) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = a;
    g.fillRect(0, 0, size, size);
    g.fillStyle = b;
    for (let y = 0; y < size; y += band * 2) g.fillRect(0, y, size, band);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The maker's mark, as a texture for the printer's base. */
function labelTexture(THREE: typeof import("three"), text: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 80;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#cfc6b5";
    g.font = "600 44px ui-monospace, Menlo, monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const spaced = text.split("").join(String.fromCharCode(8202));
    g.fillText(spaced, 256, 42);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The lightning bolt from the logo, extruded, for the robot's chest. */
function boltGeometry(THREE: typeof import("three")) {
  const s = new THREE.Shape();
  const k = 0.0022;
  const pts: [number, number][] = [
    [4, 9],
    [-7, -5],
    [2, -5],
    [-2, -14],
    [10, 1],
    [1, 1],
    [6, 9],
  ];
  pts.forEach(([x, y], i) => (i ? s.lineTo(x * k, y * k) : s.moveTo(x * k, y * k)));
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: false });
}

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/* ==========================================================================
   KOŞUL FABRİKASI — 3B sahne
   Bant kutuları taşır; karar kapısında kurallar denenir; kutu hedef sandığa düşer.
   ========================================================================== */

const BANT_BAS = -6.5;
const KAPI_X = 0.9;
const GECIS_X = 1.9;
const BIN_X = 3.25;
const YUZEY = 0.82;
const KUTU_Y = YUZEY + 0.26;

const SURE = { bant: 2.1, kapi: 0.55, donus: 0.95, birak: 0.65 };
const TOPLAM = SURE.bant + SURE.kapi + SURE.donus + SURE.birak;
const ARALIK = 1.5;

const lerp = (a, b, k) => a + (b - a) * k;

function izgaraDokusu() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#0b1016';
  x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#16212c';
  x.lineWidth = 6;
  x.strokeRect(0, 0, 256, 256);
  x.strokeStyle = '#121a23';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(128, 0); x.lineTo(128, 256);
  x.moveTo(0, 128); x.lineTo(256, 128);
  x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(26, 18);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function bantDokusu() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#20262d';
  x.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 256; i += 32) {
    x.fillStyle = '#252c34';
    x.fillRect(i, 0, 15, 64);
    x.fillStyle = '#1a2027';
    x.fillRect(i + 16, 0, 3, 64);
  }
  x.fillStyle = '#39424c';
  x.fillRect(0, 4, 256, 3);
  x.fillRect(0, 57, 256, 3);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function fabrikaKur(kap) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  kap.appendChild(renderer.domElement);

  const etiketKatman = new CSS2DRenderer();
  etiketKatman.domElement.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  kap.appendChild(etiketKatman.domElement);

  const sahne = new THREE.Scene();
  sahne.background = new THREE.Color(0x070b10);
  sahne.fog = new THREE.Fog(0x070b10, 20, 46);

  const kamera = new THREE.PerspectiveCamera(45, 1, 0.1, 140);
  kamera.position.set(3.4, 4.4, 7.6);

  const kontrol = new OrbitControls(kamera, renderer.domElement);
  kontrol.target.set(0.1, 1.05, 0);
  kontrol.enableDamping = true;
  kontrol.dampingFactor = 0.08;
  kontrol.enablePan = false;
  kontrol.minDistance = 5.5;
  kontrol.maxDistance = 26;
  kontrol.maxPolarAngle = Math.PI * 0.47;
  kontrol.minPolarAngle = 0.18;
  kontrol.rotateSpeed = 0.55;

  /* ----------------------------------------------------------------- ışık */
  sahne.add(new THREE.HemisphereLight(0x9dc4e0, 0x0a0e13, 0.85));

  const gunes = new THREE.DirectionalLight(0xfff0db, 2.4);
  gunes.position.set(7, 12, 9);
  gunes.castShadow = true;
  gunes.shadow.mapSize.set(2048, 2048);
  gunes.shadow.camera.left = -12;
  gunes.shadow.camera.right = 12;
  gunes.shadow.camera.top = 10;
  gunes.shadow.camera.bottom = -10;
  gunes.shadow.camera.far = 40;
  gunes.shadow.bias = -0.0006;
  sahne.add(gunes);

  const mavi = new THREE.PointLight(0x4fe3ff, 26, 18, 2);
  mavi.position.set(-3.4, 3.4, 2.4);
  sahne.add(mavi);

  const amber = new THREE.PointLight(0xffb454, 22, 16, 2);
  amber.position.set(3.4, 3.2, -2.2);
  sahne.add(amber);

  /* ---------------------------------------------------------------- zemin */
  const zemin = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 34),
    new THREE.MeshStandardMaterial({ map: izgaraDokusu(), roughness: 0.92, metalness: 0.15, color: 0x8894a0 })
  );
  zemin.rotation.x = -Math.PI / 2;
  zemin.receiveShadow = true;
  sahne.add(zemin);

  const duvarMat = new THREE.MeshStandardMaterial({ color: 0x121922, roughness: 0.85, metalness: 0.25 });
  const duvar = new THREE.Mesh(new THREE.BoxGeometry(30, 9, 0.4), duvarMat);
  duvar.position.set(0, 4.5, -7.4);
  duvar.receiveShadow = true;
  sahne.add(duvar);

  for (let i = -4; i <= 4; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.5, 5.6, 0.12), new THREE.MeshStandardMaterial({ color: 0x18222c, roughness: 0.7, metalness: 0.35 }));
    panel.position.set(i * 3.1, 3.4, -7.1);
    sahne.add(panel);
    const cizgi = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x0c1319 }));
    cizgi.position.set(i * 3.1, 5.9, -7.0);
    sahne.add(cizgi);
  }

  for (let i = 0; i < 7; i++) {
    const boru = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 9, 10),
      new THREE.MeshStandardMaterial({ color: 0x2a3540, metalness: 0.85, roughness: 0.45 })
    );
    boru.position.set(-9 + i * 3.2, 7.3, -6.9);
    boru.rotation.z = Math.PI / 2;
    sahne.add(boru);
  }

  /* ----------------------------------------------------------------- bant */
  const bant = new THREE.Group();
  sahne.add(bant);

  const bantUz = KAPI_X - BANT_BAS;
  const yuzeyDoku = bantDokusu();
  const yuzey = new THREE.Mesh(
    new THREE.BoxGeometry(bantUz, 0.1, 1.36),
    new THREE.MeshStandardMaterial({ map: yuzeyDoku, roughness: 0.7, metalness: 0.45 })
  );
  yuzey.position.set((BANT_BAS + KAPI_X) / 2, YUZEY - 0.06, 0);
  yuzey.receiveShadow = true;
  yuzey.castShadow = true;
  bant.add(yuzey);

  const rayMat = new THREE.MeshStandardMaterial({ color: 0x39434e, metalness: 0.9, roughness: 0.35 });
  for (const z of [-0.7, 0.7]) {
    const ray = new THREE.Mesh(new THREE.BoxGeometry(bantUz, 0.16, 0.1), rayMat);
    ray.position.set((BANT_BAS + KAPI_X) / 2, YUZEY + 0.02, z);
    ray.castShadow = true;
    bant.add(ray);
  }

  const silindirler = [];
  const silindirMat = new THREE.MeshStandardMaterial({ color: 0x8b959e, metalness: 1, roughness: 0.33 });
  for (let x = BANT_BAS + 0.2; x < KAPI_X; x += 0.52) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 1.3, 14), silindirMat);
    s.rotation.x = Math.PI / 2;
    s.position.set(x, YUZEY - 0.2, 0);
    s.castShadow = true;
    bant.add(s);
    silindirler.push(s);
  }

  const bacakMat = new THREE.MeshStandardMaterial({ color: 0x2b333c, metalness: 0.8, roughness: 0.4 });
  for (const x of [-5.6, -2.4, 0.2]) {
    for (const z of [-0.55, 0.55]) {
      const bacak = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.14), bacakMat);
      bacak.position.set(x, 0.31, z);
      bacak.castShadow = true;
      bant.add(bacak);
    }
  }

  /* ------------------------------------------------------------- karar kapısı */
  const kapi = new THREE.Group();
  sahne.add(kapi);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x2f3a45, metalness: 0.85, roughness: 0.34 });
  for (const z of [-0.92, 0.92]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.3, 0.2), postMat);
    post.position.set(KAPI_X, 1.65, z);
    post.castShadow = true;
    kapi.add(post);

    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 2.5, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x0d2b33, emissive: 0x4fe3ff, emissiveIntensity: 1.8, roughness: 0.4 })
    );
    led.position.set(KAPI_X - 0.11, 1.5, z);
    kapi.add(led);
  }
  const kiris = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 2.2), postMat);
  kiris.position.set(KAPI_X, 3.32, 0);
  kiris.castShadow = true;
  kapi.add(kiris);

  const kirisLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.05, 1.9),
    new THREE.MeshStandardMaterial({ color: 0x2b1d08, emissive: 0xffb454, emissiveIntensity: 2.2, roughness: 0.4 })
  );
  kirisLed.position.set(KAPI_X, 3.2, 0);
  kapi.add(kirisLed);

  const tarayici = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 2.4),
    new THREE.MeshBasicMaterial({ color: 0x4fe3ff, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false })
  );
  tarayici.position.set(KAPI_X, 1.7, 0);
  tarayici.rotation.y = Math.PI / 2;
  kapi.add(tarayici);

  // kural plakaları (CSS2D)
  const plakalar = [];
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('div');
    el.className = 'plaka bos';
    const obj = new CSS2DObject(el);
    obj.position.set(KAPI_X, 2.95 - i * 0.42, 0.55);
    sahne.add(obj);
    plakalar.push({ el, obj });
  }

  /* --------------------------------------------------------------- sandıklar */
  const bins = [];
  const binMatGovde = new THREE.MeshStandardMaterial({ color: 0x232c35, metalness: 0.7, roughness: 0.45 });

  function etiketleriSil(kok) {
    kok.traverse((o) => {
      if (o.isCSS2DObject && o.element) o.element.remove();
    });
  }

  function binTemizle() {
    bins.forEach((b) => {
      etiketleriSil(b.grup);
      if (b.etiket.element) b.etiket.element.remove();
      sahne.remove(b.grup);
      sahne.remove(b.etiket);
      b.grup.traverse((o) => {
        if (o.isMesh && o.geometry) o.geometry.dispose();
      });
    });
    bins.length = 0;
  }

  function hedefleriKur(hedefler) {
    binTemizle();
    const n = hedefler.length;
    hedefler.forEach((h, i) => {
      const z = (i - (n - 1) / 2) * 1.76;
      const g = new THREE.Group();
      g.position.set(BIN_X, 0, z);
      const renk = new THREE.Color(h.renk);

      const taban = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 1.4), binMatGovde);
      taban.position.y = 0.08;
      taban.castShadow = true;
      taban.receiveShadow = true;
      g.add(taban);

      for (const s of [-1, 1]) {
        const yan = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 1.4), binMatGovde);
        yan.position.set(s * 0.66, 0.53, 0);
        yan.castShadow = true;
        g.add(yan);

        const on = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.08), binMatGovde);
        on.position.set(0, 0.53, s * 0.66);
        on.castShadow = true;
        g.add(on);

        const citaMat = new THREE.MeshStandardMaterial({ color: renk.clone().multiplyScalar(0.25), emissive: renk, emissiveIntensity: 1.6, roughness: 0.4 });
        const cita1 = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.06, 0.1), citaMat);
        cita1.position.set(0, 0.99, s * 0.66);
        g.add(cita1);
        const cita2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 1.42), citaMat);
        cita2.position.set(s * 0.66, 0.99, 0);
        g.add(cita2);
      }

      const ic = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.06, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x0e141a, emissive: renk, emissiveIntensity: 0.25, roughness: 0.8 })
      );
      ic.position.y = 0.58;
      g.add(ic);

      const pad = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7, 1.7),
        new THREE.MeshBasicMaterial({ color: renk, transparent: true, opacity: 0.1, depthWrite: false })
      );
      pad.rotation.x = -Math.PI / 2;
      pad.position.y = 0.02;
      g.add(pad);

      sahne.add(g);

      const el = document.createElement('div');
      el.className = 'bin-etiket';
      el.style.setProperty('--renk', h.renk);
      el.innerHTML = `<b>${h.ad}</b><span>0 kutu</span>`;
      const etiket = new CSS2DObject(el);
      etiket.position.set(BIN_X, 2.15, z);
      sahne.add(etiket);

      bins.push({ grup: g, el, etiket, z, adet: 0, renk, pop: 0 });
    });
  }

  /* ------------------------------------------------------------------ kutular */
  const kutuGeo = new THREE.BoxGeometry(0.52, 0.52, 0.52);
  const kenarGeo = new THREE.EdgesGeometry(kutuGeo);
  const kenarMal = new THREE.LineBasicMaterial({ color: 0x0a0f14, transparent: true, opacity: 0.55 });
  const kutuKatmani = new THREE.Group();
  sahne.add(kutuKatmani);

  function kutuOlustur(it, birim) {
    const g = new THREE.Group();
    const mal = new THREE.MeshStandardMaterial({ color: 0xd6dbe2, roughness: 0.55, metalness: 0.15 });
    const govde = new THREE.Mesh(kutuGeo, mal);
    govde.castShadow = true;
    govde.receiveShadow = true;
    g.add(govde);
    g.add(new THREE.LineSegments(kenarGeo, kenarMal));

    const etiket = document.createElement('div');
    etiket.className = 'kutu-etiket' + (it.gizli ? ' gizli' : '');
    etiket.innerHTML = `<b>${it.v}${birim ? `<i>${birim}</i>` : ''}</b>${it.alt ? `<span>${it.alt}</span>` : ''}`;
    const lbl = new CSS2DObject(etiket);
    lbl.position.set(0, 0.44, 0);
    g.add(lbl);

    g.userData = { mal, etiket };
    return g;
  }

  function kutulariTemizle() {
    [...kutuKatmani.children].forEach((c) => {
      etiketleriSil(c);
      kutuKatmani.remove(c);
      c.traverse((o) => {
        if (o.isMesh && o.material && o.material.dispose) o.material.dispose();
      });
    });
  }

  /* ---------------------------------------------------------------- animasyon */
  let kosu = null;
  let kosuNo = 0;
  const simdi = () => performance.now() / 1000;

  function binYaz(b) {
    b.el.querySelector('span').textContent = `${b.adet} kutu`;
    b.el.classList.toggle('dolu', b.adet > 0);
  }

  function bantCalistir(items, hiz, olay) {
    kosuNo += 1;
    kutulariTemizle();
    bins.forEach((b) => { b.adet = 0; b.pop = 0; binYaz(b); });
    plakalar.forEach((p) => p.el.classList.remove('aktif'));

    return new Promise((resolve) => {
      const kayit = { items: [], hiz: hiz || 1, baslangic: simdi(), olay, resolve, no: kosuNo };
      items.forEach((it) => {
        const g = kutuOlustur(it, it.birim);
        g.visible = false;
        kutuKatmani.add(g);
        const b = it.hedef >= 0 ? bins[it.hedef] : null;
        kayit.items.push({
          ...it,
          g,
          mal: g.userData.mal,
          etiket: g.userData.etiket,
          binZ: b ? b.z : 0,
          binRenk: b ? b.renk : null,
          indi: false,
          kuralYok: it.hedef < 0,
          vurgu: 0,
        });
      });
      kosu = kayit;
    });
  }

  function pozisyon(it, t) {
    const p = it.g.position;
    if (it.kuralYok && t >= SURE.bant) {
      p.set(0.3, KUTU_Y, 0);
      if (!it.jam) {
        it.jam = true;
        it.etiket.classList.add('hata');
        it.etiket.querySelector('b').innerHTML = 'KURAL YOK';
        it.g.rotation.z = 0.12;
      }
      return;
    }
    if (t < SURE.bant) {
      const k = t / SURE.bant;
      p.set(lerp(BANT_BAS, KAPI_X, k), KUTU_Y + Math.sin(k * Math.PI * 3) * 0.012, 0);
    } else if (t < SURE.bant + SURE.kapi) {
      p.set(KAPI_X, KUTU_Y, 0);
      if (!it.vurgu) {
        it.vurgu = 1;
        vurgula(it.izSon);
        it.etiket.classList.add('degerlendir');
      }
    } else if (t < SURE.bant + SURE.kapi + SURE.donus) {
      const k = (t - SURE.bant - SURE.kapi) / SURE.donus;
      p.set(lerp(KAPI_X, GECIS_X, k), KUTU_Y + Math.sin(Math.PI * k) * 0.35, it.binZ * k);
      if (it.binRenk) it.mal.color.lerp(it.binRenk, 0.05);
    } else {
      const k = Math.min(1, (t - SURE.bant - SURE.kapi - SURE.donus) / SURE.birak);
      p.set(lerp(GECIS_X, BIN_X, k), lerp(KUTU_Y, 0.52, k * k), it.binZ);
      if (it.binRenk) it.mal.color.copy(it.binRenk).lerp(new THREE.Color(0xffffff), 0.35);
    }
  }

  function inis(it) {
    if (it.kuralYok) return;
    const b = bins[it.hedef];
    if (b) {
      b.adet += 1;
      b.pop = 1;
      binYaz(b);
    }
    it.etiket.classList.add(it.dogru ? 'ok' : 'hata');
    if (it.olay) it.olay('inis', it);
  }

  function guncelle() {
    if (!kosu) return;
    const k = kosu;
    const gecen = simdi() - k.baslangic;
    const h = k.hiz;
    let bitti = true;

    k.items.forEach((it, i) => {
      const t = (gecen - i * (ARALIK / h)) * h;
      if (t < 0) { it.g.visible = false; bitti = false; return; }
      it.g.visible = true;

      if (it.indi) {
        const son = t - TOPLAM;
        if (it.kuralYok) return;
        if (son > 0.4) { it.g.visible = false; return; }
        const s = Math.max(0.001, 1 - son / 0.4);
        it.g.scale.setScalar(s);
        return;
      }

      bitti = false;
      pozisyon(it, t);
      if (t >= TOPLAM) { it.indi = true; inis(it); }
      if (!it.okundu && t >= SURE.bant + SURE.kapi) { it.okundu = true; if (k.olay) k.olay('okundu', it); }
    });

    if (bitti) {
      const c = k;
      kosu = null;
      setTimeout(() => c.resolve(), 260);
    }
  }

  function vurgula(idx) {
    plakalar.forEach((p, i) => p.el.classList.toggle('aktif', i === idx));
    window.clearTimeout(vurgula._zaman);
    if (idx >= 0) {
      vurgula._zaman = window.setTimeout(() => {
        plakalar.forEach((p) => p.el.classList.remove('aktif'));
      }, 1100);
    }
  }

  function kurallariKur(rows) {
    plakalar.forEach((p, i) => {
      const r = rows[i];
      if (!r) { p.el.style.display = 'none'; return; }
      p.el.style.display = '';
      p.el.className = 'plaka ' + r.tip + (r.metin ? '' : ' bos');
      p.el.innerHTML = r.metin || '· · ·';
    });
  }

  function sifirla() {
    kosuNo += 1;
    if (kosu) { const eski = kosu; kosu = null; setTimeout(() => eski.resolve(), 0); }
    kutulariTemizle();
    bins.forEach((b) => { b.adet = 0; binYaz(b); });
    plakalar.forEach((p) => p.el.classList.remove('aktif'));
  }

  /* ------------------------------------------------------------------ döngü */
  const saat = new THREE.Clock();
  let zaman = 0;

  function boyutlandir() {
    const w = kap.clientWidth || window.innerWidth;
    const h = kap.clientHeight || Math.round(window.innerHeight * 0.5);
    kamera.aspect = w / Math.max(1, h);
    kamera.fov = kamera.aspect < 1 ? 60 : 45;
    kamera.updateProjectionMatrix();
    renderer.setSize(w, h);
    etiketKatman.setSize(w, h);
  }
  const gozlemci = new ResizeObserver(boyutlandir);
  gozlemci.observe(kap);
  window.addEventListener('resize', boyutlandir);
  boyutlandir();

  function dongu() {
    requestAnimationFrame(dongu);
    const dt = Math.min(saat.getDelta(), 0.05);
    zaman += dt;

    silindirler.forEach((s) => { s.rotation.y += dt * 3.2; });
    yuzeyDoku.offset.x -= dt * 0.32;
    tarayici.material.opacity = 0.04 + Math.sin(zaman * 2.4) * 0.02;
    kirisLed.material.emissiveIntensity = 1.7 + Math.sin(zaman * 3.1) * 0.5;

    bins.forEach((b) => {
      if (b.pop > 0) {
        b.pop = Math.max(0, b.pop - dt * 2.6);
        const s = 1 + Math.sin(b.pop * Math.PI) * 0.06;
        b.grup.scale.set(s, s, s);
      } else {
        b.grup.scale.set(1, 1, 1);
      }
    });

    if (kosu) guncelle();

    kontrol.update();
    renderer.render(sahne, kamera);
    etiketKatman.render(sahne, kamera);
  }
  dongu();

  return {
    sahne,
    kamera,
    hedefleriKur,
    kurallariKur,
    bantCalistir,
    sifirla,
    boyutlandir,
    kameraSifirla() {
      kamera.position.set(3.4, 4.4, 7.6);
      kontrol.target.set(0.1, 1.05, 0);
      kontrol.update();
    },
  };
}

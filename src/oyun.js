import { fabrikaKur } from './fabrika.js';
import { BOLUMLER, BOLGELER, OPS, METIN_OPS, TOPLAM_BOLUM } from './seviyeler.js';

/* ==========================================================================
   KOŞUL FABRİKASI — oyun denetleyicisi
   Öğrenci if / elif / else karar makinesini kurar, bant kutuları sandıklara taşır.
   ========================================================================== */

const KAYIT = 'kosulFabrikasiV1';

const S = {
  ad: '',
  i: 0,
  tamam: {},
  yildiz: {},
  deneme: 0,
  baslangic: Date.now(),
  hiz: 1,
  kurallar: [],
  kosuyor: false,
};

try {
  const k = JSON.parse(localStorage.getItem(KAYIT) || 'null');
  if (k) {
    S.ad = k.ad || '';
    S.tamam = k.tamam || {};
    S.yildiz = k.yildiz || {};
    S.baslangic = k.baslangic || Date.now();
    const ilk = BOLUMLER.findIndex((_, i) => !S.tamam[i]);
    S.i = ilk === -1 ? 0 : ilk;
  }
} catch { /* bozuk kayıt: sıfırdan başla */ }

const sahne = fabrikaKur(document.getElementById('sahne'));

const $ = (id) => document.getElementById(id);
const overlayEl = $('overlay');
const toastEl = $('toast');
const kurallarEl = $('kurallar');
const kodEl = $('kod');
const durumEl = $('durum');
const calistirBtn = $('calistir-btn');

const bolum = () => BOLUMLER[S.i];

/* ------------------------------------------------------------------ yardımcı */
let toastZaman = null;
function bildir(metin, tur = '') {
  toastEl.textContent = metin;
  toastEl.className = 'gorunur ' + tur;
  clearTimeout(toastZaman);
  toastZaman = setTimeout(() => { toastEl.className = tur; }, 4200);
}

function modal(html) {
  overlayEl.innerHTML = `<div class="modal">${html}</div>`;
  overlayEl.classList.add('gorunur');
}
function modalKapat() {
  overlayEl.classList.remove('gorunur');
  overlayEl.innerHTML = '';
}
const kapatBtn = (etiket = 'Devam et') => `<button class="btn" data-act="kapat">${etiket}</button>`;

function kaydet() {
  try {
    localStorage.setItem(KAYIT, JSON.stringify({
      ad: S.ad, tamam: S.tamam, yildiz: S.yildiz, baslangic: S.baslangic,
    }));
  } catch { /* depolama kapalıysa sorun değil */ }
}

/* --------------------------------------------------------------- kural mantığı */
function karsilastir(op, v, deger, metin) {
  if (metin) {
    const a = String(v);
    const b = String(deger);
    return op === '!=' ? a !== b : a === b;
  }
  const a = Number(v);
  const b = Number(deger);
  switch (op) {
    case '>': return a > b;
    case '>=': return a >= b;
    case '<': return a < b;
    case '<=': return a <= b;
    case '==': return a === b;
    case '!=': return a !== b;
    default: return false;
  }
}

function degerlendir(rows, v) {
  const metin = !!bolum().metin;
  const iz = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    iz.push(i);
    if (r.tip === 'else') return { hedef: r.hedef, iz };
    if (karsilastir(r.op, v, r.deger, metin)) return { hedef: r.hedef, iz };
  }
  return { hedef: -1, iz };
}

function izMetni(rows, v) {
  const metin = !!bolum().metin;
  const parca = [];
  for (const r of rows) {
    if (r.tip === 'else') { parca.push('else → evet'); break; }
    const ok = karsilastir(r.op, v, r.deger, metin);
    parca.push(`${r.tip} ${r.op} ${r.deger} → ${ok ? 'evet' : 'hayır'}`);
    if (ok) break;
  }
  return parca.join(' · ');
}

/* ------------------------------------------------------------- bölüm yükleme */
function varsayilan(b) {
  const ilk = b.kutular[0]?.v;
  if (b.metin) {
    return [
      { tip: 'if', op: '==', deger: b.secenekler[0], hedef: 0 },
      { tip: 'else', hedef: b.hedefler.length - 1 },
    ];
  }
  return [
    { tip: 'if', op: '>', deger: typeof ilk === 'number' ? ilk : 0, hedef: 0 },
    { tip: 'else', hedef: b.hedefler.length - 1 },
  ];
}

function bolumYukle(i) {
  S.i = Math.max(0, Math.min(TOPLAM_BOLUM - 1, i));
  S.deneme = 0;
  S.kosuyor = false;
  const b = bolum();
  S.kurallar = b.mod === 'kur'
    ? varsayilan(b)
    : JSON.parse(JSON.stringify(b.bozuk));
  sahne.sifirla();
  sahne.hedefleriKur(b.hedefler);
  ciz();
}

function plakaVerisi() {
  const b = bolum();
  return S.kurallar.map((r) => {
    const h = b.hedefler[r.hedef]?.ad ?? '?';
    if (r.tip === 'else') return { tip: 'else', metin: `<span class="p-kw">else</span> → <b>${h}</b>` };
    const d = r.deger === '' ? '?' : r.deger;
    return { tip: r.tip, metin: `<span class="p-kw">${r.tip}</span> ${b.alan} ${r.op} <b>${d}</b>${b.birim ? `<i>${b.birim}</i>` : ''} → <b>${h}</b>` };
  });
}

function plakaGuncelle() {
  sahne.kurallariKur(plakaVerisi());
}

/* ------------------------------------------------------------------ çizim */
function ciz() {
  const b = bolum();
  const bolge = BOLGELER[b.bolge];

  $('bolge-etiket').textContent = `BÖLGE ${bolge.no} · ${bolge.ad.toUpperCase()}`;
  $('bolge-etiket').style.color = bolge.renk;
  $('bolum-ad').textContent = b.baslik;
  $('bolum-sayac').textContent = `${String(S.i + 1).padStart(2, '0')} / ${TOPLAM_BOLUM}`;

  const mod = $('mod-etiket');
  mod.textContent = b.mod === 'kur' ? 'KUR' : b.mod === 'duzelt' ? 'ONAR' : 'SIRALA';
  mod.className = 'mod ' + b.mod;

  $('senaryo').innerHTML = `${b.senaryo}<em>${b.ogreti}</em>`;

  const tamamSayi = Object.keys(S.tamam).length;
  $('ilerleme-bar').style.width = `${(tamamSayi / TOPLAM_BOLUM) * 100}%`;
  $('ilerleme-yazi').textContent = `${tamamSayi} / ${TOPLAM_BOLUM}`;

  const yildiz = Object.values(S.yildiz).reduce((a, v) => a + v, 0);
  $('yildiz-toplam').textContent = `★ ${yildiz}`;

  $('hiz-btn').textContent = S.hiz === 1 ? '1× hız' : '2× hız';
  $('ekle-btn').hidden = b.mod === 'sirala' || S.kurallar.length >= (b.maksSatir || 5);
  durumEl.textContent = '';
  durumEl.classList.remove('ipucu');

  kurallariCiz();
  pythonCiz();
  plakaGuncelle();
}

function satirHTML(r, i) {
  const b = bolum();
  const kilit = b.mod === 'sirala';
  const ilk = i === 0;
  const hedefSec = `<select data-hedef ${kilit ? '' : ''} class="hedef-sec">
    ${b.hedefler.map((h, j) => `<option value="${j}"${r.hedef === j ? ' selected' : ''}>${h.ad}</option>`).join('')}
  </select>`;

  let tip;
  if (ilk) {
    tip = '<span class="tip-sabit">if</span>';
  } else if (kilit) {
    tip = `<span class="tip-sabit">${r.tip}</span>`;
  } else {
    tip = `<select data-tip class="tip-sec">
      <option value="elif"${r.tip === 'elif' ? ' selected' : ''}>elif</option>
      <option value="else"${r.tip === 'else' ? ' selected' : ''}>else</option>
    </select>`;
  }

  let kosul = '';
  if (r.tip === 'else') {
    kosul = '<span class="kosul-yok">diğer bütün durumlar</span>';
  } else {
    const ops = b.metin ? METIN_OPS : OPS;
    const opSec = `<select data-op ${kilit ? 'disabled' : ''} class="op-sec">
      ${ops.map((o) => `<option value="${o}"${r.op === o ? ' selected' : ''}>${o}</option>`).join('')}
    </select>`;

    let deger;
    if (b.metin) {
      deger = `<select data-deger ${kilit ? 'disabled' : ''} class="deger-in">
        ${b.secenekler.map((s) => `<option value="${s}"${r.deger === s ? ' selected' : ''}>${s}</option>`).join('')}
      </select>`;
    } else {
      deger = `<input data-deger type="number" inputmode="decimal" step="${b.adim || 1}"
        value="${r.deger}" ${kilit ? 'disabled' : ''} class="deger-in" />`;
    }

    kosul = `<span class="alan">${b.alan}</span>${opSec}<span class="deger-kutu">${deger}${b.birim ? `<i>${b.birim}</i>` : ''}</span>`;
  }

  return `<div class="kural-satir ${r.tip}" data-i="${i}">
    <span class="tip">${tip}</span>
    ${kosul}
    <span class="ok">→</span>
    ${hedefSec}
    <span class="tuslar">
      <button data-yukari title="Yukarı" ${ilk ? 'disabled' : ''}>↑</button>
      <button data-asagi title="Aşağı" ${i === S.kurallar.length - 1 ? 'disabled' : ''}>↓</button>
      ${kilit ? '' : '<button data-sil title="Satırı sil" class="sil">✕</button>'}
    </span>
  </div>`;
}

function kurallariCiz() {
  const b = bolum();
  kurallarEl.innerHTML = S.kurallar.map(satirHTML).join('');
  $('kural-sayac').textContent = `${S.kurallar.length} / ${b.maksSatir || 5} satır`;
}

/* ------------------------------------------------------------------- Python */
function pythonCiz() {
  const b = bolum();
  const ornek = b.kutular[0]?.v ?? 0;
  const yaz = (v) => (typeof v === 'string' ? `"${v}"` : String(v));
  const satirlar = [`${b.alan} = ${yaz(ornek)}`];

  S.kurallar.forEach((r) => {
    const hedef = b.hedefler[r.hedef]?.ad ?? '?';
    if (r.tip === 'else') {
      satirlar.push('else:', `    print("${hedef}")`);
    } else {
      const d = r.deger === '' ? '?' : yaz(r.deger);
      satirlar.push(`${r.tip} ${b.alan} ${r.op} ${d}:`, `    print("${hedef}")`);
    }
  });

  kodEl.innerHTML = satirlar.map((satir) => {
    let s = satir.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/^(if|elif|else)\b/, '<span class="kw">$1</span>');
    s = s.replace(/print\(&quot;([^&]*)&quot;\)/, 'print(<span class="str">"$1"</span>)');
    s = s.replace(/print\("([^"]*)"\)/, 'print(<span class="str">"$1"</span>)');
    return s;
  }).join('\n');

  $('kod-not').textContent = `# ${b.kutular.length + (b.gizli?.length || 0)} kutu bu kuraldan geçecek`;
}

/* ------------------------------------------------------------------- olaylar */
kurallarEl.addEventListener('input', (e) => {
  const satir = e.target.closest('[data-i]');
  if (!satir) return;
  const i = Number(satir.dataset.i);
  if (e.target.dataset.deger !== undefined) {
    const b = bolum();
    S.kurallar[i].deger = e.target.value === '' ? '' : (b.metin ? e.target.value : Number(e.target.value));
    pythonCiz();
    plakaGuncelle();
  }
});

kurallarEl.addEventListener('change', (e) => {
  const satir = e.target.closest('[data-i]');
  if (!satir) return;
  const i = Number(satir.dataset.i);
  if (e.target.dataset.op) { S.kurallar[i].op = e.target.value; pythonCiz(); plakaGuncelle(); }
  if (e.target.dataset.hedef) { S.kurallar[i].hedef = Number(e.target.value); pythonCiz(); plakaGuncelle(); }
  if (e.target.dataset.tip) {
    const yeni = e.target.value;
    if (yeni === 'else') {
      const [r] = S.kurallar.splice(i, 1);
      r.tip = 'else';
      r.hedef = r.hedef ?? 0;
      S.kurallar.push(r);
    } else {
      S.kurallar[i].tip = 'elif';
    }
    kurallariCiz();
    pythonCiz();
    plakaGuncelle();
  }
});

kurallarEl.addEventListener('click', (e) => {
  const satir = e.target.closest('[data-i]');
  if (!satir) return;
  const i = Number(satir.dataset.i);
  const b = bolum();
  if (b.mod === 'sirala' && (e.target.dataset.sil !== undefined)) return;

  if (e.target.closest('[data-yukari]') && i > 0) {
    [S.kurallar[i - 1], S.kurallar[i]] = [S.kurallar[i], S.kurallar[i - 1]];
    kurallariCiz(); pythonCiz(); plakaGuncelle();
  }
  if (e.target.closest('[data-asagi]') && i < S.kurallar.length - 1) {
    if (S.kurallar[i + 1].tip === 'else' || S.kurallar[i].tip === 'else') return;
    [S.kurallar[i + 1], S.kurallar[i]] = [S.kurallar[i], S.kurallar[i + 1]];
    kurallariCiz(); pythonCiz(); plakaGuncelle();
  }
  if (e.target.closest('[data-sil]')) {
    if (S.kurallar.length <= 1) return bildir('En az bir koşul kalmalı.');
    S.kurallar.splice(i, 1);
    if (S.kurallar.length && S.kurallar[0].tip !== 'if') S.kurallar[0].tip = 'if';
    kurallariCiz(); pythonCiz(); plakaGuncelle();
  }
});

/* ------------------------------------------------------------------- çalıştır */
function gecerliMi() {
  const b = bolum();
  if (!S.kurallar.length) return 'En az bir koşul satırı gerekiyor.';
  if (S.kurallar.length > (b.maksSatir || 5)) return `En fazla ${b.maksSatir} satır kullanabilirsin.`;
  for (let i = 0; i < S.kurallar.length; i++) {
    const r = S.kurallar[i];
    if (r.tip !== 'else' && (r.deger === '' || r.deger === null || Number.isNaN(Number(r.deger)) && !b.metin)) {
      return `${i + 1}. satırda değer eksik.`;
    }
    if (r.hedef === undefined || r.hedef === null) return `${i + 1}. satırda sandık seçilmemiş.`;
    if (r.tip === 'else' && i !== S.kurallar.length - 1) return 'else yalnızca en sonda olabilir.';
  }
  return null;
}

async function calistir() {
  if (S.kosuyor) return;
  const hata = gecerliMi();
  if (hata) return bildir(hata, 'kotu');

  const b = bolum();
  const kutular = b.kutular.concat(b.gizli || []);
  const items = kutular.map((k, idx) => {
    const r = degerlendir(S.kurallar, k.v);
    const bek = degerlendir(b.cozum, k.v);
    return {
      v: k.v,
      alt: k.alt,
      birim: b.birim,
      gizli: idx >= b.kutular.length,
      hedef: r.hedef,
      izSon: r.iz.length ? r.iz[r.iz.length - 1] : -1,
      dogru: r.hedef === bek.hedef,
      beklenen: bek.hedef,
    };
  });

  S.kosuyor = true;
  S.deneme += 1;
  calistirBtn.disabled = true;
  const dogru = items.filter((x) => x.dogru).length;
  let okunan = 0;
  durumEl.textContent = 'Bant çalışıyor…';
  durumEl.classList.remove('ipucu');

  try {
    await sahne.bantCalistir(items, S.hiz, (tur) => {
      if (tur === 'okundu') {
        okunan += 1;
        durumEl.textContent = `${okunan} / ${items.length} kutu okundu · ${dogru} doğru`;
      }
    });
  } finally {
    S.kosuyor = false;
    calistirBtn.disabled = false;
  }

  durumEl.textContent = `${dogru} / ${items.length} doğru`;
  sonucGoster(items, dogru);
}

function sonucGoster(items, dogru) {
  const b = bolum();
  const toplam = items.length;
  const tam = dogru === toplam;

  if (tam) {
    const y = S.deneme <= 1 ? 3 : S.deneme === 2 ? 2 : 1;
    S.yildiz[S.i] = Math.max(S.yildiz[S.i] || 0, y);
    S.tamam[S.i] = true;
    kaydet();
    ciz();
  }

  const satirlar = items.map((it) => `
    <div class="kayit-satir ${it.dogru ? 'dogru' : 'yanlis'}">
      <span class="ks-deger">${it.v}${it.alt ? `<i>${it.alt}</i>` : ''}${it.gizli ? '<em>sürpriz</em>' : ''}</span>
      <span class="ks-ok">→</span>
      <span class="ks-sonuc">${it.hedef >= 0 ? b.hedefler[it.hedef].ad : 'KURAL YOK'}</span>
      <span class="ks-isaret">${it.dogru ? '✓' : `✗ doğrusu: ${b.hedefler[it.beklenen].ad}`}</span>
    </div>`).join('');

  let aciklama = '';
  if (!tam) {
    const ilk = items.find((x) => !x.dogru);
    aciklama = `<div class="neden">
      <b>${ilk.v} değeri:</b> kuralın onu <b>${ilk.hedef >= 0 ? b.hedefler[ilk.hedef].ad : 'hiçbir sandığa'}</b> gönderdi,
      doğrusu <b>${b.hedefler[ilk.beklenen].ad}</b>.<br>
      <span class="iz">${izMetni(S.kurallar, ilk.v)}</span>
      ${ilk.hedef === -1 ? '<br>Hiçbir koşul tutmadı: kutu bantta kaldı. <b>else</b> ekle.' : ''}
    </div>`;
  }

  const yildiz = S.yildiz[S.i] || 0;
  modal(`
    <div class="ust">BÖLÜM ${S.i + 1} · ${bolum().baslik}</div>
    <h1>${tam ? 'Bant temiz çalıştı' : 'Bant karıştı'}</h1>
    <div class="sonuc-ust">
      <div class="puan"><b>${dogru}</b><small>/ ${toplam} kutu doğru</small></div>
      <div class="yildizlar">${'★'.repeat(tam ? yildiz : 0)}${'☆'.repeat(3 - (tam ? yildiz : 0))}</div>
    </div>
    <div class="kayit-liste">${satirlar}</div>
    ${aciklama}
    ${tam ? `<div class="neden bilgi"><b>Öğrendin:</b> ${bolum().ogreti}</div>` : ''}
    <div class="satir">
      ${tam
        ? (S.i === TOPLAM_BOLUM - 1
          ? '<button class="btn" data-act="rapor">Raporu gör →</button>'
          : '<button class="btn" data-act="sonraki">Sonraki bölüm →</button>')
        : '<button class="btn" data-act="duzelt">Kuralları düzelt →</button><button class="btn sade" data-act="ipucu">İpucu</button>'}
      ${tam ? '' : '<button class="btn sade" data-act="tekrar">Baştan dene</button>'}
    </div>
  `);
}

/* --------------------------------------------------------------------- ekranlar */
function giris() {
  const devam = Object.keys(S.tamam).length > 0;
  modal(`
    <div class="ust">7. sınıf · Programlama ve Yazılım · 9. Hafta</div>
    <h1>Koşul Fabrikası</h1>
    <p class="giris-metin">
      Fabrikada her kutu bir değer taşır: sıcaklık, puan, saat, renk, kilo…
      Bandın sonundaki <b>karar kapısında</b> kutular senin yazdığın kurallardan geçer ve
      doğru sandığa düşer. Kuralı yazmak <b>if / elif / else</b> yazmakla aynı şeydir.
    </p>
    <div class="bolge-kartlar">
      ${BOLGELER.map((b) => `
        <div class="bolge-kart" style="--renk:${b.renk}">
          <b>BÖLGE ${b.no}</b><span>${b.ad}</span><small>${b.ozet}</small>
        </div>`).join('')}
    </div>
    <div class="giris-alt">
      <div class="sayi-kart"><b>24</b><small>BÖLÜM</small></div>
      <div class="sayi-kart"><b>3</b><small>OYUN MODU</small></div>
      <div class="sayi-kart"><b>~35</b><small>DAKİKA</small></div>
    </div>
    <input type="text" id="ad-girdi" maxlength="24" placeholder="Adını yaz (isteğe bağlı)" value="${S.ad}" />
    <button class="btn buyuk" data-act="basla">${devam ? 'Kaldığın yerden devam et →' : 'Fabrikaya gir →'}</button>
    ${devam ? '<button class="btn sade" data-act="harita">Bölüm seç</button>' : ''}
  `);
  setTimeout(() => $('ad-girdi')?.focus(), 200);
}

function basla() {
  const girdi = $('ad-girdi');
  if (girdi) S.ad = girdi.value.trim().slice(0, 24);
  kaydet();
  modalKapat();
  bolumYukle(Object.keys(S.tamam).length >= TOPLAM_BOLUM ? 0 : S.i);
  if (S.ad) bildir(`Kolay gelsin ${S.ad}! Kuralı kur, bandı çalıştır.`, 'iyi');
}

function yardim() {
  modal(`
    <div class="ust">Kullanım</div>
    <h1>Nasıl oynanır?</h1>
    <ul class="adim-liste">
      <li><b>1 · Kuralı kur.</b> Üstteki satır <b>if</b>, altındakiler <b>elif</b>, en sondaki <b>else</b>.
        İşareti (&gt;, &gt;=, &lt;, &lt;=, ==) ve değeri seç, kutunun gideceği sandığı belirle.</li>
      <li><b>2 · Sıra önemli.</b> İlk tutan koşul çalışır, altındakiler atlanır. Geniş koşul üstte olursa
        dar koşulu yutar.</li>
      <li><b>3 · Bandı çalıştır.</b> Kutular kapıda kurallarına göre okunur ve sandıklara düşer.
        Yanlış giden kutu kırmızı işaretlenir.</li>
      <li><b>4 · Sürpriz kutular.</b> Her bölümde, ekranda görmediğin kutular da aynı kurallardan geçer.
        Kuralın ezber değil, gerçek bir kural olmalı.</li>
    </ul>
    <div class="kunye-row">
      <span class="kunye">KUR: sıfırdan kural yaz</span>
      <span class="kunye">ONAR: bozuk kuralı düzelt</span>
      <span class="kunye">SIRALA: satırların sırasını değiştir</span>
    </div>
    <div class="neden bilgi"><b>Kamera:</b> fareyle sürükle döndür · tekerlekle yakınlaş.</div>
    <button class="btn" data-act="kapat">Anladım</button>
  `);
}

function harita() {
  modal(`
    <div class="ust">24 bölüm · 4 bölge</div>
    <h1>Bölüm haritası</h1>
    <div class="harita">
      ${BOLGELER.map((bo, bi) => {
        const aralik = [];
        for (let i = bo.aralik[0]; i <= bo.aralik[1]; i++) aralik.push(i);
        return `<div class="harita-bolge" style="--renk:${bo.renk}">
          <div class="hb-baslik"><b>BÖLGE ${bo.no}</b><span>${bo.ad}</span><small>${bo.ozet}</small></div>
          <div class="hb-kutular">
            ${aralik.map((i) => {
              const b = BOLUMLER[i];
              const y = S.yildiz[i] || 0;
              return `<button class="harita-kutu ${S.tamam[i] ? 'tamam' : ''} ${i === S.i ? 'aktif' : ''}"
                data-act="bolum" data-bolum="${i}" title="${b.baslik}">
                <b>${String(i + 1).padStart(2, '0')}</b>
                <span>${b.baslik}</span>
                <i>${y ? '★'.repeat(y) : '·'}</i>
              </button>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>
    <button class="btn sade" data-act="kapat">Kapat</button>
  `);
}

function rapor() {
  const tamam = Object.keys(S.tamam).length;
  const yildiz = Object.values(S.yildiz).reduce((a, v) => a + v, 0);
  const sn = Math.floor((Date.now() - S.baslangic) / 1000);
  const dk = Math.floor(sn / 60);
  const ad = S.ad || 'Kaşif';

  // bölge bazında tamamlanma
  const bolgeSatir = BOLGELER.map((bo) => {
    let t = 0, toplam = 0;
    for (let i = bo.aralik[0]; i <= bo.aralik[1]; i++) { toplam += 1; if (S.tamam[i]) t += 1; }
    return `<tr><td>Bölge ${bo.no} · ${bo.ad}</td><td>${t} / ${toplam}</td></tr>`;
  }).join('');

  modal(`
    <div class="ust">Öğrenci raporu · ${new Date().toLocaleDateString('tr-TR')}</div>
    <h1>${tamam === TOPLAM_BOLUM ? `Fabrika senin, ${ad}!` : `İyi gidiyorsun, ${ad}`}</h1>
    <div class="sonuc-ust">
      <div class="puan"><b>${yildiz}</b><small>/ ${TOPLAM_BOLUM * 3} yıldız</small></div>
      <div class="puan"><b>${tamam}</b><small>/ ${TOPLAM_BOLUM} bölüm</small></div>
      <div class="puan"><b>${dk} dk</b><small>süre</small></div>
    </div>
    <table class="rapor-tablo">
      ${bolgeSatir}
      <tr><td>Toplam süre</td><td>${dk} dk ${sn % 60} sn</td></tr>
    </table>
    <div class="neden bilgi">
      <b>Kanıt:</b> Çoklu koşul yapısında (if–elif–else) koşullar yukarıdan aşağıya denenir,
      ilk doğru koşul çalışır ve kalan dallar atlanır. Koşulların sırası sonucu değiştirir;
      hiçbiri tutmazsa else devreye girer.
    </div>
    <div class="satir">
      <button class="btn" data-act="rapor-indir">Raporu indir (.txt)</button>
      <button class="btn sade" data-act="harita">Bölüm haritası</button>
    </div>
  `);
}

function raporIndir() {
  const tamam = Object.keys(S.tamam).length;
  const yildiz = Object.values(S.yildiz).reduce((a, v) => a + v, 0);
  const sn = Math.floor((Date.now() - S.baslangic) / 1000);
  const satirlar = [
    'KOŞUL FABRİKASI — ÖĞRENCİ RAPORU',
    '================================',
    `Öğrenci   : ${S.ad || 'Kaşif'}`,
    `Tarih     : ${new Date().toLocaleString('tr-TR')}`,
    `Süre      : ${Math.floor(sn / 60)} dk ${sn % 60} sn`,
    `Bölüm     : ${tamam} / ${TOPLAM_BOLUM}`,
    `Yıldız    : ${yildiz} / ${TOPLAM_BOLUM * 3}`,
    '',
    'Bölge sonuçları:',
    ...BOLGELER.map((bo) => {
      let t = 0, toplam = 0;
      for (let i = bo.aralik[0]; i <= bo.aralik[1]; i++) { toplam += 1; if (S.tamam[i]) t += 1; }
      return `- Bölge ${bo.no} ${bo.ad}: ${t}/${toplam}`;
    }),
    '',
    'Bölüm ayrıntısı:',
    ...BOLUMLER.map((b, i) => `- ${String(i + 1).padStart(2, '0')} ${b.baslik}: ${S.tamam[i] ? `tamam (${S.yildiz[i] || 0}★)` : 'tamamlanmadı'}`),
    '',
    'Başarı ölçütleri:',
    '- if / elif / else yapısını doğru sırayla kurar.',
    '- Koşul sırasının sonucu değiştirdiğini açıklar.',
    '- Sınır değerlerde (> / >=) doğru karşılaştırmayı seçer.',
    '- Hiçbir koşul tutmadığında else gerektiğini bilir.',
    '',
    'Öğretmen notu: Bu rapor oyun içi otomatik değerlendirmedir; sözlü açıklama ile birlikte kullanılmalıdır.',
  ];
  const blob = new Blob([satirlar.join('\r\n')], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kosul-fabrikasi-${(S.ad || 'kasif').replace(/\s+/g, '-').toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* -------------------------------------------------------------------- butonlar */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;

  switch (act) {
    case 'basla': basla(); break;
    case 'kapat': modalKapat(); break;
    case 'harita': harita(); break;
    case 'yardim': yardim(); break;
    case 'ipucu':
      modalKapat();
      durumEl.textContent = `İpucu: ${bolum().ipucu}`;
      durumEl.classList.add('ipucu');
      bildir('İpucu panelin altında.', '');
      break;
    case 'calistir': calistir(); break;
    case 'sifirla': {
      const b = bolum();
      S.kurallar = b.mod === 'kur' ? varsayilan(b) : JSON.parse(JSON.stringify(b.bozuk));
      ciz();
      bildir('Kurallar başlangıç hâline döndü.');
      break;
    }
    case 'ekle': {
      const b = bolum();
      if (S.kurallar.length >= (b.maksSatir || 5)) return bildir(`En fazla ${b.maksSatir} satır kullanabilirsin.`);
      const elseIdx = S.kurallar.findIndex((r) => r.tip === 'else');
      const yeni = {
        tip: 'elif',
        op: b.metin ? '==' : '>',
        deger: b.metin ? b.secenekler[0] : (b.kutular[0]?.v ?? 0),
        hedef: 0,
      };
      if (elseIdx === -1) S.kurallar.push(yeni);
      else S.kurallar.splice(elseIdx, 0, yeni);
      ciz();
      break;
    }
    case 'hiz':
      S.hiz = S.hiz === 1 ? 2 : 1;
      $('hiz-btn').textContent = S.hiz === 1 ? '1× hız' : '2× hız';
      break;
    case 'sonraki': modalKapat(); bolumYukle(S.i + 1); break;
    case 'tekrar': modalKapat(); S.deneme = 0; ciz(); break;
    case 'duzelt': modalKapat(); break;
    case 'bolum':
      modalKapat();
      bolumYukle(Number(el.dataset.bolum));
      break;
    case 'rapor': rapor(); break;
    case 'rapor-indir': raporIndir(); break;
    default: break;
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (overlayEl.classList.contains('gorunur')) modalKapat();
  }
  if (e.key === 'Enter' && $('ad-girdi') && overlayEl.classList.contains('gorunur')) {
    document.querySelector('[data-act="basla"]')?.click();
  }
  if (e.key === 'Enter' && !overlayEl.classList.contains('gorunur') && e.target.tagName === 'INPUT') {
    calistir();
  }
});

/* -------------------------------------------------------------------- başlangıç */
bolumYukle(S.i);
giris();

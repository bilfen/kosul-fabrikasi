# Koşul Fabrikası

7. sınıf **Tech Innovator · Programlama ve Yazılım · 9. Hafta** için 3B etkinlik.
Konu: Python'da **koşullu durumlar — if / elif / else**.

Öğrenci bir fabrikanın karar makinesini kurar. Banttaki her kutu bir değer taşır
(sıcaklık, puan, saat, renk, kilo, can…). Kutular karar kapısında öğrencinin yazdığı
kurallardan geçer, ilk tutan koşula göre doğru sandığa düşer. Panodaki Python kodu
kurallarla birlikte canlı yazılır: oyun ile dersin kod örnekleri aynı şeyi anlatır.

## 24 bölüm · 4 bölge

| Bölge | Bölüm | Ne öğretir |
|---|---|---|
| I · Koşul Atölyesi | 1–7 | if / else, >, <, >=, <=, ==, metin karşılaştırma, elif'e giriş |
| II · Elif Merdiveni | 8–13 | üç–dört kademeli elif, not aralıkları, saat dilimi, trafik ışığı, VKİ |
| III · Sıralama ve Hata | 14–19 | elif sırası, bozuk kuralı onarma, sınır hatası, eksik else |
| IV · Gerçek Dünya | 20–24 | oyun canı, kargo tarifesi, hava durumu, sinema yaşı, termostat |

## Üç oyun modu

- **KUR** — karar makinesini sıfırdan yaz.
- **ONAR** — ters işareti, kaçan sınırı veya eksik `else`'i düzelt.
- **SIRALA** — kurallar doğru ama sırası yanlış; elif merdivenini düzelt.

Her bölümde ekranda görünmeyen **sürpriz kutular** da aynı kurallardan geçer; böylece
öğrenci değerleri ezberleyemez, gerçek bir kural yazmak zorunda kalır.

Bölüm sonunda yıldız (1–3), 24 bölüm sonunda indirilebilir `.txt` öğrenci raporu vardır.
İlerleme tarayıcıda saklanır; BÖLÜMLER ekranından istenen bölüme geçilebilir.

## Kullanım

- Fareyle sürükle: kamerayı döndür · Tekerlek: yakınlaş
- Kural satırlarında işareti, değeri ve hedef sandığı seç
- `↑` `↓` ile elif sırasını değiştir · `+ elif ekle` ile satır ekle
- **BANDI ÇALIŞTIR** · `1× / 2×` hız

## Geliştirme

```bash
bun install
bun run dev     # http://127.0.0.1:5174
bun run build   # dist/
```

Statik çıktı `dist/` içindedir; harici CDN yoktur (okulda çevrimdışı çalışır).
`.github/workflows/pages.yml` hazırdır: `main` dalına push edince GitHub Pages yayınlanır.

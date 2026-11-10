# maurice-konsept

Maurice Moynihan’ın yaratıcı portfolyosunu Next.js ile yeniden oluşturan bağımsız bir konsept çalışması. Proje, ana sayfayı ve 26 alt sayfayı masaüstü ve mobil düzenleriyle birlikte kapsar.

## Deneyim

- Ana sayfada sıvı tipografi, kaydırmaya bağlı bölüm geçişleri ve imleçle üzerine gelindiğinde açılan menü kartları yer alır.
- Masaüstünde özel imleç ve sürüklenebilir yem, mobilde ise dokunmaya tepki veren koi animasyonu kullanılır. Sayfanın sonunda ASCII dokusu sualtı sahnesine açılır.
- Advertising arşivi vaka sayfalarına bağlanır. Music sayfasında parça seçimi, dalga biçimi üzerinden oynatma konumunu değiştirme ve oynatma kontrolleri bulunur.

## Yerelde çalıştırma

Node.js 20.9 veya üzeri, npm ve ilk medya indirmesi için internet bağlantısı gerekir.

```sh
git clone https://github.com/omergungor11/maurice-konsept.git
cd maurice-konsept
npm ci
npm run dev
```

Tarayıcıda [localhost:3000](http://localhost:3000/) adresini açın. Bu port doluysa terminalde yazan yerel adresi kullanın.

Üretim derlemesini yerelde aşağıdaki komutlarla çalıştırın.

```sh
npm run build
npm start
```

## Medya dosyaları

`npm run dev` ve `npm run build`, kaynak portfolyodaki 298 görsel, ses ve video dosyasını `public/assets/` altında hazırlar. Dosyalar [medya manifestindeki](reference/assets.json) SHA-256 özetleriyle doğrulanır. Sonraki çalıştırmalarda doğrulamadan geçen yerel dosyalar tekrar indirilmez.

İndirme yarıda kalırsa aşağıdaki komut eksik dosyalardan devam eder. Komut ayrıca geliştirme sunucusunu başlatmadan medyayı hazırlamak için kullanılabilir.

```sh
npm run assets:sync
```

## Sayfalar

| Adres | İçerik |
| --- | --- |
| `/` | Ana sayfa ve bölüm menüsü |
| `/advertising` | Reklam arşivi ve vaka sayfalarına bağlantılar |
| `/adnauseum` | adnauseum.ai proje sayfası |
| `/music` | Moy Moy müzik oynatıcısı |
| `/about` | Biyografi ve iletişim |
| `/unmade-w5bjflptho` | Unmade arşivi ve proje sayfaları |

Eski `.html` bağlantıları uzantısız adreslere yönlenir. Cane Toad Golf adresi, referanstaki gibi ana sayfaya döner.

## Proje yapısı

| Dizin | Görevi |
| --- | --- |
| [`app/`](app/) | Next.js App Router, ana sayfanın React bileşenleri ve alt sayfaları sunan rota işleyicisi |
| [`reference/pages/`](reference/pages/) | Alt sayfaların HTML şablonları ve sayfaya özel etkileşimleri |
| [`public/`](public/) | Ortak stiller, canvas efektleri ve yerelde hazırlanan medya |
| [`scripts/`](scripts/) | Medya indirme ve doğrulama betiği |

## Kaynak ve atıf

Referans tasarım, içerik ve medya ilgili hak sahiplerine aittir. Konsept sürümünde analitik devre dışıdır. [Referans portfolyo](https://mauricemoynihan.com/)

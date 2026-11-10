# maurice-konsept

Maurice Moynihan’ın yaratıcı portfolyosunun Next.js ile hazırlanmış bir konsept reprodüksiyonu. Ana sayfa, Advertising arşivi ve vaka sayfaları, adnauseum, Music, About ve Unmade sayfaları masaüstü ve mobil düzenleriyle birlikte yer alır. [Referans portfolyo](https://mauricemoynihan.com/)

## Yerelde çalıştırma

Node.js 20.9 veya üzeri gerekir. İlk geliştirme çalıştırması veya üretim derlemesi referans görsel, ses ve video dosyalarını indirip SHA-256 özetlerini doğrular. Sonraki çalıştırmalar yerel dosyaları kullanır.

```sh
npm ci
npm run dev
```

Tarayıcıda [localhost:3000](http://localhost:3000/) adresini açın. Üretim derlemesi için aşağıdaki komutları çalıştırın.

```sh
npm run build
npm start
```

## Proje yapısı

- `app/` ana sayfanın React bileşenlerini, Next.js App Router yapılandırmasını ve alt sayfaları sunan rota işleyicisini içerir.
- `reference/pages/` alt sayfaların HTML şablonlarını ve sayfaya özel etkileşimlerini içerir. Orijinal `.html` bağlantıları uzantısız rotalara yönlenir.
- `public/` ortak stilleri ve canvas animasyonlarını içerir. `npm run assets:sync` komutu, `reference/assets.json` listesindeki medyayı `public/assets/` klasörüne indirir.
- Masaüstünde sıvı tipografi, hover kartları, özel imleç ve sürüklenebilir yem bulunur. Mobilde koi sahnesi dokunmaya tepki verir. Her iki düzende de sayfa sonu ASCII geçişi sualtı sahnesine açılır.

Bu çalışma bağımsız bir konsepttir. Referans tasarım, içerik ve medya ilgili hak sahiplerine aittir.

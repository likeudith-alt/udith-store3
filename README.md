# UDITH STORE: site + admin panel

Meka static site ekak (`public/`) + Netlify Functions backend (`netlify/functions/`) + admin panel (`/admin`).
Data okkoma **Netlify Blobs** (Netlify eke built-in storage) wala save wenawa, ewata wenama database ekak ho account ekak oni naha.

## Admin panel eken wenas karanna puluwan deval

| Tab | Mokakda karanna puluwan |
|---|---|
| Plans & prices | Likes, Glory Bots, SENSI wage okkoma plans walata price wenas karanna, aluth plan / aluth category add karanna, hide karanna, order eka wenas karanna |
| Rare IDs | IDs add karanna (godak ekata paste karala), remove karanna, ID eka ekakata price danna, selected / filtered okkomata ekama welawe price danna, Sold kiyala hide karanna |
| Ads | Banner ho pop-up ad add karanna (image upload, text, link), on/off karanna |
| Payments | Bank / eZ Cash details, fee eka wenas karanna, aluth payment method add karanna |
| Site text | Store name, WhatsApp number, intro text, ticker, "Buy safely" boxes, FAQ |
| Backup | Backup download / restore |

## Folder structure

```
public/            website (index.html, css, js) + /admin + data/seed.json (starter data)
netlify/functions/ backend: data, login, save, upload, img
netlify/lib/       shared helpers
netlify.toml       Netlify settings
package.json       @netlify/blobs dependency
```

## Deploy kirima (GitHub + Netlify)

### 1. GitHub ekata upload karanna
1. github.com ekata gihin **New repository** ekak hadanna (eg: `udith-store`).
2. Me folder eke **okkoma files** (`public`, `netlify`, `netlify.toml`, `package.json`, `.gitignore`, `README.md`) repository ekata upload karanna (**Add file → Upload files**).
   `public` kiyana folder eka, e athule thiyena okkoma ekka, folder structure eka wenas wenne nathuwa upload wenna oni.

### 2. Netlify walin site eka hadanna
1. app.netlify.com → **Add new project → Import an existing project → GitHub** → oyage repository eka select karanna.
2. Build settings wenas karanna epa. `netlify.toml` eken ewa auto set wenawa (Publish directory = `public`, Functions = `netlify/functions`).
3. **Deploy** click karanna.

### 3. Admin password eka set karanna (WEDAGATH)
1. Netlify → oyage site → **Site configuration → Environment variables → Add a variable**.
2. Key: `ADMIN_PASSWORD`, Value: **ghana (strong) password ekak** (letters + numbers, 12+ characters).
3. (Optional, hondai) Key: `SESSION_SECRET`, Value: ahasi random text ekak.
4. **Deploys → Trigger deploy → Deploy site** karanna (env variables apply wenna oni).

### 4. Admin panel eka use karanna
1. `https://oyage-site.netlify.app/admin/` wala gihin password eken login wenna.
2. Palaweni parak login unama, original site eke data (IDs 639 ekka prices) auto load wenawa. **Save changes** click karanakota eka Netlify storage ekata save wenawa.
3. Edit karanna → **Save changes**. Site eka e muhurthe wenas wenawa (deploy ekak oni naha).

## Podi dewal danaganna

- **Prices / IDs / ads wenas karanna git ekata yanna oni naha.** Admin panel eken karama hari. Code wenas karanakota witharai GitHub push oni.
- Netlify free plan eka me site ekata hari.
- Ad image eka upload karaddi phone eken ganna photo eka auto podi karala (max 1000px) upload wenawa.
- `public/data/seed.json` kiyanne starter data. Site eka kisima data save karala nathi welawe witharai e file eka use wenne.
- Admin eke **Backup** tab eken kalin kalin backup ekak download karaganna.
- Password eka wenas karanna: Netlify env variable `ADMIN_PASSWORD` edit karala redeploy karanna.

## Computer eke test karanna (optional)

```
npm install
npx netlify-cli dev
```
Eka `http://localhost:8888` eke run wenawa. Local test ekata `.env` file ekak hadala `ADMIN_PASSWORD=test1234` danna.

## Prices eka wenas wunama cart eka mokada wenne
Customer ge cart eke thiyenne plan / ID eke key eka witharai. Checkout karaddi **dan thiyena price** eka gannawa, ewata old price ekak yana eka nae. Admin eken ain karapu items cart eken auto ain wenawa.

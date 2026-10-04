# Lab-Grown Diamond Finder: Sharjah Watch & Jewellery Show 2026

**Open the map:** https://musab0.github.io/LabGrownShops-ShjExpo/

A free, phone-friendly map of the **58th Watch & Jewellery Middle East Show** (Expo Centre Sharjah, 30 September to 4 October 2026). It shows every booth that sells **lab-grown diamonds**, so you can go straight to them.

## What you can do

- **See the real floor plan.** Booth shapes and positions come from the show's official map, drawn to scale.
- **Spot lab-grown sellers at a glance.** They are shown in green.
- **Tap any booth** to see the company, its country, and why it is marked.
- **Search** by booth number (for example `5-2540`) or company name (for example `Jama`).
- **Jump to the official Lab-Grown Zone** in Hall 5 with one tap.
- **Browse the list** under the map, grouped by hall, and tap **Show on map** to find a booth.

Works on any phone or computer browser. No app, account or sign-in.

## Where to start

Go to **Hall 5**. The official Lab-Grown Zone covers booths **5-2540 to 5-2565** and **5-2640 to 5-2660**. Khushi Jewels (5-2520) and Illustris (5-2530) sit right next to it.

## What the colours mean

| Colour on the map | Meaning |
| --- | --- |
| Dark green | **Confirmed seller.** The company says it sells lab-grown diamonds on its own website, its social media or in a trade show guide. |
| Mid green | **Listed by the show.** The exhibitor chose "lab-grown jewellery" in its official show profile, or the organiser placed it in the Lab-Grown Zone. |
| Pale green outline | **Likely seller.** The company name, website or trade records suggest lab-grown diamonds. |
| Dashed amber outline | **Worth asking.** Some hints, no confirmation. |
| Blue outline | **Diamond grading lab** (IGI, IDT). Checks and certifies stones; does not sell them. |
| Gold border | The organiser's **official Lab-Grown Zone**. |

Many jewellers sell some lab-grown pieces without advertising it, so it is always worth asking.

## Confirmed lab-grown sellers

| Booth | Company | Notes |
| --- | --- | --- |
| 5-56 | Barraq Diamonds | Lab-grown (Dazzle) and moissanite |
| 5-2520 | Khushi Jewels | |
| 5-2530 | Illustris Jewellery | |
| 5-2540 | Growe | Official zone |
| 5-2550 | Zaiyou Jewelry | Official zone |
| 5-2555 | Jama Jewels | Official zone |
| 5-2560 | GoGreen Diamonds | Grower; official zone |
| 5-2565 | Rayne Roche | CVD diamonds; official zone |
| 5-2645 | Amaraa | Official zone |
| 5-2740 | Amaar Jewels | |
| 5-2750 | Neeti Diam | |
| 5-2855 | The Green Carat | |
| 3-1545 | Pristine Jewels | Also moissanite |
| 3-1645 | Krish Diamonds & Jewellery | |
| 3-1700 | Jewel Palate (Spectrum Jewels) | Natural and lab-grown |
| 1-84 | Belgium Diamonds (Evermore) | |
| 1-85 | Al Yaasi Jewellery | Natural and lab-grown loose stones |
| 2-1 | Dani by Daniel K | Lab-grown and simulants |
| 2-225 | Dhyan Diam | Mostly natural, some lab-grown |
| 4-1015 | Selikhov Diamonds | Natural and lab-grown |
| HK-C6 | Ethereal Green Diamond | Grower (Hong Kong pavilion, Hall 3) |
| SIN-01 | Taka Jewellery | Singapore pavilion |
| SIN-02 | The Diamond Garden | Singapore pavilion |
| EP-04 | Valenza Jewellery | Emirati pavilion |

The map also shows 44 booths listed by the show, plus likely sellers and booths worth asking.

## Where the information comes from

1. **Map:** copied from the show's official interactive map (built by invisual) on 4 October 2026.
2. **Exhibitors:** from the official 58th edition catalogue.
3. **Lab-grown checks:** we opened each exhibitor's own website, and searched social media and trade show guides for diamond companies without a working site.

Information can change during the show. Always confirm what you are buying, and ask for the grading certificate, before you pay.

## Privacy and security

- No accounts, cookies, tracking, analytics or ads.
- The page makes **no network requests** after it loads, and stores nothing on your device.
- All code, fonts and data are served from this site only. No third-party scripts or CDNs.
- A strict Content Security Policy blocks inline code, outside scripts and outside connections.

See [SECURITY.md](SECURITY.md) for details and how to report a problem.

## Disclaimer

This is an independent, free guide for visitors. It is not connected to or endorsed by the show organisers, Expo Centre Sharjah, invisual or any exhibitor. Company names belong to their owners.

## For maintainers

```
site/                 The published website (served by GitHub Pages from the gh-pages branch)
  index.html          Page markup and security policy
  assets/app.js       Map and list logic (plain JavaScript, no dependencies)
  assets/data.js      Floor layout and lab-grown evidence
  assets/app.css      Styles
  assets/fonts/       Self-hosted Bodoni Moda and Jost fonts (SIL Open Font License)
  assets/gem3d.js     3D hero diamond (built from tools/gem3d, includes three.js)
tools/scrape-map.js   Playwright script that re-reads the official map in a browser
tools/gem3d/          Source for the 3D diamond; rebuild with `npm ci && npm run build`
```

To publish changes: `git subtree split --prefix site -b pages && git push -f origin pages:gh-pages`.

# Security

## Reporting a problem

Please report security issues privately through GitHub's **Report a vulnerability** button on the repository's Security tab. Do not open a public issue. Expect a reply within 5 working days.

## What this site is

A static website with no server code, no database, no user accounts and no forms. GitHub Pages serves it over HTTPS.

## Controls in place

| Area | Control |
| --- | --- |
| Content Security Policy | `default-src 'none'`; scripts, styles and fonts only from the same origin; `connect-src`, `object-src`, `frame-src`, `worker-src`, `form-action` and `base-uri` all `'none'`; `upgrade-insecure-requests`. Set with a `<meta>` tag because GitHub Pages cannot send custom headers. |
| No inline code | No inline scripts, inline styles, `eval`, `new Function`, `innerHTML` or `document.write`. |
| Third parties | None. Fonts are self-hosted. No CDNs, analytics, cookies or trackers. The page makes zero network requests after loading. |
| Output encoding | All data is written to the page with `textContent` or `setAttribute`, never parsed as HTML. |
| Links | Only `https:` links from the data are rendered (checked with the URL parser). External links use `rel="noopener noreferrer"`. |
| Referrer | `no-referrer` policy, so visitors' browsing is not leaked to linked sites. |
| Data integrity | The data object is frozen at load (`Object.freeze`). |
| Storage | Nothing is written to cookies, localStorage, sessionStorage or IndexedDB. |
| Dependencies | The website has no runtime dependencies. CodeQL scans the JavaScript and Dependabot keeps the GitHub Actions versions current. |
| Secrets | The repository contains no API keys, tokens or personal data. |

## Known platform limits

GitHub Pages cannot send these HTTP headers, so they are not set: `Strict-Transport-Security` (github.io is HSTS-preloaded anyway), `X-Frame-Options` / `frame-ancestors` (cannot be set with a meta tag), `Permissions-Policy` and `Cross-Origin-*` isolation headers. If an enterprise policy requires them, host the `site/` folder behind a CDN or server that adds the headers below:

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

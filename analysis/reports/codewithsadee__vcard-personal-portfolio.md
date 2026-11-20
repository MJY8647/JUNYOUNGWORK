# Site analysis — codewithsadee/vcard-personal-portfolio

- **Framework:** Static HTML/CSS/JS  
- **Generator/build:** none (no build step)  
- **Styling:** Hand-written CSS  
- **License:** MIT  
- **Hosting hints:** —  
- **Last commit:** 927f09a 2025-06-12

## Language mix

| Language | Files | Lines |
|---|---:|---:|
| Markdown | 1 | 44 |
| HTML | 1 | 1200 |
| CSS | 1 | 1881 |
| JavaScript | 1 | 158 |
| YAML | 1 | 3 |

Raster images: 29

## Directory map

```
assets/                            35 files
  └ images/                        33
  └ css/                            1
  └ js/                             1
(root files)                        4 files
website-demo-image/                 3 files
.github/                            1 files
```

## Routes / pages

| Route | Kind | Source |
|---|---|---|
| `/index.html` | html file | `index.html` |
| `/index.html#about` | SPA section (data-page) | `index.html` |
| `/index.html#blog` | SPA section (data-page) | `index.html` |
| `/index.html#contact` | SPA section (data-page) | `index.html` |
| `/index.html#portfolio` | SPA section (data-page) | `index.html` |
| `/index.html#resume` | SPA section (data-page) | `index.html` |

## Design tokens

**color** (12)

| Token | Value |
|---|---|
| `--jet` | `hsl(0, 0%, 22%)` |
| `--onyx` | `hsl(240, 1%, 17%)` |
| `--eerie-black-1` | `hsl(240, 2%, 13%)` |
| `--eerie-black-2` | `hsl(240, 2%, 12%)` |
| `--smoky-black` | `hsl(0, 0%, 7%)` |
| `--white-1` | `hsl(0, 0%, 100%)` |
| `--white-2` | `hsl(0, 0%, 98%)` |
| `--orange-yellow-crayola` | `hsl(45, 100%, 72%)` |
| `--vegas-gold` | `hsl(45, 54%, 58%)` |
| `--light-gray` | `hsl(0, 0%, 84%)` |
| `--light-gray-70` | `hsla(0, 0%, 84%, 0.7)` |
| `--bittersweet-shimmer` | `hsl(0, 43%, 51%)` |

**font-family** (1)

| Token | Value |
|---|---|
| `--ff-poppins` | `'Poppins', sans-serif` |

**font-weight** (4)

| Token | Value |
|---|---|
| `--fw-300` | `300` |
| `--fw-400` | `400` |
| `--fw-500` | `500` |
| `--fw-600` | `600` |

**gradient** (6)

| Token | Value |
|---|---|
| `--bg-gradient-onyx` | `linear-gradient( to bottom right, hsl(240, 1%, 25%) 3%, hsl(0, 0%, 19%) 97% )` |
| `--bg-gradient-jet` | `linear-gradient( to bottom right, hsla(240, 1%, 18%, 0.251) 0%, hsla(240, 2%, 11%, 0) 100% ), hsl(240, 2%, 13%)` |
| `--bg-gradient-yellow-1` | `linear-gradient( to bottom right, hsl(45, 100%, 71%) 0%, hsla(36, 100%, 69%, 0) 50% )` |
| `--bg-gradient-yellow-2` | `linear-gradient( 135deg, hsla(45, 100%, 71%, 0.251) 0%, hsla(35, 100%, 68%, 0) 59.86% ), hsl(240, 2%, 13%)` |
| `--border-gradient-onyx` | `linear-gradient( to bottom right, hsl(0, 0%, 25%) 0%, hsla(0, 0%, 25%, 0) 50% )` |
| `--text-gradient-yellow` | `linear-gradient( to right, hsl(45, 100%, 72%), hsl(35, 100%, 68%) )` |

**motion** (2)

| Token | Value |
|---|---|
| `--transition-1` | `0.25s ease` |
| `--transition-2` | `0.5s ease-in-out` |

**other** (1)

| Token | Value |
|---|---|
| `--scale` | `0.8` |

**shadow** (5)

| Token | Value |
|---|---|
| `--shadow-1` | `-4px 8px 24px hsla(0, 0%, 0%, 0.25)` |
| `--shadow-2` | `0 16px 30px hsla(0, 0%, 0%, 0.25)` |
| `--shadow-3` | `0 16px 40px hsla(0, 0%, 0%, 0.25)` |
| `--shadow-4` | `0 25px 50px hsla(0, 0%, 0%, 0.15)` |
| `--shadow-5` | `0 24px 80px hsla(0, 0%, 0%, 0.25)` |

**spacing/size** (9)

| Token | Value |
|---|---|
| `--fs-1` | `24px` |
| `--fs-2` | `18px` |
| `--fs-3` | `17px` |
| `--fs-4` | `16px` |
| `--fs-5` | `15px` |
| `--fs-6` | `14px` |
| `--fs-7` | `13px` |
| `--fs-8` | `11px` |
| `--ionicon-stroke-width` | `35px` |

- Google Fonts: Poppins:wght@300;400;500;600
- Tailwind `@theme` files: —
- Dark-mode rules in: —

## Client-side behaviour

- DOM events: `click`×8, `input`×1
- data-* hooks: `[data-testimonials-avatar]`, `[data-sidebar]`, `[data-sidebar-btn]`, `[data-testimonials-item]`, `[data-modal-container]`, `[data-modal-close-btn]`, `[data-overlay]`, `[data-modal-img]`, `[data-modal-title]`, `[data-modal-text]`, `[data-testimonials-title]`, `[data-testimonials-text]`, `[data-select]`, `[data-select-item]`, `[data-selecct-value]`, `[data-filter-btn]`, `[data-filter-item]`, `[data-form]`, `[data-form-input]`, `[data-form-btn]`, `[data-nav-link]`, `[data-page]`
- Browser APIs: form validation API (1 files), scroll handling (1 files)

## External resources

- Script hosts: unpkg.com×2
- Stylesheet/link hosts: fonts.googleapis.com×2, fonts.gstatic.com×1

## SEO

- In templates: —
- Generated: —

## Content & data


## Rebuild blueprint

1. Single HTML document; replicate as-is with semantic sections and one CSS + one JS file.
2. Recreate the design system first: 40 CSS custom properties → one `tokens.css` (:root).
3. Interactions are bound through data-* hooks: [data-testimonials-avatar], [data-sidebar], [data-sidebar-btn], [data-testimonials-item], [data-modal-container], [data-modal-close-btn], [data-overlay], [data-modal-img] → keep the same hook pattern.
4. Verify with headless browser screenshots at desktop (1440px) and phone (390px) widths.

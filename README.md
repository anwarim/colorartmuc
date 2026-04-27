# Color Art Munich — Website

A static portfolio website for abstract acrylic paintings, built with plain HTML/CSS/JS.
Hosted for free on GitHub Pages.

## Project Structure

```
colorartmuc/
├── index.html          # Homepage
├── gallery.html        # Full painting gallery with lightbox
├── about.html          # About the artist
├── contact.html        # Contact form (via Formspree)
├── blog.html           # Blog posts
├── impressum.html      # Legal (required in Germany)
├── datenschutz.html    # Privacy policy
├── css/
│   └── style.css       # All styles — warm earthy theme
├── js/
│   └── main.js         # Navigation, lightbox, form, scroll animations
└── images/
    └── paintings/      # Your downloaded paintings go here
```

## Setup

### 1. Add your paintings
Copy your downloaded `paintings/` folder into `images/`:
```bash
cp -r paintings/ colorartmuc/images/paintings/
```

### 2. Deploy to GitHub Pages

```bash
# Create a new GitHub repo (e.g. "colorartmuc")
git init
git add .
git commit -m "Initial site"
git remote add origin https://github.com/YOUR_USERNAME/colorartmuc.git
git push -u origin main
```

Then in GitHub → Settings → Pages → Source: **Deploy from branch: main / root**

Your site will be live at: `https://YOUR_USERNAME.github.io/colorartmuc/`

### 3. Connect your custom domain
In GitHub Pages settings, add your custom domain: `colorartmuc.com`

Then at your domain registrar (Namecheap etc.), add these DNS records:
```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   YOUR_USERNAME.github.io
```

### 4. Set up Contact Form
Go to https://formspree.io → create free account → new form
Replace `YOUR_FORM_ID` in `contact.html` with your actual form ID.

### 5. Update Impressum
Fill in your real name and address in `impressum.html` (required by German law).

## Costs After Migration

| Item            | Before (Wix) | After              |
|-----------------|-------------|---------------------|
| Hosting         | ~€140/year  | **Free** (GitHub Pages) |
| Domain          | ~€25/year   | ~€10/year (Namecheap) |
| Contact form    | included    | **Free** (Formspree) |
| **Total**       | **€165/year** | **~€10/year**     |

**Savings: ~€155/year 🎉**

## Adding New Paintings

Just add an `<div class="gallery-item">` block in `gallery.html` — the grid adapts automatically.

## Adding Blog Posts

Copy an existing `<article class="blog-card">` block in `blog.html` and update the content.
For longer posts, create a separate HTML file (e.g. `blog-post-1.html`) and link to it.

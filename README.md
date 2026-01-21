title: "Your Post Title"
categories: 
title: "Your Post Title"
description: "A short summary for SEO."

# ItalAI

ItalAI is a Jekyll-based static site dedicated to advancing AI capabilities and sharing insights. This repository contains the source code and content for the ItalAI website, including:

- Insights and blog posts
- Roadmap and vision
- Team and principles
- Capabilities and revolution cards

---

## Project Structure

- `_posts/` — Blog posts and insights (Markdown)
- `_data/` — Structured YAML data (capabilities, people, principles, etc.)
- `_includes/` — HTML partials for layouts
- `_layouts/` — Page and post layouts
- `_sass/` — SCSS partials for styling
- `assets/` — Images, JavaScript, and CSS
- `scripts/` — Utility scripts
- `_plugins/` — Custom Jekyll plugins

---

## YAML Data Files (`_data/`)

- **capabilities.yml**: Used in `work.html` — lists core capabilities or features
- **people.yml**: Used in `about.html` — team members or contributors
- **principles.yml**: Used in `index.html` — guiding principles or values
- **revolution_cards.yml**: Used in `index.html` — homepage "revolution cards"
- **roadmap_vision_cards.yml**: Used in `roadmap.html` — vision and roadmap items

Edit these files to update site content without changing HTML.

---

## Creating a Blog Post

Example front matter for a new post:

```yaml
---
title: "Your Post Title"
categories:
  - category1
  - category2
---
```

See the "mamba" series and blogging.md in `_posts/` for examples.

---

## SEO and Meta Descriptions

Set a meta description for SEO in the front matter:

```yaml
---
title: "Your Post Title"
description: "A short summary for SEO."
---
```

The default meta description is set in `_config.yaml`. Add a `description` field to override it per post or page.

---

## Plugins (`_plugins/`)

- **webp_converter.rb**: Enforces WebP-only images in production
- **vips_webp_generator.rb**: Generates WebP images locally (may fail on GitHub Actions; ignored for deployment)
- **insights_manifest.rb**: Generates manifest for insights content
- **lazy_load_images.rb**: Adds `loading="lazy"` to images
- **remove_empty_lines.rb**: Cleans up empty lines in generated HTML

---

## Running Locally

1. **Install Ruby** (3.3.8 recommended)
2. Run `bundle install` to install dependencies
3. Start the development server:
   ```sh
   bundle exec jekyll serve --host 0.0.0.0 --port 4000 --livereload
   ```
   The `--livereload` flag enables automatic reloads on file changes for fast development.
4. Open [http://localhost:4000](http://localhost:4000) in your browser.

---

## Best Practices & Notes

- **Image formats:** Only WebP images are published; legacy formats are excluded by `_config.yaml`.
- **SEO:** Use front matter or `_config.yaml` for meta descriptions.
- **Plugin configuration:** See `_config.yaml` for options.
- **Dynamic insights/blogs:** The insights manifest plugin enables paginated, filterable blog/insight loading.
- **Performance:** Plugins like `remove_empty_lines.rb` and `lazy_load_images.rb` optimize client load and rendering.
- **Development:** Use `--livereload` for a fast feedback loop.
- **Deployment:** Some plugins (notably `vips_webp_generator.rb`) may not work on GitHub Actions due to system library constraints. This does not affect the published site, as only WebP assets are shipped.

For more, see the [Jekyll documentation](https://jekyllrb.com/docs/).
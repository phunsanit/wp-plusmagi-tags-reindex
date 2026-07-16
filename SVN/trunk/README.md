# PlusMagi Tags Reindex

A WordPress plugin for fast tag operations with selectable ID behavior.

## What It Does

PlusMagi Tags Reindex helps editors create and manage post tags using two ID strategies:

1. Reuse missing term_id gaps.
2. Use normal WordPress auto-increment IDs.

The mode can be configured in Tools > Tags Reindex and also used when adding tags from the custom Gutenberg panel.

## Features

- Selectable ID mode: gap fill or auto-increment.
- Bulk JSON tag import in Tools > Tags Reindex.
- Custom Gutenberg tags panel replacing the default post_tag panel.
- Real-time stats for selected tags.
- Comma-separated quick input for batch add.
- REST add-tag endpoint protected by manage_categories capability.

## Installation

1. Build or download `plusmagi-tags-reindex.zip`.
2. Upload the zip in WordPress Plugins.
3. Activate the plugin.
4. Open Tools > Tags Reindex and choose your ID mode.

## Build

```bash
./build.sh
```

Artifacts are created in:

- `wp-assets/plusmagi-tags-reindex-<version>.zip`
- `Website/build/plusmagi-tags-reindex-latest.zip`

## Testing

Run Playwright tests from the project root:

```bash
npm run test:admin
```

For setup only:

```bash
npm run test:setup
```

## Changelog

### 1.0.0

- Initial release of PlusMagi Tags Reindex.
- Added selectable ID mode.
- Added JSON import tools page.
- Added custom Gutenberg tags panel with stats.
- Added protected REST add-tag endpoint.

# PlusMagi Tags Reindex

A WordPress plugin that inserts new tags by automatically filling gaps in term IDs (Reindexing unused term_id).

## Features

- **Automatic Gap Filling**: Finds the lowest available unused `term_id` and reuses it for new tags.
- **Real-time Reindexing**: Uses WPDB to safely insert terms and taxonomies without auto-increment jumps.
- **Custom Editor Panel**: Replaces the default Gutenberg tags panel with a custom sidebar.
- **Usage Statistics**: Displays real-time tag usage in the current post and overall publish stats.

## Installation

1. Download the latest release from the `wp-assets/` directory or build it yourself.
2. Upload `plusmagi-tags-reindex.zip` to your WordPress plugins page.
3. Activate the plugin.
4. Go to Tools > Tags Reindex to paste JSON array of tags, or edit any post to use the custom Tags panel.

## Build Instructions

To build the plugin zip file:

```bash
./build.sh
```

The output files are created at:

- `wp-assets/plusmagi-tags-reindex-<version>.zip`
- `Website/build/plusmagi-tags-reindex-latest.zip`

## Testing

End-to-end tests run against the target WordPress site using [Playwright](https://playwright.dev/).
Primary plugin-related tests are located in:

- `Playwright/tests/tags-reindex.spec.js`
- `Playwright/tests/block-tags.spec.js`
- `Playwright/tests/reindex-option.spec.js`

### Setup (first time only)

```bash
cd Playwright
npm install
npx playwright install chromium firefox webkit
```

### Daily use

```bash
# Run all tests — Chromium, Firefox, Safari in parallel
npm test
```

### Debug a specific browser

```bash
npm run test:chromium	 # Chrome / Edge
npm run test:firefox		# Firefox
npm run test:safari		 # Safari (WebKit)
```

### When a test fails

```bash
# 1. Open the HTML report to see screenshots and error details
npm run report

# 2. If still unclear, step through tests visually
npm run test:ui
```

### Test coverage

| Area | What is tested |
|------|---------------|
| Admin Tools | Tools page renders and validates JSON import workflow |
| Gutenberg Panel | Custom Tags panel add/remove behavior and comma split |
| Reindex Option | Toggle on/off behavior for gap fill mode |
| Auth Setup | Admin login and storage state generation |


## Usage

Use the plugin in these two main flows:

```
Tools > Tags Reindex (JSON import)
Post Editor > Tags (Custom panel)
```

## Security & User Roles

Tag creation through REST is protected by capability checks:

- `manage_categories` is required for `plusmagi-tags/v1/add-tag`.
- Admin form processing is protected with nonce + `manage_options`.

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

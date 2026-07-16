# PlusMagi Tags Reindex

[![WordPress Plugin](https://img.shields.io/badge/WordPress-Plugin-blue.svg)](https://wordpress.org/plugins/plusmagi-tags-reindex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**PlusMagi Tags Reindex** is a WordPress plugin designed to help site administrators and editors manage post tags efficiently, especially on content-heavy websites.

---

## 🌟 Key Features

### 1. Smart Tag ID Gap Filler
- Recycles unused `term_id` gaps left by deleted tags
- Includes duplicate ID protection and database transactions for safety
- Toggle between gap-fill mode and WordPress default auto-increment

### 2. Enhanced Gutenberg Tags Panel
- Replaces the default tags box
- Supports comma-separated bulk input
- Real-time statistics (Total, Published, Draft)
- Easy tag removal with one click

### 3. Bulk Import Tool
- JSON-based bulk tag creation from Tools > Tags Reindex

---

## 🛠️ Installation

1. Download the latest release ZIP file
2. Go to **Plugins > Add New > Upload Plugin** in your WordPress dashboard
3. Upload and activate the plugin
4. Navigate to **Tools > Tags Reindex** to configure settings

---

## 🚀 How to Use

### Tools Page (Admin)
- Go to **Tools > Tags Reindex**
- Enable/Disable gap filling mode
- Paste JSON array of tags for bulk import

### In Post Editor
- The default tags panel is replaced automatically
- Type tags and press **Enter** or use commas
- Toggle Reindex mode directly in the sidebar

---

## ⚠️ Important Notes

- **Gap Fill Mode** modifies `term_id` directly. Always backup your database before heavy use.
- The plugin is safe thanks to transactions and duplicate protection, but testing on staging is recommended for large sites.

---

## 🔒 Security

- REST endpoints are properly protected with capability checks
- Uses prepared SQL statements
- Nonce protection on admin forms

---

## Changelog

**1.0.0** (Initial Release)
- Smart gap filling with safety features
- Custom Gutenberg panel with real-time stats
- Bulk import support
- Full i18n (multilingual) support
- Improved code quality and English comments

---

## License

MIT License. See LICENSE file for details.

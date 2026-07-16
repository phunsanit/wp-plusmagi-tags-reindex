=== PlusMagi Tags Reindex ===
Contributors: phunsanit
Tags: tags, taxonomy, term id, reindex, gutenberg
Requires at least: 6.0
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: plusmagi-tags-reindex

Insert and manage post tags with selectable ID strategy: fill missing term_id gaps or use normal WordPress auto-increment.

== Description ==

PlusMagi Tags Reindex is a WordPress plugin for teams that manage many tags and need tighter control over tag creation.

It includes two important modes:

* Fill missing term_id gaps (reindex mode).
* Use default WordPress auto-increment IDs.

You can toggle this behavior in Tools > Tags Reindex, and the same mode can be used inside the custom Gutenberg tags panel.

== Features ==

* Selectable ID strategy (gap fill or auto-increment).
* Bulk JSON tag import from Tools > Tags Reindex.
* Custom Gutenberg tags panel replacing the default post_tag panel.
* Real-time tag stats (all, published, scheduled, draft).
* Batch add tags using comma-separated input.
* REST endpoint protection for add-tag with manage_categories capability.

== Installation ==

1. Upload the plugin to `/wp-content/plugins/` or install the zip from your build output.
2. Activate the plugin in WordPress admin.
3. Open `Tools > Tags Reindex` and configure your preferred ID mode.
4. Use the JSON importer or the Gutenberg custom panel to add tags.

== Frequently Asked Questions ==

= Will this always fill term_id gaps? =

No. You can enable or disable gap filling from plugin settings.

= Can I keep default WordPress ID behavior? =

Yes. Disable gap-fill mode and the plugin will create tags via WordPress auto-increment.

= Who can create tags via REST add-tag? =

Users must have `manage_categories` capability.

== Changelog ==

= 1.0.0 =
* Initial public release of PlusMagi Tags Reindex.
* Added selectable ID mode (gap fill or default auto-increment).
* Added Tools page for JSON tag import.
* Added custom Gutenberg tags panel with stats and quick tag actions.
* Added protected REST endpoint for tag creation (`manage_categories`).

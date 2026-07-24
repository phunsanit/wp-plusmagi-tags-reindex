=== PlusMagi Tags Reindex ===
Contributors: phunsanit
Tags: tags, reindex, database, gutenberg, bulk import
Requires at least: 6.0
Tested up to: 7.0
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Development: https://github.com/phunsanit/wp-plusmagi-tags-reindex

Intelligently manage post tags, recycle unused term IDs safely, and enhance the Gutenberg tags panel.

== Description ==

PlusMagi Tags Reindex is a WordPress plugin that helps manage post tags efficiently.
It offers two modes: normal WordPress auto-increment and smart gap filling for term_id.

== Features ==

* Smart gap filling for term_id (with duplicate protection)
* Custom Gutenberg tags panel with real-time statistics
* Bulk tag import via JSON
* Toggle between gap fill and normal mode
* Transaction safety for database operations

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/plusmagi-tags-reindex` directory
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Go to Tools > Tags Reindex to configure settings

== Frequently Asked Questions ==

= Is gap filling safe? =

Yes. The plugin uses database transactions and duplicate ID protection.
However, we recommend testing on a staging site first.

= Can I switch modes anytime? =

Yes, you can toggle between gap fill mode and normal mode at any time.

== Changelog ==

= 1.0.0 =
* Initial public release
* Smart gap filling with duplicate ID protection and transactions
* Enhanced custom Gutenberg tags panel
* Bulk JSON import tool
* Full English i18n support
* Improved security and error handling

== Upgrade Notice ==

= 1.0.0 =
Initial version. Please backup your database before use.

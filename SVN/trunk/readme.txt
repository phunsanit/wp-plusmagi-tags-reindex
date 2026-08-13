=== PlusMagi Tags Reindex ===
Contributors: phunsanit
Tags: tags, reindex, database, gutenberg, bulk import
Requires at least: 6.0
Requires PHP: 7.4
Tested up to: 7.0.4
Stable tag: 1.0.0
Development: https://github.com/phunsanit/wp-plusmagi-tags-reindex
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Manage and reindex post tags safely, with optional term_id gap filling and a custom Gutenberg tag panel.

== Description ==

PlusMagi Tags Reindex is a WordPress plugin that helps manage post tags efficiently.
It offers two modes: normal WordPress auto-increment and smart gap filling for term_id.
Bulk tag import accepts comma-separated or line-separated plain text input.

== Features ==

* Smart gap filling for term_id (with duplicate protection)
* Custom Gutenberg tags panel with real-time statistics
* Bulk tag import via comma-separated or line-separated input
* Toggle between gap fill and normal mode
* Transaction safety for database operations

== Screenshots ==

1. The settings page shows the gap filling toggle and bulk import tools.
2. The Gutenberg sidebar replaces the default tags box with live tag controls.
3. The tag summary panel helps review counts and newly added terms quickly.

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
* Bulk tag import via comma-separated or line-separated input
* Full English i18n support
* Improved security and error handling

== Upgrade Notice ==

= 1.0.0 =
Initial version. Please backup your database before use.

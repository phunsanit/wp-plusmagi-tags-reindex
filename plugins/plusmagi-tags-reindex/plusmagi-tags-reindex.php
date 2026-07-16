<?php
/**
 * Plugin Name: PlusMagi Tags Reindex
 * Description: Extends Gutenberg Tag Panel functionality for dynamic database-driven tag rendering.
 * Version: 1.0.1
 * Author: PlusMagi
 * Text Domain: plusmagi-tags-reindex
 */

defined( 'ABSPATH' ) || exit;

define( 'PLUSMAGI_TAGS_VERSION', '1.0.1' );

/**
 * Enqueue editor assets for the custom tags panel.
 */
function plusmagi_enqueue_scripts() {
    $script_path = plugin_dir_path( __FILE__ ) . 'js/tag-editor.js';
    $script_url  = plugins_url( 'js/tag-editor.js', __FILE__ );

    wp_register_script(
        'plusmagi-tag-editor',
        $script_url,
        array( 'wp-components', 'wp-data', 'wp-edit-post', 'wp-element', 'wp-i18n', 'wp-plugins', 'wp-dom-ready' ),
        file_exists( $script_path ) ? filemtime( $script_path ) : PLUSMAGI_TAGS_VERSION,
        true
    );

    wp_enqueue_script( 'plusmagi-tag-editor' );
}
add_action( 'enqueue_block_editor_assets', 'plusmagi_enqueue_scripts' );

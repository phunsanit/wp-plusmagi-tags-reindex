<?php
/**
 * Plugin Name: PlusMagi Tags Reindex
 * Plugin URI: https://plusmagi-tags-reindex.plusmagi.com
 * Description: Manage and reindex post tags safely. Missing term_id gaps will be recycled when enabled.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Pitt Phunsanit
 * Author URI: https://pitt.plusmagi.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: plusmagi-tags-reindex
 *
 * @package PlusMagi_Tags_Reindex
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PLUSMAGI_TAGS_REINDEX_VERSION', '1.0.0' );
define( 'PLUSMAGI_TAGS_REINDEX_PATH', plugin_dir_path( __FILE__ ) );
define( 'PLUSMAGI_TAGS_REINDEX_URL', plugin_dir_url( __FILE__ ) );

/**
 * Main Admin Settings Class
 */
class PlusMagi_Tags_Reindex_Admin {
	private $editor_assets_enqueued = false;

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_editor_assets_from_admin' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), array( $this, 'add_plugin_action_links' ) );
	}

	public function add_plugin_action_links( $links ) {
		$settings_url = admin_url( 'tools.php?page=plusmagi-tags-reindex' );
		$settings_link = '<a href="' . esc_url( $settings_url ) . '">' . esc_html__( 'Settings', 'plusmagi-tags-reindex' ) . '</a>';

		array_unshift( $links, $settings_link );
		return $links;
	}

	public function enqueue_editor_assets_from_admin( $hook_suffix ) {
		if ( ! in_array( $hook_suffix, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		$this->enqueue_editor_assets();
	}

	public function register_admin_menu() {
		add_submenu_page(
			'tools.php',
			__( 'PlusMagi Tags Reindex', 'plusmagi-tags-reindex' ),
			__( 'Tags Reindex', 'plusmagi-tags-reindex' ),
			'manage_options',
			'plusmagi-tags-reindex',
			array( $this, 'render_settings_page' )
		);

		add_options_page(
			__( 'PlusMagi Tags Reindex', 'plusmagi-tags-reindex' ),
			__( 'Tags Reindex', 'plusmagi-tags-reindex' ),
			'manage_options',
			'plusmagi-tags-reindex',
			array( $this, 'render_settings_page' )
		);
	}

	public function enqueue_admin_assets( $hook_suffix ) {
		if ( 'tools_page_plusmagi-tags-reindex' !== $hook_suffix ) {
			return;
		}

		wp_enqueue_style(
			'plusmagi-tags-reindex-admin',
			PLUSMAGI_TAGS_REINDEX_URL . 'css/plusmagi-tags-reindex.css',
			array(),
			PLUSMAGI_TAGS_REINDEX_VERSION
		);
	}

	public function enqueue_editor_assets() {
		if ( $this->editor_assets_enqueued ) {
			return;
		}

		$this->editor_assets_enqueued = true;

		$asset_path = PLUSMAGI_TAGS_REINDEX_PATH . 'js/block.asset.php';
		$asset = file_exists( $asset_path ) ? require $asset_path : array();

		$dependencies = isset( $asset['dependencies'] ) && is_array( $asset['dependencies'] )
			? $asset['dependencies']
			: array( 'wp-element', 'wp-i18n', 'wp-components', 'wp-edit-post', 'wp-plugins', 'wp-data', 'wp-api-fetch' );

		$dependencies = array_values(
			array_filter(
				$dependencies,
				static function ( $dep ) {
					return ! in_array( $dep, array( 'wp-edit-post', 'wp-editor' ), true );
				}
			)
		);

		if ( wp_script_is( 'wp-edit-post', 'registered' ) ) {
			$dependencies[] = 'wp-edit-post';
		} elseif ( wp_script_is( 'wp-editor', 'registered' ) ) {
			$dependencies[] = 'wp-editor';
		}

		$version = isset( $asset['version'] ) ? $asset['version'] : PLUSMAGI_TAGS_REINDEX_VERSION;

		wp_enqueue_script(
			'plusmagi-tags-reindex-editor',
			PLUSMAGI_TAGS_REINDEX_URL . 'js/plusmagi-tags-reindex.js',
			$dependencies,
			$version,
			true
		);

		wp_enqueue_style(
			'plusmagi-tags-reindex-editor',
			PLUSMAGI_TAGS_REINDEX_URL . 'css/plusmagi-tags-reindex.css',
			array(),
			$version
		);

		wp_add_inline_script(
			'plusmagi-tags-reindex-editor',
			'window.plusmagiTagsEditorConfig = ' . wp_json_encode(
				array(
					'statusLabels' => array(
						'all' => __( 'All', 'plusmagi-tags-reindex' ),
						'publish' => __( 'Published', 'plusmagi-tags-reindex' ),
						'future' => __( 'Scheduled', 'plusmagi-tags-reindex' ),
						'draft' => __( 'Draft', 'plusmagi-tags-reindex' ),
					),
					'reindexEnabled' => (bool) get_option( 'plusmagi_tags_reindex_enabled', 1 ),
				)
			) . ';',
			'before'
		);
	}

	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$notice_message = '';
		$notice_type = 'success';

		// 1. Handle Save Settings Action.
		if ( isset( $_POST['plusmagi_tags_save_settings'] ) && check_admin_referer( 'plusmagi_tags_settings_nonce' ) ) {
			$enable_gap_fill = isset( $_POST['enable_gap_fill'] ) ? 1 : 0;
			update_option( 'plusmagi_tags_reindex_enabled', $enable_gap_fill );

			if ( $enable_gap_fill ) {
				$notice_message = __( 'Gap filling enabled. Missing term_id gaps will now be reused for new tags.', 'plusmagi-tags-reindex' );
			} else {
				$notice_message = __( 'Gap filling disabled. New tags will use WordPress default auto-increment ID.', 'plusmagi-tags-reindex' );
			}
		}

		// 2. Handle Import Tags Action.
		if ( isset( $_POST['plusmagi_tags_import_submit'] ) && check_admin_referer( 'plusmagi_tags_import_nonce' ) ) {
			$raw_tags_list = isset( $_POST['plusmagi_tags_import_list'] ) ? sanitize_textarea_field( wp_unslash( $_POST['plusmagi_tags_import_list'] ) ) : '';

			if ( ! empty( $raw_tags_list ) ) {
				$import_result = $this->import_tags_with_summary( $raw_tags_list );

				$notice_message = sprintf(
					/* translators: 1: Number of inserted tags, 2: Total processed tags, 3: Number of skipped/existing tags. */
					__( 'Successfully inserted %1$d new tag(s) (Total processed: %2$d, Skipped/Existing: %3$d).', 'plusmagi-tags-reindex' ),
					$import_result['inserted'],
					$import_result['total'],
					$import_result['skipped']
				);
			}
		}

		// 3. Handle Fix Conflicting Slugs Action.
		if ( isset( $_POST['plusmagi_tags_fix_slugs'] ) && check_admin_referer( 'plusmagi_tags_fix_slugs_nonce' ) ) {
			$fixed_result = $this->fix_conflicting_term_slugs();

			if ( $fixed_result['count'] > 0 ) {
				$notice_message = sprintf(
					/* translators: 1: Number of fixed tags, 2: Comma-separated list of fixed slugs. */
					__( 'Successfully fixed %1$d conflicting tag slug(s): %2$s.', 'plusmagi-tags-reindex' ),
					$fixed_result['count'],
					implode( ', ', $fixed_result['fixed_slugs'] )
				);
			} else {
				$notice_message = __( 'Successfully fixed 0 conflicting tag slug(s).', 'plusmagi-tags-reindex' );
			}
		}

		$is_gap_fill_active = get_option( 'plusmagi_tags_reindex_enabled', 1 );
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'PlusMagi Tags Reindex Settings', 'plusmagi-tags-reindex' ); ?></h1>

			<?php if ( ! empty( $notice_message ) ) : ?>
				<div class="notice notice-<?php echo esc_attr( $notice_type ); ?> is-dismissible">
					<p><?php echo esc_html( $notice_message ); ?></p>
				</div>
			<?php endif; ?>

			<p class="description">
				<?php esc_html_e( 'Manage and reindex post tags safely. Missing term_id gaps will be recycled when enabled.', 'plusmagi-tags-reindex' ); ?>
			</p>

			<form method="post" action="" style="margin-top: 20px;">
				<?php wp_nonce_field( 'plusmagi_tags_settings_nonce' ); ?>
				<table class="form-table" role="presentation">
					<tbody>
						<tr>
							<th scope="row"><?php esc_html_e( 'ID Mode', 'plusmagi-tags-reindex' ); ?></th>
							<td>
								<fieldset>
									<label for="enable_gap_fill">
										<input name="enable_gap_fill" type="checkbox" id="enable_gap_fill" value="1" <?php checked( $is_gap_fill_active, 1 ); ?> />
										<?php esc_html_e( 'Enable Gap Filling (Reuse missing term_id)', 'plusmagi-tags-reindex' ); ?>
									</label>
									<p class="description">
										<?php esc_html_e( 'When disabled, new tags use WordPress default auto-increment.', 'plusmagi-tags-reindex' ); ?>
									</p>
								</fieldset>
							</td>
						</tr>
					</tbody>
				</table>
				<?php submit_button( __( 'Save Settings', 'plusmagi-tags-reindex' ), 'primary', 'plusmagi_tags_save_settings' ); ?>
			</form>

			<hr />

			<h2><?php esc_html_e( 'Import / Add Tags', 'plusmagi-tags-reindex' ); ?></h2>
			<form method="post" action="">
				<?php wp_nonce_field( 'plusmagi_tags_import_nonce' ); ?>
				<table class="form-table" role="presentation">
					<tbody>
						<tr>
							<th scope="row">
								<label for="plusmagi_tags_import_list"><?php esc_html_e( 'Tags List', 'plusmagi-tags-reindex' ); ?></label>
							</th>
							<td>
								<textarea name="plusmagi_tags_import_list" id="plusmagi_tags_import_list" rows="6" class="large-text code" placeholder="Tag 1, Tag 2, Tag 3..."></textarea>
								<p class="description"><?php esc_html_e( 'Enter tags separated by commas or new lines.', 'plusmagi-tags-reindex' ); ?></p>
							</td>
						</tr>
					</tbody>
				</table>
				<?php submit_button( __( 'Import Tags', 'plusmagi-tags-reindex' ), 'button-primary', 'plusmagi_tags_import_submit' ); ?>
			</form>

			<hr />

			<h2><?php esc_html_e( 'Maintenance', 'plusmagi-tags-reindex' ); ?></h2>
			<form method="post" action="">
				<?php wp_nonce_field( 'plusmagi_tags_fix_slugs_nonce' ); ?>
				<p>
					<?php submit_button( __( 'Fix Conflicting Term Slugs', 'plusmagi-tags-reindex' ), 'secondary', 'plusmagi_tags_fix_slugs', false ); ?>
				</p>
			</form>
		</div>
		<?php
	}

	private function import_tags_with_summary( $raw_input ) {
		$tags_array = preg_split( '/[\r\n,]+/', $raw_input );
		$tags_array = array_filter( array_map( 'trim', $tags_array ) );

		$total_count = count( $tags_array );
		$inserted_count = 0;
		$skipped_count = 0;

		$reindex_enabled = (bool) get_option( 'plusmagi_tags_reindex_enabled', 1 );

		foreach ( $tags_array as $tag_name ) {
			if ( empty( $tag_name ) ) {
				continue;
			}

			$existing_term = get_term_by( 'name', $tag_name, 'post_tag' );
			if ( $existing_term ) {
				$skipped_count++;
				continue;
			}

			$inserted_term_id = $this->insert_tag_with_gap_filling( $tag_name, $reindex_enabled );
			if ( $inserted_term_id ) {
				$inserted_count++;
			} else {
				$skipped_count++;
			}
		}

		return array(
			'total' => $total_count,
			'inserted' => $inserted_count,
			'skipped' => $skipped_count,
		);
	}

	private function insert_tag_with_gap_filling( $tag_name, $reuse_gaps ) {
		if ( $reuse_gaps ) {
			$api = new PlusMagi_Tags_Reindex_REST_API();
			return $api->insert_tag_reusing_gap( $tag_name );
		}

		$result = wp_insert_term( $tag_name, 'post_tag' );
		if ( ! is_wp_error( $result ) ) {
			return $result['term_id'];
		}
		return false;
	}

	private function fix_conflicting_term_slugs() {
		global $wpdb;

		$fixed_slugs = array();

		// This maintenance operation must query terms directly to detect slug conflicts efficiently.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$conflicting_terms = $wpdb->get_results(
			"SELECT t.term_id, t.name, t.slug
			FROM {$wpdb->terms} t
			INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
			WHERE tt.taxonomy = 'post_tag' AND t.slug LIKE '%-2'"
		);

		if ( ! empty( $conflicting_terms ) ) {
			foreach ( $conflicting_terms as $term ) {
				$new_slug = sanitize_title( $term->name );
				if ( $new_slug !== $term->slug ) {
					// Updating selected rows in wp_terms is required to normalize conflicting slugs.
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
					$wpdb->update(
						$wpdb->terms,
						array( 'slug' => $new_slug ),
						array( 'term_id' => $term->term_id )
					);
					clean_term_cache( $term->term_id, 'post_tag' );
					$fixed_slugs[] = $term->slug;
				}
			}
		}

		return array(
			'count' => count( $fixed_slugs ),
			'fixed_slugs' => $fixed_slugs,
		);
	}
}

/**
 * REST API Endpoints Class
 */
class PlusMagi_Tags_Reindex_REST_API {
	private const GAP_CACHE_KEY = 'plusmagi_tags_next_gap_id';
	private const GAP_CACHE_TTL = 30;
	private static $hooks_registered = false;

	public function __construct() {
		if ( self::$hooks_registered ) {
			return;
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'created_term', array( $this, 'delete_gap_cache' ) );
		add_action( 'delete_term', array( $this, 'delete_gap_cache' ) );

		self::$hooks_registered = true;
	}

	public function delete_gap_cache( ...$args ) {
		delete_transient( self::GAP_CACHE_KEY );
	}

	public function register_routes() {
		register_rest_route(
			'plusmagi-tags/v1',
			'/terms-with-stats',
			array(
				'methods' => 'GET',
				'callback' => array( $this, 'get_terms_with_stats' ),
				'permission_callback' => array( $this, 'permissions_check_stats' ),
			)
		);

		register_rest_route(
			'plusmagi-tags/v1',
			'/add-tag',
			array(
				'methods' => 'POST',
				'callback' => array( $this, 'add_reindexed_tag' ),
				'permission_callback' => array( $this, 'permissions_check_add_tag' ),
			)
		);
	}

	/**
	 * Permission check for viewing stats (requires category management & editing other posts).
	 */
	public function permissions_check_stats() {
		return current_user_can( 'manage_categories' ) && current_user_can( 'edit_posts' ) && current_user_can( 'edit_others_posts' );
	}

	/**
	 * Permission check for adding tags (requires category management & post editing capabilities).
	 */
	public function permissions_check_add_tag() {
		return current_user_can( 'manage_categories' ) && current_user_can( 'edit_posts' );
	}

	public function get_terms_with_stats( WP_REST_Request $request ) {
		$raw_ids = $request->get_param( 'ids' );

		if ( empty( $raw_ids ) ) {
			return rest_ensure_response( array() );
		}

		$term_ids = array_filter( array_map( 'absint', explode( ',', $raw_ids ) ) );

		if ( empty( $term_ids ) ) {
			return rest_ensure_response( array() );
		}

		$stats_list = array();

		foreach ( $term_ids as $term_id ) {
			$term = get_term( $term_id, 'post_tag' );
			if ( ! $term || is_wp_error( $term ) ) {
				continue;
			}

			$stats_list[] = array(
				'id' => (int) $term->term_id,
				'name' => html_entity_decode( $term->name, ENT_QUOTES, 'UTF-8' ),
				'all' => (int) $term->count,
				'published' => $this->get_term_post_count_by_status( $term->term_id, 'publish' ),
				'draft' => $this->get_term_post_count_by_status( $term->term_id, 'draft' ),
				'future' => $this->get_term_post_count_by_status( $term->term_id, 'future' ),
			);
		}

		return rest_ensure_response( $stats_list );
	}

	public function add_reindexed_tag( WP_REST_Request $request ) {
		$raw_name = $request->get_param( 'name' );
		$reuse_gaps = (bool) $request->get_param( 'reindex_gaps' );

		if ( empty( $raw_name ) ) {
			return new WP_Error( 'invalid_name', __( 'Tag name cannot be empty.', 'plusmagi-tags-reindex' ), array( 'status' => 400 ) );
		}

		$names = array_filter( array_map( 'trim', explode( ',', $raw_name ) ) );
		$created_terms = array();

		foreach ( $names as $name ) {
			$existing = get_term_by( 'name', $name, 'post_tag' );
			if ( $existing ) {
				$created_terms[] = array(
					'id' => (int) $existing->term_id,
					'name' => html_entity_decode( $existing->name, ENT_QUOTES, 'UTF-8' ),
				);
				continue;
			}

			if ( $reuse_gaps ) {
				$new_id = $this->insert_tag_reusing_gap( $name );
			} else {
				$result = wp_insert_term( $name, 'post_tag' );
				$new_id = ( ! is_wp_error( $result ) ) ? $result['term_id'] : false;
			}

			if ( $new_id ) {
				$term_obj = get_term( $new_id, 'post_tag' );
				$created_terms[] = array(
					'id' => (int) $new_id,
					'name' => $term_obj ? html_entity_decode( $term_obj->name, ENT_QUOTES, 'UTF-8' ) : $name,
				);
			}
		}

		return rest_ensure_response( array(
			'ids' => array_column( $created_terms, 'id' ),
			'terms' => $created_terms,
		) );
	}

	private function get_term_post_count_by_status( $term_id, $status = 'publish' ) {
		global $wpdb;

		// This query computes per-status tag counts that are not available from core term counters.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(p.ID)
				FROM {$wpdb->posts} p
				INNER JOIN {$wpdb->term_relationships} tr ON p.ID = tr.object_id
				INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
				WHERE tt.term_id = %d
				AND tt.taxonomy = 'post_tag'
				AND p.post_status = %s",
				$term_id,
				$status
			)
		);

		return absint( $count );
	}

	private function get_cached_gap_id() {
		$cached_gap_id = get_transient( self::GAP_CACHE_KEY );
		if ( false !== $cached_gap_id ) {
			return absint( $cached_gap_id );
		}

		global $wpdb;

		// Find the lowest gap ID starting from 1.
		// This query is required to discover reusable term_id gaps before insertion.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$gap_id = $wpdb->get_var(
			"SELECT MIN(t1.term_id + 1) AS gap_id
			FROM {$wpdb->terms} t1
			LEFT JOIN {$wpdb->terms} t2 ON t1.term_id + 1 = t2.term_id
			WHERE t2.term_id IS NULL AND t1.term_id > 0"
		);

		$gap_id = absint( $gap_id );
		if ( 0 === $gap_id ) {
			// Reads smallest existing term_id to handle empty-leading gaps.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$min_existing = $wpdb->get_var( "SELECT MIN(term_id) FROM {$wpdb->terms}" );
			if ( $min_existing && $min_existing > 1 ) {
				$gap_id = 1;
			} else {
				// Fallback start point when no gap is returned from the initial query.
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				$max_existing = $wpdb->get_var( "SELECT MAX(term_id) FROM {$wpdb->terms}" );
				$gap_id = absint( $max_existing ) + 1;
			}
		}

		set_transient( self::GAP_CACHE_KEY, $gap_id, self::GAP_CACHE_TTL );

		return $gap_id;
	}

	public function insert_tag_reusing_gap( $name ) {
		$gap_id = $this->get_cached_gap_id();
		$gap_id = $this->find_next_available_reindex_id( $gap_id );

		$slug = sanitize_title( $name );
		if ( '' === $slug ) {
			$slug = sanitize_title( 'tag-' . wp_generate_password( 6, false, false ) );
		}

		$term_for_slug = (object) array(
			'taxonomy' => 'post_tag',
			'parent' => 0,
		);
		$slug = wp_unique_term_slug( $slug, $term_for_slug );

		if ( $gap_id > 0 ) {
			$inserted_gap_id = $this->try_insert_tag_with_aligned_id( $name, $slug, $gap_id, 25 );
			if ( $inserted_gap_id ) {
				$this->delete_gap_cache();
				return $inserted_gap_id;
			}
		}

		// Keep aligned-ID behavior even when gap attempts fail to avoid term_id/term_taxonomy_id divergence.
		$fallback_start_id = $this->get_aligned_reindex_fallback_start_id();
		if ( $fallback_start_id > 0 ) {
			$inserted_fallback_id = $this->try_insert_tag_with_aligned_id( $name, $slug, $fallback_start_id, 25 );
			if ( $inserted_fallback_id ) {
				$this->delete_gap_cache();
				return $inserted_fallback_id;
			}
		}

		return false;
	}

	private function try_insert_tag_with_aligned_id( $name, $slug, $start_id, $max_attempts = 25 ) {
		global $wpdb;

		$next_probe_id = max( 1, absint( $start_id ) );
		$attempt = 0;

		while ( $attempt < $max_attempts && $next_probe_id > 0 ) {
			$candidate_id = $this->find_next_available_reindex_id( $next_probe_id );
			if ( $candidate_id <= 0 ) {
				return false;
			}

			$attempt++;
			$next_probe_id = $candidate_id + 1;
			$in_transaction = false;
			$attempt_result = 'error';

			try {
				// Transaction control statements are required for atomic aligned-ID inserts.
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
				if ( false !== $wpdb->query( 'START TRANSACTION' ) ) {
					$in_transaction = true;
				}

				// Direct insert preserves the selected term_id for aligned mode.
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
				$term_inserted = $wpdb->insert(
					$wpdb->terms,
					array(
						'term_id' => $candidate_id,
						'name' => $name,
						'slug' => $slug,
						'term_group' => 0,
					),
					array( '%d', '%s', '%s', '%d' )
				);

				if ( ! $term_inserted ) {
					$attempt_result = $this->is_duplicate_key_error() ? 'retry' : 'error';
				} else {
					// Direct insert keeps term_taxonomy_id aligned with term_id.
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
					$taxonomy_inserted = $wpdb->insert(
						$wpdb->term_taxonomy,
						array(
							'term_id' => $candidate_id,
							'term_taxonomy_id' => $candidate_id,
							'taxonomy' => 'post_tag',
							'description' => '',
							'parent' => 0,
							'count' => 0,
						),
						array( '%d', '%d', '%s', '%s', '%d', '%d' )
					);

					if ( ! $taxonomy_inserted ) {
						if ( ! $in_transaction ) {
							// Roll back terms row if taxonomy insert fails and transactions are unavailable.
							// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
							$wpdb->delete(
								$wpdb->terms,
								array( 'term_id' => $candidate_id ),
								array( '%d' )
							);
						}

						$attempt_result = $this->is_duplicate_key_error() ? 'retry' : 'error';
					} else {
						if ( $in_transaction ) {
							// Explicit commit finalizes both INSERTs as one atomic unit.
							// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
							$wpdb->query( 'COMMIT' );
							$in_transaction = false;
						}

						delete_option( 'post_tag_children' );
						clean_term_cache( $candidate_id, 'post_tag' );
						clean_taxonomy_cache( 'post_tag' );

						return $candidate_id;
					}
				}
			} finally {
				if ( $in_transaction ) {
					// Explicit rollback guarantees connection state is closed before retry.
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
					$wpdb->query( 'ROLLBACK' );
				}
			}

			if ( 'retry' !== $attempt_result ) {
				return false;
			}
		}

		return false;
	}

	private function get_aligned_reindex_fallback_start_id() {
		global $wpdb;

		// Uses maxima from related ID columns so fallback inserts stay above the active ID horizon.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$max_seen_id = $wpdb->get_var(
			"SELECT GREATEST(
				COALESCE((SELECT MAX(term_id) FROM {$wpdb->terms}), 0),
				COALESCE((SELECT MAX(term_id) FROM {$wpdb->term_taxonomy}), 0),
				COALESCE((SELECT MAX(term_taxonomy_id) FROM {$wpdb->term_taxonomy}), 0)
			)"
		);

		return absint( $max_seen_id ) + 1;
	}

	private function find_next_available_reindex_id( $start_id ) {
		$start_id = max( 1, absint( $start_id ) );
		$candidate_id = $start_id;
		$attempts = 0;

		while ( $attempts < 5000 ) {
			if ( ! $this->is_reindex_id_conflicting( $candidate_id ) ) {
				return $candidate_id;
			}

			$candidate_id++;
			$attempts++;
		}

		return 0;
	}

	private function is_reindex_id_conflicting( $candidate_id ) {
		global $wpdb;

		// Combined check across related tables to minimize per-ID query overhead.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$conflict = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT 1 FROM {$wpdb->terms} WHERE term_id = %d
				UNION ALL
				SELECT 1 FROM {$wpdb->term_taxonomy} WHERE term_id = %d OR term_taxonomy_id = %d
				UNION ALL
				SELECT 1 FROM {$wpdb->termmeta} WHERE term_id = %d
				UNION ALL
				SELECT 1 FROM {$wpdb->term_relationships} WHERE term_taxonomy_id = %d
				LIMIT 1",
				$candidate_id,
				$candidate_id,
				$candidate_id,
				$candidate_id,
				$candidate_id
			)
		);

		return null !== $conflict;
	}

	private function is_duplicate_key_error() {
		global $wpdb;

		if ( ! empty( $wpdb->last_error ) && is_string( $wpdb->last_error ) ) {
			// Check duplicate-key errors using wpdb error text to satisfy WordPress scanner rules.
			return false !== strpos( $wpdb->last_error, '1062' ) || false !== strpos( $wpdb->last_error, 'Duplicate entry' );
		}

		return false;
	}
}

new PlusMagi_Tags_Reindex_Admin();
new PlusMagi_Tags_Reindex_REST_API();
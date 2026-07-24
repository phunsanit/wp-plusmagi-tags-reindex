<?php
/**
 * Plugin Name: PlusMagi Tags Reindex
 * Plugin URI:  https://wordpress.org/plugins/plusmagi-tags-reindex
 * Description: Intelligently manage and reindex post tags, recycle unused term IDs safely, and enhance the Gutenberg tags panel.
 * Version:		1.0.0
 * Author:		Pitt Phunsanit
 * Author URI:	https://pitt.plusmagi.com
 * License:		GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: plusmagi-tags-reindex
 */

if (!defined('ABSPATH')) {
	exit;
}

class Plusmagi_Tags_Reindex {
	const OPTION_ENABLE_GAP_REINDEX = 'plusmagi_tags_reindex_enable_gap_fill';

	private static $instance = null;

	public static function get_instance() {
		if (self::$instance === null) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	public function __construct() {
		add_action('admin_menu', [$this, 'add_admin_menu']);
		add_action('admin_init', [$this, 'process_form']);
		add_action('enqueue_block_editor_assets', [$this, 'enqueue_editor_assets']);
		add_action('rest_api_init', [$this, 'register_rest_endpoints']);
	}

	private function is_gap_reindex_enabled() {
		return get_option(self::OPTION_ENABLE_GAP_REINDEX, '1') === '1';
	}

	public function add_admin_menu() {
		add_management_page(
			__('PlusMagi Tags Reindex', 'plusmagi-tags-reindex'),
			__('Tags Reindex', 'plusmagi-tags-reindex'),
			'manage_options',
			'plusmagi-tags-reindex',
			[$this, 'render_admin_page']
		);
	}

	public function enqueue_editor_assets() {
		$script_file = plugin_dir_path(__FILE__) . 'js/plusmagi-tags-reindex.js';
		$script_ver  = file_exists($script_file) ? filemtime($script_file) : '1.0.0';

		// ✅ Enqueue CSS
		wp_enqueue_style(
			'plusmagi-tags-reindex',
			plugin_dir_url(__FILE__) . 'css/plusmagi-tags-reindex.css',
			array(),
			$script_ver
		);

		wp_enqueue_script(
			'plusmagi-tags-reindex',
			plugin_dir_url(__FILE__) . 'js/plusmagi-tags-reindex.js',
			['wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-data', 'wp-api-fetch', 'wp-core-data', 'wp-dom-ready', 'wp-i18n'],
			$script_ver,
			true
		);

		wp_localize_script(
			'plusmagi-tags-reindex',
			'plusmagiTagsEditorConfig',
			[
				'statusLabels' => [
					'all' => __('All', 'plusmagi-tags-reindex'),
					'publish' => __('Published', 'plusmagi-tags-reindex'),
					'future' => __('Scheduled', 'plusmagi-tags-reindex'),
					'draft' => __('Drafts', 'plusmagi-tags-reindex'),
				],
				'reindexEnabled' => $this->is_gap_reindex_enabled(),
			]
		);

		wp_set_script_translations(
			'plusmagi-tags-reindex',
			'plusmagi-tags-reindex',
			plugin_dir_path(__FILE__) . 'languages'
		);
	}

	public function register_rest_endpoints() {
		register_rest_route('plusmagi-tags/v1', '/terms-with-stats', [
			'methods' => 'GET',
			'callback' => [$this, 'get_terms_with_stats'],
			// เปลี่ยนจาก 'edit_posts' เป็น 'manage_categories'
			'permission_callback' => fn() => current_user_can('manage_categories'),
			'args' => ['ids' => ['required' => true, 'type' => 'string']],
		]);

		register_rest_route('plusmagi-tags/v1', '/add-tag', [
			'methods' => 'POST',
			'callback' => [$this, 'add_reindexed_tag'],
			'permission_callback' => fn() => current_user_can('manage_categories'),
			'args' => [
				'name' => ['required' => true, 'type' => 'string'],
				'reindex_gaps' => ['required' => false, 'type' => 'boolean'],
			],
		]);
	}

	public function add_reindexed_tag($request) {
		$params = $request->get_json_params();
		$raw_names = $params['name'] ?? $request->get_param('name');

		if (empty($raw_names)) {
			return new WP_Error('missing_name', 'Tag name is required', ['status' => 400]);
		}

		if (is_string($raw_names)) {
			$split_tags = explode(',', $raw_names);
		} elseif (is_array($raw_names)) {
			$split_tags = array_reduce($raw_names, fn($carry, $item) => array_merge($carry, explode(',', $item)), []);
		} else {
			return new WP_Error('invalid_format', 'Invalid tag format', ['status' => 400]);
		}

		$tag_names = array_filter(array_map(function ($name) {
			$name = sanitize_text_field($name);
			$name = preg_replace('/\s+/u', ' ', $name);
			return trim($name);
		}, $split_tags));

		if (empty($tag_names)) {
			return new WP_Error('empty_tag_name', 'Tag name cannot be empty', ['status' => 400]);
		}

		$reindex_gaps = $this->is_gap_reindex_enabled();
		if ($request->has_param('reindex_gaps')) {
			$reindex_gaps = rest_sanitize_boolean($request->get_param('reindex_gaps'));
		}

		$tag_names = array_values(array_unique($tag_names));
		usort($tag_names, fn($a, $b) => strcasecmp($a, $b));

		$this->reindex_tags($tag_names, $reindex_gaps);

		$ids = [];
		foreach ($tag_names as $name) {
			$term = term_exists($name, 'post_tag');
			if ($term && !is_wp_error($term)) {
				$ids[] = (int) $term['term_id'];
			}
		}

		return rest_ensure_response(['ids' => $ids]);
	}

	private function reindex_tags($tags, $fill_gaps = true) {
		global $wpdb;
		$inserted_count = 0;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$wpdb->query('START TRANSACTION');

		try {
			foreach ($tags as $raw_tag) {
				foreach (explode(',', (string) $raw_tag) as $tag_name) {
					$tag_name = trim(sanitize_text_field($tag_name));
					if (empty($tag_name)) continue;

					if ($this->ensure_tag_exists($tag_name)) {
						continue;
					}

					if (!$fill_gaps) {
						$created = wp_insert_term($tag_name, 'post_tag');
						if (!is_wp_error($created)) {
							$inserted_count++;
							clean_term_cache((int) $created['term_id'], 'post_tag');
						}
						continue;
					}

					$new_id = $this->insert_with_gap_filling($tag_name);
					if ($new_id) {
						$inserted_count++;
					}
				}
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			$wpdb->query('COMMIT');

			if ($fill_gaps) {
				$this->reset_auto_increment();
			}
		} catch (Exception $e) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			$wpdb->query('ROLLBACK');
		}

		delete_option('post_tag_children');
		return $inserted_count;
	}

	private function ensure_tag_exists($name) {
		global $wpdb;

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$term_id = $wpdb->get_var($wpdb->prepare(
			"SELECT term_id FROM {$wpdb->terms} WHERE name = %s LIMIT 1",
			$name
		));
		// phpcs:enable

		if (!$term_id) return false;

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$has_taxonomy = $wpdb->get_var($wpdb->prepare(
			"SELECT 1 FROM {$wpdb->term_taxonomy} WHERE term_id = %d AND taxonomy = 'post_tag' LIMIT 1",
			$term_id
		));
		// phpcs:enable

		if (!$has_taxonomy) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			$wpdb->insert($wpdb->term_taxonomy, [
				'term_id' => $term_id,
				'taxonomy' => 'post_tag',
				'description' => '',
				'parent' => 0,
				'count' => 0
			]);
		}
		return true;
	}

	private function insert_with_gap_filling($tag_name) {
		global $wpdb;

		$slug = wp_unique_term_slug(sanitize_title($tag_name), (object)['taxonomy' => 'post_tag']);
		$attempt = 0;
		$max_attempts = 30;

		while ($attempt < $max_attempts) {
			$candidate_id = $this->find_available_term_id() + $attempt;

			if (!$this->term_id_exists($candidate_id)) {
				if ($this->insert_term_data($candidate_id, $tag_name, $slug)) {
					clean_term_cache($candidate_id, 'post_tag');
					return $candidate_id;
				}
			}
			$attempt++;
		}

		$fallback = wp_insert_term($tag_name, 'post_tag');
		return !is_wp_error($fallback) ? $fallback['term_id'] : false;
	}

	private function term_id_exists($id) {
		global $wpdb;
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return (bool) $wpdb->get_var($wpdb->prepare(
			"SELECT term_id FROM {$wpdb->terms} WHERE term_id = %d LIMIT 1",
			$id
		));
		// phpcs:enable
	}

	private function insert_term_data($id, $name, $slug) {
		global $wpdb;

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery
		$result = $wpdb->insert($wpdb->terms, [
			'term_id' => $id,
			'name' => $name,
			'slug'  => $slug,
			'term_group' => 0
		], ['%d', '%s', '%s', '%d']);

		if (!$result) {
			return false;
		}

		return $wpdb->insert($wpdb->term_taxonomy, [
			'term_id' => $id,
			'taxonomy' => 'post_tag',
			'description' => '',
			'parent'  => 0,
			'count'  => 0
		], ['%d', '%s', '%s', '%d', '%d']);
		// phpcs:enable
	}

	private function find_available_term_id() {
		global $wpdb;
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return (int) $wpdb->get_var("
			SELECT MIN(gap.available_id)
			FROM (
				SELECT (t1.term_id + 1) AS available_id
				FROM {$wpdb->terms} t1
				LEFT JOIN {$wpdb->terms} t2 ON t1.term_id + 1 = t2.term_id
				WHERE t2.term_id IS NULL
				UNION SELECT 1
				WHERE NOT EXISTS (SELECT 1 FROM {$wpdb->terms} WHERE term_id = 1)
			) AS gap
		");
		// phpcs:enable
	}

	private function reset_auto_increment() {
		global $wpdb;
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$max = $wpdb->get_var("SELECT MAX(term_id) FROM {$wpdb->terms}");
		// phpcs:enable

		if ($max) {
			// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
			$wpdb->query($wpdb->prepare("ALTER TABLE {$wpdb->terms} AUTO_INCREMENT = %d", (int)$max + 1));
			// phpcs:enable
		}
	}

	public function render_admin_page() {
		$enable_gap_reindex = $this->is_gap_reindex_enabled();

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$inserted_param = filter_input(INPUT_GET, 'inserted', FILTER_VALIDATE_INT);
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$error_param	= filter_input(INPUT_GET, 'error', FILTER_DEFAULT);
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$updated_param  = filter_input(INPUT_GET, 'settings_updated', FILTER_DEFAULT);
		?>
		<div class="wrap">
			<h1><?php echo esc_html(__('PlusMagi Tags Reindex', 'plusmagi-tags-reindex')); ?></h1>
			<p><?php echo esc_html(__('Paste a JSON array of tags to insert them. The system will automatically find missing term_id gaps when enabled.', 'plusmagi-tags-reindex')); ?></p>

			<?php
			if ($inserted_param !== null && $inserted_param !== false) {
				echo '<div class="notice notice-success is-dismissible"><p>';
				/* translators: %d: number of tags successfully inserted */
				printf(esc_html__('Successfully inserted %d new tags.', 'plusmagi-tags-reindex'), intval($inserted_param));
				echo '</p></div>';
			}
			if ($error_param !== null) {
				echo '<div class="notice notice-error is-dismissible"><p>' .
					 esc_html__('Invalid JSON format or empty tags.', 'plusmagi-tags-reindex') .
					 '</p></div>';
			}
			if ($updated_param !== null) {
				echo '<div class="notice notice-success is-dismissible"><p>' .
					 esc_html__('Settings saved successfully.', 'plusmagi-tags-reindex') .
					 '</p></div>';
			}
			?>

			<form method="post" action="" style="margin: 20px 0;">
				<?php wp_nonce_field('plusmagi_tags_reindex_settings_action', 'plusmagi_tags_reindex_settings_nonce'); ?>
				<table class="form-table">
					<tr>
						<th scope="row"><?php echo esc_html(__('ID Mode', 'plusmagi-tags-reindex')); ?></th>
						<td>
							<label for="enable_gap_reindex">
								<input type="checkbox" id="enable_gap_reindex" name="enable_gap_reindex" value="1"
									   <?php checked($enable_gap_reindex); ?> />
								<?php echo esc_html(__('Enable Gap Filling (Reuse missing term_id)', 'plusmagi-tags-reindex')); ?>
							</label>
							<p class="description"><?php echo esc_html(__('When disabled, new tags use WordPress default auto-increment.', 'plusmagi-tags-reindex')); ?></p>
						</td>
					</tr>
				</table>
				<?php submit_button(__('Save Settings', 'plusmagi-tags-reindex'), 'secondary', 'save_settings'); ?>
			</form>

			<form method="post" action="">
				<?php wp_nonce_field('plusmagi_tags_reindex_action', 'plusmagi_tags_reindex_nonce'); ?>
				<table class="form-table">
					<tr>
						<th scope="row"><label for="tags_json"><?php echo esc_html(__('JSON Tags', 'plusmagi-tags-reindex')); ?></label></th>
						<td>
							<textarea name="tags_json" id="tags_json" rows="10" cols="80" class="large-text code"
									  placeholder='["Tag One", "Tag Two", "ภาษาไทย"]'></textarea>
							<p class="description"><?php echo esc_html(__('Example: ["MacOS", "คีย์ลัด", "Documentation"]', 'plusmagi-tags-reindex')); ?></p>
						</td>
					</tr>
				</table>
				<?php submit_button(__('Import Tags', 'plusmagi-tags-reindex'), 'primary'); ?>
			</form>
		</div>
		<?php
	}

	public function process_form() {
		if (!current_user_can('manage_options')) {
			return;
		}

		if (isset($_POST['plusmagi_tags_reindex_settings_nonce']) &&
			wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['plusmagi_tags_reindex_settings_nonce'])), 'plusmagi_tags_reindex_settings_action')) {

			$enable = isset($_POST['enable_gap_reindex']) ? '1' : '0';
			update_option(self::OPTION_ENABLE_GAP_REINDEX, $enable);

			wp_safe_redirect(add_query_arg('settings_updated', '1', admin_url('tools.php?page=plusmagi-tags-reindex')));
			exit;
		}

		if (isset($_POST['plusmagi_tags_reindex_nonce']) &&
			wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['plusmagi_tags_reindex_nonce'])), 'plusmagi_tags_reindex_action')) {

			$tags_json = isset($_POST['tags_json']) ? sanitize_textarea_field(wp_unslash($_POST['tags_json'])) : '';
			$tags = json_decode($tags_json, true);

			if (!is_array($tags) || empty($tags)) {
				wp_safe_redirect(add_query_arg('error', '1', admin_url('tools.php?page=plusmagi-tags-reindex')));
				exit;
			}

			$reindex_gaps = $this->is_gap_reindex_enabled();
			$inserted_count = $this->reindex_tags($tags, $reindex_gaps);

			wp_safe_redirect(add_query_arg(['inserted' => $inserted_count], admin_url('tools.php?page=plusmagi-tags-reindex')));
			exit;
		}
	}

	public function get_terms_with_stats($request) {
		global $wpdb;

		$ids_raw = $request->get_param('ids');
		$ids = array_values(array_filter(array_map('intval', explode(',', (string)$ids_raw))));

		if (empty($ids)) {
			return rest_ensure_response([]);
		}

		$terms = get_terms([
			'taxonomy' => 'post_tag',
			'include' => $ids,
			'hide_empty' => false,
		]);

		if (is_wp_error($terms) || empty($terms)) {
			return rest_ensure_response([]);
		}

		$placeholders = implode(',', array_fill(0, count($ids), '%d'));
		$params = array_merge(['post_tag'], $ids);

		// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT tt.term_id,
						SUM(CASE WHEN p.post_status = 'publish' THEN 1 ELSE 0 END) AS published,
						SUM(CASE WHEN p.post_status = 'future' THEN 1 ELSE 0 END) AS future,
						SUM(CASE WHEN p.post_status = 'draft' THEN 1 ELSE 0 END) AS draft
				 FROM {$wpdb->term_taxonomy} tt
				 LEFT JOIN {$wpdb->term_relationships} tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
				 LEFT JOIN {$wpdb->posts} p ON tr.object_id = p.ID
				 WHERE tt.taxonomy = %s
				   AND tt.term_id IN ($placeholders)
				 GROUP BY tt.term_id",
				$params
			),
			ARRAY_A
		);
		// phpcs:enable

		$stats_map = [];
		if (is_array($rows)) {
			foreach ($rows as $row) {
				$stats_map[(int)$row['term_id']] = [
					'published' => (int)$row['published'],
					'future'	=> (int)$row['future'],
					'draft'	 => (int)$row['draft'],
				];
			}
		}

		$result = [];
		foreach ($terms as $term) {
			$id = (int)$term->term_id;
			$stats = $stats_map[$id] ?? ['published' => 0, 'future' => 0, 'draft' => 0];

			$result[] = [
				'id' => $id,
				'name' => $term->name,
				'slug'  => $term->slug,
				'edit_link' => get_edit_term_link($id, 'post_tag'),
				'all'  => $stats['published'] + $stats['future'] + $stats['draft'],
				'published' => $stats['published'],
				'future' => $stats['future'],
				'draft' => $stats['draft'],
			];
		}

		usort($result, fn($a, $b) => strcasecmp($a['name'], $b['name']));

		return rest_ensure_response($result);
	}
}

add_action('plugins_loaded', ['Plusmagi_Tags_Reindex', 'get_instance']);
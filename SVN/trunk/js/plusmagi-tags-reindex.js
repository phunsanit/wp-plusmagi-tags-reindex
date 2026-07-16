/**
 * PlusMagi Tags Reindex - Custom Gutenberg Sidebar Panel
 *
 * Replaces the default WordPress tags panel with enhanced features:
 * - Bulk comma-separated tag input
 * - Real-time tag statistics
 * - Reindex mode toggle
 */

import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { useState, useEffect } from '@wordpress/element';
import { TextControl, Button, Dashicon } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';

/**
 * ============================================================================
 * 💡 LOGIC LAYER: DATA FETCHING UTILITY (Separation of Concerns)
 * ============================================================================
 * Dispatches a REST API fetch to aggregate taxonomy relationship stats.
 * This function handles API side-effects asynchronously outside the core UI layout.
 *
 * @param {Array}	tagIds	   - Array of current post tag IDs.
 * @param {Function} setStatsMap  - Hook state updater to update the tag metadata cache.
 * @param {Function} setIsLoading - Hook state updater to toggle UI loading thresholds.
 * @param {Object}   holder	   - Object containing mount verification state properties.
 */
const fetchTagsWithStats = (tagIds, setStatsMap, setIsLoading, holder) => {
	if (!tagIds || tagIds.length === 0) {
		setStatsMap({});
		return;
	}

	setIsLoading(true);
	apiFetch({ path: `/plusmagi-tags/v1/terms-with-stats?ids=${tagIds.join(',')}` })
		.then((data) => {
			if (!holder.isMounted) return;
			const mapping = {};
			if (Array.isArray(data)) {
				data.forEach((term) => {
					mapping[term.id] = term;
				});
			}
			setStatsMap(mapping);
		})
		.catch((error) => {
			console.error('[PlusMagi Tags Reindex] API Data Aggregation Error:', error);
		})
		.finally(() => {
			if (holder.isMounted) {
				setIsLoading(false);
			}
		});
};

/**
 * ============================================================================
 * 📊 UI LAYER: CORE PANEL COMPONENT (Houkoku - Status Report Framework)
 * ============================================================================
 * Renders an administrative widget inside the Gutenberg Document Sidebar.
 * It features continuous real-time status notifications and asynchronous bulk injection.
 */
const PlusMagiTagsPanel = () => {
	const [inputValue, setInputValue] = useState('');
	const [statsMap, setStatsMap] = useState({});
	const [isLoading, setIsLoading] = useState(false);

	// 1. Core State Selectors from the WordPress global store
	const { tagIds, currentPostId } = useSelect((select) => {
		const editor = select('core/editor');
		return {
			tagIds: editor.getEditedPostAttribute('tags') || [],
			currentPostId: editor.getCurrentPostId(),
		};
	}, []);

	const { editPost } = useDispatch('core/editor');

	// Load static system configuration passed down from the localized PHP ecosystem
	const config = window.plusmagiTagsEditorConfig || { statusLabels: {}, reindexEnabled: true };

	// 2. Continuous Synchronization Trigger for tag stats evaluation with tracking cleanup
	useEffect(() => {
		const holder = { isMounted: true };
		fetchTagsWithStats(tagIds, setStatsMap, setIsLoading, holder);
		return () => {
			holder.isMounted = false;
		};
	}, [tagIds, currentPostId]);

	// 3. Action Handlers for mutating data attributes
	const handleAddTags = () => {
		if (!inputValue.trim()) return;

		apiFetch({
			path: '/plusmagi-tags/v1/add-tag',
			method: 'POST',
			data: { name: inputValue }
		})
		.then((response) => {
			if (response && response.ids) {
				// Deduplicate and combine newly generated IDs safely using a Set sequence
				const combinedIds = Array.from(new Set([...tagIds, ...response.ids]));
				editPost({ tags: combinedIds });
				setInputValue('');
			}
		})
		.catch((error) => {
			console.error('[PlusMagi Tags Reindex] Tag Generation Inversion Interrupted:', error);
		});
	};

	const handleRemoveTag = (idToRemove) => {
		const updatedIds = tagIds.filter(id => id !== idToRemove);
		editPost({ tags: updatedIds });
	};

	return (
		<PluginDocumentSettingPanel
			name="plusmagi-tags-reindex-panel"
			title={__('PlusMagi Tags Reindex', 'plusmagi-tags-reindex')}
			className="plusmagi-tags-reindex-panel"
		>
			{/* 📢 STATUS REPORTING BAR: Instant visual disclosure of backend logic mode */}
			<div
				style={{
					marginBottom: '15px',
					padding: '10px',
					borderRadius: '4px',
					backgroundColor: config.reindexEnabled ? '#e7f4ec' : '#f0f0f0',
					borderLeft: `4px solid ${config.reindexEnabled ? '#46b450' : '#cccccc'}`
				}}
			>
				<strong style={{ color: config.reindexEnabled ? '#236c35' : '#666666', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
					<Dashicon icon="admin-settings" />
					{config.reindexEnabled
						? __('Gap Filling Mode: Active (Reusing Term IDs)', 'plusmagi-tags-reindex')
						: __('WordPress Standard Mode: Active', 'plusmagi-tags-reindex')
					}
				</strong>
			</div>

			{/* BULK TAG INTERACTION CONSOLE */}
			<div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '20px' }}>
				<div style={{ flexGrow: 1 }}>
					<TextControl
						label={__('Add Tags (Comma separated)', 'plusmagi-tags-reindex')}
						value={inputValue}
						onChange={setInputValue}
						placeholder="Tag A, Tag B, Tag C"
						__nextHasNoMarginBottom
					/>
				</div>
				<Button isPrimary onClick={handleAddTags} style={{ height: '30px' }}>
					{__('Add', 'plusmagi-tags-reindex')}
				</Button>
			</div>

			{/* REAL-TIME AUDIT SUMMARY REPORTING LIST */}
			<div className="plusmagi-tags-list">
				<p style={{ fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>
					{__('Current Tags & Usage Statistics:', 'plusmagi-tags-reindex')}
					{isLoading && <span style={{ marginLeft: '8px', fontWeight: 'normal', color: '#666' }}>({__('Updating...', 'plusmagi-tags-reindex')})</span>}
				</p>

				{tagIds.length === 0 ? (
					<p style={{ color: '#666', fontStyle: 'italic', fontSize: '12px' }}>
						{__('No tags assigned to this post.', 'plusmagi-tags-reindex')}
					</p>
				) : (
					<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
						{tagIds.map((id) => {
							// Fallback gracefully if the backend evaluation has not yet resolved data records
							const term = statsMap[id] || { name: `ID: ${id}`, all: 0, published: 0, draft: 0 };
							return (
								<li
									key={id}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										padding: '8px 0',
										borderBottom: '1px solid #eee',
										gap: '10px'
									}}
								>
									{/* Structured Report metrics containing dynamic parameter placement */}
									<div style={{ flexGrow: 1 }}>
										<div style={{ fontWeight: '500', color: '#1e1e1e', fontSize: '13px' }}>{term.name}</div>
										<div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
											{sprintf(
												__('Total usage: %1$d | Published: %2$d | Draft: %3$d', 'plusmagi-tags-reindex'),
												term.all,
												term.published,
												term.draft
											)}
										</div>
									</div>

									{/* Individual Term Disconnection Interconnector */}
									<Button
										isLink
										isDestructive
										onClick={() => handleRemoveTag(id)}
										style={{ padding: 0, minWidth: 'auto', height: 'auto' }}
									>
										<Dashicon icon="dismiss" style={{ color: '#cc1818' }} />
									</Button>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</PluginDocumentSettingPanel>
	);
};

// Bind the refactored module inside Gutenberg plugin architecture
registerPlugin('plusmagi-tags-reindex', {
	render: PlusMagiTagsPanel,
	icon: 'admin-settings',
});
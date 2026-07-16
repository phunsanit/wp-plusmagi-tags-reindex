/**
 * PlusMagi Tags Reindex - Custom Gutenberg Sidebar Panel (TypeScript Edition)
 *
 * Replaces the default WordPress tags panel with enhanced features:
 * - Bulk comma-separated tag input
 * - Real-time tag statistics
 * - Reindex mode toggle
 */

import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useState, useEffect } from '@wordpress/element';
import { TextControl, Button, Dashicon, ToggleControl, PanelBody } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';

// ... (Interface definitions เหมือนเดิม)

interface TermStats {
	id: number;
	name: string;
	slug: string;
	edit_link: string;
	all: number;
	published: number;
	future: number;
	draft: number;
}

interface StatsMap {
	[key: number]: TermStats;
}

interface ComponentHolder {
	isMounted: boolean;
}

interface PHPGlobalConfig {
	statusLabels: Record<string, string>;
	reindexEnabled: boolean;
}

declare global {
	interface Window {
		plusmagiTagsEditorConfig?: PHPGlobalConfig;
	}
}

// ... (fetchTagsWithStats function เหมือนเดิม)

const fetchTagsWithStats = (
	tagIds: number[],
	setStatsMap: React.Dispatch<React.SetStateAction<StatsMap>>,
	setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
	holder: ComponentHolder
): void => {
	if (!tagIds || tagIds.length === 0) {
		setStatsMap({});
		return;
	}

	setIsLoading(true);
	apiFetch<TermStats[]>({ path: `/plusmagi-tags/v1/terms-with-stats?ids=${tagIds.join(',')}` })
		.then((data) => {
			if (!holder.isMounted) return;
			const mapping: StatsMap = {};
			if (Array.isArray(data)) {
				data.forEach((term) => {
					mapping[term.id] = term;
				});
			}
			setStatsMap(mapping);
		})
		.catch((error: unknown) => {
			console.error('[PlusMagi Tags Reindex] API Data Aggregation Error:', error);
		})
		.finally(() => {
			if (holder.isMounted) {
				setIsLoading(false);
			}
		});
};

const PlusMagiTagsPanel: React.FC = () => {
	const [inputValue, setInputValue] = useState<string>('');
	const [statsMap, setStatsMap] = useState<StatsMap>({});
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isReindexPanelOpen, setIsReindexPanelOpen] = useState<boolean>(false);
	const [reindexMode, setReindexMode] = useState<boolean>(true);

	const { tagIds, currentPostId } = useSelect((select) => {
		const editor = select('core/editor');
		return {
			tagIds: (editor.getEditedPostAttribute('tags') as number[]) || [],
			currentPostId: editor.getCurrentPostId() as number | string,
		};
	}, []);

	const { editPost } = useDispatch('core/editor');
	const { removeEditorPanel } = useDispatch('core/edit-post');

	useEffect(() => {
		removeEditorPanel('taxonomy-panel-post_tag');
	}, [removeEditorPanel]);

	const config: PHPGlobalConfig = window.plusmagiTagsEditorConfig || { statusLabels: {}, reindexEnabled: true };

	useEffect(() => {
		const holder: ComponentHolder = { isMounted: true };
		fetchTagsWithStats(tagIds, setStatsMap, setIsLoading, holder);
		return () => {
			holder.isMounted = false;
		};
	}, [tagIds.join(','), currentPostId]);

	// ✅ คำนวณสถิติรวม
	const calculateTotals = (): { total: number; published: number; future: number; draft: number; newTags: number } => {
		const totals = { total: 0, published: 0, future: 0, draft: 0, newTags: 0 };

		tagIds.forEach((id) => {
			const term = statsMap[id];
			if (term) {
				totals.published += term.published;
				totals.future += term.future;
				totals.draft += term.draft;
				if (term.all === 0) {
					totals.newTags += 1;
				}
			} else {
				totals.newTags += 1;
			}
		});

		totals.total = tagIds.length;
		return totals;
	};

	const totals = calculateTotals();

	const handleAddTags = (): void => {
		if (!inputValue.trim()) return;

		apiFetch<{ ids: number[] }>({
			path: '/plusmagi-tags/v1/add-tag',
			method: 'POST',
			data: { name: inputValue }
		})
			.then((response) => {
				if (response && response.ids) {
					const combinedIds = Array.from(new Set([...tagIds, ...response.ids]));
					editPost({ tags: combinedIds });
					setInputValue('');
				}
			})
			.catch((error: unknown) => {
				console.error('[PlusMagi Tags Reindex] Tag Generation Inversion Interrupted:', error);
			});
	};

	const handleRemoveTag = (idToRemove: number): void => {
		const updatedIds = tagIds.filter(id => id !== idToRemove);
		editPost({ tags: updatedIds });
	};

	const handleReindexToggle = (value: boolean): void => {
		setReindexMode(value);
		// TODO: ส่งค่าไปยัง backend เพื่ออัปเดตการตั้งค่า
		console.log('[PlusMagi Tags Reindex] Reindex Mode:', value);
	};

// ... (ส่วนบนคงเดิม)

	return (
		<PluginDocumentSettingPanel
			name="plusmagi-tags-reindex-panel"
			title={__('PlusMagi Tags Reindex', 'plusmagi-tags-reindex')}
			className="plusmagi-tags-reindex-panel"
		>
			{/* Summary Section */}
			<div className="plusmagi-tags-summary">
				<div className="plusmagi-tags-summary__title">
					{__('Summaries', 'plusmagi-tags-reindex')}
				</div>
				<div className="plusmagi-tags-summary__stats">
					{sprintf(
						__('Total Tags: %1$d | Published: %2$d | Future: %3$d | Draft: %4$d | New: %5$d', 'plusmagi-tags-reindex'),
						totals.total,
						totals.published,
						totals.future,
						totals.draft,
						totals.newTags
					)}
				</div>
			</div>

			{/* Bulk Tag Input */}
			<div className="plusmagi-tags-input">
				<div className="plusmagi-tags-input__field">
					<TextControl
						label={__('Add Tags (Comma separated)', 'plusmagi-tags-reindex')}
						value={inputValue}
						onChange={(value: string) => setInputValue(value)}
						placeholder="Tag A, Tag B, Tag C"
						__nextHasNoMarginBottom
					/>
				</div>
				<Button variant="primary" onClick={handleAddTags} className="plusmagi-tags-input__button">
					{__('Add', 'plusmagi-tags-reindex')}
				</Button>
			</div>

			{/* Reindex Options Panel */}
			<PanelBody
				title={__('Tags Reindex Options', 'plusmagi-tags-reindex')}
				initialOpen={isReindexPanelOpen}
				onToggle={() => setIsReindexPanelOpen(!isReindexPanelOpen)}
			>
				<ToggleControl
					label={__('Enable Gap Filling Mode', 'plusmagi-tags-reindex')}
					help={__('Reuse term IDs from deleted tags to prevent database bloat', 'plusmagi-tags-reindex')}
					checked={reindexMode}
					onChange={handleReindexToggle}
				/>

				<div className="plusmagi-reindex-status">
					<strong>{__('Current Status:', 'plusmagi-tags-reindex')}</strong>
					<div>
						{reindexMode
							? __('✓ Gap Filling: Active', 'plusmagi-tags-reindex')
							: __('○ Standard Mode: Active', 'plusmagi-tags-reindex')
						}
					</div>
				</div>
			</PanelBody>

			{/* Current Tags List - ✅ เพิ่ม class และจำกัดความสูง */}
			<div className="plusmagi-tags-list">
				<p className="plusmagi-tags-list__title">
					{__('Current Tags & Usage Statistics:', 'plusmagi-tags-reindex')}
					{isLoading && <span className="plusmagi-tags-list__loading">({__('Updating...', 'plusmagi-tags-reindex')})</span>}
				</p>

				{tagIds.length === 0 ? (
					<p className="plusmagi-tags-list__empty">
						{__('No tags assigned to this post.', 'plusmagi-tags-reindex')}
					</p>
				) : (
					<ul className="plusmagi-tags-list__items">
						{tagIds.map((id: number) => {
							const term: TermStats = statsMap[id] || {
								id: id,
								name: `ID: ${id}`,
								slug: '',
								edit_link: '',
								all: 0,
								published: 0,
								future: 0,
								draft: 0
							};

							return (
								<li key={id} className="plusmagi-tags-list__item">
									<div className="plusmagi-tags-list__info">
										<div className="plusmagi-tags-list__name">{term.name}</div>
										<div className="plusmagi-tags-list__stats">
											{sprintf(
												__('Total usage: %1$d | Published: %2$d | Future: %3$d | Draft: %4$d', 'plusmagi-tags-reindex'),
												term.all,
												term.published,
												term.future,
												term.draft
											)}
										</div>
									</div>

									<Button
										variant="link"
										isDestructive
										onClick={() => handleRemoveTag(id)}
										className="plusmagi-tags-list__remove"
									>
										<Dashicon icon="dismiss" />
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

registerPlugin('plusmagi-tags-reindex', {
	render: PlusMagiTagsPanel,
	icon: 'admin-settings',
});
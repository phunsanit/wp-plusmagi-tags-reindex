import { __ } from '@wordpress/i18n';
import { CheckboxControl, FormTokenField, Spinner, Button } from '@wordpress/components';
import { registerPlugin } from '@wordpress/plugins';
import { useSelect, useDispatch, dispatch, select } from '@wordpress/data';
import { useState, useEffect, useRef, useCallback, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

declare global {
	interface Window {
		wp?: {
			domReady?: (callback: () => void) => void;
		};
		plusmagiTagsEditorConfig?: {
			statusLabels: {
				all: string;
				publish: string;
				future: string;
				draft: string;
			};
			reindexEnabled: boolean | string | number;
		};
	}
}

interface TagTerm {
	id: number;
	name: string;
	count?: number;
}

interface TagStat {
	id: number;
	name: string;
	all: number;
	published: number;
	future: number;
	draft: number;
}

const getInitialReindexState = (): boolean => {
	const configVal = window.plusmagiTagsEditorConfig?.reindexEnabled;
	return configVal === true || configVal === '1' || configVal === 1;
};

const getDocumentSettingPanel = () => {
	const wpGlobal = window.wp as unknown as {
		editPost?: { PluginDocumentSettingPanel?: React.ComponentType<any> };
		editor?: { PluginDocumentSettingPanel?: React.ComponentType<any> };
	};

	return wpGlobal?.editPost?.PluginDocumentSettingPanel || wpGlobal?.editor?.PluginDocumentSettingPanel || null;
};

export const TagsReindexPanel: React.FC = () => {
	const DocumentSettingPanel = getDocumentSettingPanel();

	if (!DocumentSettingPanel) {
		return null;
	}

	const [isGapFillEnabled, setIsGapFillEnabled] = useState<boolean>(() => getInitialReindexState());
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [knownTerms, setKnownTerms] = useState<TagTerm[]>([]);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [isSearching, setIsSearching] = useState<boolean>(false);

	const [statsList, setStatsList] = useState<TagStat[]>([]);
	const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const searchControllerRef = useRef<AbortController | null>(null);
	const blurClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const changeRequestSeq = useRef<number>(0);
	const suggestionIdMapRef = useRef<Map<string, number>>(new Map());

	useEffect(() => {
		return () => {
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current);
			}
			if (searchControllerRef.current) {
				searchControllerRef.current.abort();
			}
			if (blurClearTimerRef.current) {
				clearTimeout(blurClearTimerRef.current);
			}
		};
	}, []);

	const mergeKnownTerms = useCallback((newTerms: TagTerm[]) => {
		setKnownTerms((prev) => {
			const combined = [...prev, ...newTerms];
			return Array.from(new Map(combined.map((t) => [t.id, t])).values());
		});
	}, []);

	const clearSuggestionState = useCallback(() => {
		suggestionIdMapRef.current.clear();
		setSuggestions([]);
		setIsSearching(false);
	}, []);

	// 1. Fetch current post tag IDs
	const { postTags, hasLoadedInitial } = useSelect((select: any) => {
		const { getEditedPostAttribute } = select('core/editor');
		const tagIds: number[] = getEditedPostAttribute('tags') || [];
		return {
			postTags: Array.isArray(tagIds) ? tagIds : [],
			hasLoadedInitial: true,
		};
	}, []);

	const { editPost } = useDispatch('core/editor');
	const { invalidateResolution } = useDispatch('core');

	const tagIdsKey = useMemo(() => {
		return [...postTags].sort((a, b) => a - b).join(',');
	}, [postTags]);

	// 2. Fetch stats list and hydrate known terms from the same endpoint
	useEffect(() => {
		if (!tagIdsKey) {
			setStatsList([]);
			return;
		}

		const controller = new AbortController();

		setIsLoadingStats(true);
		apiFetch<TagStat[]>({
			path: `/plusmagi-tags/v1/terms-with-stats?ids=${tagIdsKey}`,
			signal: controller.signal,
		})
			.then((res) => {
				if (Array.isArray(res)) {
					setStatsList(res);
					const termsFromStats: TagTerm[] = res.map((item) => ({
						id: item.id,
						name: item.name,
						count: item.all,
					}));
					mergeKnownTerms(termsFromStats);
				}
			})
			.catch((err) => {
				if (err?.name !== 'AbortError') {
					console.error('Error fetching tag stats:', err);
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) {
					setIsLoadingStats(false);
				}
			});

		return () => {
			controller.abort();
		};
	}, [tagIdsKey, mergeKnownTerms]);

	// Calculate overall statistics for summary footer
	const totalTagsCount = postTags.length;
	const totalPublishedCount = statsList.reduce((acc, item) => acc + (item.published || 0), 0);
	const totalDraftCount = statsList.reduce((acc, item) => acc + (item.draft || 0), 0);
	const newTagsCount = statsList.filter((s) => s.all === 0).length;

	const cleanTagName = (formattedName: string): string => {
		return formattedName
			.normalize('NFKC')
			.replace(/\s\(\d+\)$/, '')
			.replace(/[\u200B-\u200D\uFEFF]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	};

	// 3. Search and suggestion autocomplete handler
	const handleInputChange = (token: string) => {
		const searchTerm = token.trim();

		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current);
			debounceTimer.current = null;
		}

		if (searchControllerRef.current) {
			searchControllerRef.current.abort();
			searchControllerRef.current = null;
		}

		if (!searchTerm) {
			clearSuggestionState();
			return;
		}

		setIsSearching(true);

		debounceTimer.current = setTimeout(() => {
			const controller = new AbortController();
			searchControllerRef.current = controller;

			apiFetch<TagTerm[]>({
				path: `/wp/v2/tags?search=${encodeURIComponent(searchTerm)}&per_page=20&_fields=id,name,count`,
				signal: controller.signal,
			})
				.then((terms) => {
					if (Array.isArray(terms)) {
						mergeKnownTerms(terms);

						const nextSuggestionIdMap = new Map<string, number>();
						const nextSuggestions = terms.map((term) => {
							const label = term.count !== undefined ? `${term.name} (${term.count})` : term.name;
							nextSuggestionIdMap.set(label.toLowerCase(), term.id);
							nextSuggestionIdMap.set(term.name.toLowerCase(), term.id);
							return label;
						});
						suggestionIdMapRef.current = nextSuggestionIdMap;

						setSuggestions(nextSuggestions);
					}
				})
				.catch((err) => {
					if (err?.name !== 'AbortError') {
						console.error('Error searching tags:', err);
					}
				})
				.finally(() => {
					if (searchControllerRef.current === controller) {
						searchControllerRef.current = null;
					}
					if (!controller.signal.aborted) {
						setIsSearching(false);
					}
				});
		}, 300);
	};

	// 4. Handle tag addition/removal via FormTokenField
	const handleTagsChange = async (newTokens: (string | TagTerm)[]) => {
		if (!Array.isArray(newTokens) || newTokens.length === 0) return;

		const existingIdsToAdd: number[] = [];
		const namesToCreate: string[] = [];

		newTokens.forEach((item) => {
			if (typeof item === 'object' && item !== null && typeof item.id === 'number') {
				existingIdsToAdd.push(item.id);
				return;
			}

			const rawName = typeof item === 'string' ? item : item.name;
			const cleanedName = cleanTagName(rawName);
			if (!cleanedName) {
				return;
			}

			if (typeof item === 'string') {
				const mappedSuggestionId =
					suggestionIdMapRef.current.get(item.toLowerCase()) ||
					suggestionIdMapRef.current.get(cleanedName.toLowerCase());
				if (typeof mappedSuggestionId === 'number') {
					existingIdsToAdd.push(mappedSuggestionId);
					return;
				}
			}

			const matchedTerm = knownTerms.find(
				(term) => term.name.toLowerCase() === cleanedName.toLowerCase()
			);
			if (matchedTerm) {
				existingIdsToAdd.push(matchedTerm.id);
			} else {
				namesToCreate.push(cleanedName);
			}
		});

		const uniqueExistingIds = Array.from(new Set(existingIdsToAdd));
		const uniqueNamesToCreate = Array.from(new Set(namesToCreate));

		let createdTagIds: number[] = [];

		if (uniqueNamesToCreate.length > 0) {
			const requestSeq = ++changeRequestSeq.current;
			setIsSubmitting(true);
			try {
				const response = await apiFetch<{ ids: number[]; terms?: TagTerm[] }>({
					path: '/plusmagi-tags/v1/add-tag',
					method: 'POST',
					data: {
						name: uniqueNamesToCreate.join(','),
						reindex_gaps: isGapFillEnabled,
					},
				});

				if (response && Array.isArray(response.ids)) {
					createdTagIds = response.ids;

					if (Array.isArray(response.terms)) {
						mergeKnownTerms(response.terms);
					}
				}

				await invalidateResolution('getEntityRecords', ['taxonomy', 'post_tag', { per_page: -1 }]);
			} catch (error) {
				console.error('Error adding reindexed tag:', error);
			} finally {
				if (requestSeq === changeRequestSeq.current) {
					setIsSubmitting(false);
				}
			}
		}

		const freshEditor = select('core/editor') as unknown as {
			getEditedPostAttribute?: (key: string) => number[];
		};
		const currentTags = freshEditor?.getEditedPostAttribute?.('tags') || [];
		const updatedTagIds = Array.from(
			new Set([...(Array.isArray(currentTags) ? currentTags : []), ...uniqueExistingIds, ...createdTagIds])
		);

		editPost({ tags: updatedTagIds });
	};

	// 5. Remove tag handler from summary list
	const handleRemoveTag = (tagIdToRemove: number) => {
		const freshEditor = select('core/editor') as unknown as {
			getEditedPostAttribute?: (key: string) => number[];
		};
		const currentTags = freshEditor?.getEditedPostAttribute?.('tags') || [];
		const updatedTagIds = currentTags.filter((id) => id !== tagIdToRemove);
		editPost({ tags: updatedTagIds });
	};

	return (
		<DocumentSettingPanel
			name="plusmagi-tags-reindex-panel"
			title={__('PlusMagi Tags Reindex', 'plusmagi-tags-reindex')}
			className="plusmagi-tags-reindex-panel"
		>
			<div style={{ marginBottom: '15px' }}>
				<CheckboxControl
					label={__('Enable Gap Filling (Reuse missing term_id)', 'plusmagi-tags-reindex')}
					help={__('When disabled, new tags use WordPress default auto-increment.', 'plusmagi-tags-reindex')}
					checked={isGapFillEnabled}
					onChange={(value: boolean) => setIsGapFillEnabled(value)}
				/>
			</div>

			{!hasLoadedInitial || isSubmitting ? (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
					<Spinner />
					{isSubmitting && <span>{__('Reindexing tags...', 'plusmagi-tags-reindex')}</span>}
				</div>
			) : (
				<div>
					{/* Tag Search and Input Field */}
					<FormTokenField
						label={__('TAGS', 'plusmagi-tags-reindex')}
						value={[]}
						suggestions={suggestions}
						onChange={(tokens) => {
							handleTagsChange(tokens);
							clearSuggestionState();
						}}
						onInputChange={handleInputChange}
						onBlur={() => {
							if (debounceTimer.current) {
								clearTimeout(debounceTimer.current);
								debounceTimer.current = null;
							}
							if (blurClearTimerRef.current) {
								clearTimeout(blurClearTimerRef.current);
							}
							blurClearTimerRef.current = setTimeout(() => {
								clearSuggestionState();
								blurClearTimerRef.current = null;
							}, 150);
						}}
						placeholder={__('Add new tag', 'plusmagi-tags-reindex')}
						__next40pxDefaultSize
					/>
					{isSearching && (
						<div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
							<Spinner />
							<small>{__('Searching tags...', 'plusmagi-tags-reindex')}</small>
						</div>
					)}

					{/* Tag Usage Summary Panel */}
					{statsList.length > 0 && (
						<div className="plusmagi-tags-list" style={{ marginTop: '15px', border: '1px solid #dcdcde', borderRadius: '4px', overflow: 'hidden' }}>
							{/* Panel Header */}
							<div style={{ padding: '8px 10px', background: '#f6f7f7', borderBottom: '1px solid #dcdcde', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<strong className="plusmagi-tags-list__title" style={{ margin: 0 }}>
									{__('Tag Usage Summary', 'plusmagi-tags-reindex')}
								</strong>
								{isLoadingStats && <Spinner />}
							</div>

							{/* Tag Items List */}
							<ul className="plusmagi-tags-list__items" style={{ border: 'none', borderRadius: 0, margin: 0, padding: 0, listStyle: 'none' }}>
								{statsList.map((stat) => {
									const isNew = stat.all === 0;

									return (
										<li key={stat.id} className="plusmagi-tags-list__item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px', position: 'relative', padding: '8px 10px', borderBottom: '1px solid #f0f0f1' }}>
											<div className="plusmagi-tags-list__info" style={{ width: '100%', paddingRight: '24px' }}>
												{/* Tag Name */}
												<div className="plusmagi-tags-list__name" style={{ fontWeight: 600 }}>
													{stat.name}
												</div>

												{/* Vertical Stats Row per Item */}
												<div className="plusmagi-tags-list__stats" style={{ display: 'flex', gap: '8px', marginTop: '3px', fontSize: '11px', flexWrap: 'wrap' }}>
													{isNew ? (
														<span style={{ color: '#008a20', fontWeight: 600, background: '#e7f5ea', padding: '1px 6px', borderRadius: '3px' }}>
															{__('New Tag', 'plusmagi-tags-reindex')}
														</span>
													) : (
														<>
															{stat.all > 0 && <span>Total: <strong>{stat.all}</strong></span>}
															{stat.published > 0 && <span style={{ color: '#008a20' }}>Publish: <strong>{stat.published}</strong></span>}
															{stat.draft > 0 && <span style={{ color: '#d63638' }}>Draft: <strong>{stat.draft}</strong></span>}
														</>
													)}
												</div>
											</div>

											{/* Action Remove Button */}
											<Button
												className="plusmagi-tags-list__remove"
												isDestructive
												isSmall
												variant="tertiary"
												onClick={() => handleRemoveTag(stat.id)}
												aria-label={`Remove ${stat.name}`}
												style={{ position: 'absolute', right: '8px', top: '8px', padding: '0 2px', height: '18px', minWidth: '16px', lineHeight: '1' }}
											>
												✕
											</Button>
										</li>
									);
								})}
							</ul>

							{/* Overall Summary Footer Panel */}
							<div className="plusmagi-tags-summary" style={{ padding: '10px 12px', background: '#f8f9fa', borderTop: '1px solid #dcdcde', margin: 0 }}>
								<div style={{ fontSize: '11px', fontWeight: 600, color: '#1e1e1e', marginBottom: '4px' }}>
									{__('Summary Total', 'plusmagi-tags-reindex')}
								</div>
								<div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#555', flexWrap: 'wrap' }}>
									<span>Total Tags: <strong>{totalTagsCount}</strong></span>
									<span style={{ color: '#008a20' }}>Published: <strong>{totalPublishedCount}</strong></span>
									<span style={{ color: '#d63638' }}>Drafts: <strong>{totalDraftCount}</strong></span>
									<span style={{ color: '#008a20' }}>New Tags: <strong>{newTagsCount}</strong></span>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</DocumentSettingPanel>
	);
};

// Register Gutenberg plugin
registerPlugin('plusmagi-tags-reindex', {
	render: TagsReindexPanel,
	icon: 'tag',
});

// Remove default WordPress tags panel safely
if (typeof window !== 'undefined' && window.wp?.domReady) {
	window.wp.domReady(() => {
		dispatch('core/editor')?.removeEditorPanel('taxonomy-panel-post_tag');
	});
}
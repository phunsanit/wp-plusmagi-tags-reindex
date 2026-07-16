( function ( wp ) {
	if ( ! wp || ! wp.plugins || ! wp.editPost || ! wp.element || ! wp.components || ! wp.data ) {
		return;
	}

	var registerPlugin = wp.plugins.registerPlugin;
	var PluginDocumentSettingPanel = wp.editPost.PluginDocumentSettingPanel;
	var createElement = wp.element.createElement;
	var useState = wp.element.useState;
	var useEffect = wp.element.useEffect;
	var Button = wp.components.Button;
	var TextControl = wp.components.TextControl;
	var ToggleControl = wp.components.ToggleControl;
	var Spinner = wp.components.Spinner;
	var useSelect = wp.data.useSelect;
	var useDispatch = wp.data.useDispatch;
	var { __ } = wp.i18n;
	var apiFetch = wp.apiFetch;

	function TagsPanel() {
		var activeTagIds = useSelect( function ( select ) {
			var ids = select( 'core/editor' ).getEditedPostAttribute( 'tags' );
			return Array.isArray( ids ) ? ids : [];
		}, [] );

		var editorDispatch = useDispatch( 'core/editor' );

		var [tagsDetails, setTagsDetails] = useState([]);
		var [inputValue, setInputValue] = useState('');
		var [loading, setLoading] = useState(false);
		var [reindexGaps, setReindexGaps] = useState(
			window.plusmagiTagsEditorConfig?.reindexEnabled ?? true
		);

		// ดึงรายละเอียดของแท็กพร้อมสถิติ
		useEffect( function() {
			if ( activeTagIds.length === 0 ) {
				setTagsDetails([]);
				return;
			}

			setLoading(true);
			apiFetch({
				path: '/plusmagi-tags/v1/terms-with-stats?ids=' + activeTagIds.join(','),
				method: 'GET'
			})
			.then( function(data) {
				setTagsDetails(data);
				setLoading(false);
			})
			.catch( function(err) {
				console.error('Error fetching tags with stats:', err);
				setLoading(false);
			});
		}, [activeTagIds] );

		// เพิ่ม Tag แบบหลายคำ
		var addTagsBulk = async function(names) {
			setLoading(true);
			try {
				var response = await apiFetch({
					path: '/plusmagi-tags/v1/add-tag',
					method: 'POST',
					data: {
						name: names,
						reindex_gaps: reindexGaps
					}
				});

				if (response && response.ids) {
					var finalTagIds = [...new Set([...activeTagIds, ...response.ids])];
					editorDispatch.editPost({ tags: finalTagIds });
				}
			} catch (err) {
				console.error('Error adding tags bulk:', err);
			}
			setLoading(false);
		};

		var handleRemoveTag = function ( tagId ) {
			editorDispatch.editPost( {
				tags: activeTagIds.filter( function ( id ) {
					return id !== tagId;
				} ),
			} );
		};

		var handleInputChange = function(value) {
			if (value.indexOf(',') !== -1) {
				var parts = value.split(',');
				var tagsToAdd = parts.map(function(p) { return p.trim(); }).filter(Boolean);
				if (tagsToAdd.length > 0) {
					addTagsBulk(tagsToAdd);
				}
				setInputValue('');
			} else {
				setInputValue(value);
			}
		};

		var handleKeyDown = function(event) {
			if (event.key === 'Enter') {
				event.preventDefault();
				var value = inputValue.trim();
				if (value) {
					var parts = value.split(',');
					var tagsToAdd = parts.map(function(p) { return p.trim(); }).filter(Boolean);
					if (tagsToAdd.length > 0) {
						addTagsBulk(tagsToAdd);
					}
				}
				setInputValue('');
			}
		};

		var toggleControl = createElement( ToggleControl, {
			label: __( 'เปิดใช้งาน Reindex (ถมรูรั่ว ID)', 'plusmagi-tags-reindex' ),
			help: __( 'หากปิด ระบบจะสุ่มใช้ AUTO_INCREMENT ปกติของ WordPress', 'plusmagi-tags-reindex' ),
			checked: reindexGaps,
			onChange: function( val ) { setReindexGaps( val ); }
		} );

		var textControlInput = createElement( TextControl, {
			value: inputValue,
			onChange: handleInputChange,
			onKeyDown: handleKeyDown,
			placeholder: __( 'เพิ่ม Tag ใหม่...', 'plusmagi-tags-reindex' ),
			help: __( 'แยกด้วยเครื่องหมายจุลภาค หรือกดปุ่ม Enter', 'plusmagi-tags-reindex' )
		} );

		var spinner = loading ? createElement( 'div', {
			style: {
				position: 'absolute',
				right: '10px',
				top: '50%',
				transform: 'translateY(-50%)',
				zIndex: 10
			}
		}, createElement( Spinner ) ) : null;

		var tagsListElements = createElement(
			'div',
			{
				className: 'editor-post-taxonomies__hierarchical-terms-list',
				style: { marginTop: '15px' }
			},
			tagsDetails.length === 0
				? createElement( 'p', { style: { color: '#757575', fontSize: '12px' } }, __( 'โพสต์นี้ยังไม่มีแท็ก', 'plusmagi-tags-reindex' ) )
				: tagsDetails.map( function ( tag ) {
					return createElement(
						'div',
						{
							key: tag.id,
							title: 'term_id: ' + tag.id,
							style: {
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '8px',
								padding: '8px 12px',
								background: '#f0f0f1',
								borderRadius: '4px',
								border: '1px solid #dcdcde',
							},
						},
						createElement(
							'div',
							null,
							createElement(
								'strong',
								{ style: { display: 'block', fontSize: '13px', color: '#1e1e1e' } },
								tag.name
							),
							createElement(
								'span',
								{ style: { fontSize: '11px', color: '#646970' } },
								'ทั้งหมด: ' + tag.all + ' | Publish: ' + tag.published + ' | Draft: ' + tag.draft
							)
						),
						createElement( Button, {
							isSmall: true,
							isDestructive: true,
							className: 'has-icon',
							icon: 'no-alt',
							label: __( 'เอา Tag ออกจากโพสต์นี้', 'plusmagi-tags-reindex' ),
							onClick: function () {
								handleRemoveTag( tag.id );
							},
						} )
					);
				} )
		);

		return createElement(
			PluginDocumentSettingPanel,
			{
				name: 'plusmagi-tags-reindex-panel',
				title: __( 'ป้ายกำกับ (Reindex)', 'plusmagi-tags-reindex' ),
				className: 'plusmagi-tags-reindex-panel',
			},
			createElement( 'div', { style: { marginBottom: '15px' } }, toggleControl ),
			createElement(
				'div',
				{ style: { position: 'relative' } },
				textControlInput,
				spinner
			),
			tagsListElements
		);
	}

	registerPlugin( 'plusmagi-tags-reindex', {
		render: TagsPanel,
	} );

	wp.domReady( function() {
		wp.data.dispatch( 'core/edit-post' ).removeEditorPanel( 'taxonomy-panel-post_tag' );
	} );
} )( window.wp );

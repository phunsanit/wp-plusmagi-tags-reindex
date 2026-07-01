( function ( wp ) {
	if ( ! wp || ! wp.plugins || ! wp.editPost || ! wp.element || ! wp.components || ! wp.apiFetch || ! wp.data ) {
		return;
	}

	var registerPlugin = wp.plugins.registerPlugin;
	var PluginDocumentSettingPanel = wp.editPost.PluginDocumentSettingPanel;
	var createElement = wp.element.createElement;
	var useEffect = wp.element.useEffect;
	var useState = wp.element.useState;
	var Button = wp.components.Button;
	var TextControl = wp.components.TextControl;
	var Flex = wp.components.Flex;
	var FlexItem = wp.components.FlexItem;
	var apiFetch = wp.apiFetch;
	var useSelect = wp.data.useSelect;
	var useDispatch = wp.data.useDispatch;

	function toSlug( value ) {
		return ( value || '' )
			.toString()
			.toLowerCase()
			.trim()
			.replace( /\s+/g, '-' )
			.replace( /\//g, '-' )
			.replace( /[^a-z0-9\u0E00-\u0E7F-]/g, '' )
			.replace( /-+/g, '-' )
			.replace( /^-|-$/g, '' );
	}

	function normalizeBaseUrl( url ) {
		return ( url || '' ).replace( /\/+$/, '' );
	}

	function TagsPanel() {
		var _useState = useState( [] );
		var tags = _useState[ 0 ];
		var setTags = _useState[ 1 ];

		var _useState2 = useState( '' );
		var inputValue = _useState2[ 0 ];
		var setInputValue = _useState2[ 1 ];

		var _useState3 = useState( false );
		var loading = _useState3[ 0 ];
		var setLoading = _useState3[ 1 ];

		var selectedTagIds = useSelect( function ( select ) {
			var ids = select( 'core/editor' ).getEditedPostAttribute( 'tags' );
			return Array.isArray( ids ) ? ids : [];
		}, [] );

		var editorDispatch = useDispatch( 'core/editor' );

		var baseUrl = normalizeBaseUrl(
			window.plusmagiTagsConfig && window.plusmagiTagsConfig.frontendBaseUrl
				? window.plusmagiTagsConfig.frontendBaseUrl
				: window.location.origin
		);

		var loadTags = function ( tagIds ) {
			if ( ! tagIds || tagIds.length === 0 ) {
				setTags( [] );
				setLoading( false );
				return;
			}

			setLoading( true );
			apiFetch( {
				path:
					'/wp/v2/tags?include=' +
					tagIds.join( ',' ) +
					'&per_page=100&orderby=include&_fields=id,name,slug,count',
			} )
				.then( function ( response ) {
					var normalized = Array.isArray( response ) ? response.slice() : [];
					normalized.sort( function ( a, b ) {
						return ( a.name || '' ).localeCompare( b.name || '', 'th', {
							sensitivity: 'base',
							numeric: true,
						} );
					} );
					setTags( normalized );
				} )
				.catch( function () {
					setTags( [] );
				} )
				.finally( function () {
					setLoading( false );
				} );
		};

		useEffect( function () {
			loadTags( selectedTagIds );
		}, [ selectedTagIds.join( ',' ) ] );

		var handleAddTag = function () {
			var tagName = inputValue.trim();
			if ( ! tagName ) {
				return;
			}

			var attachTagToPost = function ( tagId ) {
				if ( ! selectedTagIds.includes( tagId ) ) {
					editorDispatch.editPost( { tags: selectedTagIds.concat( [ tagId ] ) } );
				}
				setInputValue( '' );
			};

			apiFetch( {
				path: '/wp/v2/tags?search=' + encodeURIComponent( tagName ) + '&per_page=20&_fields=id,name,slug,count',
			} )
				.then( function ( response ) {
					var existingTags = Array.isArray( response ) ? response : [];
					var existingTag = existingTags.find( function ( tag ) {
						return tag.name.toLowerCase() === tagName.toLowerCase();
					} );

					if ( existingTag && existingTag.id ) {
						attachTagToPost( existingTag.id );
						return null;
					}

					return apiFetch( {
						path: '/wp/v2/tags',
						method: 'POST',
						data: {
							name: tagName,
							slug: toSlug( tagName ),
						},
					} );
				} )
				.then( function ( createdTag ) {
					if ( createdTag && createdTag.id ) {
						attachTagToPost( createdTag.id );
					}
				} )
				.catch( function () {
					// Keep editor stable when API creation/search fails.
				} );
		};

		var handleRemoveTag = function ( tagId ) {
			editorDispatch.editPost( {
				tags: selectedTagIds.filter( function ( id ) {
					return id !== tagId;
				} ),
			} );
		};

		return createElement(
			PluginDocumentSettingPanel,
			{
				name: 'plusmagi-tags-reindex-panel',
				title: 'Tags (กำหนดเอง)',
				className: 'plusmagi-tags-reindex-panel',
			},
			createElement(
				'div',
				{
					style: { height: '500px', overflowY: 'auto', overflowX: 'hidden', marginBottom: '16px', paddingRight: '4px' },
				},
				loading
					? createElement( 'p', null, 'กำลังโหลดแท็ก...' )
					: tags.length === 0
						? createElement( 'p', null, 'โพสต์นี้ยังไม่มีแท็ก' )
					: tags.map( function ( tag ) {
						var tagLink = baseUrl + '/tag/' + tag.slug + '/';
						var publishCount = Number.isFinite( Number( tag.count ) ) ? Number( tag.count ) : 0;
						var scheduledCount = Number.isFinite( Number( tag.scheduled_count ) )
							? Number( tag.scheduled_count )
							: 0;
						var totalCount = publishCount + scheduledCount;
						var summaryParts = [];

						if ( publishCount > 0 ) {
							summaryParts.push( 'Publish ' + totalCount + ' บทความ' );
						}

						if ( scheduledCount > 0 ) {
							summaryParts.push( 'ตั้งเวลาไว้ ' + scheduledCount + ' บทความ' );
						}

						var summaryText = summaryParts.length > 0 ? summaryParts.join( ', ' ) : '';
						return createElement(
							'div',
							{
								key: tag.id,
								title: 'term_id: ' + tag.id,
								style: {
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '10px',
									padding: '8px',
									background: 'rgb(240, 240, 241)',
									borderRadius: '4px',
									border: '1px solid rgb(220, 220, 222)',
								},
							},
							createElement(
								'a',
								{
									href: tagLink,
									rel: 'tag',
									target: 'term_id_' + tag.id,
								},
								createElement(
									'strong',
									{ style: { display: 'block', fontSize: '13px' } },
									tag.name
								),
								summaryText
									? createElement(
										'span',
										{ style: { fontSize: '11px', color: 'rgb(100, 105, 112)' } },
										'(' + summaryText + ')'
									)
									: null
							),
							createElement( Button, {
								isSmall: true,
								isDestructive: true,
								className: 'has-icon',
								icon: 'no-alt',
								label: 'เอา Tag ออกจากโพสต์นี้',
								onClick: function () {
									handleRemoveTag( tag.id );
								},
							} )
						);
					} )
			),
			createElement(
				Flex,
				null,
				createElement(
					FlexItem,
					null,
					createElement( TextControl, {
						placeholder: 'เพิ่ม Tag ใหม่...',
						value: inputValue,
						onChange: function ( value ) {
							setInputValue( value );
						},
						onKeyDown: function ( event ) {
							if ( event.key === 'Enter' || event.key === ',' ) {
								event.preventDefault();
								handleAddTag();
							}
						},
					} )
				)
			)
		);
	}

	registerPlugin( 'plusmagi-tags-reindex', {
		render: TagsPanel,
	} );
} )( window.wp );

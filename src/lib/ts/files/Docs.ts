// Documentation structure for DB_Docs
// This represents the /notes/designs hierarchy
// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Run: bash notes/tools/create_docs_db_data.sh to regenerate

export interface DocNode {
	id: string;
	name: string;
	type: 'folder' | 'file';
	path: string;
	link?: string;
	children?: DocNode[];
}

export function getDocsStructure(): DocNode[] {
	return [
		{
			id: 'architecture',
			name: 'Architecture',
			type: 'folder',
			path: 'architecture',
			link: 'architecture/index',
			children: [
				{
					id: 'architecture_core',
					name: 'Core',
					type: 'folder',
					path: 'architecture/core',
					link: 'architecture/core/index',
					children: [
						{
							id: 'architecture_core_components',
							name: 'Components',
							type: 'file',
							path: 'architecture/core/components'
						},
						{
							id: 'architecture_core_databases',
							name: 'Databases',
							type: 'file',
							path: 'architecture/core/databases'
						},
						{
							id: 'architecture_core_geometry',
							name: 'Geometry',
							type: 'file',
							path: 'architecture/core/geometry'
						},
						{
							id: 'architecture_core_hits',
							name: 'Hits',
							type: 'file',
							path: 'architecture/core/hits'
						},
						{
							id: 'architecture_core_managers',
							name: 'Managers',
							type: 'file',
							path: 'architecture/core/managers'
						},
						{
							id: 'architecture_core_state',
							name: 'State',
							type: 'file',
							path: 'architecture/core/state'
						},
						{
							id: 'architecture_core_ux',
							name: 'Ux',
							type: 'file',
							path: 'architecture/core/ux'
						},
					]
				},
				{
					id: 'architecture_more',
					name: 'More',
					type: 'folder',
					path: 'architecture/more',
					link: 'architecture/more/index',
					children: [
						{
							id: 'architecture_more_persistable',
							name: 'Persistable',
							type: 'file',
							path: 'architecture/more/persistable'
						},
						{
							id: 'architecture_more_reactivity',
							name: 'Reactivity',
							type: 'file',
							path: 'architecture/more/reactivity'
						},
						{
							id: 'architecture_more_styles',
							name: 'Styles',
							type: 'file',
							path: 'architecture/more/styles'
						},
						{
							id: 'architecture_more_timers',
							name: 'Timers',
							type: 'file',
							path: 'architecture/more/timers'
						},
					]
				},
				{
					id: 'architecture_platforms',
					name: 'Platforms',
					type: 'folder',
					path: 'architecture/platforms',
					link: 'architecture/platforms/index',
					children: [
						{
							id: 'architecture_platforms_bubble',
							name: 'Bubble',
							type: 'file',
							path: 'architecture/platforms/bubble'
						},
						{
							id: 'architecture_platforms_svelte_5',
							name: 'Svelte.5',
							type: 'file',
							path: 'architecture/platforms/svelte.5'
						},
						{
							id: 'architecture_platforms_vitepress',
							name: 'Vitepress',
							type: 'file',
							path: 'architecture/platforms/vitepress'
						},
					]
				},
				{
					id: 'architecture_ux',
					name: 'Ux',
					type: 'folder',
					path: 'architecture/ux',
					link: 'architecture/ux/index',
					children: [
						{
							id: 'architecture_ux_breadcrumbs',
							name: 'Breadcrumbs',
							type: 'file',
							path: 'architecture/ux/breadcrumbs'
						},
						{
							id: 'architecture_ux_buttons',
							name: 'Buttons',
							type: 'file',
							path: 'architecture/ux/buttons'
						},
						{
							id: 'architecture_ux_controls',
							name: 'Controls',
							type: 'file',
							path: 'architecture/ux/controls'
						},
						{
							id: 'architecture_ux_details',
							name: 'Details',
							type: 'file',
							path: 'architecture/ux/details'
						},
						{
							id: 'architecture_ux_paging',
							name: 'Paging',
							type: 'file',
							path: 'architecture/ux/paging'
						},
						{
							id: 'architecture_ux_preferences',
							name: 'Preferences',
							type: 'file',
							path: 'architecture/ux/preferences'
						},
						{
							id: 'architecture_ux_search',
							name: 'Search',
							type: 'file',
							path: 'architecture/ux/search'
						},
						{
							id: 'architecture_ux_titles',
							name: 'Titles',
							type: 'file',
							path: 'architecture/ux/titles'
						},
					]
				},
			]
		},
		{
			id: 'digest',
			name: 'Digest',
			type: 'file',
			path: 'digest'
		},
		{
			id: 'guides',
			name: 'Guides',
			type: 'folder',
			path: 'guides',
			link: 'guides/index',
			children: [
				{
					id: 'guides_access',
					name: 'Access',
					type: 'file',
					path: 'guides/access'
				},
				{
					id: 'guides_chat',
					name: 'Chat',
					type: 'file',
					path: 'guides/chat'
				},
				{
					id: 'guides_composition',
					name: 'Composition',
					type: 'file',
					path: 'guides/composition'
				},
				{
					id: 'guides_debugging',
					name: 'Debugging',
					type: 'file',
					path: 'guides/debugging'
				},
				{
					id: 'guides_gotchas',
					name: 'Gotchas',
					type: 'file',
					path: 'guides/gotchas'
				},
				{
					id: 'guides_markdown',
					name: 'Markdown',
					type: 'file',
					path: 'guides/markdown'
				},
				{
					id: 'guides_migration',
					name: 'Migration',
					type: 'file',
					path: 'guides/migration'
				},
				{
					id: 'guides_refactoring',
					name: 'Refactoring',
					type: 'file',
					path: 'guides/refactoring'
				},
				{
					id: 'guides_style',
					name: 'Style',
					type: 'file',
					path: 'guides/style'
				},
				{
					id: 'guides_voice',
					name: 'Voice',
					type: 'file',
					path: 'guides/voice'
				},
			]
		},
		{
			id: 'overview',
			name: 'Overview',
			type: 'file',
			path: 'overview'
		},
		{
			id: 'project',
			name: 'Project',
			type: 'file',
			path: 'project'
		},
		{
			id: 'work',
			name: 'Work',
			type: 'folder',
			path: 'work',
			link: 'work/index',
			children: [
				{
					id: 'work_book',
					name: 'Book',
					type: 'file',
					path: 'work/book'
				},
				{
					id: 'work_done',
					name: 'Done',
					type: 'folder',
					path: 'work/done',
					link: 'work/done/index',
					children: [
						{
							id: 'work_done_focus',
							name: 'Focus',
							type: 'file',
							path: 'work/done/focus'
						},
						{
							id: 'work_done_migration',
							name: 'Migration',
							type: 'folder',
							path: 'work/done/migration',
							link: 'work/done/migration/index',
							children: [
								{
									id: 'work_done_migration_focus',
									name: 'Focus',
									type: 'file',
									path: 'work/done/migration/focus'
								},
								{
									id: 'work_done_migration_grow_shrink',
									name: 'Grow Shrink',
									type: 'file',
									path: 'work/done/migration/grow-shrink'
								},
							]
						},
						{
							id: 'work_done_refactoring',
							name: 'Refactoring',
							type: 'folder',
							path: 'work/done/refactoring',
							link: 'work/done/refactoring/index',
							children: [
								{
									id: 'work_done_refactoring_banners',
									name: 'Banners',
									type: 'file',
									path: 'work/done/refactoring/banners'
								},
								{
									id: 'work_done_refactoring_breadcrumbs',
									name: 'Breadcrumbs',
									type: 'file',
									path: 'work/done/refactoring/breadcrumbs'
								},
								{
									id: 'work_done_refactoring_layout',
									name: 'Layout',
									type: 'file',
									path: 'work/done/refactoring/layout'
								},
							]
						},
						{
							id: 'work_done_vitepress',
							name: 'Vitepress',
							type: 'folder',
							path: 'work/done/vitepress',
							link: 'work/done/vitepress/index',
							children: [
								{
									id: 'work_done_vitepress_redox',
									name: 'Redox',
									type: 'file',
									path: 'work/done/vitepress/redox'
								},
								{
									id: 'work_done_vitepress_webseriously_driven_docs',
									name: 'Webseriously Driven Docs',
									type: 'file',
									path: 'work/done/vitepress/webseriously-driven-docs'
								},
							]
						},
					]
				},
				{
					id: 'work_next',
					name: 'Next',
					type: 'folder',
					path: 'work/next',
					link: 'work/next/index',
					children: [
						{
							id: 'work_next_ai_ux_spider_guide',
							name: 'Ai Ux Spider Guide',
							type: 'file',
							path: 'work/next/ai-ux-spider-guide'
						},
						{
							id: 'work_next_holons_api',
							name: 'Holons.api',
							type: 'file',
							path: 'work/next/holons.api'
						},
						{
							id: 'work_next_resize_optimization_ai',
							name: 'Resize Optimization Ai',
							type: 'file',
							path: 'work/next/Resize_Optimization_AI'
						},
					]
				},
				{
					id: 'work_search_links',
					name: 'Search Links',
					type: 'file',
					path: 'work/search-links'
				},
			]
		},
	];
}

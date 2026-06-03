<template>
  <div class="min-h-screen bg-[#07131f] text-[#e6eefc] font-sans">
    <nav class="sticky top-0 z-50 border-b border-[#1c3047] bg-[rgba(7,19,31,0.9)] backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <a href="#home" class="text-lg font-extrabold tracking-tight text-white">PlusMagi Site Search</a>
        <div class="hidden gap-6 text-sm text-[#b8c7dc] md:flex">
          <a href="#features" class="hover:text-white">Features</a>
          <a href="#use-cases" class="hover:text-white">Use Cases</a>
          <a href="#documentation" class="hover:text-white">Documentation</a>
          <a href="#faq" class="hover:text-white">FAQ</a>
        </div>
        <a
          href="https://wordpress.org/plugins/plusmagi-site-search"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-sm bg-[#e4572e] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#ff6e45]"
        >
          Download Plugin
        </a>
      </div>
    </nav>

    <main>
      <section id="home" class="relative overflow-hidden border-b border-[#15283d] px-5 py-16 md:px-8 md:py-24">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(228,87,46,0.12),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(44,120,255,0.18),transparent_28%)]"></div>
        <div class="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <p class="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-[#ff9d7a]">WordPress Ajax Search Plugin</p>
            <h1 class="max-w-4xl text-4xl font-black leading-tight tracking-[-0.04em] text-white md:text-6xl">
              Faster WordPress Site Search for Posts, Taxonomies, Custom Fields, and WooCommerce SKU
            </h1>
            <p class="mt-6 max-w-3xl text-lg leading-8 text-[#bfd0e8]">
              PlusMagi Site Search is a WordPress site search plugin built for websites that need more than the default search box.
              It adds Ajax live search, custom fields search, category and tag results, WooCommerce SKU lookup, and role-based visibility
              so visitors can find the right content faster.
            </p>
            <div class="mt-8 flex flex-wrap gap-4">
              <a
                href="https://wordpress.org/plugins/plusmagi-site-search"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-sm bg-[#e4572e] px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#ff6e45]"
              >
                Get Plugin
              </a>
              <a
                href="https://pitt.plusmagi.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-sm border border-[#2c4869] px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-[#d7e3f7] transition hover:border-[#4d6d93] hover:text-white"
              >
                View Live Demo
              </a>
            </div>
            <div class="mt-10 grid gap-4 md:grid-cols-3">
              <div class="rounded border border-[#20364f] bg-[#0d1b2a] p-4">
                <div class="text-2xl font-black text-white">Ajax</div>
                <p class="mt-2 text-sm leading-6 text-[#aebfd6]">Live search results without a full page reload.</p>
              </div>
              <div class="rounded border border-[#20364f] bg-[#0d1b2a] p-4">
                <div class="text-2xl font-black text-white">Meta</div>
                <p class="mt-2 text-sm leading-6 text-[#aebfd6]">Search custom fields and product identifiers such as SKU.</p>
              </div>
              <div class="rounded border border-[#20364f] bg-[#0d1b2a] p-4">
                <div class="text-2xl font-black text-white">Roles</div>
                <p class="mt-2 text-sm leading-6 text-[#aebfd6]">Show only the content each visitor is allowed to see.</p>
              </div>
            </div>
          </div>

          <aside class="rounded border border-[#1f3550] bg-[#0b1725] p-6">
            <h2 class="text-xl font-extrabold text-white">Why this plugin ranks for real search needs</h2>
            <ul class="mt-5 space-y-4 text-sm leading-7 text-[#bfd0e8]">
              <li><strong class="text-white">WordPress Ajax search plugin:</strong> instant results for users who do not want a slow search page.</li>
              <li><strong class="text-white">WordPress custom fields search:</strong> useful for directories, product catalogs, and internal knowledge bases.</li>
              <li><strong class="text-white">WooCommerce SKU search:</strong> helps customers search by product code and metadata.</li>
              <li><strong class="text-white">WordPress taxonomy search:</strong> shows category and tag results in separate tabs.</li>
              <li><strong class="text-white">Block and shortcode support:</strong> easy to add in editors, widgets, or theme templates.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section id="features" class="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div class="max-w-4xl">
          <h2 class="text-3xl font-black tracking-tight text-white md:text-4xl">WordPress search features built for relevance, speed, and control</h2>
          <p class="mt-4 text-lg leading-8 text-[#b8c7dc]">
            PlusMagi Site Search improves internal search quality for content-heavy WordPress websites. Instead of returning only basic post
            matches, it can search post titles, post content, categories, tags, and selected custom fields. The result is a more complete
            WordPress search experience for publishers, business sites, membership portals, and WooCommerce stores.
          </p>
        </div>

        <div class="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="feature in features" :key="feature.title" class="rounded border border-[#20364f] bg-[#0d1b2a] p-5">
            <h3 class="text-lg font-bold text-white">{{ feature.title }}</h3>
            <p class="mt-3 text-sm leading-7 text-[#b8c7dc]">{{ feature.description }}</p>
          </article>
        </div>

        <div class="mt-12 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h3 class="text-2xl font-bold text-white">Search visibility by user role</h3>
            <p class="mt-3 text-[#b8c7dc] leading-7">
              Search results respect access levels so public visitors do not see restricted content while administrators and editors can search
              deeper into drafts, pending posts, and private content when appropriate.
            </p>
            <div class="mt-5 overflow-hidden rounded border border-[#20364f]">
              <table class="min-w-full text-left text-sm">
                <thead class="bg-[#14263a] text-[#dfe9fa]">
                  <tr>
                    <th class="px-4 py-3">User Role</th>
                    <th class="px-4 py-3">Visible Results</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-t border-[#20364f]">
                    <td class="px-4 py-3 text-white">Public</td>
                    <td class="px-4 py-3 text-[#b8c7dc]">Published posts, pages, categories, and tags only</td>
                  </tr>
                  <tr class="border-t border-[#20364f]">
                    <td class="px-4 py-3 text-white">Author</td>
                    <td class="px-4 py-3 text-[#b8c7dc]">Published content plus own draft or pending entries</td>
                  </tr>
                  <tr class="border-t border-[#20364f]">
                    <td class="px-4 py-3 text-white">Admin and Editor</td>
                    <td class="px-4 py-3 text-[#b8c7dc]">All indexed content across statuses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 class="text-2xl font-bold text-white">Example Ajax live search interface</h3>
            <p class="mt-3 text-[#b8c7dc] leading-7">
              The preview below shows how results can be grouped into separate tabs for posts, categories, and tags. This structure helps users
              scan search results faster and makes it easier to surface archive pages alongside individual posts.
            </p>
            <div class="mt-5 overflow-hidden rounded border border-[#20364f] bg-[#0d1b2a]">
              <div class="grid grid-cols-3 bg-[#14263a] text-sm font-semibold">
                <button
                  type="button"
                  class="border-r border-[#20364f] px-4 py-3 text-left transition-colors"
                  :class="activePreviewTab === 'posts' ? 'bg-[#1d344c] text-[#ffb49e]' : 'text-[#d7e3f7] hover:text-white'"
                  @click="activePreviewTab = 'posts'"
                >
                  Posts (3)
                </button>
                <button
                  type="button"
                  class="border-r border-[#20364f] px-4 py-3 text-left transition-colors"
                  :class="activePreviewTab === 'category' ? 'bg-[#1d344c] text-[#ffb49e]' : 'text-[#d7e3f7] hover:text-white'"
                  @click="activePreviewTab = 'category'"
                >
                  Category (2)
                </button>
                <button
                  type="button"
                  class="px-4 py-3 text-left transition-colors"
                  :class="activePreviewTab === 'tag' ? 'bg-[#1d344c] text-[#ffb49e]' : 'text-[#d7e3f7] hover:text-white'"
                  @click="activePreviewTab = 'tag'"
                >
                  Tag (2)
                </button>
              </div>
              <div class="space-y-3 p-4">
                <div
                  v-for="item in previewResults[activePreviewTab]"
                  :key="`${activePreviewTab}-${item.title}`"
                  class="rounded border border-[#20364f] bg-[#112233] p-3"
                >
                  <div class="font-semibold text-white">{{ item.title }}</div>
                  <div class="text-sm text-[#aabbd0]">{{ item.meta }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="use-cases" class="border-y border-[#15283d] bg-[#091623] px-5 py-16 md:px-8">
        <div class="mx-auto max-w-6xl">
          <h2 class="text-3xl font-black tracking-tight text-white md:text-4xl">Best use cases for PlusMagi Site Search</h2>
          <div class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <article v-for="useCase in useCases" :key="useCase.title" class="rounded border border-[#1d3248] bg-[#0d1b2a] p-5">
              <h3 class="text-lg font-bold text-white">{{ useCase.title }}</h3>
              <p class="mt-3 text-sm leading-7 text-[#b8c7dc]">{{ useCase.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="documentation" class="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div class="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h2 class="text-3xl font-black tracking-tight text-white md:text-4xl">Installation and implementation</h2>
            <p class="mt-4 text-lg leading-8 text-[#b8c7dc]">
              The plugin is designed to be simple to deploy on WordPress while still giving developers flexible output options for different site layouts.
            </p>

            <h3 class="mt-8 text-2xl font-bold text-white">Install from WordPress.org</h3>
            <ol class="mt-4 list-decimal space-y-3 pl-6 text-[#d2ddef]">
              <li>Open <strong>Plugins &gt; Add New</strong> in your WordPress admin area.</li>
              <li>Search for <strong>PlusMagi Site Search</strong>.</li>
              <li>Click <strong>Install Now</strong> and then <strong>Activate</strong>.</li>
              <li>Add the search block to a page, post, or widget area.</li>
            </ol>

            <h3 class="mt-8 text-2xl font-bold text-white">Add search to your layout</h3>
            <ul class="mt-4 list-disc space-y-3 pl-6 text-[#d2ddef]">
              <li>Use the WordPress block editor for a no-code setup.</li>
              <li>Insert the shortcode <code class="rounded bg-[#102033] px-2 py-1 text-[#ffd0c1]">[plusmagi-site-search]</code> in content areas.</li>
              <li>Embed the shortcode in templates when you need the search widget inside headers, sidebars, landing pages, or product pages.</li>
            </ul>

            <div class="mt-6 rounded border border-[#1d3248] bg-[#0d1b2a] p-5 text-sm leading-7 text-[#b8c7dc]">
              <strong class="text-white">Developer note:</strong> You can adapt the styling with your theme CSS so the live search dropdown matches existing navigation,
              sidebar, or WooCommerce product layouts.
            </div>
          </div>

          <div class="rounded border border-[#1d3248] bg-[#0d1b2a] p-6">
            <h3 class="text-2xl font-bold text-white">What the plugin can search</h3>
            <dl class="mt-5 space-y-5 text-sm leading-7 text-[#b8c7dc]">
              <div>
                <dt class="font-bold text-white">Posts and pages</dt>
                <dd>Searchable by title and content for standard WordPress publishing workflows.</dd>
              </div>
              <div>
                <dt class="font-bold text-white">Custom fields and metadata</dt>
                <dd>Useful for product codes, internal references, directory entries, and structured data stored in post meta.</dd>
              </div>
              <div>
                <dt class="font-bold text-white">Categories and tags</dt>
                <dd>Taxonomy matches appear in their own grouped tabs to improve result discovery.</dd>
              </div>
              <div>
                <dt class="font-bold text-white">WooCommerce SKU values</dt>
                <dd>Customers can search by known product identifiers when SKU data is stored in searchable fields.</dd>
              </div>
              <div>
                <dt class="font-bold text-white">Restricted content by role</dt>
                <dd>Logged-in users can see only the search results that match their permissions.</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section id="faq" class="border-t border-[#15283d] bg-[#091623] px-5 py-16 md:px-8">
        <div class="mx-auto max-w-4xl">
          <h2 class="text-3xl font-black tracking-tight text-white md:text-4xl">Frequently asked questions about WordPress search</h2>
          <div class="mt-8 space-y-5">
            <article v-for="faq in faqs" :key="faq.question" class="rounded border border-[#1d3248] bg-[#0d1b2a] p-5">
              <h3 class="text-lg font-bold text-white">{{ faq.question }}</h3>
              <p class="mt-3 text-sm leading-7 text-[#b8c7dc]">{{ faq.answer }}</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activePreviewTab = ref<'posts' | 'category' | 'tag'>('posts')

const features = [
  {
    title: 'Ajax live search for WordPress',
    description: 'Return results while the visitor types, reducing friction and helping users discover content faster than default WordPress search.',
  },
  {
    title: 'Custom fields and meta search',
    description: 'Search metadata such as SKU, codes, internal labels, and structured content stored in post meta fields.',
  },
  {
    title: 'WooCommerce SKU search support',
    description: 'Make product lookup easier when customers search by SKU or internal product identifiers instead of full product names.',
  },
  {
    title: 'Grouped taxonomy results',
    description: 'Show categories and tags in separate tabs so archive pages become part of the discovery flow, not hidden content.',
  },
  {
    title: 'Role-based search visibility',
    description: 'Respect user permissions so restricted content stays restricted while administrators and editors can search more deeply.',
  },
  {
    title: 'Shortcode and block support',
    description: 'Add the search interface in the block editor, inside shortcode-ready content, or in theme templates for custom layouts.',
  },
] as const

const useCases = [
  {
    title: 'Content-heavy blogs',
    description: 'Help readers navigate large archives with faster WordPress live search and clearer result grouping.',
  },
  {
    title: 'WooCommerce stores',
    description: 'Improve product discovery when users search by SKU, product terms, categories, and related metadata.',
  },
  {
    title: 'Knowledge bases',
    description: 'Search internal references, structured entries, and taxonomy pages more effectively than default WordPress search.',
  },
  {
    title: 'Membership sites',
    description: 'Keep protected content hidden from public visitors while still supporting useful search for logged-in roles.',
  },
] as const

const faqs = [
  {
    question: 'What makes this different from default WordPress search?',
    answer: 'Default WordPress search often misses metadata, taxonomies, and product identifiers. PlusMagi Site Search adds Ajax live search, custom field search, taxonomy grouping, and role-aware result visibility.',
  },
  {
    question: 'Can this WordPress search plugin search WooCommerce SKU values?',
    answer: 'Yes. The plugin can search metadata stored in custom fields, which makes it suitable for WooCommerce SKU search and other product reference lookups.',
  },
  {
    question: 'Can I use the plugin in a sidebar, landing page, or template file?',
    answer: 'Yes. You can insert it with a WordPress block, place the shortcode in content, or embed the shortcode inside theme templates where you need site search to appear.',
  },
  {
    question: 'Does it work for private or restricted content?',
    answer: 'Yes. Results are filtered by user role so visitors see only content they are allowed to access, while administrators and editors can search more complete sets of content.',
  },
  {
    question: 'Is it suitable for SEO-focused websites?',
    answer: 'Yes. Better site search can improve content discovery, page depth, and user engagement by helping visitors find relevant posts, pages, and taxonomy archives faster.',
  },
] as const

const previewResults = {
  posts: [
    { title: 'How to Configure PlusMagi Search', meta: 'Published - Post' },
    { title: 'WooCommerce SKU Search Setup', meta: 'Published - Post' },
    { title: 'Internal Knowledge Base Search', meta: 'Private - Post' },
  ],
  category: [
    { title: 'Documentation', meta: 'Category Archive' },
    { title: 'WooCommerce', meta: 'Category Archive' },
  ],
  tag: [
    { title: 'live-search', meta: 'Tag Archive' },
    { title: 'sku-filter', meta: 'Tag Archive' },
  ],
} as const
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;800;900&display=swap');
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
}
body {
  font-family: 'Inter', sans-serif;
}
</style>

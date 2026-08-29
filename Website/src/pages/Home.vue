<template>
  <div class="page-shell min-h-screen text-[#1f2b2d]">
    <div class="ambient-bg" aria-hidden="true"></div>

    <header class="sticky top-0 z-30 border-b border-[#2f5f60]/20 bg-[#f8f5ef]/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <a href="#top" class="brand text-lg font-black tracking-tight text-[#16353b]">PlusMagi Tags Reindex</a>
        <nav class="hidden items-center gap-5 text-sm font-semibold text-[#355b61] md:flex">
          <a href="#screenshots" class="hover:text-[#17353a]">Screenshots</a>
          <a href="#what" class="hover:text-[#17353a]">What</a>
          <a href="#causes" class="hover:text-[#17353a]">Causes</a>
          <a href="#fix" class="hover:text-[#17353a]">Fix Flow</a>
          <a href="#reindex" class="hover:text-[#17353a]">Reindex</a>
          <a href="#prevention" class="hover:text-[#17353a]">Prevention</a>
        </nav>
      </div>
    </header>

    <main id="top" class="relative z-10">
      <section class="mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-12 md:grid-cols-[1.2fr_0.8fr] md:pb-16 md:pt-16">
        <div class="reveal-up">
          <p class="eyebrow">WordPress Troubleshooting Guide</p>
          <h1 class="hero-title mt-4 text-4xl leading-tight sm:text-5xl md:text-6xl">
            Fix Conflicting Term Slugs
            <span class="block text-[#cb4f2d]">Without Breaking URLs</span>
          </h1>
          <p class="mt-6 max-w-2xl text-base leading-relaxed text-[#365b61] sm:text-lg">
            Conflicting Term Slugs happen when multiple terms compete for the same slug path and WordPress cannot resolve the right archive URL.
            This page gives you a practical fix workflow plus a safe term reindex routine.
          </p>
          <div class="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="https://wordpress.org/plugins/plusmagi-tags-reindex/" class="inline-flex justify-center rounded-full bg-[#cb4f2d] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#a93e23]">
              Get the Plugin
            </a>
            <a href="#fix" class="inline-flex justify-center rounded-full bg-[#173a3f] px-6 py-3 text-sm font-bold text-[#f9f5ee] transition hover:bg-[#0f2b2f]">
              Start Fix Steps
            </a>
            <a href="#reindex" class="inline-flex justify-center rounded-full border border-[#173a3f]/30 bg-[#fffdf8] px-6 py-3 text-sm font-bold text-[#173a3f] transition hover:border-[#173a3f]/60">
              Jump to Reindex
            </a>
          </div>
          <div class="mt-6 rounded-2xl border border-[#2f7e6a]/20 bg-[#2f7e6a]/10 p-4 text-sm text-[#1f4f42]">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <strong>Plugin update: v{{ pluginRelease.version }}</strong>
              <span class="text-xs font-semibold uppercase tracking-[0.12em]">Latest release</span>
            </div>
            <ul class="mt-2 list-disc space-y-1 pl-5">
              <li v-for="item in pluginRelease.changelogItems" :key="item">{{ item }}</li>
            </ul>
          </div>
          <img
            :src="bannerImage"
            alt="PlusMagi Tags Reindex hero banner"
            class="mt-8 w-full max-w-4xl rounded-2xl border border-[#355d63]/25 shadow-[0_24px_70px_-35px_rgba(23,58,63,0.45)]"
          />
        </div>

        <aside class="reveal-up delay-1 rounded-3xl border border-[#1c4d56]/15 bg-[#fffef9] p-5 shadow-[0_24px_70px_-35px_rgba(23,58,63,0.45)]">
          <h2 class="panel-title text-lg font-extrabold text-[#1a3c43]">Fast Diagnostic</h2>
          <ul class="mt-4 space-y-3 text-sm text-[#33575d]">
            <li class="diag-row"><span class="dot bg-[#cb4f2d]"></span>Category and Tag share the same slug</li>
            <li class="diag-row"><span class="dot bg-[#e78f2f]"></span>Old term still exists in Trash</li>
            <li class="diag-row"><span class="dot bg-[#2f7e6a]"></span>SEO plugin flags duplicate archive path</li>
            <li class="diag-row"><span class="dot bg-[#2f5f9f]"></span>WordPress auto-appends <strong>-2</strong> repeatedly</li>
          </ul>
          <div class="mt-5 rounded-2xl border border-[#2f7e6a]/20 bg-[#2f7e6a]/10 p-4 text-sm text-[#1f4f42]">
            Rule of thumb: if a slug conflict appears, resolve slug clarity first, then run a controlled reindex to normalize terms.
          </div>
        </aside>
      </section>

      <section id="screenshots" class="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 md:pb-14">
        <div class="reveal-up flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="eyebrow">Live WordPress UI</p>
            <h2 class="section-title mt-3 text-2xl font-black text-[#16363d] md:text-3xl">Manage Tags Where You Work</h2>
          </div>
          <a href="https://wordpress.org/plugins/plusmagi-tags-reindex/#description" class="text-sm font-bold text-[#a43e24] hover:text-[#762713]">
            View on WordPress.org →
          </a>
        </div>
        <div class="mt-5 grid gap-5 md:grid-cols-2">
          <figure v-for="(screenshot, index) in screenshots" :key="screenshot.src" class="reveal-up overflow-hidden rounded-2xl border border-[#274e53]/20 bg-[#fffef9] shadow-[0_20px_55px_-38px_rgba(23,58,63,0.5)]" :class="{ 'md:col-span-2': index === 0 }" :style="{ animationDelay: `${index * 100}ms` }">
            <img :src="screenshot.src" :alt="screenshot.alt" class="aspect-video w-full object-cover object-top" loading="lazy" />
            <figcaption class="border-t border-[#274e53]/15 px-4 py-3 text-sm font-semibold text-[#355b61]">
              {{ screenshot.caption }}
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="what" class="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 md:pb-14">
        <article class="reveal-up rounded-3xl border border-[#274e53]/15 bg-[#fffef9] p-6 md:p-8">
          <h2 class="section-title text-2xl font-black text-[#16363d] md:text-3xl">What Is a Conflicting Term Slug?</h2>
          <p class="mt-4 text-[#395d62]">
            In WordPress, a term is an entry inside a taxonomy such as Categories, Tags, or Product Categories. A slug is the URL-safe identifier.
            A conflict occurs when two terms map to the same slug shape and routing becomes ambiguous.
          </p>
          <p class="mt-3 text-[#395d62]">
            Result: warning notices, forced suffixes like <strong>-2</strong>, wrong archive landing pages, or SEO duplicate-path alerts.
          </p>
        </article>
      </section>

      <section id="causes" class="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 md:pb-14">
        <h2 class="section-title reveal-up text-2xl font-black text-[#16363d] md:text-3xl">Common Causes</h2>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <article v-for="(cause, index) in causes" :key="cause.title" class="reveal-up card p-5" :style="{ animationDelay: `${index * 90}ms` }">
            <h3 class="text-lg font-extrabold text-[#1b3f46]">{{ cause.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[#3b5f64]">{{ cause.text }}</p>
          </article>
        </div>
      </section>

      <section id="fix" class="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 md:pb-14">
        <div class="rounded-3xl border border-[#1f4a50]/15 bg-[#13343a] p-6 text-[#ecf4f2] md:p-8">
          <h2 class="section-title text-2xl font-black md:text-3xl">Fix Workflow (Step by Step)</h2>
          <ol class="mt-5 grid gap-4 md:grid-cols-2">
            <li v-for="(step, index) in fixSteps" :key="step.title" class="step-card reveal-up" :style="{ animationDelay: `${index * 110}ms` }">
              <p class="text-xs font-extrabold tracking-[0.16em] text-[#f3b24f]">STEP {{ index + 1 }}</p>
              <h3 class="mt-1 text-lg font-black text-white">{{ step.title }}</h3>
              <p class="mt-2 text-sm text-[#d2e2df]">{{ step.text }}</p>
            </li>
          </ol>
        </div>
      </section>

      <section id="reindex" class="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 md:pb-14">
        <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article class="reveal-up rounded-3xl border border-[#355d63]/20 bg-[#fffefb] p-6 md:p-7">
            <h2 class="section-title text-2xl font-black text-[#16363d]">Reindex Terms Safely</h2>
            <p class="mt-3 text-[#3a5f65]">
              After slug cleanup, use PlusMagi Tags Reindex to normalize term creation flow and avoid recycled mistakes.
            </p>
            <ul class="mt-4 space-y-3 text-sm text-[#355b61]">
              <li class="diag-row"><span class="dot bg-[#cb4f2d]"></span>Open Settings > Tags Reindex in wp-admin.</li>
              <li class="diag-row"><span class="dot bg-[#2f7e6a]"></span>Run Fix Conflicting Term Slugs once to normalize <strong>-2</strong> style leftovers.</li>
              <li class="diag-row"><span class="dot bg-[#2f5f9f]"></span>Choose ID mode: reuse gaps or default auto-increment.</li>
              <li class="diag-row"><span class="dot bg-[#e78f2f]"></span>Import or add terms and validate term URLs immediately.</li>
            </ul>
          </article>

          <aside class="reveal-up delay-1 rounded-3xl border border-[#cb4f2d]/20 bg-[#fff6f2] p-6">
            <h3 class="text-lg font-black text-[#7e2a16]">SEO Safety Reminder</h3>
            <p class="mt-2 text-sm text-[#8a3a24]">
              If a changed slug was already indexed, add a 301 redirect from the old URL to the new canonical term URL.
              This protects rankings and prevents user-facing 404s.
            </p>
            <div class="mt-4 rounded-2xl border border-[#cb4f2d]/25 bg-white p-4 text-sm text-[#6f2d1b]">
              Redirect target should be the final slug you plan to keep long-term. Avoid chained redirects.
            </div>
          </aside>
        </div>
      </section>

      <section id="prevention" class="mx-auto max-w-6xl scroll-mt-24 px-4 pb-20">
        <div class="rounded-3xl border border-[#23474d]/20 bg-[#f2f8f7] p-6 md:p-8">
          <h2 class="section-title text-2xl font-black text-[#16363d] md:text-3xl">Prevention for the Long Run</h2>
          <div class="mt-5 grid gap-4 md:grid-cols-3">
            <article v-for="item in prevention" :key="item.title" class="card reveal-up p-5">
              <h3 class="text-base font-black text-[#1b3f46]">{{ item.title }}</h3>
              <p class="mt-2 text-sm text-[#3b5f64]">{{ item.text }}</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { releaseMeta } from '../generated/release-meta';

const svnAssetBase = 'https://ps.w.org/plusmagi-tags-reindex/assets';
const bannerImage = `${svnAssetBase}/banner-1544x500.png`;

const pluginRelease = {
  version: releaseMeta.version,
  changelogItems: releaseMeta.changelogItems,
};

const screenshots = [
  {
    src: `${svnAssetBase}/screenshot-1.jpg`,
    alt: 'PlusMagi Tags Reindex settings and bulk import tools in WordPress',
    caption: 'Configure gap filling and import tags in bulk from one settings page.',
  },
  {
    src: `${svnAssetBase}/screenshot-2.jpg`,
    alt: 'PlusMagi Tags Reindex controls in the Gutenberg editor sidebar',
    caption: 'Add and manage tags without leaving the Gutenberg editor.',
  },
  {
    src: `${svnAssetBase}/screenshot-3.jpg`,
    alt: 'Tag usage summary showing published and draft counts',
    caption: 'Review tag usage, publishing counts, and totals at a glance.',
  },
];

const causes = [
  {
    title: 'Category and Tag Share the Same Slug',
    text: 'Two taxonomies can accidentally produce the same URL segment. WordPress then needs to guess which archive should answer that path.',
  },
  {
    title: 'Parent and Child Structures Become Ambiguous',
    text: 'Nested terms with similar slug paths can create routing confusion, especially after restructuring taxonomy trees.',
  },
  {
    title: 'Deleted Terms Still in Trash',
    text: 'A deleted term that remains in Trash can still reserve slug history, causing forced suffixes like -2 when recreating names.',
  },
  {
    title: 'SEO and Commerce Plugin Validation',
    text: 'Plugins such as Rank Math, Yoast, and WooCommerce often detect permalink duplication earlier and surface warnings immediately.',
  },
];

const fixSteps = [
  {
    title: 'Create a Full Backup First',
    text: 'Take a database backup or snapshot before changing taxonomy structure. This gives you a clean rollback point.',
  },
  {
    title: 'Empty Term Trash Completely',
    text: 'Check Categories, Tags, and Product Categories trash bins. Permanently delete stale items that may reserve old slugs.',
  },
  {
    title: 'Find Duplicate or Colliding Slugs',
    text: 'Search terms by slug and identify all entries sharing the same path pattern, even across different taxonomies.',
  },
  {
    title: 'Rename Slugs with Clear Intent',
    text: 'Use distinct, descriptive slugs such as mobile-phones and mobile-news instead of generic duplicates.',
  },
  {
    title: 'Apply 301 Redirects for Old URLs',
    text: 'If old slugs were indexed or linked, add redirects from old paths to final term URLs before going live.',
  },
  {
    title: 'Run Term Reindex and Verify',
    text: 'Use the plugin maintenance flow to normalize terms, then test affected archive URLs and editor tag behavior.',
  },
];

const prevention = [
  {
    title: 'Define Taxonomy Rules Early',
    text: 'Separate category naming from tag naming so editorial teams do not reuse the same high-level words everywhere.',
  },
  {
    title: 'Audit URL Prefix Settings',
    text: 'Be careful with removing category base prefixes. Flat URL structures can increase collision risk with pages and posts.',
  },
  {
    title: 'Validate Before Recreating Terms',
    text: 'Before recreating a deleted term, confirm it is fully removed from Trash and no redirect points to conflicting paths.',
  },
];
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap');

.page-shell {
  font-family: 'Sora', sans-serif;
  background: #f8f5ef;
}

.ambient-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 5% 8%, rgba(203, 79, 45, 0.22), transparent 25%),
    radial-gradient(circle at 88% 18%, rgba(47, 126, 106, 0.2), transparent 22%),
    radial-gradient(circle at 58% 85%, rgba(47, 95, 159, 0.15), transparent 26%);
}

.brand,
.hero-title,
.section-title,
.panel-title {
  font-family: 'Fraunces', serif;
}

.eyebrow {
  display: inline-flex;
  border: 1px solid rgba(23, 58, 63, 0.25);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  padding: 0.38rem 0.78rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #254e56;
}

.card {
  border-radius: 1.1rem;
  border: 1px solid rgba(38, 75, 82, 0.18);
  background: rgba(255, 255, 255, 0.88);
}

.step-card {
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  padding: 1rem;
}

.diag-row {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.dot {
  margin-top: 0.42rem;
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.reveal-up {
  opacity: 0;
  transform: translateY(16px);
  animation: revealUp 560ms cubic-bezier(0.2, 0.75, 0.18, 1) forwards;
}

.delay-1 {
  animation-delay: 150ms;
}

@keyframes revealUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

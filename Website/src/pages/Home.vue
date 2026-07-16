<template>
  <div class="min-h-screen text-slate-100 bg-[#0d1224]">
    <div class="pointer-events-none fixed inset-0 opacity-70" style="background-image: radial-gradient(circle at 8% 15%, rgba(255, 94, 58, 0.24), transparent 30%), radial-gradient(circle at 85% 8%, rgba(61, 180, 242, 0.2), transparent 28%), linear-gradient(135deg, rgba(16, 24, 48, 1) 0%, rgba(10, 15, 34, 1) 50%, rgba(11, 10, 32, 1) 100%);"></div>

    <header class="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md bg-[#0f1732]/70">
      <div class="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
        <a href="#home" class="font-black tracking-tight text-base sm:text-lg text-white">PlusMagi Tags Reindex</a>
        <nav class="hidden md:flex items-center gap-5 text-sm text-slate-300">
          <a href="#features" class="hover:text-orange-300 transition-colors">Features</a>
          <a href="#workflow" class="hover:text-orange-300 transition-colors">Workflow</a>
          <a href="#changelog" class="hover:text-orange-300 transition-colors">Changelog</a>
          <a href="#docs" class="hover:text-orange-300 transition-colors">Docs</a>
        </nav>
        <a
          href="https://plusmagi.com"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-colors"
        >
          PlusMagi
        </a>
      </div>
    </header>

    <main class="relative z-10" id="home">
      <section class="mx-auto max-w-6xl px-4 pt-14 pb-12 md:pt-20 md:pb-16 grid md:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
        <div>
          <p class="text-[11px] uppercase tracking-[0.22em] text-cyan-200/90 mb-4">WordPress Tag Management Plugin</p>
          <p class="inline-flex rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1 text-xs font-semibold text-cyan-100 mb-4">
            {{ releaseMeta.pluginName }} v{{ releaseMeta.version }}
          </p>
          <h1 class="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-[-0.03em] text-white">
            Reindex Smartly.
            <span class="block text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-rose-300 to-cyan-300">Or keep auto-increment.</span>
          </h1>
          <p class="mt-6 text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
            PlusMagi Tags Reindex helps editors create tags faster with batch input, real-time tag stats, and a selectable ID strategy.
            Turn gap filling ON to reuse missing term_id slots, or OFF to use WordPress default auto-increment flow.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="#docs"
              class="inline-flex justify-center rounded-md bg-white text-slate-900 px-5 py-3 font-bold hover:bg-slate-200 transition-colors"
            >
              Read Docs
            </a>
            <a
              href="https://pitt.plusmagi.com"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex justify-center rounded-md border border-white/20 bg-white/5 text-white px-5 py-3 font-bold hover:bg-white/10 transition-colors"
            >
              Live Site
            </a>
          </div>
        </div>

        <div class="rounded-2xl border border-white/15 bg-[#111933]/80 p-4 sm:p-5 shadow-[0_20px_80px_-25px_rgba(255,94,58,0.45)]">
          <img
            :src="bannerImage"
            alt="PlusMagi Tags Reindex banner"
            class="w-full rounded-xl border border-white/15"
          />
          <div class="mt-4 grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div class="rounded-lg border border-white/10 bg-white/5 p-3">
              <p class="text-slate-400">Bulk Import</p>
              <p class="font-semibold text-white mt-1">JSON tags in Tools panel</p>
            </div>
            <div class="rounded-lg border border-white/10 bg-white/5 p-3">
              <p class="text-slate-400">Editor UX</p>
              <p class="font-semibold text-white mt-1">Custom sidebar + quick add</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="mx-auto max-w-6xl px-4 pb-14 md:pb-20">
        <div class="rounded-2xl border border-white/10 bg-[#101935]/75 p-6 md:p-8">
          <h2 class="text-2xl md:text-3xl font-extrabold text-white">Plugin Features (Current)</h2>
          <p class="mt-2 text-slate-300">Everything below matches the current plugin behavior and admin flow.</p>

          <div class="mt-6 grid md:grid-cols-2 gap-4">
            <article class="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4">
              <h3 class="font-bold text-cyan-100">Selectable ID Strategy</h3>
              <p class="mt-2 text-sm text-slate-300">Users can toggle between filling missing term_id gaps or using normal auto-increment IDs.</p>
            </article>
            <article class="rounded-xl border border-orange-300/20 bg-orange-300/5 p-4">
              <h3 class="font-bold text-orange-100">Batch JSON Import</h3>
              <p class="mt-2 text-sm text-slate-300">Import multiple tags from a JSON array in Tools > Tags Reindex with validation and success notice.</p>
            </article>
            <article class="rounded-xl border border-rose-300/20 bg-rose-300/5 p-4">
              <h3 class="font-bold text-rose-100">Custom Gutenberg Tags Panel</h3>
              <p class="mt-2 text-sm text-slate-300">Replace default tags panel with a custom panel showing per-tag stats and quick add/remove behavior.</p>
            </article>
            <article class="rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4">
              <h3 class="font-bold text-emerald-100">Safer REST Write Permission</h3>
              <p class="mt-2 text-sm text-slate-300">Tag creation endpoint now checks manage_categories capability for better control.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="workflow" class="mx-auto max-w-6xl px-4 pb-14 md:pb-20">
        <h2 class="text-2xl md:text-3xl font-extrabold text-white mb-5">How It Works</h2>
        <div class="grid md:grid-cols-3 gap-4">
          <article class="rounded-xl border border-white/10 bg-white/5 p-5">
            <p class="text-xs tracking-[0.18em] uppercase text-orange-200">Step 1</p>
            <h3 class="mt-2 font-bold text-lg">Choose ID Mode</h3>
            <p class="mt-2 text-sm text-slate-300">In Tools > Tags Reindex, choose whether to fill gaps or use auto-increment.</p>
          </article>
          <article class="rounded-xl border border-white/10 bg-white/5 p-5">
            <p class="text-xs tracking-[0.18em] uppercase text-cyan-200">Step 2</p>
            <h3 class="mt-2 font-bold text-lg">Insert Tags</h3>
            <p class="mt-2 text-sm text-slate-300">Add tags via JSON import or directly in the editor panel with comma-separated input.</p>
          </article>
          <article class="rounded-xl border border-white/10 bg-white/5 p-5">
            <p class="text-xs tracking-[0.18em] uppercase text-emerald-200">Step 3</p>
            <h3 class="mt-2 font-bold text-lg">Track Usage</h3>
            <p class="mt-2 text-sm text-slate-300">See tag counts by status and open term edit pages from the same panel.</p>
          </article>
        </div>
      </section>

      <section id="changelog" class="mx-auto max-w-6xl px-4 pb-14 md:pb-20">
        <div class="rounded-2xl border border-white/10 bg-[#121d3d]/80 p-6 md:p-8">
          <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 class="text-2xl md:text-3xl font-extrabold text-white">Changelog {{ releaseMeta.changelogVersion }}</h2>
              <p class="mt-2 text-slate-300">This section is synced automatically from plugin header and readme on each build.</p>
            </div>
            <p class="text-xs text-slate-400">Source: {{ releaseMeta.sources.pluginHeader }} + {{ releaseMeta.sources.readme }}</p>
          </div>

          <ul class="mt-6 space-y-3">
            <li
              v-for="item in releaseMeta.changelogItems"
              :key="item"
              class="rounded-lg border border-white/10 bg-white/5 p-4 text-slate-200"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </section>

      <section id="docs" class="mx-auto max-w-6xl px-4 pb-20">
        <div class="grid lg:grid-cols-[1fr_1fr] gap-6">
          <article class="rounded-2xl border border-white/10 bg-[#0f1938]/80 p-6">
            <h2 class="text-2xl font-extrabold text-white">Installation</h2>
            <ol class="mt-4 list-decimal list-inside space-y-2 text-slate-300 text-sm sm:text-base">
              <li>Run ./build.sh in the project root.</li>
              <li>Upload plusmagi-tags-reindex zip from wp-assets or Website/build latest zip.</li>
              <li>Activate plugin in WordPress admin.</li>
              <li>Open Tools > Tags Reindex and configure ID mode.</li>
            </ol>
          </article>

          <article class="rounded-2xl border border-white/10 bg-[#0f1938]/80 p-6">
            <h2 class="text-2xl font-extrabold text-white">FAQ</h2>
            <div class="mt-4 space-y-4 text-sm sm:text-base">
              <div>
                <h3 class="font-bold text-orange-100">Will IDs always be reindexed?</h3>
                <p class="text-slate-300 mt-1">No. The user can enable or disable gap filling from the plugin settings and from editor toggle flow.</p>
              </div>
              <div>
                <h3 class="font-bold text-cyan-100">Who can create tags via REST add-tag?</h3>
                <p class="text-slate-300 mt-1">Only users with manage_categories capability.</p>
              </div>
              <div>
                <h3 class="font-bold text-emerald-100">Can I still use default WordPress ID behavior?</h3>
                <p class="text-slate-300 mt-1">Yes. Disable gap-fill mode and new tags will follow normal auto-increment IDs.</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import bannerImage from '../assets/banner-1544x500.png'
import { releaseMeta } from '../generated/release-meta'
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');

div {
  font-family: 'Space Grotesk', sans-serif;
}
</style>

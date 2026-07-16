#!/usr/bin/env bash

# =============================================================================
# UNIVERSAL WordPress PLUGIN BUILD SCRIPT
# - Builds TS source (if present) into runtime JS
# - Packages production files into a versioned zip package
# Usage:
#	 ./build.sh <plugin-slug>
# =============================================================================

set -euo pipefail

# --- Configuration & Paths ---
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="$ROOT_DIR/SVN/trunk"
PM_ASSETS_DIR="$ROOT_DIR/wp-assets"
TEMP_DIR="$ROOT_DIR/temp_build"
DEFAULT_PLUGIN_SLUG="plusmagi-tags-reindex"

# 1. Resolve Plugin Slug priority: Argument > Env Variable > package.json > Default
resolve_slug() {
	if [[ -n "${1:-}" ]]; then
		echo "$1"
		return
	fi

	if [[ -n "${PLUGIN_SLUG_TO_USE:-}" ]]; then
		echo "$PLUGIN_SLUG_TO_USE"
		return
	fi

	local package_json="$ROOT_DIR/package.json"
	if [[ -f "$package_json" ]]; then
		local module_name
		module_name=$(grep '"name":' "$package_json" | head -n1 | cut -d'"' -f4 || true)
		if [[ -n "$module_name" ]]; then
			echo "$module_name"
			return
		fi
	fi

	echo "$DEFAULT_PLUGIN_SLUG"
}

# 2. Compile TypeScript assets if configuration exists
build_ts_if_present() {
  local tsx_source="$SOURCE_DIR/js/plusmagi-tags-reindex.tsx"

  if [[ -f "$tsx_source" ]]; then
    echo "-> Compiling TypeScript Source via workspace build..."

    # ✅ เรียกผ่าน npm workspace (จะไปเรียก plugin/package.json -> vite build)
    npm run build:plugin

    echo "✅ TS Build Completed: $SOURCE_DIR/js/plusmagi-tags-reindex.js"
  else
    echo "-> No TSX source found at $tsx_source, skipping TS build."
  fi
}

main() {
	local raw_slug plugin_slug display_name target_php_file version zip_filename

	cd "$ROOT_DIR"

	raw_slug="$(resolve_slug "${1:-}")"
	plugin_slug="${raw_slug#wp-}"
	display_name="$plugin_slug"

	target_php_file="$SOURCE_DIR/$plugin_slug.php"
	if [[ ! -f "$target_php_file" ]]; then
		echo "❌ Error: Main plugin file not found at $target_php_file" >&2
		exit 1
	fi

	version=$(grep -i "Version:" "$target_php_file" | head -n1 | sed -E 's/.*Version:[[:space:]]*//i' | tr -d '\r' | xargs || true)
	if [[ -z "$version" ]]; then
		echo "❌ Error: Could not find 'Version:' header in $target_php_file" >&2
		exit 1
	fi

	echo "-----------------------------------------"
	echo "🔎 Target Plugin Slug: $plugin_slug"
	echo "🚀 Building version: $version"
	echo "-----------------------------------------"

	build_ts_if_present

	mkdir -p "$PM_ASSETS_DIR"
	rm -rf "$TEMP_DIR"
	mkdir -p "$TEMP_DIR/$plugin_slug"

	echo "-> Copying core deployment files..."
	if command -v rsync >/dev/null 2>&1; then
		rsync -a --exclude '.DS_Store' --exclude '__MACOSX' --exclude 'assets/ts' "$SOURCE_DIR/" "$TEMP_DIR/$plugin_slug/"
	else
		cp -R "$SOURCE_DIR"/* "$TEMP_DIR/$plugin_slug/"
		rm -rf "$TEMP_DIR/$plugin_slug/assets/ts" || true
	fi

	zip_filename="${display_name}-${version}.zip"

	echo "-> Creating zip archive..."
	(
		cd "$TEMP_DIR"
		zip -qr "$zip_filename" "$plugin_slug" -x "*.DS_Store" -x "__MACOSX"

		# ✅ กำหนดสิทธิ์ให้เจ้าของอ่าน/เขียนได้ และคนอื่นอ่านได้อย่างเดียว (644)
		chmod 644 "$zip_filename"

		# ปรับปรุง: ดึงสิทธิ์มาเช็ก และใส่ || true ป้องกันการพังหากไม่มีสิทธิ์รัน chown
		local user_group
		user_group=$(stat -f "%u:%g" "$SOURCE_DIR" 2>/dev/null || stat --format="%U:%G" "$SOURCE_DIR" 2>/dev/null || echo "")
		if [[ -n "$user_group" ]]; then
			chown "$user_group" "$zip_filename" 2>/dev/null || true
		fi
	)

	echo "-> Moving final assets..."
	mv "$TEMP_DIR/$zip_filename" "$PM_ASSETS_DIR/$zip_filename"

	rm -rf "$TEMP_DIR"

	echo "✅ Build Complete!"
	echo "📦 Package: $PM_ASSETS_DIR/$zip_filename"
}

main "$@"
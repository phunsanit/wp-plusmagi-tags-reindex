#!/bin/bash

set -euo pipefail

# --- Configuration ---
PM_ORG_SLUG="plusmagi-tags-reindex"
SOURCE_DIR="./SVN/trunk"
PM_ASSETS_SRC="./wp-assets"
SVN_ROOT="./SVN"
SVN_TRUNK="${SVN_ROOT}/trunk"
SVN_ASSETS="${SVN_ROOT}/assets"
SVN_TAGS="${SVN_ROOT}/tags"

sync_tree() {
	local source_dir="$1"
	local target_dir="$2"
	local label="$3"

	if [ ! -d "$source_dir" ]; then
		echo "⏭️  Skip $label sync (missing source: $source_dir)"
		return
	fi

	mkdir -p "$target_dir"
	echo "🔄 Syncing $label..."
	rsync -av --delete --exclude='.svn/' --exclude='.git/' --exclude='.DS_Store' --exclude='*.zip' "$source_dir/" "$target_dir/"
}

register_svn_changes() {
	cd "$SVN_ROOT" || exit
	svn add --force trunk assets tags 2>/dev/null || true

	# Remove files from SVN tracking when they no longer exist in source.
	svn status | awk '/^!/ {print substr($0, 9)}' | while IFS= read -r missing_path; do
		[ -n "$missing_path" ] && svn rm "$missing_path"
	done
}

main() {
	cd "$(dirname "$0")" || exit

	VERSION=$(grep -i "Version:" "$SOURCE_DIR/plusmagi-tags-reindex.php" | awk -F: '{print $2}' | xargs)
	if [ -z "$VERSION" ]; then
		echo "❌ Error: Could not find version in $SOURCE_DIR/plusmagi-tags-reindex.php"
		exit 1
	fi

	if [ ! -f "$SOURCE_DIR/blueprint.json" ]; then
		echo "❌ Error: Missing $SOURCE_DIR/blueprint.json"
		exit 1
	fi

	REPO_ROOT="$(pwd)"

	echo "📦 Preparing SVN for version: $VERSION"

	# 1. Sync SourceCode -> Trunk
	sync_tree "$SOURCE_DIR" "$SVN_TRUNK" "trunk"

	# 2. Sync Images -> Assets (always exclude .zip files)
	sync_tree "$PM_ASSETS_SRC" "$SVN_ASSETS" "assets"

	# 3. SVN Status Update
	register_svn_changes

	# 4. Create Tag Automatically (idempotent)
	if [ -d "tags/$VERSION" ]; then
		echo "⏭️  Skip tag creation (already exists: tags/$VERSION)"
	else
		echo "🏷️  Creating SVN tag: tags/$VERSION"
		svn copy trunk "tags/$VERSION"
	fi

	# 5. Create/push Git tag from plugin version (idempotent)
	cd "$REPO_ROOT" || exit
	if git show-ref --verify --quiet "refs/tags/$VERSION"; then
		echo "⏭️  Skip local git tag creation (already exists: $VERSION)"
	else
		echo "🏷️  Creating git tag: $VERSION"
		git tag -a "$VERSION" -m "Release $VERSION"
	fi

	if git ls-remote --exit-code --tags origin "refs/tags/$VERSION" >/dev/null 2>&1; then
		echo "⏭️  Skip pushing git tag (already on origin: $VERSION)"
	else
		echo "🚀 Pushing git tag to origin: $VERSION"
		git push origin "$VERSION"
	fi

	echo "---------------------------------------------------"
	echo "✅ SVN + Git tag staging complete!"
	echo "📍 Path: $SVN_ROOT"
	echo "👉 Next step: run 'svn commit' (tag is already prepared when missing)."
	echo "---------------------------------------------------"
}

main
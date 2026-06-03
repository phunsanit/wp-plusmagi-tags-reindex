#!/bin/bash

# --- Configuration ---
PM_ORG_SLUG="plusmagi-site-search"
SOURCE_DIR="./SVN/trunk"
PM_ASSETS_SRC="./wp-assets"
SVN_ROOT="./SVN"
SVN_TRUNK="${SVN_ROOT}/trunk"
SVN_ASSETS="${SVN_ROOT}/assets"

main() {
	cd "$(dirname "$0")" || exit

	VERSION=$(grep -i "Version:" "$SOURCE_DIR/plusmagi-site-search.php" | awk -F: '{print $2}' | xargs)
	if [ -z "$VERSION" ]; then
		echo "❌ Error: Could not find version in $SOURCE_DIR/plusmagi-site-search.php"
		exit 1
	fi

	echo "📦 Preparing SVN for version: $VERSION"

	# 1. Sync SourceCode -> Trunk
	if [ "$SOURCE_DIR" = "$SVN_TRUNK" ]; then
		echo "⏭️  Skip trunk sync (source and destination are the same: $SOURCE_DIR)"
	else
		echo "🔄 Syncing trunk..."
		rsync -av --delete --exclude='.svn/' --exclude='.git/' "$SOURCE_DIR/" "$SVN_TRUNK/"
	fi

	# 2. Sync Images -> Assets (ข้ามไฟล์ .zip เสมอ)
	if [ -d "$PM_ASSETS_SRC" ]; then
		echo "🎨 Syncing banners/icons to SVN assets..."
		rsync -av --delete --exclude='.svn/' --exclude='*.zip' "$PM_ASSETS_SRC/" "$SVN_ASSETS/"
	fi

	# 3. SVN Status Update
	cd "$SVN_ROOT" || exit
	svn add --force trunk/* assets/* 2>/dev/null
	# ลบไฟล์ที่ต้นทางไม่มีออกจากการติดตามของ SVN
	svn status | awk '/^!/ {print substr($0, 9)}' | while IFS= read -r missing_path; do
		[ -n "$missing_path" ] && svn rm "$missing_path"
	done

	echo "---------------------------------------------------"
	echo "✅ SVN staging complete!"
	echo "📍 Path: $SVN_ROOT"
	echo "👉 ขั้นตอนต่อไป: 'svn commit' และสร้าง 'tags/$VERSION' ตามลำดับ"
	echo "---------------------------------------------------"
}

main
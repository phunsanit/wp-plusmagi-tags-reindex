#!/bin/bash

# --- Configuration ---
PLUGIN_SLUG="plusmagi-tags-reindex"
DISPLAY_NAME="plusmagi-tags-reindex"
SOURCE_DIR="./SVN/trunk"
PM_ASSETS_DIR="./wp-assets"
WEBSITE_BUILD_DIR="./Website/build"
TEMP_DIR="temp_build"

main() {
	cd "$(dirname "$0")" || exit

	# 1. ดึง Version จาก trunk
	VERSION=$(grep -i "Version:" "$SOURCE_DIR/plusmagi-tags-reindex.php" | awk -F: '{print $2}' | xargs)

	if [ -z "$VERSION" ]; then
		echo "❌ Error: Could not find version in $SOURCE_DIR/plusmagi-tags-reindex.php"
		exit 1
	fi

	echo "🚀 Building version: $VERSION"

	# 2. เตรียม Folders
	mkdir -p "$PM_ASSETS_DIR"
	mkdir -p "$WEBSITE_BUILD_DIR"
	rm -rf "$TEMP_DIR"
	mkdir -p "$TEMP_DIR/$PLUGIN_SLUG"

	# 3. Copy files (ไม่เอา README.md ของ Git เข้าไปในปลั๊กอิน)
	cp "$SOURCE_DIR/plusmagi-tags-reindex.php" "$TEMP_DIR/$PLUGIN_SLUG/"
	cp "$SOURCE_DIR/readme.txt" "$TEMP_DIR/$PLUGIN_SLUG/"
	cp "$SOURCE_DIR/LICENSE" "$TEMP_DIR/$PLUGIN_SLUG/"
	[ -f "$SOURCE_DIR/blueprint.json" ] && cp "$SOURCE_DIR/blueprint.json" "$TEMP_DIR/$PLUGIN_SLUG/"
	[ -d "$SOURCE_DIR/assets" ] && cp -r "$SOURCE_DIR/assets" "$TEMP_DIR/$PLUGIN_SLUG/"

	# 4. Create Zip
	cd "$TEMP_DIR" || exit
	zip -qr "${DISPLAY_NAME}.zip" "$PLUGIN_SLUG" -x "*.DS_Store" -x "__MACOSX"
	cd .. || exit

	# 5. Move to destinations
	cp "$TEMP_DIR/${DISPLAY_NAME}.zip" "$PM_ASSETS_DIR/${DISPLAY_NAME}-${VERSION}.zip"
	mv "$TEMP_DIR/${DISPLAY_NAME}.zip" "$WEBSITE_BUILD_DIR/${DISPLAY_NAME}-latest.zip"

	VERSIONED_ZIP_PATH="$(pwd)/${PM_ASSETS_DIR#./}/${DISPLAY_NAME}-${VERSION}.zip"
	LATEST_ZIP_PATH="$(pwd)/${WEBSITE_BUILD_DIR#./}/${DISPLAY_NAME}-latest.zip"

	rm -rf "$TEMP_DIR"
	echo "✅ Build Complete!"
	echo "📦 Versioned zip: $VERSIONED_ZIP_PATH"
	echo "📦 Latest zip: $LATEST_ZIP_PATH"
}

main
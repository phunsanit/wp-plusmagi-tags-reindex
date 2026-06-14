#!/bin/bash
# =========================================================
# UNIVERSAL PLUGIN BUILD SCRIPT (Dynamic Config Loader)
# Usage: ./build.sh <PLUGIN_SLUG> OR just run ./build.sh if slug is in .env
# =========================================================

<<<<<<< HEAD
# --- Configuration Variables ---
DEFAULT_PLUGIN_SLUG="plusmagi" # Default fallback
=======
# --- Configuration ---
PLUGIN_SLUG="plusmagi-tags-reindex"
DISPLAY_NAME="plusmagi-tags-reindex"
>>>>>>> e40aebfefcd5b7e585a5c97702702a75849a8046
SOURCE_DIR="./SVN/trunk"
PM_ASSETS_DIR="./wp-assets"
WEBSITE_BUILD_DIR="./Website/build"
temp_dir="temp_build"

main() {
	# กลับมาที่ไดเรกทอรีของสคริปต์ป้องกัน Path เพี้ยน
	cd "$(dirname "$0")" || exit

<<<<<<< HEAD
	# Initialize variables with defaults
	PLUGIN_SLUG=$DEFAULT_PLUGIN_SLUG
	DISPLAY_NAME=$DEFAULT_PLUGIN_SLUG
	PACKAGE_JSON_LOADED=false

	# 1. Priority Check: สั่งผ่าน Argument (Highest) หรือมี Env อยู่แล้ว
	if [ ! -z "$1" ]; then
		PLUGIN_SLUG="$1"
		DISPLAY_NAME="$1"
		echo "[INFO] Using Plugin Slug from argument: $PLUGIN_SLUG"
	elif [ -z "$PLUGIN_SLUG_TO_USE" ]; then
		# 2. Fallback: ลองอ่านชื่อจาก package.json
		PACKAGE_JSON="./package.json"
		if [ -f "$PACKAGE_JSON" ]; then
			MODULE_NAME=$(grep -i '"name":' "$PACKAGE_JSON" | awk -F': ' '{print $2}' | tr -d '\", ')
			if [ ! -z "$MODULE_NAME" ]; then
				PLUGIN_SLUG="$MODULE_NAME"
				DISPLAY_NAME="$MODULE_NAME"
				PACKAGE_JSON_LOADED=true
				echo "[INFO] Using Plugin Slug derived from package.json: $PLUGIN_SLUG"
			fi
		fi
	else
		PLUGIN_SLUG="$PLUGIN_SLUG_TO_USE"
		DISPLAY_NAME="$PLUGIN_SLUG_TO_USE"
	fi

	# --- SLUG CLEANUP STEP ---
	# ตรวจสอบและตัด 'wp-' ออกถ้ามี (ทั้งจาก package.json หรือแหล่งอื่น)
	if [[ "$PLUGIN_SLUG" == wp-* ]]; then
		CLEAN_SLUG=$(echo "$PLUGIN_SLUG" | sed -E 's/^wp-//')
		PLUGIN_SLUG="$CLEAN_SLUG"
		DISPLAY_NAME="$CLEAN_SLUG"
		echo "[INFO] Slug cleaned: New slug is $PLUGIN_SLUG"
	fi

	# Final validation after all loading steps
	if [ -z "$PLUGIN_SLUG" ]; then
		echo "❌ Error: Could not determine a valid PLUGIN SLUG from any source."
=======
	# 1. ดึง Version จาก trunk
	VERSION=$(grep -i "Version:" "$SOURCE_DIR/plusmagi-tags-reindex.php" | awk -F: '{print $2}' | xargs)

	if [ -z "$VERSION" ]; then
		echo "❌ Error: Could not find version in $SOURCE_DIR/plusmagi-tags-reindex.php"
>>>>>>> e40aebfefcd5b7e585a5c97702702a75849a8046
		exit 1
	fi

	echo "-----------------------------------------"
	echo "🔎 Target Plugin Slug: $PLUGIN_SLUG"
	echo "-----------------------------------------"

	# 1. ดึง Version จาก Source Directory
	TARGET_PHP_FILE="$SOURCE_DIR/$PLUGIN_SLUG.php"
	if [ ! -f "$TARGET_PHP_FILE" ]; then
		echo "❌ Error: Main plugin file not found at $TARGET_PHP_FILE"
		exit 1
	fi

	VERSION=$(grep -i "Version:" "$TARGET_PHP_FILE" | awk -F': ' '{print $2}' | xargs)
	if [ -z "$VERSION" ]; then
		echo "❌ Error: Could not find version in $TARGET_PHP_FILE (Check Version format)."
		exit 1
	fi
	echo "🚀 Building version: $VERSION"

	# 2. เตรียม Folders
	mkdir -p "$PM_ASSETS_DIR"
	mkdir -p "$WEBSITE_BUILD_DIR"
	rm -rf "$temp_dir"
	mkdir -p "$temp_dir/$PLUGIN_SLUG"

<<<<<<< HEAD
	# 3. Copy files
	echo "-> Copying core files..."
	cp "$TARGET_PHP_FILE" "$temp_dir/$PLUGIN_SLUG/"
	[ -f "$SOURCE_DIR/readme.txt" ] && cp "$SOURCE_DIR/readme.txt" "$temp_dir/$PLUGIN_SLUG/"
	[ -f "$SOURCE_DIR/LICENSE" ] && cp "$SOURCE_DIR/LICENSE" "$temp_dir/$PLUGIN_SLUG/"
	[ -f "$SOURCE_DIR/blueprint.json" ] && cp "$SOURCE_DIR/blueprint.json" "$temp_dir/$PLUGIN_SLUG/"
	[ -d "$SOURCE_DIR/assets" ] && cp -r "$SOURCE_DIR/assets" "$temp_dir/$PLUGIN_SLUG/"
=======
	# 3. Copy files (ไม่เอา README.md ของ Git เข้าไปในปลั๊กอิน)
	cp "$SOURCE_DIR/plusmagi-tags-reindex.php" "$TEMP_DIR/$PLUGIN_SLUG/"
	cp "$SOURCE_DIR/readme.txt" "$TEMP_DIR/$PLUGIN_SLUG/"
	cp "$SOURCE_DIR/LICENSE" "$TEMP_DIR/$PLUGIN_SLUG/"
	[ -f "$SOURCE_DIR/blueprint.json" ] && cp "$SOURCE_DIR/blueprint.json" "$TEMP_DIR/$PLUGIN_SLUG/"
	[ -d "$SOURCE_DIR/assets" ] && cp -r "$SOURCE_DIR/assets" "$TEMP_DIR/$PLUGIN_SLUG/"
>>>>>>> e40aebfefcd5b7e585a5c97702702a75849a8046

	# 4. Create Zip
	echo "-> Creating zip archive..."
	cd "$temp_dir" || exit
	zip -qr "${DISPLAY_NAME}.zip" "$PLUGIN_SLUG" -x "*.DS_Store" -x "__MACOSX"
	cd .. || exit

	# 5. Move to destinations
	echo "-> Moving final assets..."
	cp "$temp_dir/${DISPLAY_NAME}.zip" "$PM_ASSETS_DIR/${DISPLAY_NAME}-${VERSION}.zip"
	mv "$temp_dir/${DISPLAY_NAME}.zip" "$WEBSITE_BUILD_DIR/${DISPLAY_NAME}-latest.zip"

	# Output Paths
	VERSIONED_ZIP_PATH="$(pwd)/${PM_ASSETS_DIR#./}/${DISPLAY_NAME}-${VERSION}.zip"
	LATEST_ZIP_PATH="$(pwd)/${WEBSITE_BUILD_DIR#./}/${DISPLAY_NAME}-latest.zip"
	rm -rf "$temp_dir" # Clean up the temporary directory

	echo "✅ Build Complete!"
	echo "📦 Versioned zip: $VERSIONED_ZIP_PATH"
	echo "📦 Latest zip: $LATEST_ZIP_PATH"
}

# Run the main function and pass all arguments
main "$@"

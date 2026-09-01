#!/bin/bash

cd "$(dirname "$0")" || exit

while true; do
	echo -e "\n======================================================="
	echo " 🚀 Starting Build & Test loop"
	echo "======================================================="

	# 1. Build plugin package
	bash ./build.sh
	if [ $? -ne 0 ]; then
		echo "❌ Build failed. Fix the error and press [Enter] to retry..."
		read -r
		continue
	fi

	# 2. Run REST tests against the deployed target
	echo -e "\n📦 Build completed"
	echo -e "\n🧪 Running Playwright tests (admin project)..."
	(
		cd Playwright || exit 1
		npx playwright test --project=admin
	)
	TEST_RESULT=$?

	# 3. Evaluate result and continue loop if needed
	if [ $TEST_RESULT -eq 0 ]; then
		echo -e "\n✅ All tests passed. Exiting loop."
		break
	else
		echo -e "\n❌ Tests failed"
		echo "🔍 Open the report to inspect failures. Run this in a new terminal:"
		echo "   cd Playwright && npx playwright show-report"
		echo "👉 After fixing the code, press [Enter] to run the loop again..."
		read -r
	fi
done
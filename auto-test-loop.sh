#!/bin/bash

cd "$(dirname "$0")" || exit

while true; do
	echo -e "\n======================================================="
	echo " 🚀 เริ่มต้นกระบวนการ Build & Test (Automated Loop)"
	echo "======================================================="

	# 1. สั่ง Build ปลั๊กอิน
	bash ./build.sh
	if [ $? -ne 0 ]; then
		echo "❌ Build ไม่สำเร็จ! กรุณาแก้ไข Error แล้วกด [Enter] เพื่อลองใหม่..."
		read -r
		continue
	fi

	# 2. หยุดรอให้อัปโหลดขึ้นเว็บจริง
	echo -e "\n📦 Build เสร็จสมบูรณ์!"
	echo "⚠️  กรุณานำไฟล์ Website/build/plusmagi-tags-reindex-latest.zip"
	echo "   ไปอัปโหลดและกดแทนที่ (Replace) บนเว็บ pitt.plusmagi.com ให้เรียบร้อย"
	echo "👉 อัปโหลดเสร็จแล้ว กด [Enter] เพื่อเริ่มการทดสอบ..."
	read -r

	# 3. สั่งรัน Playwright Test
	echo -e "\n🧪 กำลังรัน Playwright Tests (Admin Project)..."
	(
		cd Playwright || exit 1
		npx playwright test --project=admin
	)
	TEST_RESULT=$?

	# 4. ประเมินผลและวนลูป
	if [ $TEST_RESULT -eq 0 ]; then
		echo -e "\n✅ สุดยอด! ทดสอบผ่านครบ 100% ออกจากลูปการทำงาน"
		break
	else
		echo -e "\n❌ ทดสอบไม่ผ่าน (มี Error)"
		echo "🔍 ดู Report เพื่อหาสาเหตุ พิมพ์คำสั่งนี้ในหน้าต่าง Terminal ใหม่:"
		echo "   cd Playwright && npx playwright show-report"
		echo "👉 เมื่อแก้ไขโค้ดเสร็จแล้ว กด [Enter] เพื่อวนลูป Build และ Test ใหม่อีกครั้ง..."
		read -r
	fi
done
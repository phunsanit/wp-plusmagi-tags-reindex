# PlusMagi Tags Reindex - Project Details & Requirements

## 📌 Project Overview
**PlusMagi Tags Reindex** เป็นปลั๊กอิน WordPress ที่ออกแบบมาเพื่อบริหารจัดการ Tag (`wp_terms`) อย่างมีประสิทธิภาพ โดยมีฟีเจอร์หลักในการ "อุดรูรั่ว" (Reindexing) ของ `term_id` ที่ว่างอยู่ในฐานข้อมูล เพื่อป้องกันปัญหาตัวเลข Auto Increment กระโดดข้าม พร้อมทั้งปรับปรุงหน้าต่างจัดการ Tag ใน Block Editor (Gutenberg) ให้ฉลาดและแสดงสถิติแบบ Real-time

## 🎯 Core Requirements (ฟีเจอร์หลัก)

1. plguins/plusmagi-tags-reindex ควรทำอย่างที่ Tag ใน Block Editor (Gutenberg) ทำได้

2. **Auto ID Filler (ถมรูรั่ว ID อัตโนมัติ)**
	- ระบบจะค้นหา `term_id` ที่ต่ำที่สุดที่ยังว่างอยู่ (Gap) ในตาราง `wp_terms`
	- ทำการ Insert ข้อมูล Tag ลงใน ID ที่ว่างอยู่ผ่าน `$wpdb` ทันทีเพื่อป้องกันการชนกัน
	- สั่ง Reset ค่า `AUTO_INCREMENT` ของตารางให้กลับไปรอที่จุดสูงสุดเมื่อจบงาน

3. **Bulk Import (เครื่องมือนำเข้า Tag)**
	- สามารถนำเข้า Tag ผ่านรูปแบบ (เช่น `"Tag A", "Tag B, Tag C"`)
	- ระบบสามารถแยกคำ (Split) ที่มีเครื่องหมายคอมม่า (`,`) คั่นอยู่ได้อัตโนมัติก่อนนำเข้าฐานข้อมูล 3 tag ตาม Tag A, Tag B, Tag C

4. **Custom Block Editor Sidebar Panel (พาเนลจัดการ Tag กำหนดเอง)**
	- ปิดการทำงาน (Remove) พาเนล Tags ต้นฉบับของระบบ
	- สร้าง UI พาเนลใหม่ด้วย React (`wp.element`, `wp.components`) โดยไม่พึ่งพา Build Step
	- **Auto-split on comma**: เมื่อพิมพ์หรือวางข้อความที่มีคอมม่า (`,`) ระบบจะดักจับ (ผ่าน native `<input>`) เพื่อแยก Tag และล้างค่าหน้าจอทันทีเพื่อหลีกเลี่ยงบั๊ก React State Bailout
	- **Real-time Statistics**: แสดงผลสถิติของแต่ละ Tag ได้แก่:
	  - จำนวนคำที่ปรากฏในบทความปัจจุบัน (คำนวณผ่าน Regex)
	  - จำนวนโพสต์ที่ใช้ Tag นี้และ "เผยแพร่แล้ว" (ผ่าน Custom REST API)
	  - จำนวนโพสต์ทั้งหมดที่ผูกกับ Tag นี้

5. **Automated Testing & CI/CD**
	- **Playwright E2E**: มีระบบจำลองการคลิกและพิมพ์เพื่อทดสอบหน้า Admin และ Editor แบบอัตโนมัติ
	- สคริปต์ Bash (`build.sh`, `deploy.sh`, `auto-test-loop.sh`) สำหรับแพ็กไฟล์และ Deploy ขึ้น SVN ของ WordPress.org
	- **GitHub Actions**: รันการทดสอบและแพ็กไฟล์ปลั๊กอินทุกครั้งที่มีการ Push โค้ดขึ้น Repository

---

## 💻 Useful Commands (คำสั่งที่ใช้งานบ่อย)

### 📁 Project Inspection
ดูโครงสร้างไฟล์ทั้งหมดในโปรเจกต์โดยซ่อนโฟลเดอร์ที่ไม่จำเป็น:
```bash
tree -I 'node_modules|.git|.svn|.DS_Store|temp_build|playwright-report|test-results'
```

### 🧪 Testing (Playwright)
รันเทสสำหรับโปรเจกต์ (รันจากโฟลเดอร์ root):
```bash
# รันลูปอัตโนมัติ: Build -> ให้เวลาอัปโหลด -> ยิง Test -> วนลูป
./auto-test-loop.sh

# หรือรันแยกเฉพาะ Playwright
npm run test:setup  # ล็อกอินเข้าแอดมิน (ต้องการ WP_ADMIN_PASSWORD ใน .env)
npm run test:admin  # รันเทสหน้า Tools และหน้า Block Editor
```

### 🚀 Build & Deploy
```bash
# แพ็กไฟล์ Plugin ออกมาเป็นไฟล์ Zip ไว้ใน wp-assets/
./build.sh

# ซิงค์โค้ดเข้า SVN พร้อมสร้าง Git Tag
./deploy.sh
```

### 🐘 SVN Workflow Note (สำหรับ WordPress.org)
โฟลเดอร์ `/SVN` คือ Working Copy ของ WordPress Repository

**คำสั่งดึงอัปเดตล่าสุดจากรีโมท (เพื่อป้องกัน Conflict ก่อนทำงาน):**
```bash
cd SVN
svn update
```

**การ Clone SVN สำหรับ Plugin ใหม่ (ทำแค่ครั้งแรก):**
```bash
cd SVN
svn checkout https://plugins.svn.wordpress.org/plusmagi-tags-reindex
# หมายเหตุ: SVN จะสร้างโฟลเดอร์ .svn ให้อัตโนมัติ ไม่ต้องสร้างเอง
```
*อ้างอิง: https://wordpress.org/plugins/developers/add/*
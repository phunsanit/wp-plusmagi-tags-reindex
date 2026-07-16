# PlusMagi Tags Reindex

[![WordPress Plugin](https://img.shields.io/badge/WordPress-Plugin-blue.svg)](https://wordpress.org/plugins/plusmagi-tags-reindex)
[![License: GPLv2 or later](https://img.shields.io/badge/License-GPLv2%20or%20later-orange.svg)](https://www.gnu.org/licenses/gpl-2.0.html)

**PlusMagi Tags Reindex** is a WordPress plugin designed to help site administrators and editors manage post tags efficiently, quickly, and cleanly. It is perfect for content-heavy websites that use a large number of tags or frequently delete old tags, which usually leaves messy "gaps" and skipped numbers in the database.

---

## 🌟 Key Features

### 1. Smart Tag ID Gap Filler
Normally, when you delete a tag in WordPress, its unique ID number is lost forever. When you create a new tag, WordPress skips ahead to the next higher number, leaving empty gaps in your database. This plugin intelligently finds those missing ID numbers and recycles them for your new tags, keeping your database compact and clean.

### 2. Upgraded Tags Panel in the Post Editor
We have replaced the default WordPress tags box in the Block Editor (Gutenberg) with a much smarter version:
* **Quick Comma-Separated Input:** You can type or paste a list like `"Tag A, Tag B, Tag C"`. The plugin instantly splits them into three separate tags without slowing down your browser.
* **Real-time Statistics:** Right inside the editor sidebar, you can instantly see:
  * How many times this specific word appears in your current article text.
  * How many **published** posts are currently using this tag.
  * The total number of posts linked to this tag.

### 3. Bulk Tag Import Tool
If you have a long list of tags you want to add to your website all at once, you can paste them into our bulk tool to create dozens of tags in a single click.

---

## 🛠️ Installation

1. Download the latest release `plusmagi-tags-reindex.zip`.
2. Go to your WordPress Dashboard and navigate to **Plugins > Add New Plugin**.
3. Click **Upload Plugin** at the top, choose the downloaded ZIP file, and click **Install Now**.
4. Click **Activate Plugin**, and you are ready to go!

---

## 🚀 How to Use

### 1. Choosing Your Tag ID Strategy
Navigate to **Tools > Tags Reindex** in your WordPress dashboard. You will see two options:
* **Gap Fill Mode:** The system will recycle unused ID numbers left behind by previously deleted tags.
* **Normal Mode (Auto-Increment):** The system will let WordPress assign numbers continuously as it usually does.

> 💡 **Note:** You can switch between these modes at any time depending on your preference.

### 2. Bulk Importing Tags
On the same settings page (**Tools > Tags Reindex**), you can use the import section to paste your prepared tags list to instantly batch-create them without typing them one by one.

### 3. Working inside the Post Editor
When you open or edit any post, the original WordPress tags box will be automatically upgraded to the **PlusMagi Tags Reindex** panel in the right sidebar. Enjoy instant tag splitting and real-time statistics as you write.

---

## 🔒 Security & Permissions

Your website stability is our priority:
* Only users with **Administrator** or **Editor** roles (specifically those with `manage_categories` capabilities) can adjust these settings or create tags through this system. 
* This ensures your website's database remains secure and protected from unauthorized access.
Mobile Food Stall POS & Micro-ERP

A lightweight, mobile-first Point of Sale (POS) and inventory management web application built specifically for fast-paced street food stalls and micro-merchants. Designed for single-handed operation on smartphones, it eliminates bulky hardware costs through zero-server Google Sheets database integration and instant in-app digital receipts.

Key Features
-Thumb-Friendly Quick Order UI: High-contrast, text-only menu cards with category filtering (Promos, Siomai, Shawarma, Noodles, Snacks, Milktea) and progressive-disclosure flavor selection for fast checkout during peak hours.

-Dual-Mode Payment & GCash Verification: Supports Cash payments (with quick-cash presets and automatic change calculation) and GCash payments (with mandatory reference number logging).

-Zero-Hardware Digital Receipts: Generates an immediate, high-contrast on-screen order summary upon checkout, removing the need for thermal printers or paper rolls.

-Countable-Unit Inventory Tracking: Tracks discrete packaging and main stock items (e.g., Paper Bowls, Rice Boxes, Milktea Cups, Siomai pieces) with automatic order deductions, combo/promo multi-deductions, and low-stock alerts.

-Dynamic Menu & Margin Builder: Allows stall owners to add new menu items, link countable inventory deductions, and preview unit profit margins (Selling Price - Unit Cost) in real time.

-Automated Sales & Net Profit Dashboard: Logs daily stall expenses alongside gross sales (Cash vs. GCash) to calculate real-time net profit, complete with one-tap CSV export.

Architecture & Tech Stack
-Frontend: React, Tailwind CSS (Mobile-first PWA design, installable on Android & iOS Home Screens)

-Backend & Database: Serverless REST API powered by Google Apps Script and Google Sheets (Menu, Inventory, Orders, Expenses)

-Offline Resilience: Automatic localStorage caching and fallback mode so sales continue uninterrupted during spotty mobile data connections.

Quick Setup
Database: Duplicate the Google Sheet template with tabs Menu, Inventory, Orders, and Expenses.

API: Deploy the provided Google Apps Script as a Web App (Execute as: Me, Access: Anyone) and copy the deployment URL.

Connect: Open the app on your mobile browser, tap the Settings (≡ / Gear) icon, paste your Web App URL, and tap Sync.

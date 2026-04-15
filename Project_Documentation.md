# Vanamala Clinic: Hospital Token Management System 🏥
**Project Technical Documentation & Overview**

---

## 1. What is this project?
This project is a modern, full-stack **Hospital Token Management System** custom-built for Vanamala Clinic. Its primary goal is to digitize and streamline the patient-handling process. Instead of managing queues on paper, the system allows the receptionist to register patients, automatically assign them sequential Queue Tokens, simulate payments, log their vitals (BP, SpO2), and generate beautiful, printable A4 clinical reports for the doctors.

---

## 2. The Technology Stack Used
We chose a modern web-development stack often called the **"React + Node.js"** stack. It is lightweight, extremely fast, and highly customizable.

### 🌐 Frontend (The User Interface)
* **React.js**: A library built by Facebook. **Why?** It allows us to build the website like "Lego blocks" (components). Instead of rewriting code for every page, we create one standard button or form and reuse it. It makes the site feel incredibly fast and responsive without needing to reload the browser.
* **Vite**: The build tool behind React. **Why?** Older tools (like Create React App) take a long time to start up. Vite starts instantly and updates the screen the exact millisecond you save a file.
* **Tailwind CSS**: A modern styling framework. **Why?** Instead of writing hundreds of separate CSS files, Tailwind lets us style the website directly inside the HTML using simple class names (like `bg-blue-500 rounded-lg`). It allowed us to rapidly build the stunning, premium "Vanamala Clinic" branding.

### ⚙️ Backend (The Server & Logic)
* **Node.js & Express.js**: The server engine. **Why?** It lets us write the backend logic in JavaScript (the exact same language used on the Frontend). Express provides an easy way to organize our system into "Routes" (e.g., separating `/patients` from `/appointments`).

### 🗄️ Database (The Storage)
* **SQLite (with `better-sqlite3`)**: **Why?** Traditional databases (like MySQL or PostgreSQL) require heavy software installations and background servers. SQLite stores the entire clinic's database inside a single, secure file (`database.sqlite`). For a clinic of this scale, it is lightning-fast, zero-configuration, and incredibly easy to back up (you just copy-paste the file!).

---

## 3. Module Breakdown (How the Pieces Intertwine)

### 🔒 Module 1: Authentication & Role-Based Access
* **What it does:** Allows users to log in securely. Sorts users into Admins, User1 (Receptionist), and User2 (Nurse).
* **Tech behind it:** `bcrypt` (scrambles passwords so even database hackers can't read them) and `JWT` (JSON Web Tokens).
* **Why it's important:** A nurse shouldn't be able to delete a doctor's profile, and a receptionist doesn't need to configure system settings. JWT acts as a digital "ID Badge" that checks their permissions on every single click securely.

### 🏥 Module 2: Patient Registration & Old Patient Search
* **What it does:** The main interface to type in victim demographic info and assign them to a Doctor and Batch.
* **Why it's important:** Time is critical at a clinic front desk. We added a split "New vs Old" toggle. If an Old patient returns, the receptionist simply searches their name/phone, and the system instantly auto-fills all their address and demographic data, eliminating repetitive typing.

### 🎫 Module 3: Intelligent Token Generation & Resequencing
* **What it does:** Automatically assigns Queue Numbers (1, 2, 3...) based on the *Specific Date* and *Specific Batch* (Morning/Evening). 
* **Why it's important:** If Token #4 cancels and the Admin deletes it, the system executes a "Resequencing Algorithm." It mathematically shifts Token 5 to 4, Token 6 to 5, etc. This ensures there are never confusing gaps or missing numbers in the clinic's waiting room.

### 💳 Module 4: Simulated Payment Gateway
* **What it does:** A full-screen visual overlay mimicking Razorpay/UPI that pops up before registering the patient.
* **Why it's important:** While it's a visual simulation, it models real-world UX design. It sets the foundation for exactly where a real payment provider (like Stripe or PhonePe APIs) could be plugged in the future without having to rewrite the flow.

### 🩺 Module 5: Preliminary Investigations (Vitals)
* **What it does:** A dedicated tab for nurses to record Weight, BP, Pulse, SpO2, and Temperature attached to a patient's Token.
* **Why it's important:** Usually, doctors waste 5 minutes checking basic vitals. By having nurses punch this data in externally, the doctor can just glance at the printed sheet and immediately diagnose the problem. 

### 🖨️ Module 6: Clinical Case Sheets (Reporting)
* **What it does:** When you click "Case Sheet" on a patient, it aggregates their entire history—combining their visits, their assigned doctors, reception comments, and vitals from the *investigations* table into one document.
* **Why it's important:** We used specialized `@media print` CSS directives. When the receptionist hits 'Print', all the digital website menus permanently hide, and the printer spits out a perfectly clean, official A4 medical document with a blank "Doctor's Assessment" box at the bottom for physical handwritten prescriptions.

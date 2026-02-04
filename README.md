# AssetVerse Server  
**Backend for Corporate Asset Management System**

![Node.js](https://img.shields.io/badge/Runtime-Node.js-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Framework-Express.js-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Auth-Firebase_Admin-FFCA28?logo=firebase&logoColor=black)
![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe&logoColor=white)
![REST API](https://img.shields.io/badge/API-REST-success)
![License](https://img.shields.io/badge/License-MIT-blue)

---

🔗 **Live Website:** https://assetverse00.netlify.app/

## 📌 About

**AssetVerse Server** is the backend service for the AssetVerse corporate asset management system.  
It provides secure RESTful APIs for managing assets, employees, role-based access, approvals, and Stripe-powered asset purchases.

---

## 🚀 Features

- 🔐 Firebase Admin authentication & authorization
- 🧑‍💼 Role-based access control (HR / Employee)
- 📦 Asset CRUD operations
- 🔁 Returnable & non-returnable asset handling
- 👥 Employee management APIs
- 📊 Asset allocation tracking
- ⏳ Request & approval workflow
- 🎂 Upcoming birthdays & notifications support
- 💳 Stripe integration for asset purchases
- 🌐 Secure RESTful API
- 🧩 Environment-based configuration

---

## 🛠 Tech Stack

- Node.js
- Express.js
- MongoDB
- Firebase Admin SDK
- Stripe

---

## 📦 NPM Packages

- cors
- dotenv
- express
- firebase-admin
- mongodb
- stripe

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/AssetVerse-server.git
```

### 2️⃣ Navigate to Server Directory
```bash
cd AssetVerse
```

### 3️⃣ Install Dependencies
```bash
npm install
```

### 4️⃣ Start the Server
```bash
npm run start
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory and configure:

```env
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
STRIPE_SECRET_KEY=your_stripe_secret_key
FIREBASE_PRIVATE_KEY=your_firebase_private_key
CLIENT_SITE_URL=your_client_live_url
```

⚠️ Do **NOT** commit `.env` to version control.

---

## 📡 API Base URL

```text
http://localhost:5000
```

_(Update the port if different in your configuration)_

---

## 🤝 Contribution

Contributions are welcome.  
Fork the repository and submit a pull request.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Tahsin Sikder Prithul**  
📧 Email: tahsinsikder456@gmail.com  
🔗 LinkedIn: https://www.linkedin.com/in/tahsin-sikder99/

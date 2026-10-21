# SNACKER 🍫

**SNACKER** is an innovative vending machine system that seamlessly integrates hardware and software. This system allows users to select, order, and purchase snacks via a dedicated web app, generating a unique QR code for each order, which can be scanned at the vending unit.

## Features ⚙️

- **Wallet-Based System**: Streamlines transactions for frequent users with instant checkout. 💸
- **Dynamic UPI Gateway**: Recharges powered by [youpi-pg/YouPI-PG](https://github.com/youpi-pg/YouPI-PG) self-hosted queue. ⚡
- **QR Code Integration**: Each order generates a unique QR code for physical vending. 📲
- **Hardware Integration**: Real-time communication between Raspberry Pi (with QuickScan QR reader) and Arduino Mega motor controllers via Firebase. 🤝
- **Progressive Web App (PWA)**: Ensures the app is accessible and performs well on all devices. 📱

## Tech Stack 🛠️

- **Frontend**:
  - ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
  - ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
  - ![ShadCN](https://img.shields.io/badge/ShadCN-007ACC?style=flat)
  - ![Zustand](https://img.shields.io/badge/Zustand-FF8C00?style=flat&logo=zustand&logoColor=white) 
  
- **Backend & APIs**:
  - ![Next.js Route Handlers](https://img.shields.io/badge/Next.js%20API-000000?style=flat&logo=nextdotjs&logoColor=white)
  - ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white) 
  
- **Database & Services**:
  - ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=white) 
  
- **Authentication**:
  - ![Clerk](https://img.shields.io/badge/Clerk-004AAD?style=flat&logo=clerk&logoColor=white) 
  
- **Payments**:
  - [![YouPI-PG](https://img.shields.io/badge/youpi--pg%2FYouPI--PG-Payment%20Gateway-blue?style=flat)](https://github.com/youpi-pg/YouPI-PG)
  
- **Networking & Tunneling**:
  - ![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat&logo=cloudflare&logoColor=white)
  
- **Hosting**:
  - ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white) 

## How It Works 🚀

1. **Wallet Recharge**: Users top up their wallet points using dynamic UPI QR codes powered by [youpi-pg/YouPI-PG](https://github.com/youpi-pg/YouPI-PG).
2. **Order & Payment**: Users select snacks and check out instantly using wallet balance.
3. **QR Code Generation**: A unique QR code is generated for each order.
4. **Vending**: The user scans the QR code at the machine (using a Fingers QuickScan USB scanner). A Raspberry Pi verifies the order via Firebase and signals an Arduino Mega to dispense from the designated motor slot (A1–A3, B1–B3) with IR drop sensor verification.

## Setup & Installation 🛠️

1. **Clone the repository**:
    ```bash
    git clone https://github.com/djmahe4/snacker.git
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Set up external services**:
   - Configure your **Clerk**, **Firebase**, and **[youpi-pg/YouPI-PG](https://github.com/youpi-pg/YouPI-PG)** accounts.
   - Use the environment variables shown in the `.env.local.sample` file.
   - Replace placeholder values with your credentials in `.env.local`.

4. **Run the app**:
    ```bash
    npm run dev
    ```

## Team & Acknowledgements 🙌

This project was made possible through the dedication and hard work of a 10-member team, along with the invaluable support of our faculty advisors. 

## License 📄

This project is licensed under the MIT License.

# AquariumGuard: Smart Aquaculture Monitor

AquariumGuard is an offline IoT-based environmental monitoring and alert system designed for African Catfish (*Clarias gariepinus*) aquaculture ponds. It monitors critical environmental parameters—**Dissolved Oxygen (DO)**, **pH**, and **Water Temperature**—and processes them locally to detect statistical anomalies and forecast critical water quality drops.

---

## Directory Structure

```text
AquariumGuard/
├── firmware/              # PlatformIO ESP32 Microcontroller Project
│   ├── src/
│   │   ├── main.cpp       # Microcontroller logic (Wi-Fi, sensor sim, HTTP Post, Local Server)
│   │   └── config.h       # Pin configs, Wi-Fi credentials, and thresholds
│   ├── platformio.ini     # PlatformIO configuration (compiler, boards, dependencies)
│   ├── setup_env.ps1      # PowerShell helper to create a local virtualenv and install PlatformIO
│   ├── build.bat          # Batch compiler script
│   ├── upload.bat         # Batch uploader script
│   └── monitor.bat        # Batch Serial monitor script
├── prisma/
│   └── schema.prisma      # PostgreSQL tables definition (Telemetry, Alerts, Settings)
├── src/                   # Next.js App Router Codebase
│   ├── app/
│   │   ├── api/           # Backend API Endpoints (Telemetry, Settings, Alerts)
│   │   ├── analytics/     # Dissolved Oxygen trends chart & AI Insights
│   │   ├── alerts/        # Urgency alarms log & SVG Site Map
│   │   ├── settings/      # Safety sliders, Offline credentials & Firmware exporter
│   │   ├── layout.tsx     # Responsive Sidebar (desktop) & BottomNav (mobile) shell
│   │   └── page.tsx       # Dashboard with telemetry widgets & hardware controls
│   ├── components/        # SidebarNav and BottomNav navigation files
│   └── lib/
│       ├── db.ts          # Global Prisma Client singleton
│       └── ml.ts          # Analytical Z-score Anomaly & Linear Regression Forecasting engine
├── .env                   # Local Environment credentials (PostgreSQL URL)
└── package.json           # Next.js project configurations & node dependencies
```

---

## Local Offline Wi-Fi Communication

To run this system without internet, your computer (PC) and the ESP32 must connect to the same local Wi-Fi router (Station Mode). The communication flow is fully local:

```mermaid
flowchart LR
    ESP32[ESP32 Microcontroller] -->|1. HTTP POST JSON /api/telemetry| NextJS[Next.js Local Server]
    NextJS -->|2. Writes Telemetry & Alerts| PostgreSQL[(PostgreSQL Database)]
    NextJS -->|3. Responds with aeratorState & intervalMinutes| ESP32
    NextJS -->|4. Web UI User Control toggles aerator| PostgreSQL
```

---

## Switching to Another Computer (Migration Guide)

This codebase is configured to be fully portable. If you switch to another PC or network, follow these steps:

### Phase 1: Database Setup
1. Install **PostgreSQL** locally on the new computer.
2. Open the root [.env](file:///.env) file and update the `DATABASE_URL` string to match your local PostgreSQL password, port, and database name:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/aquarium_guard?schema=public"
   ```

### Phase 2: Next.js Server Initializer
1. Open a terminal in the project root folder.
2. Install the node packages:
   ```bash
   npm install
   ```
3. Generate the Prisma database client and push the tables structure directly to your local PostgreSQL instance:
   ```bash
   npx prisma db push
   ```
4. Start the Next.js development server. To allow the ESP32 to connect, we must bind the server to all network interfaces (`0.0.0.0`):
   ```bash
   npx next dev -H 0.0.0.0
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Phase 3: ESP32 Firmware Synchronizer
1. Find the **Local IP Address** of your computer on your Wi-Fi network:
   - On Windows: Run `ipconfig` in Command Prompt/PowerShell and look for `IPv4 Address` (e.g. `192.168.1.120`).
2. Update the network parameters:
   - Navigate to the **SETTINGS** tab in the Next.js Web UI.
   - Enter your local Wi-Fi SSID, Password, and your computer's Local IP Address in the form, and click **Save Settings**.
3. Export Configuration:
   - Underneath the Save button, expand the **PlatformIO config.h Exporter** panel.
   - Click **Copy** to copy the generated configuration code.
   - Open [firmware/src/config.h](file:///firmware/src/config.h) on your filesystem and overwrite its contents by pasting the copied code.
4. Upload to the ESP32:
   - Connect the ESP32 to the computer via USB.
   - If PlatformIO is not set up on the computer, double-click [firmware/setup_env.ps1](file:///firmware/setup_env.ps1) to download and install PlatformIO inside a local virtual environment automatically.
   - Double-click [firmware/upload.bat](file:///firmware/upload.bat) to build and flash the code.
   - Double-click [firmware/monitor.bat](file:///firmware/monitor.bat) to open the monitor console and watch the ESP32 successfully connect to your local Wi-Fi and upload live values.

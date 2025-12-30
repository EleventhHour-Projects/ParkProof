# ParkProof 🚗🅿️

Making Parking Violations Visible, Provable, and Auditable

📌 Overview

ParkProof is a data-driven municipal parking enforcement system designed to help authorities like MCD detect over-parking and parking fraud without deploying cameras or expensive hardware.

Instead of relying on random inspections or paper logs, ParkProof analyzes long-term parking behavior, ranks parking lots by audit risk, and enables targeted ground verification through time-bound queries.

❗ Problem

Urban parking in cities like Delhi is largely:

  Manual and contractor-controlled

  Vulnerable to over-parking and fake QR/payment scams

  Opaque to both citizens and municipal authorities

This leads to:

  Traffic congestion and pedestrian discomfort

  Revenue leakage
  
  Low trust in authorized parking systems

💡 Solution

ParkProof works in four layers:

Digital Entry–Exit Logging
  Every parking entry and exit is logged digitally using QR-based tickets.

Rule-Based Over-Parking Detection
  Sustained anomalies are detected using simple, explainable rules:

  Entry suppression during peak hours

  Repeated occupancy plateau below capacity

  Exit-duration and timing anomalies

Risk-Based Audit Ranking
  Parking lots are scored and ranked based on long-term violation risk, enabling targeted inspections.

Query-Based Ground Verification
  MCD can send time-bound queries to specific parking lots; response (or lack of it) acts as a proof-of-presence signal.

⭐ Key Features / USP

Rule-based over-parking detection 

Risk-ranked audit dashboard for MCD

Query-based ground verification

Verified MCD-authorized parking discovery for users

Paperless QR-based parking tickets

Append-only event logs for auditability

🧑‍💼 User Roles
  👤 Citizen (User)

    Find authorized MCD parking locations

    Book parking tickets (online or offline)

    View active tickets and vehicles

    Report discrepancies

  🧑‍🔧 Parking Attendant

    Log vehicle entry and exit

    Scan QR tickets or generate offline tickets

    Respond to admin queries

  🏛️ MCD Admin

    View all parking lots and risk rankings

    Analyze trends and reports

    Send verification queries

    Prioritize physical audits

**File Structure**

```
ParkProof/
│
├── README.md
├── docs/
│   ├── architecture.md
│   ├── rules.md
│   └── api-contracts.md
│
├── nextjs-app/
│   ├── app/
│   │   ├── login/
│   │   ├── user/
│   │   ├── attendant/
│   │   ├── admin/
│   │   └── api/
│   │       ├── user/
│   │       ├── attendant/
│   │       └── admin/
│   │
│   ├── components/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── apiClient.ts
│   │   └── constants.ts
│   │
│   ├── middleware.ts
│   ├── styles/
│   ├── public/
│   ├── next.config.js
│   └── package.json
│
├── go-backend (root)/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   │
│   ├── internal/
│   │   ├── auth/
│   │   ├── qr/
│   │   ├── session/
│   │   ├── parkinglot/
│   │   ├── rules/
│   │   ├── ranking/
│   │   ├── query/
│   │   └── report/
│   │
│   ├── pkg/
│   │   ├── db/
│   │   ├── logger/
│   │   └── utils/
│   │
│   ├── api/
│   │   └── router.go
│   │
│   ├── go.mod
│   └── go.sum
│
└── docker-compose.yml (optional)

```

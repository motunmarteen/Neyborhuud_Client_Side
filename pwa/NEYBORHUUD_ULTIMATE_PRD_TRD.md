# 🏙️ NeyborHuud: The Ultimate Product & Technical Requirement Document

## 📄 Document Information
- **Version:** 1.0.0-PROX
- **Status:** Master Draft (Expanded)
- **Last Updated:** December 26, 2025
- **Target Reach:** 8,000 - 15,000 Words
- **Confidentiality:** Internal / Stakeholder Only

---

## 1. 🚀 Strategic Foundation

### 1.1 Executive Summary
NeyborHuud is not just an application; it is a digital infrastructure for the modern African neighborhood. In a landscape where social cohesion is often fragmented by rapid urbanization and infrastructure gaps, NeyborHuud serves as the glue that binds local communities together. It is a comprehensive ecosystem designed to handle everything from personal safety to local commerce, gig work, and community governance.

The platform integrates several critical technical and social pillars:
1.  **Safety & Vigilance:** Real-time, AI-powered security monitoring and peer-to-peer guardian networks (Sentinel AI).
2.  **Hyperlocal Connectivity:** A curated social layer that prioritizes geographical proximity over global popularity.
3.  **Economic Empowerment:** A decentralized marketplace and gig economy tailored for local artisans, merchants, and service providers (HuudCoin Economy).
4.  **Trust & Verification:** A multi-layered identity system that builds digital reputation from physical reality (TrustOS).

By leveraging advanced technologies like GSP-boundary validation (PostGIS), Google Gemini-powered threat analysis (Sentinel AI), and a robust microservices architecture (21 services), NeyborHuud provides a "Fortress" for the community while fostering a vibrant "Market Square."

### 1.2 The Problem Statement: The "Why"
The Nigerian urban environment presents unique challenges that global social networks fail to address.

#### 1.2.1 The Security Gap
Traditional security measures in many Nigerian neighborhoods are either reactive or non-existent. Residents rely on informal WhatsApp groups or physical sirens, which lack structured data, real-time geolocation, and automated escalation logic. When "One Chance" (kidnapping/robbery) or localized unrest occurs, there is no centralized system to broadcast alerts instantly to the immediate vicinity.
*   **The Problem:** Response times are measured in minutes or hours, rather than seconds.
*   **The Impact:** Loss of life, property, and a constant state of anxiety for residents.

#### 1.2.2 The Trust Deficit in Commerce
E-commerce in Nigeria suffers from a significant trust barrier. "Pay on delivery" is a response to this, but it introduces risks for sellers. Local marketplaces like Jiji or Facebook Marketplace often lack the geographic specificity to make local transactions truly convenient. Residents often don't know that their next-door neighbor is a world-class plumber or a baker, leading to wasted economic potential.
*   **The Problem:** High transaction friction due to fear of scams.
*   **The Impact:** Local businesses remain local and obscure, while residents pay more for distant services.

#### 1.2.3 The Digital Noise Problem
Global platforms like Facebook and X (formerly Twitter) are designed for global reach, which often results in "noise" for local users. A user in Lagos is more bothered by a local water shortage or a security threat in their street than a global trending topic. Hyperlocal relevance is currently missing in the digital social landscape.
*   **The Problem:** Information overload with low local utility.
*   **The Impact:** Users miss critical neighborhood news buried under global trends.

### 1.3 Vision & Strategic Goals
NeyborHuud’s North Star is to become the **Operating System for the Neighborhood**.

*   **Goal 1: Zero-Lag Safety Reporting.** Reduce the time from "Incident Detected" to "Guardians Notified" to less than 2 seconds, regardless of network conditions.
*   **Goal 2: 100% Verified Identity.** Implement a multi-layered verification system (NIN, BVN, Community Vetting) to ensure every "Neighbor" is who they say they are, creating a high-trust digital environment.
*   **Goal 3: Hyper-Efficient Local Discovery.** Ensure that 90% of user needs (services, products, news) can be met within a 5km radius of their primary location.
*   **Goal 4: Resilient Infrastructure.** Build a system that performs flawlessly on 2G/3G networks, acknowledging the reality of Nigerian telecommunications.
*   **Goal 5: Financial Inclusion.** Empower local artisans with digital wallets and escrow services that bridge the gap between "Street Hustle" and "Formal Economy."

---

## 2. 👥 User Personas & Psychology

The success of NeyborHuud depends on understanding the diverse demographics of a typical Nigerian neighborhood. We have identified 7 core personas that represent the primary user segments.

### 2.1 Persona 1: "Mrs. Ngozi - The Protective Matriarch"
*   **Age:** 48
*   **Location:** Surulere, Lagos
*   **Occupation:** Secondary School Vice Principal
*   **Tech Literacy:** Moderate (Uses WhatsApp, Facebook, Banking apps)
*   **Motivations:** Family safety, community order, reputation.
*   **Pain Points:** Constantly worries about her teenage children coming home from school. Heard about "One Chance" incidents in the local news. Finds official police reporting too slow and bureaucratic.
*   **NeyborHuud Usage:**
    *   Primary user of the **Safe Trip Check**.
    *   Has designated her husband and elder son as **Guardians**.
    *   Uses **Gossip Locale** to stay informed about community issues like "Estate gate closing early" or "PHCN transformer repairs".
    *   Vouches for other neighbors she knows personally to help them reach **Tier 3 Trust Level**.

### 2.2 Persona 2: "Tunde - The Side-Hustle Graduate"
*   **Age:** 26
*   **Location:** Gwarinpa, Abuja
*   **Occupation:** Junior Accountant (Day) / Graphics Designer (Night)
*   **Tech Literacy:** High (Digital Native)
*   **Motivations:** Financial independence, professional growth, networking.
*   **Pain Points:** Low salary, high cost of living in Abuja. Finds it hard to get clients for his graphics design business locally. Tired of being "scammed" on generic platforms.
*   **NeyborHuud Usage:**
    *   Power user of the **Jobs & Gigs Service**.
    *   Lists his graphics services and used electronics in the **Marketplace**.
    *   Uses the **Staking & Referrals** system to earn HuudCoins for extra passive income.
    *   Actively builds his **Trust Score** to win high-ticket local contracts.

### 2.3 Persona 3: "Alhaji Musa - The Established Merchant"
*   **Age:** 55
*   **Location:** Sabon Gari, Kano City
*   **Occupation:** Wholesale Textile Merchant
*   **Tech Literacy:** Low-Moderate
*   **Motivations:** Business security, regional influence, traditional values.
*   **Pain Points:** Concerns about the security of his shop at night. Wants to know what’s happening around his business premises without being physically present. Religious and traditional holidays often impact his supply chain.
*   **NeyborHuud Usage:**
    *   Uses **Sentinel AI Alerts** to get notified of any civil unrest or fire hazards in the market area.
    *   Uses **FYI Bulletins** to post about new stock arrivals to his regular local customers.
    *   Relies on **Community Verification** to build trust with new local buyers coming from other parts of Kano.

### 2.4 Persona 4: "Blessing - The University Student"
*   **Age:** 21
*   **Location:** Benin City (Off-campus)
*   **Occupation:** Student / Content Creator
*   **Tech Literacy:** Very High
*   **Motivations:** Social connection, safety, convenience.
*   **Pain Points:** Feeling isolated in a new neighborhood. Worried about safety during late-night study sessions or returning from the library. Always looking for cheap student deals.
*   **NeyborHuud Usage:**
    *   Uses the **Hyperlocal Feed** to find other students in the area for study groups.
    *   Uses the **SOS Panic Button** as a safety net during night walks.
    *   Participates in **Gamification** to earn badges and climb the neighborhood leaderboard, showing off her "Social Influencer" badge.

### 2.5 Persona 5: "Baba Jide - The Retired Elder"
*   **Age:** 72
*   **Location:** Ibadan, Oyo State
*   **Occupation:** Retired Civil Servant
*   **Tech Literacy:** Low (Relies on grandchildren for setup)
*   **Motivations:** Community heritage, passing on wisdom, loneliness.
*   **Pain Points:** Feels the younger generation is losing touch with community values. Struggles with isolation since his wife passed. Wants a way to contribute his knowledge.
*   **NeyborHuud Usage:**
    *   Primary contributor to the **Cultural Wisdom** threads in the Gossip Locale.
    *   Uses the **Voice Note** feature (in Yoruba) to communicate instead of typing.
    *   Acts as a "Traditional Validator" for neighbors seeking Tier 3 status.

### 2.6 User Psychology & Engagement Hooks
The NeyborHuud "Engagement Engine" is built on several core psychological drivers:

1.  **The Hook Model (Trigger, Action, Variable Reward, Investment):**
    *   **Trigger:** A localized safety alert or a need for a local service.
    *   **Action:** Opening the app to check the threat level or browse services.
    *   **Variable Reward:** Seeing a neighbor's helpful comment, getting a discount from a local shop, or seeing an SOS resolved successfully.
    *   **Investment:** Every Vouch, Vouch, and Reputation point earned increases the "switching cost" for the user.
2.  **Maslow’s Hierarchy of Needs:** We address the foundational "Safety" need before moving up to "Belonging" (Community Social) and "Esteem" (Leaderboards/Reputation).
3.  **The "Village Square" Effect:** By restricting content to physical proximity, we create a sense of geographical intimacy. Users feel a stronger emotional bond to a post about a street lamp on their road than a viral video from halfway across the world.
4.  **Altruistic Reward (The Guardian Psychology):** Being a Guardian provides a sense of purpose and social status. The "I helped save a neighbor" feeling is a powerful driver of long-term retention.

---

## 3. 🔄 Comprehensive User Flows

### 3.1 Onboarding & "Bootstrapping" Verification
To accelerate growth and minimize infrastructure costs (SMS), NeyborHuud employs a friction-lite onboarding strategy.

1.  **Initial Join:** User enters **Email**, **Username**, and **Password**.
2.  **GPS Pinning:** System captures current coordinates and asks the user to "Pin Home."
3.  **Community Assignment:** User is automatically assigned to their **LGA** and **Ward** polygon using PostGIS.
4.  **Tier 1 Access:** User can now read feeds and participate in the community social layer.
5.  **Profile Completion (HuudCoin Incentive):** Users are encouraged to earn their first 100 HuudCoins by completing their profile (Full Name, Gender, DOB, and optional Phone Number). This moves user data capture from a barrier to a reward.

### 3.2 The Emergency Lifecycle (SOS & Sentinel)
1.  **Trigger:** User taps the SOS button or provides a "Duress Password" during a Safe Trip Check.
2.  **Immediate Action (T+0s):**
    *   Backend creates a high-priority `EmergencyEvent`.
    *   RabbitMQ fires `alert.process`.
    *   Push notifications sent to **5 Linked Guardians**.
3.  **Surround Alert (T+2s):** Users within 500m get a pulse notification: "Neighborhood Watch Alert: Help needed nearby."
4.  **Location Stream:** Mobile client starts streaming GPS every 5s to the `SafetyGateway`.
5.  **Resolution:** Event is marked `RESOLVED`. An audit log is generated including the path taken and responders' actions.

### 3.3 The Local Commerce Journey (Marketplace)
1.  **Listing:** Seller (Tier 2) uploads 3 images + price in NGN + category.
2.  **Discovery:** Buyer filters by radius (1km, 5km).
3.  **Communication:** In-app chat facilitates negotiation.
4.  **Escrow Funding:** Buyer pays. Payment service holds funds.
5.  **Handoff:** Parties meet at a "Safe Hub" or neighbor's house.
6.  **Release:** Buyer clicks "Confirmed," funds move to Seller's Wallet.

### 3.4 Safe Trip Check-In (STC) Flow
1.  **Configuration:** User sets `From`, `To`, and `Check-in Interval` (e.g., every 15 mins).
2.  **Monitoring:** System sends a silent "Pulse" every interval.
3.  **Confirmation:** User must tap "I am Safe" on the lock screen.
4.  **Escalation:** If missed + 5 min delay -> Automatic notification to Guardians + Sentinel AI monitoring.

### 3.5 🎒 Neighborhood Guide for Kids (The "Family-First" Feature Explanations)
To ensure every stakeholder—from kids to grandparents—understands how NeyborHuud works, we use these simplified "10-Year-Old" analogies:

#### 🐕 Sentinel AI: The Super-Smart Guard Dog
Imagine a super-smart guard dog that lives inside the app. It reads the neighborhood news board in milliseconds. If it hears something dangerous (like "fire" or "thief"), it barks loudly to warn everyone! It also talks to a "Big Brain" (Google Gemini) to figure out how big the danger is and turns the map **RED** to keep you safe.

#### 🏫 TrustOS: The Neighborhood Report Card
Imagine if everyone had a "Kindness Score." When you show your ID or help a neighbor, your score goes **UP**. If someone tries to be a bully or lie, their score goes **DOWN**. A high score tells everyone, "This person is a Great Neighbor!"

#### 📌 Hyperlocal Feed: The Magic News Board
Instead of seeing news from another country, this board only shows what's happening on **your street**. If a neighbor is selling fresh cookies 2 houses down, or a street lamp is broken, you’ll see it here instantly. It ignores the "noise" from far away and keeps things local.

#### 💎 Marketplace & Escrow: The Safe Neighborhood Witness
Selling a bike to a neighbor? The app acts as a "Social Witness." The buyer and seller agree on the deal in the app. The app keeps a record of the deal so nobody can change their mind later. Once the bike is handed over and everything is perfect, the app records that the deal is finished. It’s like having a trusted neighbor watch the swap to make sure everyone is honest!

#### ⭐ HuudCoin: The "Happy Star" Coins
Earn coins like you earn stars in class! You get them for being a great neighbor, completing your profile, or helping others. You can use these stars to make your posts stand out or "boost" your local business.

#### 🧵 Safe Trip: The Invisible Safety String
Imagine an invisible string tied to your family’s hand while you walk. Every few minutes, the app asks, "Are you okay?" If you tap "Yes!", the string stays loose. If you don't answer, the app "pulls the string" and shows your family exactly where you are.

#### 🧹 Jobs & Gigs: The Neighborhood Chore Board
Need help washing a car or fixing a computer? Put it on the board! Neighbors can help each other out and earn money or coins. It’s neighbors helping neighbors, just like the old days.

---

---

## 4. 🛠️ Feature Breakdown & Complex Business Logic

### 4.1 Sentinel AI (Threat Analysis Engine)
> **Kid-Friendly:** Like a super-smart guard dog that reads the neighborhood news board and barks if it finds danger.

The Sentinel AI is a distributed service that monitors text, audio, and spatial signals.

#### 4.1.1 Semantic Logic
Using Google Gemini LLM, it evaluates "Contextual Threat":
*   "There is a snake in my room" -> Level 4 (Information/Safety).
*   "There is a man with a weapon in the compound" -> Level 10 (Critical SOS).
*   "Water don finish for estate" -> Level 2 (Community Utility).

#### 4.1.2 The "Slang Hub"
A specialized dictionary maintained by community elders that helps the AI understand Nigerian nuance (e.g., "Enter with your load", "Dem don come").

### 4.2 TrustOS & the Reputation Algorithm
> **Kid-Friendly:** A "Kindness Score" (Report Card) for neighbors. High scores mean you are super trustworthy!

Reputation is a floating integer between 0 and 1,000.
*   **Positive Gains:** NIN (+200), BVN (+150), Email (+50), Helpful Vouch (+20), Successful Sale (+10).
*   **Negative Impact:** Verified scam report (-500), False SOS (-300), Harassment (-100).
*   **Social Vouching:** A Tier 3 user can vouch for a Tier 1 user, granting them a "Community Trusted" temporary status.

### 4.3 Hyperlocal Feed Radius Logic
> **Kid-Friendly:** A magic news board that only shows what's happening on your street.

We use a **Cascading Radius Model**:
1.  **Tier 1 (The Block - 500m):** 100% of posts shown.
2.  **Tier 2 (The Ward - 2km):** 50% of posts shown (ranked by engagement).
3.  **Tier 3 (The LGA - 10km):** 10% of posts shown (ranked by relevance).
4.  **Emergency Override:** Any post with `threat_score > 8` is shown to 100% of the LGA users instantly.

---

## 5. 🔑 Roles & Permissions Matrix

NeyborHuud utilizes a hybrid RBAC (Role-Based Access Control) and Reputation-Based system (Trust Scores and Vouching).

| Role | Description | Core Permissions | Constraints |
| :--- | :--- | :--- | :--- |
| **Citizen (Tier 1 - "Newbie")** | Email verified user. | View public feeds, read-only marketplace, basic SOS. | No photo uploads, no marketplace selling. |
| **Citizen (Tier 2 - "Validated")** | NIN/BVN verified. | Tier 1 + Feed posting, Gossip, basic buying. | 5 posts/day limit, 3 gossip limit. |
| **Citizen (Tier 3 - "Neighbor")** | Community Vouched. | Tier 2 + Sell items, Apply for gigs, Vouch for others. | Requires 3 Level 3 vouchers from 500m radius. |
| **Guardian** | Personal safety contact. | Emergency location access, SOS escalation. | Access only during ACTIVE user-triggered SOS. |
| **Merchant** | Verified artisan/business. | Digital storefront, Escrow withdrawals, Listing boosts. | Must maintain Trust Score > 75. |
| **Community Admin** | Local moderator. | Pin FYI Bulletins, Moderate Feed, Vouch review. | Geographically locked to assigned Ward/LGA. |
| **Super Admin** | Platform maintenance. | Global settings, Sentinel AI config, Audit log access. | High-security MFA + IP restricted access. |
| **Sentinel AI** | Automated Safety Bot. | Real-time scan, Threat tagging, Auto-SOS trigger. | Actions auditable by Super Admin. |

---

### 6.1 The Infrastructure Backbone

#### 6.1.1 API Gateway (Port 3000)
*   **Role:** The "Fortress Gatekeeper." It is the only service exposed to the public internet.
*   **Responsibilities:**
    *   **JWT Validation:** Centralized authentication check and token rotation.
    *   **Rate Limiting:** Enforces 100 requests / 60s per user/IP using a sliding window algorithm in Redis.
    *   **Security Headers:** Implements Helmet, CORS (restricted to mobile domains), and HPP (HTTP Parameter Pollution) protection.
    *   **Request Transformation:** Strips sensitive internal metadata from responses before they reach the user.
*   **Key Tech:** Express, JSONWebToken, Redis, Morgan (logging).

#### 6.1.2 Identity & Trust Service (TrustOS) (Port 3001)
*   **Role:** Managing the "Reputation Engine" and User Identity.
*   **Logic:**
    *   **The Trust Ladder:** Handles transitions between Level 1 (Email), Level 2 (NIN/BVN), and Level 3 (Vouched).
    *   **KYC Proxy:** Integrates with Nimc, Flutterwave KYC, and VerifyMe.
    *   **Reputation Calculation:** A weighted algorithm that considers account age, activity, and community feedback.
*   **Tables:** `users`, `identity_levels`, `reputation_log`, `verification_requests`.
*   **Dependencies:** Redis (for session caching), Postgres (for long-term storage).

#### 6.1.3 Search Service (Port 3002)
*   **Role:** High-speed fuzzy search for people, products, and services.
*   **Tech:** Meilisearch or Elasticsearch.
*   **Logic:** Indexes data from Identity, Marketplace, and Content services. Handles Nigerian name misspellings and localized area names.

#### 6.1.4 Mobile Optimization Service (Port 3003)
*   **Role:** Ensuring usability on 2G/3G networks.
*   **Logic:** Intercepts outgoing media and compresses images dynamically to < 100KB without significant loss of context.
*   **Feature:** Generates "Quick-Link" PWA manifests for users who cannot afford high data downloads for the full APK.

### 6.2 Safety & Geospatial Processing

#### 6.2.1 Geo-Community Service (Port 3004)
*   **Role:** The "Spatial Brain."
*   **Tech:** Built on **PostGIS**.
*   **Logic:** Stores ward/LGA boundaries as multi-polygons.
    *   **Validation:** Uses `ST_Contains` to verify if a user's GPS is within their declared community.
    *   **Proximity:** Uses `ST_DWithin` for "Who is near me?" safety queries.
*   **Tables:** `lga_polygons`, `ward_polygons`, `community_hubs`.

#### 6.2.2 Safety & Emergency Service (Port 3005)
*   **Role:** Managing the SOS lifecycle.
*   **Logic:** 
    *   **The Panic Protocol:** When triggered, it locks the user's session and elevates priority in the RabbitMQ queue.
    *   **Safe Trip Heartbeat:** Monitors active STC sessions and triggers alerts if the heartbeat stops for > 5 minutes.
*   **Tables:** `emergency_events`, `safe_trip_sessions`, `guardian_mappings`.

#### 6.3.3 Emergency Location Specialist (Port 3019)
*   **Role:** Specialized, high-frequency tracking for high-risk scenarios.
*   **Logic:** Disregards power-saving settings to get the most accurate GPS trail. Streams data directly to a dedicated Redis instance for real-time dashboard plotting.

### 6.3 Social & Content Ecosystem

#### 6.3.1 Content Management Service (Feed) (Port 3007)
*   **Role:** Powering the "Hyperlocal Pulse."
*   **Logic:** The "Cascading Radius Engine" (CRE) fetches posts in three rings: Ring 1 (500m), Ring 2 (2km), Ring 3 (10km).
*   **Feature:** Sentiment analysis integration (Sentinel AI) to auto-flag negative energy or disinformation.
*   **Tables:** `posts`, `comments`, `likes`, `radius_cache`.

#### 6.3.2 Chat & Messaging Service (Port 3006)
*   **Role:** Real-time, encrypted communication.
*   **Tech:** Socket.io + Redis Pub/Sub for horizontal scaling across pods.
*   **Feature:** "Incident Chat" - Automatically creates a group chat between a victim and their 5 Guardians during an active SOS.

#### 6.3.3 Sentinel AI Service (Google Gemini Wrapper)
*   **Role:** Automated vigilance.
*   **Logic:** Passes all incoming text/audio through Google Gemini with specialized prompts for Nigerian slang and threat detection.
*   **Payload Example:** `{ "text": "I see boys with guns at the gate", "context": "GossipLocale" }` -> Result: `ThreatHigh(9/10)`.

### 6.4 The Economic & Marketplace Layer

#### 6.4.1 Marketplace Service (Port 3008)
> **Kid-Friendly:** A safe place to swap your toys or sell your crafts without getting tricked.

*   **Role:** Powering local commerce.
*   **Logic:** State management for products and services. Integrates with the Search Service for real-time catalog updates.
*   **Tables:** `listings`, `categories`, `inventory_log`.

#### 6.4.2 Escrow & Payment Service (Port 3017)
> **Kid-Friendly:** A trusted "Social Witness" who watches a trade between neighbors to make sure everyone is honest about their handshake deals.

*   **Role:** Secure transaction settlement via **Social Escrow**.
*   **Logic:** Implements a three-party lock (Buyer, Seller, Platform). Instead of holding cash, it manages the *Social Commitment* and *Reputation Risk*. Funds are "paid" directly between peers, and the platform "Witnesses" the release via Delivery Confirmation Tokens.
*   **Integrations:** Paystack, Flutterwave, and internal HuudCoin ledger.

#### 6.4.3 Jobs & Gigs Service (Port 3010)
> **Kid-Friendly:** A "Chore Board" where neighbors help each other with tasks like washing cars or fixing computers.

*   **Role:** Connecting local laborers with tasks.
*   **Logic:** Milestone-based payment releases. Supports "Urgent Gigs" (e.g., "I need a plumber NOW").

### 6.5 System Infrastructure & Operations

#### 6.5.1 Notifications Service (Port 3011)
*   **Role:** The "Voice" of the platform.
*   **Channels:** Firebase (Push), Termii (SMS), Nodemailer (Email), Voice Calls (Twilio/Infobip).

#### 6.5.2 Gamification & Rewards (Port 3012)
> **Kid-Friendly:** Earn "Happy Star Coins" (HuudCoins) for being a great neighbor!

*   **Role:** Incentivizing positive behavior.
*   **Logic:** Calculates badge awards and HuudCoin minting events based on Trust-Level milestones.

#### 6.5.3 Analytics & Reporting (Port 3015)
*   **Role:** Business intelligence and safety mapping.
*   **Logic:** Aggregates anonymized data to find "Heat Zones" for security threats or economic opportunities.

#### 6.5.4 Admin & Moderation Dashboard (Port 3016)
*   **Role:** Human oversight.
*   **Feature:** A real-time "War Room" dashboard for platform admins to monitor active SOS events across the country.

#### 6.5.5 Event Bus Worker (Port 3020)
*   **Role:** Background processing.
*   **Logic:** Handles non-blocking tasks like image resizing, email sending, and old log archival.

#### 6.5.6 Ratings & Reviews (Port 3013)
*   **Role:** Social proof engine.
*   **Logic:** Cross-entity rating system for Users, Businesses, and Gigs.

#### 6.5.7 Recommendation Engine (Port 3018)
*   **Role:** Discovery optimizer.
*   **Logic:** Uses user behavior patterns to suggest "People you may know" or "Services you may need."

#### 6.5.8 Services Directory (Port 3009)
*   **Role:** Yellow-pages for a digital age.
*   **Logic:** Categories local businesses with PostGIS tagging for radius search.

---

---

## 7. 🚀 Infrastructure, Scalability & Resilience

### 7.1 Tech Stack Deep Dive
*   **Language:** TypeScript (Node.js/Express).
*   **Primary DB:** PostgreSQL with PostGIS extensions.
*   **Transient Data:** Redis (Caching, Socket management, Speed-lists).
*   **Messaging:** RabbitMQ (Asynchronous inter-service communication).
*   **Real-time:** Socket.io (Bi-directional emergency alerts).
*   **Hosting:** Dockerized microservices orchestrated via Kubernetes (K8s).

### 7.2 Scalability Mechanisms
*   **Horizontal Pod Autoscaling (HPA):** Scaling SOS services based on CPU/RAM usage spikes.
*   **Database Sharding:** Archiving historical safety logs to separate cold-storage while keeping active events on high-speed NVMe drives.
*   **CDN Optimization:** Using Cloudinary edges in Nigeria for sub-second image loads.

---

## 8. 🛡️ Acceptance Criteria & Edge Cases

### 8.1 SOS Fallback (The "Zero-Data" Rule)
*   **Edge Case:** User hits SOS in an area with no data signal.
*   **Criteria:** If the HTTP request fails, the app must automatically attempt to send a structured emergency SMS to the user's 5 Guardians.

### 8.2 Marketplace Dispute (The "Burnt Cake" Rule)
*   **Edge Case:** Buyer claims service/product wasn't delivered as described.
*   **Criteria:** Funds are locked in Escrow. A "Community Arbiter" (Admin) is notified. Resolution must be reached within 12 hours based on chat logs.

---

## 9. ⚠️ Constraints, Risks, & Assumptions

### 9.1 Technical Constraints
*   **Phone Battery:** The app must not drain more than 5% battery over a 2-hour Safe Trip monitoring session.
*   **App Size:** The Android APK must stay under 15MB to ensure compatibility with entry-level devices.

### 9.2 Critical Risks
*   **False Alert Fatigue:** Too many false SOS reports could lead to Guardians ignoring real alerts.
    *   *Mitigation:* Trust Score penalty for verified false reports.
*   **Data Breach (PII):** Storage of NIN/BVN.
    *   *Mitigation:* No plain-text storage of KYC values; only hashed pointers to encrypted external vaults.

---

### 10.5 Marketplace & Gigs Service (`marketplace-service:3010`)

#### 15.1.1 POST `/api/v1/marketplace/listings`
*   **Description:** Creates a new product or service listing.
*   **Permissions:** Requires Tier 2 (NIN/BVN Verified).
*   **Request Body:**
    ```json
    {
      "title": "Fresh Home-made Bread",
      "description": "Artisan sourdough bread made daily in my kitchen. No preservatives.",
      "price_ngn": 1500,
      "category": "Food/Bakery",
      "images": ["cloudinary_url_1", "cloudinary_url_2"],
      "location_mask": true,
      "community_id": "LGA_SURULERE_001",
      "tags": ["bakery", "home-made", "fresh"]
    }
    ```
*   **Business Logic:**
    1.  **Trust Verification:** System checks `TrustOS` for user's level. If < 2, returns `403 FORBIDDEN_LEVEL_UP_REQUIRED`.
    2.  **Safety Scan:** Sentinel AI scans the title and description for prohibited goods (keywords like "gun", "drug", "codeine").
    3.  **Spatial Tagging:** Item is tagged with PostGIS coordinates. If `location_mask` is true, it uses the Ward's centroid instead of the user's house.
    4.  **HuudCoin Check:** If the user wants to "Boost" the listing, deduct 50 HuudCoins from their wallet.

#### 15.1.2 POST `/api/v1/marketplace/orders`
*   **Description:** Creates a purchase order for a listing.
*   **Logic:** 
    *   Initiates the **Escrow Service**.
    *   Locks funds in the platform's settlement account.
    *   Notifies the merchant via WebSockets.
*   **Response:** Returns an `order_id` and an `escrow_token`.

### 10.6 Payment & Wallet Service (`wallet-service:3005`)

#### 16.1.1 POST `/api/v1/payments/fund-wallet`
*   **Description:** Fund the in-app wallet via Paystack/Flutterwave.
*   **Logic:** 
    1. Creates a transaction record with `status: PENDING`. 
    2. Generates a payment URL from the provider.
    3. Webhook from provider updates status to `SUCCESSFUL` and increments `balance`.

#### 16.1.2 POST `/api/v1/payments/transfer`
*   **Description:** Peer-to-peer HuudCoin or NGN transfer.
*   **Security:** Requires a 6-digit transaction PIN if the amount exceeds 5,000 NGN.
*   **Logic:** Atomic balance deduction logic to prevent double-spending using PostgreSQL `FOR UPDATE` locks.

### 10.7 Messaging & Real-Time Service (`messaging-service:3004`)

#### 17.1.1 POST `/api/v1/messages/send`
*   **Description:** Send an encrypted message to a neighbor.
*   **Logic:**
    1. Check if both users are in the same community or have a transaction history.
    2. Scan content with Sentinel AI for harassment.
    3. Store encrypted blob in DB; emit socket event.

### 10.8 Content & Feed Service (`content-service:3007`)

#### 18.1.1 GET `/api/v1/feed`
*   **Query Params:** `lat`, `lng`, `radius`, `category`.
*   **Logic:** Performs a PostGIS `ST_DWithin` query to find posts within the specified radius. Results are sorted by a combination of "Time Decay" and "Trust Score weighting."

### 10.9 Search & Discovery Service (`search-service:3011`)

#### 19.1.1 GET `/api/v1/search`
*   **Query Params:** `q`, `type` (USER, POST, ITEM).
*   **Logic:** Routes query to Meilisearch index. Results filtered by the user's `current_ward_id`.

### 10.10 Notification Service (`notification-service:3008`)

#### 20.1.1 POST `/api/v1/notifications/push`
*   **Description:** Send a push notification to a user or group.
*   **Logic:** Routes through FCM (Firebase) or internal WebSocket depending on user's active state.

#### 20.1.2 POST `/api/v1/notifications/sms` (Internal Only)
*   **Description:** Sends safety-critical SMS via Termii or Infobip.

### 10.11 Community & Ward Service (`community-service:3002`)

#### 21.1.1 GET `/api/v1/communities/:lga_id`
*   **Description:** Returns the active Wards and safety stats for a given Local Government Area.

### 10.12 Audit & Compliance Service (`audit-service:3015`)

#### 22.1.1 POST `/api/v1/audit/log`
*   **Description:** Log a system event for compliance.
*   **Logic:** Appends to the immutable ledger with a digital signature.

### 10.13 Referral & Growth Service (`referral-service:3014`)

#### 23.1.1 POST `/api/v1/referrals/redeem`
*   **Description:** Redeem a referral code from a neighbor.
*   **Logic:** Validates the code; grants 10 HuudCoins to the referrer and 5 to the referee once the referee reaches Tier 2.

### 10.14 Advertising & Boosting Service (`ad-service:3012`)

#### 24.1.1 POST `/api/v1/ads/create`
*   **Description:** Creates a boosted post or banner for a marketplace item.
*   **Logic:** Requires staking HuudCoins. Ad is prioritized in the spatial feed for the selected Ward.

---

## 11. 🗄️ Detailed Database Schema & Data Models

NeyborHuud utilizes a polyglot persistence strategy with PostgreSQL (Primary), Redis (Transient), and Meilisearch (Search).

### 11.1 Primary Relational Schemas

#### 11.1.1 `users` Table (Identity Service)
*   `id` (UUID, PK)
*   `email` (TEXT, UNIQUE) - Primary authentication key for bootstrapping.
*   `username` (TEXT, UNIQUE) - Public identifier and neighborhood handle.
*   `password_hash` (TEXT) - Argon2id hashing.
*   `display_name` (VARCHAR)
*   `phone_number` (VARCHAR, Optional) - Captured during "Complete Profile" phase.
*   `trust_score` (INT, Default 300) - Dynamic reputation metric.
*   `verification_level` (INT, Default 1) - Corresponds to the Trust Ladder (Email verified).
*   `profile_completed_at` (TIMESTAMP) - Tracks Step 2 completion.
*   `primary_location` (JSONB) - PostGIS coordinate and address data.
*   `created_at` (TIMESTAMP)

#### 11.1.2 `sos_events` Table (Safety Service)
*   `id` (UUID, PK)
*   `victim_id` (UUID, FK) - User who triggered the SOS.
*   `status` (ENUM: ACTIVE, RESOLVED, CANCELLED)
*   `initial_location` (GEOMETRY Point)
*   `threat_logs` (JSONB) - Stores all incoming pings, network state, and battery level logs.
*   `guardian_notified_count` (INT)
*   `resolution_data` (TEXT)

#### 11.1.3 `trust_ledger` Table (TrustOS)
*   `id` (UUID, PK)
*   `user_id` (UUID, FK)
*   `change_amount` (INT) - Points added or removed.
*   `reason` (VARCHAR) - e.g., "Verified NIN", "False Alert Penalty".
*   `vouched_by` (UUID, FK, Optional) - Link to the neighbor who vouched.

---

## 12. 🕵️ Complex Feature State Machines

### 12.1 The Escrow State Machine (Marketplace)
1.  **PENDING_PAYMENT:** Buyer has initiated the order.
2.  **FUNDED:** Payment confirmed by gateway. Funds moved to platform settlement account.
3.  **DISPATCHED:** Seller has clicked "Item Shipped" or "Started Service."
4.  **COMPLETED:** Buyer has entered the 6-digit verification token from the seller's phone.
5.  **DISPUTED:** Either party has clicked "Raise Dispute." Funds are frozen.
6.  **REFUNDED/RELEASED:** Platform admin has resolved the case.

### 12.2 The Safe Trip Check-In (STC) State Machine
1.  **IDLE:** Monitoring is inactive.
2.  **MONITORING:** Pulse timer is running on the backend.
3.  **AWAITING_CONFIRMATION:** Interval (e.g., 15 mins) reached. Push sent to user.
4.  **GRACE_PERIOD:** 5-minute countdown for the user to tap "I am Safe."
5.  **ESCALATED:** Timer expired. System auto-triggers SOS notification to Guardians.

---

## 13. 🎨 Mobile Design System & UX Principles

### 13.1 Micro-Interactions
*   **The Haptic Pulse:** During an active SOS, the phone vibrates in a rhythmic heartbeat pattern to give the user physical feedback that the system is tracking them.
*   **The Proximity Glow:** On the feed, posts from neighbors within 500m have a subtle "Glow" border to catch the user's eye.
*   **The Trust Badge Evolution:** Icons that visually grow from a "Seedling" to a "Baobab Tree" as the user's Trust Score increases.

### 13.2 "Offline-First" Resilience
*   **Optimistic UI:** Posting in the gossip locale appears instantly while the background service-worker retries the network request.
*   **SMS Bridge:** If data connection is lost, the "SOS" button turns into an "SMS Panic" button that pre-fills a coordinate link in the native SMS app.

---

## 14. 🧪 Testing & Quality Assurance Plan

To maintain "Production Ready" status in a safety-critical application, NeyborHuud follows a 4-tier testing strategy.

### 14.1 Unit Testing
*   **Framework:** Jest + Supertest.
*   **Logic:** Every microservice has 85%+ coverage for its business logic (Service/Util layers).
*   **Critical Path:** The `SafetyService` and `IdentityService` require 100% logic coverage with mocks for external KYC/SMS providers.

### 14.2 Integration & Chaos Testing
*   **Integration:** Verifying the interaction between services (e.g., Content -> Search Indexing).
*   **Chaos Engineering:** We simulate localized network outages (simulating a mast failure) to ensure the platform caches critical FYI bulletins locally.

---

## 15. 📦 Deployment & Maintenance Guide

### 15.1 Infrastructure as Code (IaC)
*   **Kubernetes (K8s):** All microservices are deployed as pods within a VPC to ensure inter-service isolation.
*   **Terraform:** Manages the Cloud SQL (Postgres), Redis, and RabbitMQ clusters.

### 15.2 Monitoring & Alerting
*   **Sentry:** For real-time error tracking across the 21 services.
*   **Prometheus/Grafana:** For monitoring system health (CPU, Memory, Request Latency).
*   **Safety Dashboard:** A specialized real-time map for super-admins to monitor active emergencies across Nigeria.

---

## 16. 🌍 Cultural Design & Linguistic nuances

### 16.1 Pidgin & Local Language Support
The **Sentinel AI** is trained specifically on Nigerian English and Pidgin.
*   **Keyword Detection:** "Dem don come" (Threat), "One Chance" (Hijacking), "Abeg" (Request for help).
*   **Sentiment Tone:** Evaluating the difference between a humorous "Wahala" and a critical emergency.

### 16.2 "Elder Mode"
 Recognizing the high respect for traditional authority, we provide "Community Leader" account types that have pinning rights and higher vouching weights, mirroring physical community hierarchies.

---

## 17. 🛡️ Security Audit & Compliance (Fortress Mode)

### 17.1 NDPR (Nigerian Data Protection Regulation)
*   **Data Residency:** All PII is stored on servers that comply with Nigerian data sovereignty rules.
*   **Consent Management:** Granular toggles for location tracking, ensuring users know exactly when they are being "watched" during emergencies.

---

---

## 18. 🕵️ Detailed Business Logic: The \"Sentinel AI\" Engine

The Sentinel AI (S-AI) is the platform's autonomous moderator and threat detection system. It operates on a multi-model ensemble (Google Gemini and fine-tuned local LLMs) to ensure safety without suppressing legitimate cultural expression.

### 18.1 Semantic Threat Categorization Logic
S-AI evaluates every text interaction (posts, comments, private messages) using a three-stage heuristic:

1.  **Tier 1: Direct Hazard Detection (Hard Block)**
    *   **Logic:** Regex and Keyword matching against the "Red List" (e.g., weapons sale, illegal drug listings, specific terror-related terms).
    *   **Action:** Immediate `403 FORBIDDEN` response. Post is not saved to the database. User's Trust Score is docked by 10 points.
2.  **Tier 2: Contextual Sentiment Pass (Soft Moderation)**
    *   **Logic:** Transformer-based analysis of the sentence structure. It distinguishes between a threat ("I will kill you") and a colloquialism ("This food is a killer").
    *   **Action:** If sentiment score is below -0.8, the post is flagged for "Neighborhood Arbiter" (Tier 3 user) review.
3.  **Tier 3: Cultural/Slang Normalization**
    *   **Logic:** Mapping Nigerian Pidgin and local dialects (Yoruba, Igbo, Hausa) to semantic intent.
    *   **Example Map:**
        *   "Dem don come" -> Context check: If location shows high SOS activity -> Alert local Guardians.
        *   "One chance" -> Identify as hijacking/fraud threat.
        *   "Wahala" -> Determine severity (e.g., "small wahala" vs "big wahala for area").

### 18.2 Audio Transcription & Dialect Normalization
For "Elder Mode" users and voice notes:
*   **Acoustic Pass:** Noise cancellation removes LAGOS market/traffic background noise.
*   **STT (Speech-to-Text):** Converts audio to text.
*   **Semantic Pass:** Runs the same logic as Section 18.1.
*   **Latency Target:** < 1.5 seconds for a 30-second audio clip.

---

## 19. 🛡️ TrustOS Reputation Model: The Mathematics of Trust

Trust is the currency of NeyborHuud. The TrustOS service (`trustos-service:3009`) calculates a dynamic score ($T$) for every user.

### 19.1 Score Component Calculation
The score is a floating-point value between 0 and 1,000, calculated as:
$$T = (B + V_{n} + V_{b} + \sum W_{v}) \times D(t)$$

Where:
*   $B$: Baseline score (Default 50).
*   $V_{n}$: NIN Verification Bonus (+150).
*   $V_{b}$: BVN/Face Match Bonus (+150).
*   $W_{v}$: Weighted Vouch Value (Neighbor of Tier 3 gives +25).
*   $D(t)$: Time-based decay function $e^{-kt}$ where $k$ is the inactivity constant.

### 19.2 The \"Cascading Penalty\" Logic
Reputation is social. If User A (The Voucher) vouches for User B (The Vouchee), their fates are linked:
*   **Scenario:** User B commits a "Tier 1 Safety Violation" (Assault, Fraud).
*   **Penalty to B:** Score reset to 0; permanent ban; NIN/Biometrics blacklisted.
*   **Penalty to A:** 
    *   Immediate 30% reduction in Trust Score.
    *   Loss of Tier 3 status (Vouching rights revoked).
    *   "Voucher Integrity" flag added to metadata.
*   **Logic Rationale:** Encourages "Extreme Caution" in vouching, preventing the system from being gamed by bot farms.

---

## 20. 💰 The Digital Ajo (ROS) Economic Model

The Digital Ajo is a blockchain-inspired, audited version of the traditional West African rotating savings scheme.

### 20.1 The Ajo State Machine
A "Circle" progresses through these states:
1.  **ST_DRAFT:** Circle creator defines the pool.
2.  **ST_VETTING:** TrustOS checks if all invited members meet the minimum trust score (350+).
3.  **ST_ACTIVE:** The cycle begins. 
    *   In each sub-period (e.g., Week 1), the `PaymentService` initiates a pull-request from all members' wallets.
    *   Funds are held in an **Escrow Lock**.
4.  **ST_PAYOUT:** The full pot (minus 2% community levy) is released to the member whose turn it is.
5.  **ST_SETTLED:** Final member is paid. Circle dissolves or restarts.

### 20.2 Default & Recovery Logic
*   **The Freeze:** If a member defaults after taking their "Hand" (payout), their wallet is frozen across ALL services.
*   **The Recovery:** Any funds entering the user's wallet (e.g., from secondary marketplace sales) are automatically diverted to the Ajo pool until the debt is cleared.
*   **Social Pressure:** The other members of the Circle (all verified neighbors) are notified. In the physical world, they represent the ultimate debt collection mechanism.

---

## 21. 🛡️ Security Hardening: \"Fortress Mode\" Protocols

NeyborHuud implements "Fortress Mode" to prevent data breaches and maintain SOS integrity during network instability.

### 21.1 JWT Rotation & Pinning
*   **Short-Lived Access Tokens:** 15-minute expiration.
*   **Device-Bound Refresh Tokens:** Stored in the device's Secure Enclave/Keystore.
*   **Session Pinning:** Every request includes an `X-Device-Fingerprint`. If a token is replayed from a different device fingerprint, the account is locked instantly.

### 21.2 The Geofence Session Breach
If a user is logged in from "Lagos Island" and a login attempt is made from "London" within 30 minutes:
*   **Logic:** $dist(L_1, L_2) / (t_2 - t_1) > 900 km/h$ (Approximate speed of a commercial plane).
*   **Action:** Impossible Velocity Trigger. 
    1.  Kill all active sessions.
    2.  Send MFA challenge.
    3.  Flag as "Compromised Attempt."

### 21.3 \"Silent SOS\" Implementation
How the system triggers an emergency without alerting the assailant:
*   **Trigger A:** 5-tap power button sequence (System-level bridge).
*   **Trigger B:** "Safe Word" monitoring (Microphone is sampled for 2 seconds every 15 minutes during "High Alert" status).
*   **Network Protocol:**
    1.  App sends a UDP "Heartbeat" packet (minimal size) containing GPS coordinates.
    2.  If UDP fails (packet loss), app sends an Encrypted SMS via the `SmsBridge`.
    3.  Backend receives the signal and marks the user's `sos_status = ACTIVE_SILENT`.

---

## 22. 🔌 Exhaustive API Specifications (Secondary Services)

### 22.1 Audit & Governance Service (`audit-service:3015`)
*   **POST `/api/v1/audit/log`** (Internal Only)
    *   **Payload:** `{ "actor": UUID, "action": ENUM, "diff": JSONB, "sign": HMAC }`
    *   **Use Case:** Tracking every Trust Score change.
*   **GET `/api/v1/audit/verify/:entity_id`**
    *   **Description:** Returns the public audit trail of a Tier 3 Merchant or Community Leader.

### 22.2 Referral & Onboarding Service (`referral-service:3014`)
*   **POST `/api/v1/referrals/invite`**
    *   **Logic:** Generates a link that pre-fills the "Vouch" field of the signup form.
*   **GET `/api/v1/referrals/earnings`**
    *   **Description:** Shows HuudCoins earned from referee's activity (listing sales/vouching).

### 22.3 Sentiment & Moderation Service (`sentiment-service:3016`)
*   **POST `/api/v1/sentiment/batch-scan`**
    *   **Logic:** Scans the last 100 posts in a Ward during a "Safety Spike" (e.g., local unrest) to identify misinformation.

---

## 23. 🗄️ Comprehensive Database Data Dictionary

NeyborHuud utilizes a polyglot persistence strategy, primarily leveraging PostgreSQL with PostGIS for relational and spatial data, Redis for transient state, and Meilisearch for ultra-fast localized search.

### 23.1 Identity & Trust Service (`identity.`)
#### 23.1.1 `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique User Identifier |
| `phone` | VARCHAR(15) | UNIQUE, NOT NULL | Primary Auth Key (E.164 format) |
| `password_hash` | TEXT | NOT NULL | Argon2id multi-pass hash |
| `display_name` | VARCHAR(50) | NOT NULL | User-facing handle |
| `trust_score` | INT | DEFAULT 50 | Calculated by TrustOS |
| `tier` | INT | DEFAULT 1 | 1: Basic, 2: ID Verified, 3: Elder/Arbiter |
| `nin_ref` | VARCHAR(64) | NULLABLE | Encrypted pointer to NIN vault |
| `bvn_ref` | VARCHAR(64) | NULLABLE | Encrypted pointer to BVN vault |
| `geom` | GEOMETRY(POINT, 4326) | NOT NULL | User's home coordinates |
| `ward_id` | UUID | FK -> `communities.wards` | Logical boundary unit |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

#### 23.1.2 `vouch_ledger`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Ledger ID |
| `voucher_id` | UUID | FK -> `users` | The person giving the vouch |
| `vouchee_id` | UUID | FK -> `users` | The person receiving the vouch |
| `stake_amount` | INT | DEFAULT 0 | HuudCoins staked on this vouch |
| `status` | ENUM | PENDING, ACTIVE, REVOKED | Current state of the link |

### 23.2 Safety & Emergency Service (`safety.`)
#### 23.2.1 `sos_alerts`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Alert ID |
| `victim_id` | UUID | FK -> `users` | The user in distress |
| `type` | ENUM | LOUD, SILENT, STC_FAILURE | Category of emergency |
| `status` | ENUM | ACTIVE, RESOLVED, FALSE_ALARM | Life-cycle state |
| `audio_stream_url` | TEXT | NULLABLE | S3 link to encrypted SOS audio |
| `location_trail` | JSONB | NOT NULL | Array of coordinates/times |

#### 23.2.2 `guardians`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | FK -> `users` | The subscriber |
| `contact_id` | UUID | FK -> `users` | The trusted neighbor |
| `relationship` | VARCHAR(20) | NULLABLE | e.g., "Family", "Leader" |

### 23.3 Marketplace & Gigs Service (`marketplace.`)
#### 23.3.1 `listings`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Listing ID |
| `owner_id` | UUID | FK -> `users` | The seller/provider |
| `title` | VARCHAR(100) | NOT NULL | Descriptive title |
| `price` | DECIMAL(15,2) | NOT NULL | Amount in NGN |
| `is_boosted` | BOOLEAN | DEFAULT FALSE | Ranking multiplier flag |
| `geom` | GEOMETRY | NOT NULL | Item location for radius search |

#### 23.3.2 `escrow_transactions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Transaction ID |
| `order_id` | UUID | FK -> `orders` | Link to purchase |
| `status` | ENUM | LOCKED, RELEASED, DISPUTED | Fund state |
| `release_code` | CHAR(6) | NOT NULL | Sent to buyer to confirm delivery |

### 23.4 Audit & Ledger Service (`audit_hub.`)
#### 23.4.1 `immutable_logs`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `seq` | BIGSERIAL | PK | Global sequence |
| `event_type` | VARCHAR(30) | NOT NULL | e.g., "BALANCE_ADJUST" |
| `payload` | JSONB | NOT NULL | Full event metadata |
| `prev_hash` | CHAR(64) | NOT NULL | Hash of the previous row |
| `current_hash` | CHAR(64) | NOT NULL | Self-hash for chain integrity |

---

## 24. 🧩 Exhaustive Logic Flow Catalog

### 24.1 Bootstrapping Onboarding (Streamlined Logic)
1. **Initial Signup:** Email + Username + Password + Location.
2. **Community Entry:** System validates Location (PostGIS) and assigns Ward/LGA. User enters "Tier 1."
3. **Incentivized Completion:** User is encouraged to complete profile (Step 2) for 100 HuudCoins.
4. **Identity Pass (Optional for Tier 2):** User provides NIN/BVN. System calls NIMC/VerifyMe API.
5. **Biometric Validation:** User takes a "Liveness Selfie."
6. **Score Injection:** Face match NIN photo vs Selfie. 
    - If Match > 95% -> Promote to `Tier 2`, Grant +150 Trust Points.
    - If Match < 95% -> Queue for **Manual Human Review** (Level 3 Admin).

### 24.2 Emergency Escalation (The "Guardian Wave" Protocol)
1. **Trigger:** User taps "SOS" or Power Button sequence.
2. **Phase 1 (Immediate):** 
    - Nearest 5 "Guardians" get High-Priority push/SMS.
    - Sentinel AI starts recording & analyzing audio.
3. **Phase 2 (Proximity):** 
    - All `Tier 3` Neighbors within 500m get a "Community Alert" notification.
4. **Phase 3 (Official):** 
    - LGA Security Dashboard flashes red for the specific Ward.
    - Incident Hub creates an immutable audit trail.

### 24.3 Marketplace Dispute Workflow
1. **Claim:** Buyer clicks "Dispute" on an Escrow-locked order.
2. **Freeze:** `EscrowService` moves funds from `LOCKED` to `DISPUTED`.
3. **Evidence:** Both parties have 2 hours to upload photos/videos of the item/service.
4. **Arbiter Assignment:** System picks a Tier 3 neighbor with the highest "Resolution Score" in the same Ward.
5. **Verdict:** Arbiter clicks "Refund" or "Release."
    - If Arbiter is biased (detected by pattern analysis), their Trust Score is docked.

---

## 25. 💻 Hardware & Infrastructure Deep Dive

NeyborHuud is designed to run on a globally distributed, hardware-abstracted infrastructure to ensure resilience against regional internet outages.

### 25.1 Server Infrastructure (GCP Stack)
*   **Compute Engine:** e2-standard instances for general microservices.
*   **Cloud SQL:** PostgreSQL 15 with High Availability (Failover Replica).
*   **Cloud MemoryStore:** Managed Redis 7 for session caching and Pub/Sub.
*   **Artifact Registry:** Storing Docker images for the 21 services.

### 25.2 Networking Topology
*   **VPC Peering:** All microservices communicate over a private, low-latency VPC.
*   **Cloud Load Balancing:** Anycast IP with Edge SSL termination in Lagos/Nairobi/Accra.
*   **Cloud Armor:** L7 WAF protection against DDoS and SQL injection.

### 25.3 Mobile Device Specifications (Minimum Requirements)
To ensure accessibility while maintaining security:
*   **Android:** Version 8.0 (Oreo) or higher. 2GB RAM minimum.
*   **iOS:** iOS 14.0 or higher.
*   **Network:** Optimized for Edge/2G connectivity. The app uses `Protobuf` for data serialization to minimize packet size.

---

## 26. 🛡️ Compliance, Privacy & NDPR Protocols

NeyborHuud adheres to the **Nigerian Data Protection Regulation (NDPR)** and global GDPR principles.

### 26.1 Data Sovereignty
*   **Residency:** All Personal Identifiable Information (PII) of Nigerian citizens is hosted on servers located within Nigeria (via provider local zones) or in jurisdictions with reciprocal data protection treaties.
*   **Encryption:** Data at rest utilizes AES-256. Data in transit utilizes TLS 1.3.

### 26.2 Consent & Transparency
*   **Location Tracking:** Only active during a "Safe Trip" session or an "SOS" event. At all other times, location is "Ward-Level" masked.
*   **Right to Erasure:** Users can initiate account deletion. All data is purged except for immutable audit logs (required for anti-terrorism/fraud compliance).

---

## 27. 🆘 Disaster Recovery & Grid-Independent Playbooks

### 27.1 The "Blackout" Protocol
In the event of a national power/data grid failure:
1.  **Local Cache:** The mobile app stores the "Emergency Contacts" and "Local Ward Map" in persistent local storage.
2.  **BLE Relay:** App uses Bluetooth Low Energy to broadcast SOS pings.
3.  **Sync:** Once a device in the mesh gains satellite or functional cell signal, it batch-uploads the meshed signals to the backend.

### 27.2 RTO/RPO Targets
*   **Recovery Time Objective (RTO):** < 15 minutes for core Safety services.
*   **Recovery Point Objective (RPO):** < 500ms (Data loss limit).

---

## 28. 🧪 Exhaustive Quality Assurance & Testing Matrix

To maintain the "1000% Secure" and "Production Ready" status of NeyborHuud, we implement a rigorous, multi-tiered testing strategy.

### 28.1 Safety Service Verification (SOS)
| Test Case ID | Scenario | Expected Outcome | Criticality |
| :--- | :--- | :--- | :--- |
| **QA-SOS-001** | LOUD SOS in 2G area | Fallback to SMS Bridge within 5 seconds of HTTP failure. | P0 (Critical) |
| **QA-SOS-002** | SILENT SOS trigger | Dashboard notification with audio stream; No UI change for user. | P0 (Critical) |
| **QA-SOS-003** | Fake SOS Spam | TrustOS detects pattern; Score deducted; Cooldown applied. | P2 (Medium) |
| **QA-SOS-004** | Battery Drain Check | < 2% drain during 60-minute active tracking session. | P1 (High) |

### 28.2 Economic Integrity (Escrow & Ajo)
| Test Case ID | Scenario | Expected Outcome | Criticality |
| :--- | :--- | :--- | :--- |
| **QA-PAY-001** | Escrow Double-Spend | Atomic lock prevents concurrent release calls. | P0 (Critical) |
| **QA-PAY-002** | Ajo Default Recovery | Merchant earnings automatically diverted to cover Ajo debt. | P1 (High) |
| **QA-PAY-003** | PIN Brute Force | Account lockout after 3 incorrect payout PIN attempts. | P0 (Critical) |

---

## 29. 🛠️ Maintenance & SysOps Playbook

### 29.1 The "Mast Failure" Protocol
In the event of a major cellular mast outage in a Ward:
1. **Auto-Detection:** Monitoring service (`monitoring-service:3018`) detects a 90% drop in active heartbeats from `LGA_IKEJA_001`.
2. **Push Redirect:** Any critical notifications (Safety) are routed via the SMS bridge until mast heartbeat returns.
3. **BLE Activation:** App-side background service activates BLE Mesh mode to maintain local peer-to-peer safety pings.

### 29.2 Database Maintenance (Vacuum & Indexing)
*   **Weekly:** `VACUUM ANALYZE` on `identity.users` and `safety.sos_alerts`.
*   **Monthly:** Re-index PostGIS spatial columns to optimize `ST_DWithin` query performance for the feed.
*   **Archiving:** Move resolved SOS events older than 180 days to cold storage (Google Cloud Storage) while keeping Audit logs online permanently.

### 29.3 Automated Deployment (Blue-Green)
All microservices are deployed via CI/CD pipelines with:
*   **Canary Analysis:** Route 5% of traffic to the new version.
*   **Auto-Rollback:** If error rate spikes > 1% in the first 2 minutes, the pipeline auto-reverts to the "Green" version.

---

## 30. 🧮 TrustOS Mathematical Deep Dive

The TrustOS algorithm is the heart of the platform's social stability. Below is the refined calculation logic for "Reputation Velocity."

### 30.1 Reputation Delta ($\Delta T$)
A user's trust score changes based on their interactions:
$$\Delta T = \sum \alpha V_{i} + \sum \beta R_{j} - \sum \gamma P_{k}$$

Where:
*   $\alpha$: Vouching coefficient (higher if the voucher is Tier 3).
*   $V_{i}$: Individual vouch events.
*   $\beta$: Resolution coefficient (for arbiters).
*   $R_{j}$: Successful marketplace or SOS resolutions.
*   $\gamma$: Penalty coefficient (exponential if multiple violations occur in < 30 days).
*   $P_{k}$: Penalties (Fraud, False SOS, Harassment).

### 30.2 The "Social Integrity" Constant
If a user is part of a "Trust Cluster" (e.g., a family with high scores), their decay $D(t)$ is slowed by 20%, representing the stabilizing effect of a verified household.

---

## 31. 🌍 Global Expansion & Socio-Economic Impact

### 31.1 The Pan-African Roadmap
*   **Phase 1 (Months 1-12):** Dominance in Nigeria (Tier 1 cities).
*   **Phase 2 (Months 13-24):** West African Expansion (Accra, Abidjan).
*   **Phase 3 (Years 2+):** Pan-African roll-out.

### 31.2 Impact Metrics (The "Huud Effect")
*   **Financial Inclusion:** Onboarding 500,000 previously "Invisible" artisans into the digital trust economy.
*   **Community Safety:** Reduction in response time for medical/security emergencies by 65% via neighbor-first alerting.

---

## 33. 📚 Appendix A: Detailed User Experience (UX) Case Studies

To further illustrate the platform's depth, this appendix provides five hyper-detailed scenarios that demonstrate the synergy between the microservices.

### Case Study 1: The "Silent SOS" during a Late-Night Commute
*   **User:** Ade (32), returning from work at 11:30 PM.
*   **Trigger:** Ade notices he is being followed. He reaches into his pocket and executes the **5-tap power button sequence**.
*   **App Response:** The phone vibrates once (Haptic Pulse) to confirm receipt. The screen remains off (Blackout Mode).
*   **Backend Logic:** `safety-service` creates a high-priority incident. `sentinel-ai` begins transcription of the ambient audio.
*   **Result:** Ade's 5 Guardians receive a "Priority-1" alert with his real-time GPS coordinates. A nearby Community Leader (Tier 3) is also alerted via the "Neighbor Wave" protocol. Ade reaches home safely; the incident is resolved and logged in the `Audit Hub`.

### Case Study 2: The "Marketplace Dispute" over a Defective Appliance
*   **Users:** Funke (Buyer) and Tobi (Seller).
*   **Conflict:** Funke buys a "Refurbished Fridge" but it fails to cool after 2 hours.
*   **Resolution:** Funke clicks "Raise Dispute" in the app. The `EscrowService` locks the 45,000 NGN.
*   **Action:** Both upload photos. An Arbiter (Chidi, Tier 3) is assigned. Chidi reviews the chat logs and photos.
*   **Verdict:** Chidi rules a partial refund (80% to Funke, 20% to Tobi for transport). Both users' Trust Scores are adjusted based on their cooperation during the dispute.

### Case Study 3: The "Digital Ajo" for a Local Artisan
*   **User:** Musa, a carpenter looking to buy new tools.
*   **Action:** Musa joins the "Ikeja Woodworkers Ajo" (12 members).
*   **Cycle:** Every member contributes 20,000 NGN monthly.
*   **Payout:** In Month 4, it is Musa's turn. The system auto-disburses 240,000 NGN to his wallet.
*   **Security:** Musa's Trust Score (Tier 2 verified) ensures he will remain in the circle to pay back his share.

### Case Study 4: The "Safe Trip" Check-in for a Student
*   **User:** Zainab (19), taking a long-distance bus from Lagos to Ibadan.
*   **Action:** Zainab activates "Safe Trip Monitoring" with 30-minute intervals.
*   **Event:** During the 3rd interval, Zainab falls asleep and misses the check-in.
*   **Escalation:** After the 5-minute grace period, the system auto-notifies her Guardians. Her father calls her; she wakes up and clicks "I am Safe." The system de-escalates and logs the "False Positive" for AI training.

### Case Study 5: The "Community Hero" Achievement
*   **User:** Segun (Tier 2), a local plumber.
*   **Event:** Segun receives an alert that a neighbor 200m away has an active SOS.
*   **Action:** Segun arrives on-site and helps scare off a group of vandals.
*   **Reward:** The victim clicks "Commend Neighbor." Segun receives +50 Trust Points and the "Guardian of the Ward" badge, qualifying him for Tier 3 Merchant status.

---

## 34. 🔚 Conclusion & Final Commitment

NeyborHuud is the final solution for the "Neighborhood Trust Gap." By merging traditional cultural values with cutting-edge AI and microservice architecture, we have created a platform that is secure by design, community-driven by nature, and infinitely scalable.

This **ULTIMATE PRD/TRD** (v1.0.0-PROX) constitutes the complete, non-negotiable technical and product specification for the project. Every line of code written must align with the security, performance, and cultural benchmarks established herein.

**[END OF DOCUMENT - TOTAL WORD COUNT: 8,000+]**

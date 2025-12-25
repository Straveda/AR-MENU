# Backend API Documentation

> **Generated for:** Restaurant-AR Project (SaaS Platform)
> **Version:** 2.0.0 (Enterprise Scope)
> **Base URL:** `/api/v1` > **Last Updated:** 2025-12-25

---

## 📚 Table of Contents

1.  [System Overview](#1-system-overview)
2.  [Authentication & Authorization](#2-authentication--authorization-lifecycle)
3.  [Tenant Isolation Model](#3-tenant-isolation-model)
4.  [Standard API Response Format](#4-standard-api-response-format)
5.  [Role Access Matrix](#5-role-access-matrix)
6.  [Real-Time Events (Socket.IO)](#6-real-time-events-socketio)
7.  [Authentication API](#7-authentication-api)
8.  [Platform Management API (SaaS Owner)](#8-platform-management-api-saas-owner)
9.  [Subscription Plans API](#9-subscription-plans-api)
10. [Restaurant Administration API](#10-restaurant-administration-api)
11. [Dish Management API](#11-dish-management-api)
12. [Order System API (Public & KDS)](#12-order-system-api-public--kds)

---

## 1. System Overview

The **Restaurant-AR Project** is a multi-tenant SaaS platform designed to digitize restaurant operations. It provides a unified backend that serves multiple distinct restaurants (tenants) simultaneously while maintaining strict data isolation.

**Major Modules:**

- **Platform Core:** Manages tenants (restaurants), subscriptions, and global settings.
- **Auth System:** Unified login for Super Admins, Restaurant Admins, and Staff.
- **Menu & Dishes:** Manages catalogue, pricing, and the unique AI-driven 3D model generation pipeline.
- **Order System:** Handles the lifecycle from customer placement to kitchen fulfillment.
- **KDS (Kitchen Display System):** A real-time dashboard for kitchen staff.
- **Public Interface:** Slug-based access for customers to view menus and place orders without login.

---

## 2. Authentication & Authorization Lifecycle

### Login Flow

1.  User submits credentials (`email`, `password`) to `/api/v1/users/auth/login`.
2.  Server verifies password (bcrypt) and checks `isActive` status.
3.  Server issues a signed **JWT (JSON Web Token)**.

### JWT Structure

The token payload contains critical context for all subsequent requests:

```json
{
  "id": "user_123", // Unique User ID
  "role": "RESTAURANT_ADMIN", // Role for RBAC
  "restaurantId": "rest_999", // Tenant Context (Null for Super Admin)
  "iat": 1630000000,
  "exp": 1630604800
}
```

### Role Enforcement

Middleware `requireRole("ROLE_NAME")` runs after authentication. It compares the user's JWT role against the allowed roles for the endpoint.

- **Unauthorized (401):** User is not logged in or token is invalid.
- **Forbidden (403):** User is logged in but lacks the specific role required.

---

## 3. Tenant Isolation Model

The platform uses a **Shared Database / Logical Isolation** strategy.

### 1. Restaurant ID Scope (Private Areas)

- For logged-in users (Admins, Staff), the `restaurantId` is embedded _immutably_ in their JWT.
- The middleware `resolveRestaurantFromUser` extracts this ID.
- **Enforcement:** Every database query for private data (Orders, Dishes) _must_ include `{ \restaurantId: req.user.restaurantId }`. This prevents a user from one restaurant accessing data from another.

### 2. Slug Scope (Public Areas)

- Public routes (Menu, Ordering) do not require login.
- They use unique URL slugs (e.g., `/r/pizza-palace/dishes`).
- **Enforcement:** The middleware `resolveRestaurant` looks up the restaurant by slug and attaches it to the request object. If the slug is invalid, the request fails instantly (404).

---

## 4. Standard API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... } // Optional payload
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description here",
  "error": "Detailed stack trace or internal error message" // Only in Dev
}
```

**Common HTTP Codes:**

- `200 OK`: Success (GET/PATCH/PUT).
- `201 Created`: Resource created (POST).
- `400 Bad Request`: Validation failure.
- `401 Unauthorized`: Invalid or missing token.
- `403 Forbidden`: Valid token but insufficient permission or subscription issue.
- `404 Not Found`: Resource or Endpoint not found.
- `500 Internal Error`: Server crash or unhandled exception.

---

## 5. Role Access Matrix

| Role                 | Platform APIs | Plans APIs | Staff Mgmt | Dish Mgmt | KDS View | Order Status | Menu View | Order Create |
| :------------------- | :-----------: | :--------: | :--------: | :-------: | :------: | :----------: | :-------: | :----------: |
| **SUPER_ADMIN**      |      ✅       |     ✅     |     ❌     |    ❌     |    ❌    |      ❌      |    ✅     |      ✅      |
| **RESTAURANT_ADMIN** |      ❌       |     ❌     |     ✅     |    ✅     |    ❌    |      ❌      |    ✅     |      ✅      |
| **KDS**              |      ❌       |     ❌     |     ❌     |    ❌     |    ✅    |      ✅      |    ✅     |      ✅      |
| **WAITER / CASHIER** |      ❌       |     ❌     |     ❌     |    ❌     |    ❌    |      ❌      |    ✅     |      ✅      |
| **CUSTOMER**         |      ❌       |     ❌     |     ❌     |    ❌     |    ❌    |      ❌      |    ✅     |      ✅      |

---

## 6. Real-Time Events (Socket.IO)

The backend uses `socket.io` for real-time synchronization.

### Connection

Clients connect to the base URL. Authentication is currently handshake-based or open (for customers).

### Rooms & Events

#### 1. Kitchen Display Room (`KDS_ROOM_{restaurantId}`)

- **Listener:** KDS Frontend Screens.
- **Events Received:**
  - `order_created`: Emitted when a customer places a new order.
  - `kds_order_updated`: Emitted when _another_ KDS screen updates an order status.

#### 2. Order Specific Room (`ORDER_ROOM_{restaurantId}_{orderCode}`)

- **Listener:** Specific Customer's Browser (Tracking Page).
- **Events Received:**
  - `order_status_updated`: Emitted when the KDS changes status (e.g., "Preparing" -> "Ready").

---

## 7. Authentication API

### 1.1 Login User

**Endpoint Overview**

- **URL:** `POST /users/auth/login`
- **Auth:** No
- **Scope:** Global
- **Consumer:** All Dashboards

**What does this API do?**
The single entry point for all authorized personnel. It validates credentials and establishes the user's session context (Role + Tenant).

**Request Details**

- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "secure123"
  }
  ```

**Response Details**

- **Success (200):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhb...",
    "user": {
      "id": "...",
      "role": "RESTAURANT_ADMIN",
      "restaurantId": "..."
    }
  }
  ```

**Internal Flow**

1. Checks if user exists and `isActive` is true.
2. Compares password hashes.
3. Specific login logic for 'KDS' role exists in a separate controller but this is the primary unified login.

---

### 1.2 Get Current User

**Endpoint Overview**

- **URL:** `GET /users/auth/me`
- **Auth:** Yes
- **Scope:** User Context
- **Consumer:** All Dashboards

**What does this API do?**
Returns the user profile associated with the current token. Used to hydrate the frontend state on page usage.

**Response Details**

- **Success (200):** Returns the full User object (excluding password).

---

## 8. Platform Management API (SaaS Owner)

> **Required Role:** `SUPER_ADMIN` for all endpoints below.

### 2.1 Get All Restaurants

**Endpoint Overview**

- **URL:** `GET /platform/get-all-restaurants`
- **Auth:** Yes
- **Consumer:** SaaS Dashboard

**What does this API do?**
Provides a birds-eye view of all tenants on the platform to monitor growth and subscription health.

**Response Details**

- **Success (200):** Array of Restaurant objects.

---

### 2.2 Create Restaurant

**Endpoint Overview**

- **URL:** `POST /platform/create-restaurant`
- **Auth:** Yes
- **Consumer:** SaaS Dashboard

**What does this API do?**
Onboards a new tenant. Automatically generates a URL slug and assigns a default TRIAL subscription.

**Request Details**

- **Body:** `{"name": "The Great Grill"}`

**Internal Flow**

1. Generates slug from name (e.g., "the-great-grill").
2. Sets `status: Active` and `subscriptionStatus: TRIAL`.
3. Sets trial expiry to 30 days from now.

---

### 2.3 Create Restaurant Admin

**Endpoint Overview**

- **URL:** `POST /platform/create-restaurant-admin`
- **Auth:** Yes
- **Scope:** Target Tenant
- **Consumer:** SaaS Dashboard

**What does this API do?**
Provisions the master account for a specific restaurant.

**Request Details**

- **Body:**
  ```json
  {
    "restaurantId": "...",
    "username": "Manager One",
    "email": "manager@grill.com",
    "password": "init",
    "phone": "555-0199"
  }
  ```

**Security Notes**

- Checks if the target restaurant is Active.
- Enforces `maxStaff` limits of the restaurant's plan before creation.

---

### 2.4 Assign Plan

**Endpoint Overview**

- **URL:** `PATCH /platform/assign-plan`
- **Auth:** Yes
- **Consumer:** SaaS Dashboard

**What does this API do?**
Manually assigns a subscription plan to a restaurant.

**Request Details**

- **Body:** `{"restaurantId": "...", "planId": "...", "durationInDays": 365}`

---

### 2.5 Change Plan

**Endpoint Overview**

- **URL:** `PATCH /platform/change-plan/:restaurantId`
- **Auth:** Yes
- **Consumer:** SaaS Dashboard

**What does this API do?**
Upgrades or downgrades a tenant's plan.

**Edge Cases**

- **Downgrade Protection:** If a tenant tries to move to a smaller plan but currently has MORE dishes or staff than the new plan allows, the request is **rejected** (400) to prevent data inconsistency.

---

### 2.6 Extend Subscription

**Endpoint Overview**

- **URL:** `PATCH /platform/extend-subscription/:restaurantId`
- **Auth:** Yes
- **Consumer:** SaaS Dashboard

**What does this API do?**
Extends the current subscription end date for a restaurant by a specified number of days.

**Request Details**

- **Body:** `{"extendByDays": 30}`

---

### 2.7 Suspend / Resume Restaurant

**Endpoints**

- `PATCH /platform/suspend-restaurant/:restaurantId`
- `PATCH /platform/resume-restaurant/:restaurantId`

**What does this API do?**
Emergency control to block a tenant's access (e.g., non-payment) or restore it.

---

## 9. Subscription Plans API

> **Required Role:** `SUPER_ADMIN`

### 3.1 Create Plan

**Endpoint Overview**

- **URL:** `POST /platform/plans/create-plan`
- **Auth:** Yes

**What does this API do?**
Defines a SaaS tier configuration.

**Request Details**

- **Body:**
  ```json
  {
    "name": "Enterprise",
    "price": 299,
    "interval": "MONTHLY",
    "features": { "arModels": true, "kds": true, "analytics": true },
    "limits": { "maxDishes": 999, "maxStaff": 50 }
  }
  ```

### 3.2 Get Plans

**Endpoint Overview**

- **URL:** `GET /platform/plans/get-plans`
- **Auth:** Yes

### 3.3 Update Plan

**Endpoint Overview**

- **URL:** `PUT /platform/plans/update/:planId`
- **Auth:** Yes

---

## 10. Restaurant Administration API

> **Required Role:** `RESTAURANT_ADMIN`

### 4.1 Create Staff User

**Endpoint Overview**

- **URL:** `POST /admin/create-staff`
- **Auth:** Yes
- **Scope:** Restaurant
- **Consumer:** Admin Panel

**What does this API do?**
Creates sub-accounts for restaurant operations.

**Request Details**

- **Body:**
  ```json
  {
    "username": "KDS1",
    "email": "kds@loc.com",
    "password": "...",
    "role": "KDS" // KDS, WAITER, CASHIER
  }
  ```

**Auth & Tenancy Behavior**

1.  **Subscription Check:** Middleware `checkSubscription` ensures the restaurant is not Suspended/Expired.
2.  **Limit Check:** Middleware `enforcePlanFeature("maxStaff")` counts current staff. If `>= limit`, returns 403 Forbidden.

---

## 11. Dish Management API

### 5.1 Get Dishes (Public)

**Endpoint Overview**

- **URL:** `GET /dishes/r/:restaurantSlug/dishes`
- **Auth:** No
- **Scope:** Public (Slug)
- **Consumer:** Customer Menu

**What does this API do?**
Fetches the public-facing menu. Filters to show only `available: true` dishes.

**Request Details**

- **Query Params:** `sort` (optional: `most_ordered`, `budget`, `chef_special`)

---

### 5.2 Get Single Dish

**Endpoint Overview**

- **URL:** `GET /dishes/r/:restaurantSlug/dishes/:id`
- **Auth:** No

**What does this API do?**
Fetches details for a single dish.

---

### 5.3 People Also Ordered (Recommendations)

**Endpoint Overview**

- **URL:** `GET /dishes/r/:restaurantSlug/dishes/:dishId/also-ordered`
- **Auth:** No

**What does this API do?**
Returns a list of recommended dishes based on order history analysis (data analytics).

---

### 5.4 Add Dish

**Endpoint Overview**

- **URL:** `POST /dishes/add`
- **Auth:** Yes (RESTAURANT_ADMIN)
- **Scope:** Restaurant
- **Consumer:** Admin Panel

**What does this API do?**
Creates a dish AND starts the AI model generation pipeline.

**Request Details**

- **Headers:** `Content-Type: multipart/form-data`
- **Body:** `name`, `price`, `description`, `category`, `image` (File).

**Internal Flow**

1. Uploads image to Cloudinary.
2. Creates Dish document in MongoDB.
3. Checks `arModels` feature flag.
4. Sends job to Meshy AI API.
5. Updates Dish with `modelStatus: processing`.
6. Starts in-memory polling service to check for 3D model completion.

---

### 5.5 Update Dish

**Endpoint Overview**

- **URL:** `PUT /dishes/updatedish/:id`
- **Auth:** Yes (RESTAURANT_ADMIN)

**What does this API do?**
Updates dish details (price, description, availability, etc.).

---

### 5.6 Delete Dish

**Endpoint Overview**

- **URL:** `DELETE /dishes/deletedish/:id`
- **Auth:** Yes (RESTAURANT_ADMIN)

---

### 5.7 Generate 3D Model (Manual)

**Endpoint Overview**

- **URL:** `POST /dishes/:id/generate-model`
- **Auth:** Yes (RESTAURANT_ADMIN)

**What does this API do?**
Manually triggers the AI pipeline for a dish that might have failed or was skipped.

**Edge Cases**

**Edge Cases**

- Returns 400 if model generation is already in progress.

---

### 5.8 Retry Model Generation

**Endpoint Overview**

- **URL:** `POST /dishes/:id/retry-model`
- **Auth:** Yes (RESTAURANT_ADMIN)

**What does this API do?**
Retries a failed Meshy AI generation task.

---

### 5.4 Check Model Status

**Endpoint Overview**

- **URL:** `GET /dishes/r/:restaurantSlug/dishes/:id/model-status`
- **Auth:** No (Public)

**What does this API do?**
Used by the AR Viewer to check if the 3D model is ready to be displayed.

**Response Details**

- **Success:**
  ```json
  {
    "data": {
      "modelStatus": "completed",
      "modelUrls": { "glb": "...", "usdz": "..." }
    }
  }
  ```

---

### 5.5 Proxy Model

**Endpoint Overview**

- **URL:** `GET /dishes/r/:restaurantSlug/dishes/proxy-model/:id/:format`
- **Auth:** No

**What does this API do?**
Acts as a pass-through proxy for 3D model files (GLB/USDZ). This avoids CORS issues on some mobile browsers and allows the backend to control caching.

---

## 12. Order System API (Public & KDS)

### 6.1 KDS Dedicated Login

**Endpoint Overview**

- **URL:** `POST /kds/login`
- **Auth:** No
- **Consumer:** KDS Devices

**What does this API do?**
Specialized login for KDS screens. Returns a 12h token.

---

### 6.2 Get KDS Orders

**Endpoint Overview**

- **URL:** `GET /kds/getkdsorders`
- **Auth:** Yes (KDS Role)

**What does this API do?**
Fetches all active orders (Pending, Preparing, Ready) for the kitchen board.

---

### 6.3 Create Order

**Endpoint Overview**

- **URL:** `POST /orders/r/:restaurantSlug/create`
- **Auth:** No
- **Scope:** Public
- **Consumer:** Customer Order UI

**What does this API do?**
Accepts a guest order. Matches dish IDs to the private database prices (ignoring client-sent prices).

**Request Details**

- **Body:**
  ```json
  {
    "tableNumber": 4,
    "orderItems": [{ "dishId": "...", "quantity": 1 }]
  }
  ```

**Internal Flow**

1. Resolves restaurant from Slug.
2. Checks Subscription Status.
3. Creates Order.
4. **Socket Emit:** `io.to(KDS_ROOM_{id}).emit('order_created', order)` providing real-time alert to kitchen.

---

### 6.2 Track Order

**Endpoint Overview**

- **URL:** `GET /orders/r/:restaurantSlug/track/:orderCode`
- **Auth:** No
- **Consumer:** Customer Order UI

**What does this API do?**
Retrieves order status using the unique 5-character `orderCode`. Safe for public use as the code is essentially a password for that specific order.

---

### 6.3 Update Order Status (KDS)

**Endpoint Overview**

- **URL:** `PATCH /kds/:orderCode/status`
- **Auth:** Yes (KDS Role)
- **Scope:** Restaurant
- **Consumer:** KDS Screen

**What does this API do?**
Moves order through stages: `Pending` -> `Preparing` -> `Ready` -> `Completed`.

**Request Details**

- **Body:** `{"status": "Ready"}`

**Internal Flow**

1. Validates transition logic (e.g., can't go from Ready back to Pending).
2. Updates DB.
3. **Socket Emit 1:** `KDS_ROOM_{id}` (Syncs other kitchen screens).
4. **Socket Emit 2:** `ORDER_ROOM_{id}_{code}` (Notifies the specific customer).

---

**End of Documentation**

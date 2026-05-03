# Pathao Courier API Onboarding Guidelines

Date: 4 May 2026
Project: ARON
Purpose: Step-by-step guide to get Pathao credentials, environment access, store configuration, and webhook integration live for automatic order tracking.

## 1. Scope

This document covers:
- How to request and receive Pathao API credentials
- How to get sandbox and production access
- How to configure merchant store, pickup, city/zone mappings, COD settings
- How to set up webhooks for real-time status updates
- How to validate everything before go-live

This document does not replace official Pathao confirmation. If Pathao updates policy or auth flow, follow the latest official response from their support/relationship manager.

## 2. What Is Confirmed

From public merchant flow and SDK references, these are the practical requirements:
- Merchant account approval is required before API onboarding
- API credentials are required from Pathao (SDK alone is not enough)
- Sandbox and production are separate environments
- Webhook requires callback URL + secret and proper response behavior
- Shipment creation requires merchant/store location configuration (store, city/zone/area, COD policy)

## 3. Prerequisites

Before contacting Pathao, prepare:
- Merchant name
- Merchant ID (if visible in panel)
- Registered merchant email and phone
- Production domain
- Expected webhook URL
- Server public IP(s) (if IP whitelist is needed)
- Technical contact name and email

## 4. Step-by-Step Process

### Step 1: Request Courier API onboarding

Contact Pathao support or your relationship manager and request Courier Merchant API enablement.

Ask for all items in one message:
- Sandbox API activation
- Production API activation
- Auth flow details and required fields
- Webhook enablement
- Store and location data access
- COD rules for your account

### Step 2: Collect API credentials

Request credentials for both environments:
- client_id
- client_secret

Also confirm:
- Token endpoint
- Grant type and required auth fields
- Access token expiry and refresh behavior

Important: Do not proceed with development assumptions. Wait for Pathao to confirm exact auth and token details for your merchant.

### Step 3: Confirm environment details

Get these values explicitly:
- Sandbox base URL
- Production base URL
- API version (if versioned)
- Any required headers beyond Authorization and Content-Type
- Whether IP whitelisting is mandatory

If whitelist is required, send IPs immediately and confirm activation time.

### Step 4: Configure merchant/store logistics data

You need valid operational data before creating orders via API:
- Store or pickup point ID
- City IDs
- Zone IDs
- Area IDs
- Delivery type rules
- Parcel weight constraints
- COD settings (enabled/disabled, fee, remittance policy)

Without correct store/location IDs, shipment creation usually fails.

### Step 5: Enable webhooks

Provide Pathao:
- Callback URL (HTTPS, publicly reachable)
- Webhook secret
- Event subscriptions

Minimum events to subscribe:
- order.created
- order.updated
- order.pickup-requested
- order.assigned-for-pickup
- order.picked
- order.in-transit
- order.received-at-last-mile-hub
- order.assigned-for-delivery
- order.delivered
- order.partial-delivery
- order.returned
- order.delivery-failed
- order.on-hold

Webhook endpoint requirements:
- URL must be reachable from internet
- Valid SSL certificate
- Fast response (target under 10 seconds)
- Signature verification in your backend
- Return required integration header/value expected by Pathao

### Step 6: Sandbox validation

Run full test cycle in sandbox:
- Issue token
- Create shipment
- Get tracking details
- Receive webhook events
- Update database status map

Validation checklist:
- Auth success and token refresh path works
- Tracking number/consignment id stored
- Status transitions mapped to your internal order statuses
- Duplicate webhook handling is idempotent
- Out-of-order event handling does not corrupt status

### Step 7: Production rollout

After sandbox success:
- Switch credentials and base URL to production values
- Confirm production webhook is enabled
- Run one controlled real order end-to-end
- Verify admin notifications and customer tracking page update correctly

### Step 8: Monitoring and fallback

Always keep:
- Webhook failure logging
- Retry strategy for transient errors
- Optional polling fallback for active shipments if webhook is delayed

Recommended fallback:
- Poll active shipments every 10-15 minutes
- Stop polling once terminal state is reached (delivered/returned/cancelled)

## 5. Exact Data You Should Ask Pathao For

Use this checklist and do not close onboarding until all are received.

### API and Auth
- client_id (sandbox + production)
- client_secret (sandbox + production)
- token endpoint
- grant type and required fields
- token expiry and refresh contract

### Environment
- sandbox base URL
- production base URL
- API version details
- header requirements
- IP whitelist requirement and activation confirmation

### Merchant Configuration
- store_id / pickup location IDs
- city/zone/area mapping source
- delivery type limitations
- item type and weight constraints
- COD enablement and fee/remittance policy

### Webhook
- webhook registration status
- signature header and verification method
- list of enabled events
- expected response headers and values
- retry behavior (if callback fails)

## 6. Support Message Template (Copy and Send)

Subject: Courier Merchant API Enablement Request (Approved Merchant)

Hello Pathao Team,

Our merchant account is approved. We need Courier Merchant API onboarding for website integration.

Please provide/enable the following:

1) API Credentials
- Sandbox: client_id, client_secret
- Production: client_id, client_secret
- Token endpoint and grant type details
- Token expiry and refresh behavior

2) Environment Access
- Sandbox base URL
- Production base URL
- Required headers and API version details
- Confirm if IP whitelisting is required

3) Merchant/Store Configuration
- Store/Pickup IDs for our account
- City/Zone/Area mapping source
- Delivery type and parcel constraint rules
- COD settings and remittance policy

4) Webhook Setup
- Enable webhook for our merchant account
- Callback URL: <YOUR_WEBHOOK_URL>
- Signature verification details
- Required response header/value
- Confirm enabled event list

Merchant details:
- Merchant Name: <YOUR_MERCHANT_NAME>
- Merchant ID: <YOUR_MERCHANT_ID>
- Registered Email: <YOUR_EMAIL>
- Technical Contact: <NAME + EMAIL>
- Server IP(s): <PUBLIC_IPS_IF_NEEDED>

Thank you.

## 7. ARON Internal Implementation Checklist

Complete these before production launch:
- Store Pathao secrets in env variables (no hardcoding)
- Add shipment fields/tables in database
- Build status mapper from Pathao events to ARON order statuses
- Implement webhook signature verification
- Implement idempotency key strategy for webhook events
- Add admin log for each webhook payload and processing outcome
- Add alerting for webhook failure spikes

## 8. Risk Notes

- SDK from GitHub helps coding but does not grant account-level access
- Missing store/location configuration causes shipment creation errors
- Webhook misconfiguration causes tracking delays
- Production credentials should never be tested directly without sandbox validation

## 9. Go-Live Signoff Checklist

All must be true before launch:
- Sandbox end-to-end tested
- Production credentials verified
- Production webhook receiving events
- Status updates visible in admin panel
- Customer tracking reflects real status
- Fallback polling active for non-terminal shipments
- Monitoring and error alerts active

---

Owner: ARON Engineering
Review cycle: Update whenever Pathao changes API/auth/webhook policies

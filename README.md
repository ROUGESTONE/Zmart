# ZMart Shopping Platform

## Run

```bash
npm start
```

Open http://localhost:3000.

## Demo Accounts

- Admin: `admin@zmart.com` / `Admin@123`
- Customer: `demo@zmart.com` / `Demo@123`

## Environment Variables

- `PORT` - server port, defaults to `3000`
- `ZMART_TOKEN_SECRET` - HMAC secret for signed auth tokens
- `RAZORPAY_KEY_ID` - Razorpay checkout key
- `RAZORPAY_KEY_SECRET` - Razorpay webhook/signature secret used by `/api/payments/verify`
- `ZMART_UPI_ID` - UPI ID shown for QR/GPay payments

The app stores data in `zmart-db.json`, created automatically on first run. Important data such as users, carts, orders, products, coupons, reviews, wishlist, addresses, payments, and contact messages is stored through the backend API instead of browser-only localStorage.

# Nana's Kitchen Dashboard — Server

Express + TypeScript + Drizzle ORM backend for managing products, orders, analytics, and shipping.

## Tech Stack

- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Database**: MySQL 8+ via Drizzle ORM
- **Auth**: JWT (jsonwebtoken)
- **File Upload**: Cloudinary (multer + cloudinary SDK)
- **Email**: Nodemailer
- **Seed/manage**: Drizzle Kit

## Folder Structure

```
server/
├── src/
│   ├── controllers/
│   │   ├── V2/                          V2 controllers
│   │   │   ├── product_controllers.ts   Products, flavors, price tiers
│   │   │   ├── price_tiers_controllers.ts  Preview/apply tiers across flavors
│   │   │   ├── user_controllers.ts
│   │   │   ├── settingsController.ts
│   │   │   └── seed_controllers.ts
│   │   ├── auth_controllers.ts
│   │   ├── order_controllers.ts
│   │   ├── review_controllers.ts
│   │   ├── sales_analytics_controllers.ts
│   │   ├── customer_analytics_controllers.ts
│   │   ├── website_analytics_controllers.ts
│   │   ├── feedback_analytics_controllers.ts
│   │   ├── stats_controller.ts
│   │   ├── user-roles-controller.ts
│   │   └── countries_and_locations_controllers.ts
│   ├── models/
│   │   └── db_connection.ts             Database connection
│   ├── utils/
│   │   ├── email-service.ts
│   │   ├── html-template.ts
│   │   ├── period.ts
│   │   └── country-currency.ts
│   ├── types/
│   │   └── express.d.ts
│   └── server.ts                        Express app setup & routes
├── db/
│   ├── schema.ts                        Full Drizzle schema
│   ├── relations.ts                     Table relations
│   ├── index.ts                         Re-exports
│   ├── meta/                            Migration snapshots
│   └── 0000_*.sql to 0004_*.sql        SQL migration files
├── .env
├── drizzle.config.ts
├── tsconfig.json
└── package.json
```

## Database Schema

### Core Tables

| Table | Fields | Purpose |
|-------|--------|---------|
| `Product` | id, sourceId, title, image, flavorId, variantId, isCase, dimensions, weight, unitsPerCase | Product variants |
| `Flavors` | id, label, image | Flavor definitions |
| `Variants` | id, variantName, titleTag | Product variants (e.g. 500ml, 1L) |
| `PricingGroups` | id, groupName | Retailer / Wholesaler / Distributor |
| `PricingTiers` | id, productId, pricingGroupId, currencyId, minCases, maxCases, amount, discount | Price per group per currency |
| `Countries` | id, countryLabel, countryCode, currencyId | Shipping countries |
| `Currency` | id, currencyLabel, currencyCode | Supported currencies |
| `DeliveryLocation` | id, location, price, isFreeDelivery, discountPercentage | Local delivery zones |
| `Order` | id, sourceId, totalAmount, status, origin, currency, paymentMethod, trackingNumber | Customer orders |
| `OrderCartItem` | id, orderId, title, quantity, price, totalPrice, weight, dimensions | Line items |
| `OrderUserDetail` | id, orderId, firstName, lastName, email, phone, country, location, deliveryLocationId | Shipping details |
| `User` | id, email, phoneNumber, firstName, lastName, pricingGroupId | Customers |
| `UserRoles` | id, userId, pricingGroupId | Admin role assignments |
| `Review` | id, sourceId, productId, name, comment, status, rating | Product reviews |
| `Admin` | id, name, email, password | Dashboard admins |
| `CountryProductSettings` | id, countryId, productId, outOfStock, visible | Per-country product visibility |

### Pricing System
The pricing tier system supports:
- Multiple currencies per product
- Pricing groups (Retailer, Wholesaler, Distributor)
- Bulk apply tiers from one flavor to others (with preview)
- Discount percentages per tier

## API Endpoints

### Products (V2)
```
GET    /api/v2/products/flavors                              List all flavors
GET    /api/v2/products/productByflavor/tiers/:flavorId      Full price list by flavor
GET    /api/v2/products/productByflavor/tiers/:flavorId/:priceGroupId  Price list filtered by group
GET    /api/v2/products/price-list/tiers/preview-apply       Preview tier changes across flavors
POST   /api/v2/products/price-list/tiers/apply               Apply tier changes
PATCH  /api/v2/products/price-list/tiers                     Batch update tier values
POST   /api/v2/products/create                               Create new product
GET    /api/v2/products/fetch/:productId                     Get single product
POST   /api/v2/products/fix-price-list                       Clean inconsistent tier assignments
```

### Shipping
```
GET    /api/shipping/countries             List all countries
POST   /api/shipping/add-country           Add new country
DELETE /api/shipping/countries/:id         Delete country
GET    /api/shipping/delivery-locations    List delivery locations
POST   /api/shipping/delivery-locations    Add delivery location
PUT    /api/shipping/delivery-locations/:id Update location
DELETE /api/shipping/delivery-locations/:id Delete location
```

### Orders
```
GET    /api/orders/all           List orders (with filters)
GET    /api/orders/pending       Awaiting payment
GET    /api/orders/completed     Completed orders
GET    /api/orders/delivered     Delivered orders
GET    /api/orders/trashed       Soft-deleted orders
```

### Auth
```
POST   /api/auth/login           Admin login (JWT)
POST   /api/auth/verify-token    Verify JWT
```

### Analytics
```
GET    /api/analytics/sales      Sales data (period, country filters)
GET    /api/analytics/customers  Customer metrics
GET    /api/analytics/feedback   Feedback responses
GET    /api/analytics/website    Website analytics
GET    /api/stats/overview       Dashboard KPI cards
```

## Environment Variables

```env
DATABASE_URL=mysql://user:pass@localhost:3306/nanas_kitchen
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
PORT=3000
```

## Available Scripts

```bash
npm run dev              # Start dev (tsx watch)
npm run build            # Compile to dist/
npm run start            # Run compiled dist/server.js
npm run db:generate      # Generate Drizzle migration
npm run db:migrate       # Apply migrations
npm run db:seed          # Seed pricing groups
npm run db:studio        # Launch Drizzle Studio GUI
npm run lint             # ESLint
```

## Adding a New Endpoint

1. Add controller function in `src/controllers/` (or `V2/`)
2. Register route in `src/server.ts`
3. Add Drizzle query if new table access is needed
4. Update client store to consume new endpoint

### Layer order
```
Route → Controller → Drizzle Query → Response
```

Controllers validate input, call the database layer, and return formatted responses.

## Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Railway / Render
- Set build command: `npm run build`
- Set start command: `npm start`
- Add environment variables

### Bare Metal
```bash
npm run build
npm start  # Runs dist/server.js
```
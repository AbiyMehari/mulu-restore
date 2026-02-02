# Mulu Restore - Complete System Flow Diagram

```mermaid
graph TB
    %% ============================================
    %% PUBLIC CUSTOMER FLOW
    %% ============================================
    subgraph Public["🌐 Public Storefront"]
        Start[User Visits Site] --> Browse[Browse Products<br/>GET /api/products]
        Browse --> ProductList[Product List Page<br/>/products]
        ProductList -->|Click Product| ProductDetail[Product Detail<br/>/products/[slug]]
        ProductList -->|Add to Cart| AddToCart1[Add to Cart<br/>localStorage: mulu_cart]
        ProductDetail -->|Add to Cart| AddToCart2[Add to Cart<br/>localStorage: mulu_cart]
        
        AddToCart1 --> CartPage[View Cart<br/>/cart]
        AddToCart2 --> CartPage
        CartPage -->|Update Qty/Remove| UpdateCart[Update Cart<br/>localStorage]
        UpdateCart --> CartPage
        
        CartPage -->|Go to Checkout| CheckoutPage[Checkout Page<br/>/checkout]
        CheckoutPage -->|Fill Form| ValidateForm{Validate<br/>Form Fields}
        ValidateForm -->|Invalid| ShowErrors[Show Validation Errors]
        ShowErrors --> CheckoutPage
        ValidateForm -->|Valid| SubmitCheckout[Submit Checkout<br/>POST /api/checkout]
        
        SubmitCheckout --> StockCheck{Validate Stock<br/>& Decrement}
        StockCheck -->|Insufficient| StockError[Return 409<br/>Insufficient Stock]
        StockError --> CheckoutPage
        StockCheck -->|Sufficient| CreateOrder[Create Order<br/>Status: pending]
        CreateOrder --> CreateStripeSession[Create Stripe<br/>Checkout Session]
        CreateStripeSession -->|Return URL| RedirectStripe[Redirect to<br/>Stripe Checkout]
        
        RedirectStripe --> StripePayment[Stripe Payment<br/>External]
        StripePayment -->|Success| StripeSuccess[Stripe Success<br/>/checkout/success]
        StripePayment -->|Cancel| StripeCancel[Stripe Cancel<br/>/checkout/cancel]
        StripeSuccess --> ClearCart[Clear Cart<br/>localStorage.removeItem]
        ClearCart --> OrderSuccess[Order Success Page<br/>Show Order ID]
        
        ProductList -->|Login| AuthLogin[Login Page<br/>/auth/login]
        AuthLogin -->|Submit| NextAuth[NextAuth<br/>POST /api/auth/signin]
        NextAuth -->|Success| Authenticated[Authenticated User]
        Authenticated --> MyOrders[My Orders<br/>/orders]
        MyOrders --> OrderDetail[Order Detail<br/>/orders/[id]]
    end
    
    %% ============================================
    %% ADMIN FLOW
    %% ============================================
    subgraph Admin["👨‍💼 Admin Panel"]
        AdminStart[Admin Visits<br/>/admin] --> Middleware[Middleware Check<br/>Role: admin]
        Middleware -->|Not Admin| RedirectHome[Redirect to Home]
        Middleware -->|Admin| AdminDashboard[Dashboard<br/>GET /api/admin/dashboard]
        
        AdminDashboard --> KPIs[Display KPIs<br/>Orders, Revenue, Products, Customers]
        AdminDashboard --> RecentOrders[Recent Orders Table]
        
        AdminDashboard --> AdminProducts[Products Management<br/>/admin/products]
        AdminProducts --> ListProducts[List Products<br/>GET /api/admin/products]
        AdminProducts --> CreateProduct[Create Product<br/>POST /api/admin/products]
        AdminProducts --> EditProduct[Edit Product<br/>PATCH /api/admin/products/[id]]
        AdminProducts --> DeleteProduct[Delete Product<br/>Soft Delete: isDeleted=true]
        
        AdminDashboard --> AdminCategories[Categories Management<br/>/admin/categories]
        AdminCategories --> ListCategories[List Categories<br/>GET /api/admin/categories]
        AdminCategories --> CreateCategory[Create Category<br/>POST /api/admin/categories]
        AdminCategories --> DeleteCategory[Delete Category<br/>DELETE /api/admin/categories/[id]]
        
        AdminDashboard --> AdminOrders[Orders Management<br/>/admin/orders]
        AdminOrders --> ListOrders[List Orders<br/>GET /api/admin/orders]
        AdminOrders --> OrderDetailAdmin[Order Detail<br/>/admin/orders/[id]]
        OrderDetailAdmin --> UpdateStatus[Update Order Status<br/>PATCH /api/admin/orders/[id]]
        UpdateStatus --> StatusOptions[Status: pending, paid,<br/>processing, shipped,<br/>completed, cancelled]
        
        AdminDashboard --> AdminUsers[Users Management<br/>/admin/users]
        AdminUsers --> ListUsers[List Users<br/>GET /api/admin/users]
    end
    
    %% ============================================
    %% API & DATABASE LAYER
    %% ============================================
    subgraph API["🔌 API Routes"]
        StockCheck --> ValidateStock[Validate Stock<br/>Product.stockQuantity >= qty]
        ValidateStock --> DecrementStock[Decrement Stock<br/>Product.findOneAndUpdate<br/>$inc: -quantity]
        DecrementStock --> CreateOrderDB[Create Order Document<br/>Order.create]
        CreateOrderDB --> MongoDB[(MongoDB)]
        
        CreateStripeSession --> StripeAPI[Stripe API<br/>stripe.checkout.sessions.create]
        StripeAPI --> StripeExternal[(Stripe External)]
        
        Browse --> ProductsAPI[GET /api/products<br/>Filter: isActive=true<br/>isDeleted=false]
        ProductsAPI --> MongoDB
        
        ListProducts --> AdminProductsAPI[GET /api/admin/products<br/>Admin Only]
        AdminProductsAPI --> MongoDB
        
        ListOrders --> AdminOrdersAPI[GET /api/admin/orders<br/>Populate: user, items.product]
        AdminOrdersAPI --> MongoDB
        
        MyOrders --> OrdersMeAPI[GET /api/orders/me<br/>Filter by userId]
        OrdersMeAPI --> MongoDB
    end
    
    %% ============================================
    %% WEBHOOK FLOW
    %% ============================================
    subgraph Webhook["🔄 Stripe Webhook"]
        StripePayment -->|Payment Complete| WebhookEvent[Stripe Webhook<br/>checkout.session.completed]
        WebhookEvent --> VerifySignature[Verify Signature<br/>stripe.webhooks.constructEvent]
        VerifySignature -->|Valid| UpdateOrderStatus[Update Order Status<br/>POST /api/webhooks/stripe]
        UpdateOrderStatus --> SetPaid[Set Order Status: paid<br/>Store paymentIntentId]
        SetPaid --> MongoDB
        VerifySignature -->|Invalid| RejectWebhook[Reject Webhook<br/>400 Invalid Signature]
    end
    
    %% ============================================
    %% STATE MANAGEMENT
    %% ============================================
    subgraph State["💾 State Management"]
        AddToCart1 --> LocalStorage[(localStorage<br/>mulu_cart)]
        AddToCart2 --> LocalStorage
        UpdateCart --> LocalStorage
        CartPage --> ReadCart[Read Cart<br/>lib/cart.ts]
        ReadCart --> LocalStorage
        ClearCart --> LocalStorage
        
        NextAuth --> Session[(NextAuth Session<br/>JWT Cookie)]
        Session --> Middleware
        Authenticated --> Session
    end
    
    %% ============================================
    %% DATABASE MODELS
    %% ============================================
    subgraph Models["📊 Database Models"]
        MongoDB --> ProductModel[(Product Model<br/>title, price, stockQuantity,<br/>isActive, isDeleted, images)]
        MongoDB --> OrderModel[(Order Model<br/>user/guestEmail, status,<br/>totalAmount, items,<br/>shippingAddress,<br/>stripeSessionId)]
        MongoDB --> UserModel[(User Model<br/>email, role, passwordHash)]
        MongoDB --> CategoryModel[(Category Model<br/>name, slug)]
    end
    
    %% ============================================
    %% STYLING
    %% ============================================
    classDef publicFlow fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef adminFlow fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef apiFlow fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef webhookFlow fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef stateFlow fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dbFlow fill:#eceff1,stroke:#263238,stroke-width:2px
    
    class Start,Browse,ProductList,ProductDetail,AddToCart1,AddToCart2,CartPage,CheckoutPage,SubmitCheckout,StripePayment,StripeSuccess,OrderSuccess,AuthLogin,MyOrders,OrderDetail publicFlow
    class AdminStart,AdminDashboard,AdminProducts,AdminCategories,AdminOrders,AdminUsers,ListProducts,CreateProduct,EditProduct,DeleteProduct,ListCategories,CreateCategory,DeleteCategory,ListOrders,OrderDetailAdmin,UpdateStatus,ListUsers adminFlow
    class ProductsAPI,AdminProductsAPI,AdminOrdersAPI,OrdersMeAPI,ValidateStock,DecrementStock,CreateOrderDB,CreateStripeSession,StripeAPI apiFlow
    class WebhookEvent,VerifySignature,UpdateOrderStatus,SetPaid,RejectWebhook webhookFlow
    class LocalStorage,ReadCart,UpdateCart,ClearCart,Session stateFlow
    class MongoDB,ProductModel,OrderModel,UserModel,CategoryModel,StripeExternal dbFlow
```

## Key Flows Explained

### 🛒 Customer Shopping Flow
1. **Browse Products** → View product list from `/api/products`
2. **Product Details** → Click product to see full details
3. **Add to Cart** → Store in `localStorage` (key: `mulu_cart`) using `lib/cart.ts`
4. **View Cart** → `/cart` page reads from `localStorage`
5. **Checkout** → `/checkout` page validates form and submits to `/api/checkout`
6. **Stock Validation** → API validates and atomically decrements stock
7. **Order Creation** → Creates order with status `pending`
8. **Stripe Session** → Creates Stripe Checkout Session and redirects
9. **Payment** → User pays on Stripe (external)
10. **Webhook** → Stripe sends webhook to update order status to `paid`
11. **Success** → Cart cleared, order confirmed

### 👨‍💼 Admin Management Flow
1. **Dashboard** → View KPIs (orders, revenue, products, customers)
2. **Products** → CRUD operations with soft delete (`isDeleted`)
3. **Categories** → Create/delete categories (with product dependency check)
4. **Orders** → View orders, update status (pending → paid → processing → shipped → completed)
5. **Users** → View user list

### 🔄 Stock Management
- **Atomic Decrement**: Uses MongoDB transactions or `findOneAndUpdate` with `$gte` check
- **Rollback**: If checkout fails, stock is rolled back
- **Validation**: Stock checked before order creation

### 💳 Payment Flow
- **Checkout Session**: Created before redirecting to Stripe
- **Order Created**: Order created with `pending` status before payment
- **Webhook**: Stripe webhook updates order to `paid` after successful payment
- **Guest Checkout**: No authentication required for checkout

### 🔐 Authentication
- **NextAuth.js**: JWT-based sessions
- **RBAC**: Role-based access control (admin/customer)
- **Middleware**: Protects `/admin/*` routes
- **Guest Checkout**: Allowed without login

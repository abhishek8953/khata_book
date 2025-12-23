# KhataBook - Developer Documentation

## 🏗️ Architecture Overview

### MVC Pattern

```
Request → Middleware → Routes → Controller → Model → Database
                                    ↓
                              Business Logic
                                    ↓
Response ← Middleware ← Controller Response
```

### Frontend Architecture

```
Pages (React Components)
    ↓
Context (AuthContext)
    ↓
Utils (API, Validation)
    ↓
API (Axios)
    ↓
Backend Server
```

---

## 🔐 Authentication Flow

1. **Register:**
   - User fills form with validation
   - Password hashed with bcryptjs
   - Seller created in MongoDB
   - JWT token generated
   - Token stored in localStorage

2. **Login:**
   - User enters credentials
   - Server verifies with bcryptjs
   - JWT token generated
   - Token sent to frontend
   - Token sent with every API request

3. **Protected Routes:**
   - Frontend checks token
   - Backend verifies JWT
   - Route accessible only if valid token

---

## 📊 Database Relationships

```
Seller (1) ─── (Many) Customers
  │
  ├─── (Many) Products
  │
  └─── (Many) Transactions

Customer (1) ─── (Many) Transactions
Product (1) ─── (Many) Transactions
```

---

## 💰 Balance Calculation Logic

### Purchase Transaction
```
outstandingBalance += amount
totalPurchaseAmount += amount
```

### Payment Transaction
```
outstandingBalance -= amount  (cannot go below 0)
totalPaidAmount += amount
```

### Deposit Transaction
```
depositAmount += amount
outstandingBalance -= amount  (cannot go below 0)
```

### Withdrawal Transaction
```
depositAmount -= amount  (cannot go below 0)
outstandingBalance += amount
```

---

## 📱 SMS Integration

### Message Templates

**English:**
```
"Hi {name}, you have an outstanding balance of ₹{amount} in your account. 
Please settle the payment at your earliest convenience."
```

**Hindi:**
```
"नमस्ते {name}, आपके खाते में ₹{amount} की बकाया राशि है। 
कृपया जल्द से जल्द भुगतान करें।"
```

### When SMS is Sent
- After purchase (if balance > 0)
- Manual send from Customers page
- Configurable in Settings

---

## 🎯 Code Standards

### Backend (Node.js)

**File Structure:**
```
routes/
  └── customerRoutes.js
        ├── POST /customers
        ├── GET /customers
        ├── GET /customers/:id
        ├── PUT /customers/:id
        └── DELETE /customers/:id

controllers/
  └── customerController.js
        ├── addCustomer()
        ├── getCustomers()
        ├── getCustomer()
        ├── updateCustomer()
        └── deleteCustomer()

models/
  └── Customer.js
        ├── Schema definition
        └── Indexes
```

**Naming Conventions:**
- Routes: PascalCase for files (customerRoutes.js)
- Controllers: PascalCase for files (customerController.js)
- Functions: camelCase (getCustomer)
- Variables: camelCase (sellerId)

**Error Handling:**
```javascript
try {
  // Logic
} catch (error) {
  console.error('Error message:', error);
  res.status(500).json({ 
    success: false, 
    message: 'User-friendly message',
    error: error.message 
  });
}
```

---

### Frontend (React)

**Component Structure:**
```javascript
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from 'lucide-react';

const ComponentName = () => {
  const { t } = useTranslation();
  const [state, setState] = useState();

  useEffect(() => {
    // Effect
  }, []);

  const handleAction = async () => {
    // Handle action
  };

  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

**Naming Conventions:**
- Components: PascalCase (Customers.jsx)
- Functions: camelCase (handleChange)
- State: camelCase (formData)
- Classes: Tailwind classNames

---

## 📝 API Response Format

### Success Response
```javascript
{
  success: true,
  message: "Operation successful",
  data: {
    // Response data
  }
}
```

### Error Response
```javascript
{
  success: false,
  message: "Error message",
  error: "Detailed error (development only)"
}
```

### Pagination Response
```javascript
{
  success: true,
  data: [...],
  pagination: {
    total: 100,
    limit: 10,
    skip: 0
  }
}
```

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Register with valid data
- [ ] Register with invalid email
- [ ] Register with weak password
- [ ] Login with correct credentials
- [ ] Login with wrong password
- [ ] Logout functionality
- [ ] Protected routes require login

**Customers:**
- [ ] Add customer with all fields
- [ ] Add customer with missing fields
- [ ] Edit customer details
- [ ] Delete customer
- [ ] Duplicate phone number error
- [ ] View customer balance
- [ ] Send SMS to customer

**Products:**
- [ ] Add product with different units
- [ ] Edit product
- [ ] Delete product
- [ ] Duplicate product name error

**Transactions:**
- [ ] Record purchase
- [ ] Record payment
- [ ] Record deposit
- [ ] Record withdrawal
- [ ] Update transaction
- [ ] Delete transaction
- [ ] Verify balance calculation

**UI/UX:**
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] English language works
- [ ] Hindi language works
- [ ] All buttons functional
- [ ] Form validation messages show
- [ ] Error alerts display

---

## 🐛 Debugging Tips

### Backend
```javascript
// Log requests
console.log('Request:', req.method, req.path);

// Log data
console.log('Customer Data:', customerData);

// Error stack
console.error('Error:', error.stack);

// Use debugger
debugger; // Add breakpoint
```

### Frontend
```javascript
// Check component render
console.log('Component mounted');

// Check state
console.log('State:', state);

// Check API response
console.log('API Response:', response.data);

// Use React DevTools
// Install React DevTools browser extension
```

---

## 📚 Common Issues & Solutions

### Backend Issues

**1. Duplicate Key Error**
```
MongoError: E11000 duplicate key error
```
**Solution:** Use unique: true in schema with proper indexing

**2. Validation Error**
```
Cast to ObjectId failed
```
**Solution:** Validate ID format before querying

**3. CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Enable CORS in server.js

### Frontend Issues

**1. Token Expired**
```
401 Unauthorized
```
**Solution:** Refresh token or redirect to login

**2. API Not Responding**
```
Network Error
```
**Solution:** Check if backend server is running

**3. Components Not Rendering**
```
Blank page or white screen
```
**Solution:** Check console for errors, verify API calls

---

## 🚀 Performance Tips

### Backend
- Index frequently queried fields
- Use lean() for read-only queries
- Implement pagination for large datasets
- Cache frequently accessed data
- Use connection pooling

### Frontend
- Lazy load components
- Memo heavy components
- Debounce search/input
- Optimize re-renders
- Code splitting with React.lazy

---

## 🔒 Security Best Practices

1. **Never store passwords:** Use hashing (bcryptjs)
2. **Validate input:** Both frontend and backend
3. **Use HTTPS:** In production
4. **Environment variables:** Never hardcode secrets
5. **CORS:** Whitelist trusted domains
6. **Rate limiting:** Prevent brute force attacks
7. **SQL Injection:** Use parameterized queries (Mongoose)
8. **XSS Protection:** Sanitize user input

---

## 📦 Adding New Features

### Example: Add Email Notifications

**1. Install nodemailer:**
```bash
npm install nodemailer
```

**2. Create utils/emailService.js:**
```javascript
import nodemailer from 'nodemailer';

const sendEmail = async (email, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: message
  });
};

export default sendEmail;
```

**3. Use in controller:**
```javascript
import sendEmail from '../utils/emailService.js';

// In transaction controller
if (customer.email) {
  await sendEmail(customer.email, 'Balance Notification', message);
}
```

---

## 🔄 Version Updates

When updating packages:
```bash
# Check outdated packages
npm outdated

# Update packages
npm update

# Update specific package
npm install package-name@latest

# Test after updates
npm test
```

---

## 📖 Useful Resources

- [Express.js Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [i18next Documentation](https://www.i18next.com)
- [Twilio Documentation](https://www.twilio.com/docs)

---

## 💬 Code Comments

Good comments:
```javascript
// This validates email format before database insert
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

Bad comments:
```javascript
// Loop through array
for (let i = 0; i < array.length; i++) {
  // Get item
  const item = array[i];
}
```

---

## 🎓 Learning Path

1. Understand database relationships
2. Learn API design
3. Master authentication flow
4. Study component lifecycle
5. Implement state management
6. Learn testing practices
7. Study deployment process
8. Learn monitoring and logging

---

**Keep learning and building! 🚀**

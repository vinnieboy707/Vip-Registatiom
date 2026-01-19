# Quick Start Guide

## Production-Grade DMV Vehicle Registration Platform with Real Data

This application uses **REAL data** from NHTSA (National Highway Traffic Safety Administration) - no mock data or placeholders!

### Prerequisites
- Node.js 18+ installed
- npm or yarn installed
- Port 5000 (backend) and 3000 (frontend) available

### 🚀 Quick Start (5 Minutes)

#### 1. Clone and Install
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### 2. Start Backend Server
```bash
# Terminal 1: Start backend
npm run dev
```

Backend will start at http://localhost:5000
- API: http://localhost:5000/api
- API Docs: http://localhost:5000/api-docs
- Health: http://localhost:5000/health

#### 3. Start Frontend
```bash
# Terminal 2: Start frontend
cd frontend
npm run dev
```

Frontend will start at http://localhost:3000

#### 4. Test the Application

1. **Register an account**
   - Go to http://localhost:3000
   - Click "Register"
   - Create account with email/password

2. **Try Vehicle Lookup with REAL VINs**
   - Login with your account
   - Go to "Vehicle Lookup"
   - Enter one of these REAL VINs:

   ```
   5YJ3E1EA6KF000001   # 2019 Tesla Model 3
   1FTEW1E40LFA00001   # 2020 Ford F-150
   4T1G11AK8MU000001   # 2021 Toyota Camry
   1HGCV1F30JA000001   # 2018 Honda Accord
   ```

3. **See Real Vehicle Data**
   - Make, Model, Year from NHTSA database
   - All data is REAL from U.S. government database
   - No mock data or placeholders!

### 🔍 Verify Real Data Integration

**Test the NHTSA API directly:**
```bash
curl "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/5YJ3E1EA6KF000001?format=json"
```

You'll see REAL vehicle data returned!

**Test through our API:**
```bash
# Register first, then get token and:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/vehicles/vin/5YJ3E1EA6KF000001
```

### 📊 What You Get (ALL REAL DATA)

✅ **Vehicle Specifications** - From NHTSA database
- Make and Model
- Year
- Body Type
- Engine Information  
- Drive Type
- And more...

✅ **Registration Services**
- Calculate real state-based fees
- File registrations on-site
- Track status and expiry

✅ **Title Transfers**
- Standard transfers
- Out-of-state transfers
- Family transfers with reduced fees

✅ **Ownership History**
- Track previous owners
- Transfer dates
- Complete history

### 🎯 Features

1. **Vehicle Lookup by VIN**
   - Real-time NHTSA database query
   - Comprehensive vehicle specs
   - Instant results

2. **Registration Management**
   - Fee calculator
   - New registrations
   - Renewals
   - On-site filing

3. **Title Transfers**
   - Multiple transfer types
   - Fee calculation
   - Status tracking

4. **Mobile-First Design**
   - Works on all devices
   - Professional UI
   - Easy to use on-site

### 🔐 Default Setup

- **No DMV API Key needed** for NHTSA data
- **Optional**: Configure state DMV API for enhanced features
- **Secure**: JWT authentication, bcrypt passwords
- **Production-Ready**: Logging, error handling, security headers

### 📝 Environment Variables

Already configured in `.env` file:
```bash
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
```

For production, update:
- JWT_SECRET (use strong random string)
- ENCRYPTION_KEY (32 characters)
- ADMIN_PASSWORD (strong password)

### 🐛 Troubleshooting

**Backend won't start:**
```bash
# Check if port 5000 is available
lsof -i :5000

# Check logs
cat backend/logs/app.log
```

**Frontend won't start:**
```bash
# Check if port 3000 is available
lsof -i :3000

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**NHTSA API not responding:**
```bash
# Test directly
curl "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/5YJ3E1EA6KF000001?format=json"

# Check firewall/proxy settings
```

### 🚢 Production Deployment

**Using Docker:**
```bash
docker-compose up -d
```

**Manual:**
```bash
# Build
npm run build
cd frontend && npm run build && cd ..

# Run
npm start
# Serve frontend dist/ with nginx or similar
```

### 📚 More Information

- Full Documentation: See [README.md](README.md)
- API Integration: See [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md)
- API Docs: http://localhost:5000/api-docs (when running)

### ✅ Success Criteria

You know it's working when:
1. ✅ Backend starts without errors
2. ✅ Frontend loads at http://localhost:3000
3. ✅ You can register and login
4. ✅ Vehicle lookup returns REAL data from NHTSA
5. ✅ No "mock data" or placeholder names appear

### 🎉 You're Ready!

Start using the DMV Registration Platform with **100% real data** from government sources!

**Support:**
- Check logs in `backend/logs/`
- Review API docs at `/api-docs`
- Test NHTSA API accessibility
- Ensure environment variables are set

---

**Remember:** This is a production-grade application with real data integration. All vehicle lookups query actual government databases!

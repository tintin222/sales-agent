#!/bin/bash

echo "📦 Adding authentication dependencies..."

# Add authentication related packages
npm install bcryptjs jsonwebtoken cookies-next

# Add types
npm install --save-dev @types/bcryptjs @types/jsonwebtoken

echo "✅ Dependencies added!"
echo ""
echo "Packages installed:"
echo "- bcryptjs: Password hashing"
echo "- jsonwebtoken: JWT token generation"
echo "- cookies-next: Cookie management for Next.js"
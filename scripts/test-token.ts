import { generateToken, verifyToken, JWT_SECRET } from '../lib/auth/config';

async function testTokenGeneration() {
  console.log('=== Token Generation and Verification Test ===\n');
  
  // Log JWT secret (partially hidden for security)
  const secretPreview = JWT_SECRET.substring(0, 10) + '...' + JWT_SECRET.substring(JWT_SECRET.length - 5);
  console.log(`JWT_SECRET preview: ${secretPreview}`);
  console.log(`JWT_SECRET length: ${JWT_SECRET.length} characters\n`);

  // Test data
  const testUser = {
    userId: 123,
    email: 'test@example.com',
    role: 'admin'
  };

  console.log('Test user data:', testUser);
  console.log('\n--- Generating token ---');

  // Generate token
  const token = generateToken(testUser.userId, testUser.email, testUser.role);
  console.log('\nGenerated token:');
  console.log(token);
  console.log(`\nToken length: ${token.length} characters`);

  // Parse token parts
  const tokenParts = token.split('.');
  console.log(`\nToken structure:`);
  console.log(`- Header: ${tokenParts[0]?.substring(0, 20)}...`);
  console.log(`- Payload: ${tokenParts[1]?.substring(0, 20)}...`);
  console.log(`- Signature: ${tokenParts[2]?.substring(0, 20)}...`);

  // Decode token header and payload without verification
  try {
    const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    console.log('\nDecoded header:', header);
    console.log('Decoded payload:', payload);
  } catch (error) {
    console.error('Error decoding token parts:', error);
  }

  console.log('\n--- Verifying token immediately ---');

  // Verify token immediately
  const decoded = verifyToken(token);
  
  if (decoded) {
    console.log('\n✅ Token verification SUCCESSFUL!');
    console.log('\nDecoded token data:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Check if all fields match
    const fieldsMatch = 
      decoded.userId === testUser.userId &&
      decoded.email === testUser.email &&
      decoded.role === testUser.role;
    
    console.log(`\nField validation: ${fieldsMatch ? '✅ All fields match' : '❌ Field mismatch'}`);
    
    if (!fieldsMatch) {
      console.log('\nField comparison:');
      console.log(`- userId: ${decoded.userId} === ${testUser.userId} ? ${decoded.userId === testUser.userId}`);
      console.log(`- email: ${decoded.email} === ${testUser.email} ? ${decoded.email === testUser.email}`);
      console.log(`- role: ${decoded.role} === ${testUser.role} ? ${decoded.role === testUser.role}`);
    }

    // Check token expiration
    const decodedWithExp = decoded as any;
    if (decodedWithExp.exp) {
      const expirationDate = new Date(decodedWithExp.exp * 1000);
      const now = new Date();
      const timeUntilExpiry = expirationDate.getTime() - now.getTime();
      
      console.log(`\nToken expiration:`);
      console.log(`- Expires at: ${expirationDate.toISOString()}`);
      console.log(`- Current time: ${now.toISOString()}`);
      console.log(`- Time until expiry: ${Math.floor(timeUntilExpiry / 1000 / 60)} minutes`);
    }
  } else {
    console.log('\n❌ Token verification FAILED!');
    console.log('Token could not be verified. This could be due to:');
    console.log('- Invalid signature');
    console.log('- Token expired');
    console.log('- Malformed token');
    console.log('- Wrong secret key');
  }

  // Test with invalid token
  console.log('\n--- Testing with invalid token ---');
  const invalidToken = token + 'corrupted';
  const invalidDecoded = verifyToken(invalidToken);
  console.log(`Invalid token verification: ${invalidDecoded ? '❌ UNEXPECTEDLY PASSED' : '✅ Correctly rejected'}`);

  // Test with expired token (simulate by modifying the token)
  console.log('\n--- Testing edge cases ---');
  
  // Test empty token
  const emptyDecoded = verifyToken('');
  console.log(`Empty token verification: ${emptyDecoded ? '❌ UNEXPECTEDLY PASSED' : '✅ Correctly rejected'}`);
  
  // Test malformed token
  const malformedDecoded = verifyToken('not.a.token');
  console.log(`Malformed token verification: ${malformedDecoded ? '❌ UNEXPECTEDLY PASSED' : '✅ Correctly rejected'}`);

  console.log('\n=== Test Complete ===');
}

// Run the test
testTokenGeneration().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
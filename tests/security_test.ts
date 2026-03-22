import fetch from 'node-fetch'; // Standard fetch might not be in older Node, but Node 22 has it. Using standard fetch if available.

async function runSecurityTest() {
  const BASE_URL = 'http://localhost:3001/api';
  console.log('🛡️ Starting Security Verification Tests... \n');

  // Test 1: Rate Limiting on Login
  console.log('Test 1: Rate Limiting on /auth/login');
  let rateLimited = false;
  for (let i = 0; i < 15; i++) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test', password: 'wrong_password' })
    });
    if (res.status === 429) {
      rateLimited = true;
      console.log(`✅ Success: Rate limit hit at attempt ${i + 1}`);
      break;
    }
  }
  if (!rateLimited) console.error('❌ Fail: Rate limit was not hit after 15 attempts');

  // Test 2: Unauthorized Access to Protected Routes
  console.log('\nTest 2: Unauthorized Access to /orders');
  const resOrders = await fetch(`${BASE_URL}/orders`);
  if (resOrders.status === 401) {
    console.log('✅ Success: /orders returned 401 Unauthorized');
  } else {
    console.error(`❌ Fail: /orders returned ${resOrders.status}`);
  }

  console.log('\nTest 3: Unauthorized Access to /orders/:id');
  const resOrderId = await fetch(`${BASE_URL}/orders/any-id`);
  if (resOrderId.status === 401) {
    console.log('✅ Success: /orders/:id returned 401 Unauthorized');
  } else {
    console.error(`❌ Fail: /orders/:id returned ${resOrderId.status}`);
  }

  // Test 4: Security Headers
  console.log('\nTest 4: Security Headers (Helmet)');
  const resHeaders = await fetch(`${BASE_URL}/products`);
  const headers = resHeaders.headers;
  const helmetHeaders = [
    'x-dns-prefetch-control',
    'x-frame-options',
    'x-content-type-options',
    'content-security-policy'
  ];
  
  helmetHeaders.forEach(h => {
    if (headers.get(h)) {
      console.log(`✅ Success: Header '${h}' is present`);
    } else {
      console.error(`❌ Fail: Header '${h}' is missing`);
    }
  });

  console.log('\n🏁 Security Tests Completed.');
}

runSecurityTest().catch(console.error);

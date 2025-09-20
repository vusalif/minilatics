#!/usr/bin/env node

// Production test script for Minilatics
const https = require('https');
const http = require('http');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const SITE_KEY = 'production-test-' + Math.random().toString(36).substr(2, 9);

console.log(`🧪 Testing Minilatics at: ${BASE_URL}`);
console.log(`🔑 Using site key: ${SITE_KEY}`);
console.log('');

// Test 1: Check if server is running
async function testServerHealth() {
  return new Promise((resolve) => {
    const protocol = BASE_URL.startsWith('https') ? https : http;
    protocol.get(`${BASE_URL}/script.js`, (res) => {
      console.log('✅ Server is running');
      resolve(true);
    }).on('error', (err) => {
      console.log('❌ Server is not running:', err.message);
      resolve(false);
    });
  });
}

// Test 2: Test tracking endpoint
async function testTracking() {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      site_key: SITE_KEY,
      page_path: '/test-page',
      referrer: 'https://example.com'
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const protocol = BASE_URL.startsWith('https') ? https : http;
    const url = new URL(`${BASE_URL}/track`);
    
    const req = protocol.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Tracking endpoint works');
          resolve(true);
        } else {
          console.log('❌ Tracking endpoint failed:', res.statusCode);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Tracking request failed:', err.message);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// Test 3: Test stats endpoint
async function testStats() {
  return new Promise((resolve) => {
    const protocol = BASE_URL.startsWith('https') ? https : http;
    const url = new URL(`${BASE_URL}/stats/${SITE_KEY}`);
    
    protocol.get(url, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const stats = JSON.parse(responseData);
            console.log('✅ Stats endpoint works');
            console.log(`   📊 Total views: ${stats.total_views}`);
            console.log(`   👥 Unique visitors: ${stats.unique_visitors}`);
            resolve(true);
          } catch (err) {
            console.log('❌ Stats parsing failed:', err.message);
            resolve(false);
          }
        } else {
          console.log('❌ Stats endpoint failed:', res.statusCode);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Stats request failed:', err.message);
      resolve(false);
    });
  });
}

// Test 4: Test admin page
async function testAdminPage() {
  return new Promise((resolve) => {
    const protocol = BASE_URL.startsWith('https') ? https : http;
    protocol.get(`${BASE_URL}/admin/${SITE_KEY}`, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Admin page accessible');
        console.log(`   🔗 Admin URL: ${BASE_URL}/admin/${SITE_KEY}`);
        resolve(true);
      } else {
        console.log('❌ Admin page failed:', res.statusCode);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log('❌ Admin page request failed:', err.message);
      resolve(false);
    });
  });
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting production tests...\n');
  
  const tests = [
    { name: 'Server Health', fn: testServerHealth },
    { name: 'Tracking Endpoint', fn: testTracking },
    { name: 'Stats Endpoint', fn: testStats },
    { name: 'Admin Page', fn: testAdminPage }
  ];

  let passed = 0;
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    const result = await test.fn();
    if (result) passed++;
    console.log('');
  }

  console.log(`📋 Test Results: ${passed}/${tests.length} passed`);
  
  if (passed === tests.length) {
    console.log('🎉 All tests passed! Your Minilatics is production-ready!');
    console.log('\n📝 Usage Instructions:');
    console.log(`   1. Add this to your website:`);
    console.log(`      <script src="${BASE_URL}/script.js" data-site-key="${SITE_KEY}"></script>`);
    console.log(`   2. View analytics at: ${BASE_URL}/admin/${SITE_KEY}`);
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
    process.exit(1);
  }
}

runTests().catch(console.error);

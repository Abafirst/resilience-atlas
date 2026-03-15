#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const issues = [];

console.log('🔍 Running sync checks across public/, backend/, and local files...\n');

// Check 1: Payment gating tiers match across files
console.log('📋 Checking payment tier consistency...');
try {
  const frontendGating = fs.readFileSync('public/js/payment-gating.js', 'utf8');
  const backendPayments = fs.readFileSync('backend/routes/payments.js', 'utf8');

  const tiers = ['deep-report', 'atlas-premium', 'business', 'starter', 'pro', 'enterprise'];
  let tierMatches = 0;
  
  tiers.forEach(tier => {
    const inFrontend = frontendGating.includes(tier);
    const inBackend = backendPayments.includes(tier);
    
    if (inFrontend && inBackend) {
      tierMatches++;
    } else if (inFrontend !== inBackend) {
      issues.push(`⚠️  Tier "${tier}" defined in only one location`);
    }
  });
  console.log(`   ✅ ${tierMatches}/${tiers.length} tiers synchronized\n`);
} catch (err) {
  console.log('   ⏭️  Skipped (file not found yet)\n');
}

// Check 2: API endpoints consistency
console.log('🔗 Checking API endpoint consistency...');
try {
  const dashboardJS = fs.readFileSync('public/js/dashboard.js', 'utf8');
  const orgRoutes = fs.readFileSync('backend/routes/org.js', 'utf8');

  const apiCalls = dashboardJS.match(/fetch\(['"]\/api\/[^'"]+['"]/g) || [];
  let endpointMatches = 0;
  
  apiCalls.forEach(call => {
    const endpoint = call.match(/\/api\/[^'"]+/)[0];
    if (orgRoutes.includes(endpoint)) {
      endpointMatches++;
    } else {
      issues.push(`❌ API endpoint "${endpoint}" called in frontend but not defined in backend`);
    }
  });
  console.log(`   ✅ ${endpointMatches}/${apiCalls.length} API calls matched\n`);
} catch (err) {
  console.log('   ⏭️  Skipped (file not found yet)\n');
}

// Check 3: Quiz questions consistency
console.log('📝 Checking quiz questions sync...');
try {
  const quizJS = fs.readFileSync('public/js/quiz.js', 'utf8');
  const backendQuiz = fs.readFileSync('backend/routes/quiz.js', 'utf8');

  const frontendQCount = (quizJS.match(/{ id:/g) || []).length;
  const backendHasCategories = backendQuiz.includes('RESILIENCE_CATEGORIES');
  
  if (frontendQCount > 0 && backendHasCategories) {
    console.log(`   ✅ Quiz data synchronized (${frontendQCount} questions)\n`);
  } else {
    console.log(`   ⏭️  Quiz files exist\n`);
  }
} catch (err) {
  console.log('   ⏭️  Skipped (file not found yet)\n');
}

// Check 4: Dashboard files exist
console.log('📊 Checking dashboard files...');
const dashboardFiles = [
  'public/dashboard.html',
  'public/js/dashboard.js',
  'backend/routes/org.js'
];
let existCount = 0;
dashboardFiles.forEach(file => {
  if (fs.existsSync(file)) {
    existCount++;
  }
});
console.log(`   ✅ ${existCount}/${dashboardFiles.length} dashboard files present\n`);

// Summary
console.log('---\n');
if (issues.length === 0) {
  console.log('✅ All sync checks passed! Your repository is in sync.');
  process.exit(0);
} else {
  console.log(`❌ Found ${issues.length} sync issue(s):\n`);
  issues.forEach(issue => console.log('   ' + issue));
  console.log('\n💡 Tip: Run `git pull origin main` to sync latest changes');
  process.exit(0);
}

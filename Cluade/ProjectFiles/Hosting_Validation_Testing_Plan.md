# Hosting Validation & Performance Testing Plan

## Objectives
1. Validate infrastructure strategy assumptions
2. Identify actual Regular vs Premium hosting thresholds
3. Create data-driven upgrade recommendations

## Test Scenarios

### Scenario 1: Small Business (3 Staff, 20 Bookings/Day)
**Expected Result:** Regular hosting sufficient
**Test on:** Hostinger Business Cloud

Dashboard Load Test:
- 3 concurrent staff users
- Auto-refresh enabled (30-second intervals)
- 1 staff generating morning report
- 5 customers booking simultaneously
- Monitor: Page load times, database query duration, error rate

**Pass Criteria:**
- Dashboard loads: <3 seconds average
- Reports complete: <10 seconds
- Booking success rate: >99%
- Zero timeouts or database errors

### Scenario 2: Medium Business (7 Staff, 80 Bookings/Day)
**Expected Result:** Regular hosting may struggle, Premium recommended
**Test on:** Both Hostinger AND Kinsta

Dashboard Load Test:
- 7 concurrent staff users
- Auto-refresh enabled
- 2 staff generating reports simultaneously
- 10 customers booking
- Monitor: Performance degradation

**Pass Criteria for Regular:**
- Dashboard loads: <4 seconds (marginal acceptable)
- Reports complete: <15 seconds
- If fails: Document specific pain points for Premium pitch

**Compare to Kinsta:**
- Same test on Premium hosting
- Document performance improvement
- Calculate ROI (time saved vs. cost increase)

### Scenario 3: Peak Load Stress Test
**Purpose:** Find breaking point for Regular hosting

Gradually increase load:
- Start: 5 concurrent dashboard users
- Increment: +2 users every 5 minutes
- Monitor: When does performance degrade?
- Document: Exact threshold where Regular hosting fails

**Outputs:**
- "Regular hosting can handle X concurrent dashboard users"
- "Upgrade to Premium recommended at Y staff members"

## Testing Tools

**wp-cli + Custom Scripts:**
```bash
# Simulate concurrent dashboard loads
for i in {1..5}; do
  curl "https://staging.site/dashboard" & 
done
wait

# Measure response time
ab -n 100 -c 10 https://staging.site/dashboard/
```

**k6 Load Testing Script:**
```javascript
// test-dashboard-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 5 },   // 5 concurrent users
    { duration: '5m', target: 5 },   // Stay at 5
    { duration: '2m', target: 10 },  // Ramp to 10
    { duration: '5m', target: 10 },  // Stay at 10
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function() {
  let response = http.get('https://staging.site/dashboard/');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'load time < 3s': (r) => r.timings.duration < 3000,
  });
  
  sleep(30); // Simulate 30-second auto-refresh
}
```

**Database Query Monitoring:**
- Install Query Monitor plugin
- Enable slow query log (>1 second)
- Document N+1 queries or missing indexes

## Validation Schedule

**Week 18 (Sprint 5):**
- Set up load testing tools (k6, ab)
- Create test data (1000 bookings, 10 staff, 100 customers)
- Run Scenario 1 tests on Hostinger

**Week 19 (Sprint 6):**
- Run Scenario 2 tests (both hosting providers)
- Run Scenario 3 stress test
- Document findings

**Week 20 (Sprint 6):**
- Update Hosting Infrastructure Strategy doc with ACTUAL results
- Create client-facing "Hosting Requirements Guide"
- Define upgrade triggers for sales process

## Deliverables

1. **Performance Test Report**
   - Actual query counts by business size
   - Dashboard load times under various scenarios
   - Regular vs Premium comparison data

2. **Updated Hosting Thresholds**
   - Replace projections with measured data
   - "Regular hosting works for businesses with <X staff and <Y bookings/day"
   - "Upgrade to Premium when: [specific triggers]"

3. **Client Qualification Tool**
   - Questions to ask prospects
   - Automated recommendation based on answers
   - ROI calculator (Premium cost vs. revenue risk)

## Success Metrics

- Projections validated within ±20% accuracy
- Clear Regular vs Premium decision criteria
- Confidence in hosting recommendations
- Data to support Premium hosting sales pitch
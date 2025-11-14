import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },     // Stay at 10 users
    { duration: '30s', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.01'],    // Error rate should be less than 1%
    errors: ['rate<0.01'],
  },
};

// Base URL from environment variable or default
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5099';

export default function () {
  // Test GET /student-projects
  const getProjectsResponse = http.get(`${BASE_URL}/student-projects`, {
    tags: { name: 'GetStudentProjects' },
  });

  const getProjectsSuccess = check(getProjectsResponse, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'response has data': (r) => r.body.length > 0,
  });

  errorRate.add(!getProjectsSuccess);
  requestDuration.add(getProjectsResponse.timings.duration);

  // Test GET /student-projects with eventId filter
  const eventId = __ENV.EVENT_ID || null;
  if (eventId) {
    const getProjectsWithEventResponse = http.get(
      `${BASE_URL}/student-projects?eventId=${eventId}`,
      {
        tags: { name: 'GetStudentProjectsWithEvent' },
      }
    );

    const getProjectsWithEventSuccess = check(getProjectsWithEventResponse, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!getProjectsWithEventSuccess);
    requestDuration.add(getProjectsWithEventResponse.timings.duration);
  }

  // Test GET /student-projects with skills filter
  const skillIds = __ENV.SKILL_IDS || null;
  if (skillIds) {
    const skillIdsArray = skillIds.split(',');
    const queryParams = skillIdsArray.map((id) => `NeedSkills=${id}`).join('&');
    const getProjectsWithSkillsResponse = http.get(
      `${BASE_URL}/student-projects?${queryParams}`,
      {
        tags: { name: 'GetStudentProjectsWithSkills' },
      }
    );

    const getProjectsWithSkillsSuccess = check(getProjectsWithSkillsResponse, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!getProjectsWithSkillsSuccess);
    requestDuration.add(getProjectsWithSkillsResponse.timings.duration);
  }

  sleep(1); // Wait 1 second between iterations
}

export function handleSummary(data) {
  return {
    'perf/load-tests/results.json': JSON.stringify(data, null, 2),
  };
}


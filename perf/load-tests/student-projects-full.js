import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5099';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  throw new Error('AUTH_TOKEN env variable is required for full suite tests.');
}

const HEADERS = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

const errorRate = new Rate('errors_full_suite');
const requestDuration = new Trend('request_duration_full_suite');

export const options = {
  stages: [
    { duration: '45s', target: 25 },
    { duration: '1m', target: 25 },
    { duration: '45s', target: 100 },
    { duration: '2m', target: 100 },
    { duration: '45s', target: 200 },
    { duration: '3m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    errors_full_suite: ['rate<0.02'],
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<3000'],
    request_duration_full_suite: ['p(95)<2500'],
  },
};

export function setup() {
  const skills = safeJson(http.get(`${BASE_URL}/student-projects/skills`)) ?? [];
  const teamRoles = safeJson(http.get(`${BASE_URL}/student-projects/team-roles`)) ?? [];
  const projects = safeJson(http.get(`${BASE_URL}/student-projects`)) ?? [];

  return {
    skills,
    teamRoles,
    projects,
  };
}

export default function (data) {
  const liveProjectsResponse = http.get(`${BASE_URL}/student-projects`);
  const projects = safeJson(liveProjectsResponse) ?? data.projects;
  track(liveProjectsResponse, 'GetStudentProjects');

  group('public_endpoints', () => {
    track(http.get(`${BASE_URL}/student-projects/skills`), 'GetSkills');
    track(http.get(`${BASE_URL}/student-projects/team-roles`), 'GetTeamRoles');
  });

  group('mutations', () => {
    runMutations(projects, data, BASE_URL);
  });

  sleep(1);
}

function runMutations(projects, data, baseUrl) {
  const project = pickProject(projects);
  const skills = data.skills;
  const teamRoles = data.teamRoles;

  const projectPayload = createProjectPayload(skills);
  const createResp = http.post(`${baseUrl}/student-projects`, JSON.stringify(projectPayload), { headers: HEADERS });
  track(createResp, 'CreateProject');

  let createdProjectId = null;
  if (createResp.status === 200 || createResp.status === 201) {
    const createdProject = safeJson(createResp);
    createdProjectId = createdProject?.id ?? null;
  }

  if (createdProjectId) {
    const updateResp = http.put(
      `${baseUrl}/student-projects/${createdProjectId}`,
      JSON.stringify(createProjectPayload(skills)),
      { headers: HEADERS }
    );
    track(updateResp, 'UpdateProject');
  }

  if (project) {
    const roleIds = pickRoleIds(teamRoles);

    track(
      http.post(
        `${baseUrl}/student-projects/${project.id}/participants/requests`,
        JSON.stringify({ roleIds }),
        { headers: HEADERS }
      ),
      'RequestParticipation'
    );

    const appliedParticipant = findParticipant(project, (p) => p.status === 'Applied' && !p.isCreator);
    if (appliedParticipant) {
      const approveBody = JSON.stringify({ roleIds });
      track(
        http.post(
          `${baseUrl}/student-projects/${project.id}/participants/${appliedParticipant.id}/approve`,
          approveBody,
          { headers: HEADERS }
        ),
        'ApproveParticipant'
      );
      track(
        http.post(
          `${baseUrl}/student-projects/${project.id}/participants/${appliedParticipant.id}/reject`,
          null,
          { headers: HEADERS }
        ),
        'RejectParticipant'
      );
    }

    const approvedParticipant = findParticipant(project, (p) => p.status === 'Approved' && !p.isCreator);
    if (approvedParticipant) {
      track(
        http.put(
          `${baseUrl}/student-projects/${project.id}/participants/${approvedParticipant.id}/roles`,
          JSON.stringify({ roleIds, newRoles: [] }),
          { headers: HEADERS }
        ),
        'UpdateParticipantRoles'
      );
    }

    const rejectedParticipant = findParticipant(project, (p) => p.status === 'Rejected' && !p.isCreator);
    if (rejectedParticipant) {
      track(
        http.del(
          `${baseUrl}/student-projects/${project.id}/participants/${rejectedParticipant.id}`,
          null,
          { headers: HEADERS }
        ),
        'RemoveParticipant'
      );
    }
  }

  const createRoleBody = JSON.stringify({
    name: `perf-role-${__VU}-${__ITER}-${Date.now()}`,
    description: 'Load test generated role',
  });
  track(http.post(`${baseUrl}/student-projects/team-roles`, createRoleBody, { headers: HEADERS }), 'CreateTeamRole');
}

function track(response, name) {
  if (!response) {
    errorRate.add(1);
    return;
  }

  const ok = response.status >= 200 && response.status < 400;
  check(response, { [`${name} status ${ok ? 'OK' : 'FAIL'}`]: () => ok });
  errorRate.add(ok ? 0 : 1);
  if (response.timings?.duration != null) {
    requestDuration.add(response.timings.duration, { endpoint: name });
  }
}

function safeJson(response) {
  try {
    return response.json();
  } catch (error) {
    return null;
  }
}

function pickProject(projects) {
  if (!projects || projects.length === 0) {
    return null;
  }
  return projects[Math.floor(Math.random() * projects.length)];
}

function pickRoleIds(teamRoles) {
  if (!teamRoles || teamRoles.length === 0) {
    return [];
  }

  const count = Math.min(teamRoles.length, Math.floor(Math.random() * 3));
  const shuffled = [...teamRoles].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((role) => role.id);
}

function findParticipant(project, predicate) {
  if (!project?.participants) {
    return null;
  }
  return project.participants.find(predicate) ?? null;
}

function createProjectPayload(skills) {
  const payload = {
    title: `Load test ${FakerHash()}`,
    description: 'Automatically generated by k6 full suite',
    needSkills: [],
    eventId: null,
  };

  if (skills && skills.length > 0) {
    const shuffled = [...skills].sort(() => Math.random() - 0.5);
    payload.needSkills = shuffled.slice(0, Math.min(5, shuffled.length)).map((skill) => ({
      id: skill.id,
      name: skill.name,
    }));
  }

  return payload;
}

function FakerHash() {
  const random = Math.random().toString(36).substring(2, 8);
  return `${__VU}-${__ITER}-${random}`;
}

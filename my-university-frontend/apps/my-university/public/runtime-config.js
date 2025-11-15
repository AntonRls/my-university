/* This file is replaced inside the Docker image via envsubst.
 * Keep the ${VAR_NAME} placeholders as-is.
 */
window.__MY_UNIVERSITY_RUNTIME_CONFIG__ = {
  tenantApiBaseUrl: '${TENANT_API_BASE_URL}',
  authApiBaseUrl: '${AUTH_API_BASE_URL}',
  adminApiBaseUrl: '${ADMIN_API_BASE_URL}',
};


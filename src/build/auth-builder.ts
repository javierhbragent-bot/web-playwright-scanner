import type { AuthenticationArtifact } from '../types/artifacts.js';
import type { AuthResult } from '../explore/auth-handler.js';
import type { SessionManager } from '../core/session.js';

export function buildAuth(authResult: AuthResult | null): AuthenticationArtifact | null {
  if (!authResult) return null;

  const loginForm = authResult.loginDom.forms[0];
  const loginApiCall = authResult.loginApiCalls.find((c) => c.category === 'user_action');

  return {
    id: 'auth:login',
    loginRoute: authResult.loginRoute,
    authType: 'form',
    loginInputs: loginForm
      ? loginForm.inputs.map((i) => ({
          name: i.name,
          type: i.type,
          label: i.label,
        }))
      : [],
    loginApiEndpoint: loginApiCall?.endpointPattern ?? null,
    redirectAfterLogin: authResult.redirectAfterLogin,
    sessionMechanism: authResult.sessionManager.getSessionMechanism(),
    relatedFlowIds: [],
    protectedPageIds: [],
  };
}

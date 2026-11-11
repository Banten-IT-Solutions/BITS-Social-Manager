import { describe, it, expect } from 'vitest';
import { openApiSpec } from '../../src/worker/openapi';

type Operation = {
  security?: unknown[];
  requestBody?: {
    content: Record<
      string,
      { schema: { required?: string[]; properties?: Record<string, Record<string, unknown>> } }
    >;
  };
  responses?: Record<string, unknown>;
};

const spec = openApiSpec as unknown as {
  info: { description: string };
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: Record<string, unknown> };
};

/** Every route mounted in src/worker (index.ts + routes/*). */
const EXPECTED: Record<string, string[]> = {
  '/api/auth/register': ['post'],
  '/api/auth/login': ['post'],
  '/api/auth/logout': ['post'],
  '/api/profile': ['get', 'put'],
  '/api/projects': ['get', 'post'],
  '/api/projects/{id}': ['get', 'put', 'delete'],
  '/api/accounts': ['get', 'post'],
  '/api/accounts/{id}': ['get', 'put', 'delete'],
  '/api/drive': ['get', 'delete'],
  '/api/drive/connect': ['post'],
  '/api/integrations/google/callback': ['get'],
  '/api/posts': ['get'],
  '/api/accounts/{accountId}/posts': ['get', 'post'],
  '/api/accounts/{accountId}/posts/{postId}': ['get', 'put', 'delete'],
  '/api/health': ['get'],
};

const PUBLIC_PATHS = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/integrations/google/callback',
  '/api/health',
];

describe('OpenAPI spec vs codebase', () => {
  it('documents every mounted path and method (no extras)', () => {
    expect(Object.keys(spec.paths).sort()).toEqual(Object.keys(EXPECTED).sort());
    for (const [path, methods] of Object.entries(EXPECTED)) {
      const item = spec.paths[path]!;
      for (const method of methods) {
        expect(item, `${method.toUpperCase()} ${path}`).toHaveProperty(method);
      }
    }
  });

  it('resolves every $ref to a component schema', () => {
    const refs = new Set<string>();
    const walk = (node: unknown) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
          if (key === '$ref' && typeof value === 'string') refs.add(value);
          else walk(value);
        }
      }
    };
    walk(spec);
    expect(refs.size).toBeGreaterThan(0);
    for (const ref of refs) {
      const name = ref.replace('#/components/schemas/', '');
      expect(spec.components.schemas, ref).toHaveProperty(name);
    }
  });

  it('marks public endpoints with security: []', () => {
    for (const path of PUBLIC_PATHS) {
      for (const [method, op] of Object.entries(spec.paths[path]!)) {
        if (method === 'parameters') continue;
        expect(op.security, `${method.toUpperCase()} ${path}`).toEqual([]);
      }
    }
  });

  it('post create requires title (JSON + multipart), update requires nothing', () => {
    const create = spec.paths['/api/accounts/{accountId}/posts']!.post!;
    const createJson = create.requestBody!.content['application/json']!.schema;
    const createForm = create.requestBody!.content['multipart/form-data']!.schema;
    expect(createJson).toEqual({ $ref: '#/components/schemas/PostCreateInput' });
    expect(createForm.required).toEqual(['title']);
    expect(createForm.properties).not.toHaveProperty('accountId');
    expect(createForm.properties!.status).toHaveProperty('default', 'draft');

    const update = spec.paths['/api/accounts/{accountId}/posts/{postId}']!.put!;
    const updateJson = update.requestBody!.content['application/json']!.schema;
    const updateForm = update.requestBody!.content['multipart/form-data']!.schema;
    expect(updateJson).toEqual({ $ref: '#/components/schemas/PostUpdateInput' });
    expect(updateForm.required).toBeUndefined();
    expect(updateForm.properties).toHaveProperty('accountId');
  });

  it('documents rate-limit and not-found fallbacks', () => {
    expect(spec.paths['/api/auth/register']!.post!.responses).toHaveProperty('429');
    expect(spec.paths['/api/auth/login']!.post!.responses).toHaveProperty('429');
    expect(spec.paths['/api/profile']!.get!.responses).toHaveProperty('404');
    expect(spec.paths['/api/profile']!.put!.responses).toHaveProperty('404');
    expect(spec.info.description).toContain('/api/integrations/google/callback');
  });
});

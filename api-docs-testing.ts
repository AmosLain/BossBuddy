// ===================================
// API DOCUMENTATION WITH SWAGGER
// ===================================

// app/api/docs/route.ts
import { SwaggerUIBundle } from 'swagger-ui-dist';

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>BossBuddy API Documentation</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
      <script>
        window.onload = function() {
          window.ui = SwaggerUIBundle({
            url: "/api/openapi.json",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout"
          });
        }
      </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// app/api/openapi.json/route.ts
export async function GET() {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'BossBuddy API',
      version: '1.0.0',
      description: 'Professional message rewriting API',
      contact: {
        name: 'API Support',
        email: 'api@bossbuddy.ai',
        url: 'https://bossbuddy.ai/support'
      }
    },
    servers: [
      {
        url: 'https://api.bossbuddy.ai/v1',
        description: 'Production server'
      },
      {
        url: 'https://staging-api.bossbuddy.ai/v1',
        description: 'Staging server'
      }
    ],
    security: [
      {
        apiKey: []
      }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication'
        }
      },
      schemas: {
        RewriteRequest: {
          type: 'object',
          required: ['message', 'tone'],
          properties: {
            message: {
              type: 'string',
              description: 'The message to rewrite',
              example: 'hey boss, cant make it today im sick'
            },
            tone: {
              type: 'string',
              enum: ['formal', 'friendly', 'assertive', 'apologetic', 'urgent', 'diplomatic'],
              description: 'Desired tone for the rewritten message',
              example: 'formal'
            },
            context: {
              type: 'object',
              properties: {
                recipientRole: {
                  type: 'string',
                  example: 'manager'
                },
                urgencyLevel: {
                  type: 'string',
                  enum: ['low', 'medium', 'high']
                }
              }
            }
          }
        },
        RewriteResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            original: {
              type: 'string',
              example: 'hey boss, cant make it today im sick'
            },
            rewritten: {
              type: 'string',
              example: 'Dear [Boss Name],\n\nI hope this message finds you well. I am writing to inform you that I am feeling unwell today and will not be able to come to work.\n\nI apologize for any inconvenience this may cause and will ensure that all urgent matters are addressed appropriately. Please let me know if you need any additional information.\n\nThank you for your understanding.\n\nBest regards,\n[Your Name]'
            },
            tone: {
              type: 'string',
              example: 'formal'
            },
            metrics: {
              type: 'object',
              properties: {
                wordCount: {
                  type: 'object',
                  properties: {
                    original: { type: 'integer', example: 8 },
                    rewritten: { type: 'integer', example: 76 }
                  }
                },
                professionalismScore: {
                  type: 'integer',
                  example: 95
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Invalid API key'
            },
            code: {
              type: 'string',
              example: 'UNAUTHORIZED'
            },
            details: {
              type: 'object'
            }
          }
        }
      }
    },
    paths: {
      '/rewrite': {
        post: {
          summary: 'Rewrite a message',
          description: 'Transform a casual message into a professional one using AI',
          operationId: 'rewriteMessage',
          tags: ['Message Rewriting'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RewriteRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successfully rewritten message',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RewriteResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            },
            '429': {
              description: 'Rate limit exceeded',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      },
      '/tones': {
        get: {
          summary: 'List available tones',
          description: 'Get a list of all available tones for message rewriting',
          operationId: 'listTones',
          tags: ['Configuration'],
          responses: {
            '200': {
              description: 'List of available tones',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tones: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            tier: { type: 'string', enum: ['free', 'pro'] }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/usage': {
        get: {
          summary: 'Get API usage statistics',
          description: 'Retrieve your API usage statistics for the current billing period',
          operationId: 'getUsage',
          tags: ['Account'],
          responses: {
            '200': {
              description: 'Usage statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      period: {
                        type: 'object',
                        properties: {
                          start: { type: 'string', format: 'date-time' },
                          end: { type: 'string', format: 'date-time' }
                        }
                      },
                      usage: {
                        type: 'object',
                        properties: {
                          requests: { type: 'integer' },
                          tokensUsed: { type: 'integer' },
                          successRate: { type: 'number' }
                        }
                      },
                      limits: {
                        type: 'object',
                        properties: {
                          requestsPerMonth: { type: 'integer' },
                          requestsPerMinute: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  
  return Response.json(openApiSpec);
}

// ===================================
// API CLIENT SDK
// ===================================

// sdk/bossbuddy-sdk.ts
export class BossBuddySDK {
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey: string, options?: { baseUrl?: string }) {
    this.apiKey = apiKey;
    this.baseUrl = options?.baseUrl || 'https://api.bossbuddy.ai/v1';
  }
  
  /**
   * Rewrite a message with the specified tone
   * @param message - The message to rewrite
   * @param tone - The desired tone
   * @param options - Additional options
   * @returns The rewritten message
   */
  async rewrite(
    message: string,
    tone: 'formal' | 'friendly' | 'assertive' | 'apologetic' | 'urgent' | 'diplomatic',
    options?: {
      context?: {
        recipientRole?: string;
        urgencyLevel?: 'low' | 'medium' | 'high';
      };
    }
  ): Promise<RewriteResponse> {
    const response = await fetch(`${this.baseUrl}/rewrite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        message,
        tone,
        context: options?.context,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new BossBuddyError(error.error, error.code, response.status);
    }
    
    return response.json();
  }
  
  /**
   * Get available tones
   * @returns List of available tones
   */
  async getTones(): Promise<Tone[]> {
    const response = await fetch(`${this.baseUrl}/tones`, {
      headers: {
        'X-API-Key': this.apiKey,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new BossBuddyError(error.error, error.code, response.status);
    }
    
    const data = await response.json();
    return data.tones;
  }
  
  /**
   * Get usage statistics
   * @returns Usage statistics for the current period
   */
  async getUsage(): Promise<UsageStats> {
    const response = await fetch(`${this.baseUrl}/usage`, {
      headers: {
        'X-API-Key': this.apiKey,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new BossBuddyError(error.error, error.code, response.status);
    }
    
    return response.json();
  }
}

class BossBuddyError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'BossBuddyError';
  }
}

// ===================================
// TESTING SUITE
// ===================================

// __tests__/api/rewrite.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/rewrite/route';

describe('/api/rewrite', () => {
  let mockOpenAI: any;
  
  beforeAll(() => {
    // Mock OpenAI
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Mocked professional message'
              }
            }],
            usage: {
              total_tokens: 100
            }
          })
        }
      }
    };
  });
  
  afterAll(() => {
    jest.clearAllMocks();
  });
  
  it('should rewrite a message successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        message: 'hey boss im sick',
        tone: 'formal',
        userId: 'test-user-id'
      },
    });
    
    const response = await POST(req as any);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.rewritten).toBeDefined();
    expect(data.tone).toBe('formal');
  });
  
  it('should validate request body', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        // Missing required fields
        tone: 'formal'
      },
    });
    
    const response = await POST(req as any);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
  
  it('should enforce rate limits', async () => {
    // Simulate multiple requests
    for (let i = 0; i < 11; i++) {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1'
        },
        body: {
          message: 'test',
          tone: 'formal'
        },
      });
      
      const response = await POST(req as any);
      
      if (i < 10) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429);
      }
    }
  });
  
  it('should check user plan limits', async () => {
    // Mock user with free plan who has reached daily limit
    const mockUser = {
      plan: 'free',
      dailyUsage: 3
    };
    
    const { req } = createMocks({
      method: 'POST',
      body: {
        message: 'test',
        tone: 'formal',
        userId: 'free-user-id'
      },
    });
    
    const response = await POST(req as any);
    const data = await response.json();
    
    expect(response.status).toBe(403);
    expect(data.error).toContain('Daily limit reached');
  });
});

// __tests__/integration/payment.test.ts
import { describe, it, expect } from '@jest/globals';
import { setupTestDatabase, cleanupTestDatabase } from '../utils/testDb';
import { PayPalWebhookHandler } from '@/lib/paypal';

describe('PayPal Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  it('should handle subscription creation webhook', async () => {
    const webhookEvent = {
      id: 'WH-TEST-001',
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource: {
        id: 'I-TEST12345',
        plan_id: 'P-PRO-MONTHLY',
        subscriber: {
          email_address: 'test@example.com'
        }
      }
    };
    
    const handler = new PayPalWebhookHandler();
    await handler.handleWebhook(webhookEvent);
    
    // Verify user was created
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    expect(user).toBeDefined();
    expect(user?.paypal_subscription_id).toBe('I-TEST12345');
  });
  
  it('should handle payment completion', async () => {
    const webhookEvent = {
      id: 'WH-TEST-002',
      event_type: 'PAYMENT.SALE.COMPLETED',
      resource: {
        billing_agreement_id: 'I-TEST12345',
        amount: {
          total: '1.99',
          currency: 'USD'
        }
      }
    };
    
    const handler = new PayPalWebhookHandler();
    await handler.handleWebhook(webhookEvent);
    
    // Verify subscription was extended
    const subscription = await prisma.subscription.findFirst({
      where: { provider_subscription_id: 'I-TEST12345' }
    });
    
    expect(subscription?.status).toBe('active');
  });
});

// __tests__/e2e/user-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Journey', () => {
  test('complete signup and rewrite flow', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click get started
    await page.click('text=Try It Free');
    
    // Fill in message
    await page.fill('textarea[placeholder*="Type or paste"]', 'hey boss im sick today');
    
    // Select tone
    await page.click('text=Formal');
    
    // Click rewrite
    await page.click('text=Rewrite Message');
    
    // Wait for result
    await expect(page.locator('text=Your Professional Message')).toBeVisible();
    
    // Verify rewritten content exists
    const rewrittenText = await page.textContent('.result-text');
    expect(rewrittenText).toContain('Dear');
    expect(rewrittenText).toContain('I am writing to inform you');
    
    // Test copy functionality
    await page.click('text=Copy');
    await expect(page.locator('text=Copied!')).toBeVisible();
  });
  
  test('payment flow', async ({ page }) => {
    await page.goto('/');
    
    // Use app 3 times to hit limit
    for (let i = 0; i < 3; i++) {
      await page.fill('textarea', `test message ${i}`);
      await page.click('text=Rewrite Message');
      await page.waitForTimeout(1000);
    }
    
    // Try 4th time - should show upgrade
    await page.fill('textarea', 'test message 4');
    await page.click('text=Rewrite Message');
    
    // Verify upgrade modal appears
    await expect(page.locator('text=Upgrade to Pro')).toBeVisible();
    
    // Click upgrade
    await page.click('text=Start Free Trial');
    
    // Verify payment options
    await expect(page.locator('text=PayPal')).toBeVisible();
    await expect(page.locator('text=Credit Card')).toBeVisible();
  });
});

// __tests__/performance/load.test.ts
import { check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'], // Error rate must be below 10%
  },
};

export default function () {
  const payload = JSON.stringify({
    message: 'I need to take a sick day today',
    tone: 'formal',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': __ENV.API_KEY,
    },
  };
  
  const response = http.post('https://api.bossbuddy.ai/v1/rewrite', payload, params);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has rewritten message': (r) => {
      const body = JSON.parse(r.body);
      return body.rewritten !== undefined;
    },
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
}

// ===================================
// TEST UTILITIES
// ===================================

// __tests__/utils/testDb.ts
import { PrismaClient } from '@prisma/client';

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST,
    },
  },
});

export async function setupTestDatabase() {
  // Clear all data
  await testPrisma.user.deleteMany();
  await testPrisma.subscription.deleteMany();
  await testPrisma.usageLog.deleteMany();
  
  // Seed test data
  await testPrisma.user.create({
    data: {
      id: 'test-user-id',
      email: 'test@example.com',
      plan: 'free',
      created_at: new Date(),
    },
  });
}

export async function cleanupTestDatabase() {
  await testPrisma.$disconnect();
}

// __tests__/utils/mockData.ts
export const mockMessages = {
  sickDay: {
    input: 'hey boss cant come in today im sick',
    expectedOutput: /Dear.*I am writing to inform you.*unable to come to work.*apologize/i,
  },
  timeOff: {
    input: 'need to take next friday off',
    expectedOutput: /request.*time off.*Friday/i,
  },
  lateArrival: {
    input: 'running late traffic is bad',
    expectedOutput: /delayed.*traffic.*arrive/i,
  },
};

export const mockTones = [
  { id: 'formal', name: 'Formal', tier: 'free' },
  { id: 'friendly', name: 'Friendly', tier: 'free' },
  { id: 'assertive', name: 'Assertive', tier: 'free' },
  { id: 'apologetic', name: 'Apologetic', tier: 'free' },
  { id: 'urgent', name: 'Urgent', tier: 'pro' },
  { id: 'diplomatic', name: 'Diplomatic', tier: 'pro' },
];

// ===================================
// JEST CONFIGURATION
// ===================================

// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
};

// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock environment variables
process.env = {
  ...process.env,
  DATABASE_URL_TEST: 'postgresql://test:test@localhost:5432/bossbuddy_test',
  OPENAI_API_KEY: 'test-key',
  PAYPAL_CLIENT_ID: 'test-client-id',
  PAYPAL_CLIENT_SECRET: 'test-client-secret',
};
import { Context, Next } from 'hono';
import prisma from '../config/database';

/**
 * Subdomain/Domain middleware to identify school from host
 * Supports both subdomain (school.example.com) and full domain (school.com)
 */
export const subdomainMiddleware = async (c: Context, next: Next) => {
  try {
    const host = c.req.header('host') || '';
    const forwardedHost = c.req.header('x-forwarded-host') || '';
    const actualHost = forwardedHost || host;
    
    // Remove port if present (e.g., localhost:3001 -> localhost)
    const hostWithoutPort = actualHost.split(':')[0];
    
    console.log('[SUBDOMAIN] Host:', host, 'Forwarded:', forwardedHost, 'Actual:', hostWithoutPort);

    if (!hostWithoutPort || hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
      // Skip subdomain detection for localhost
      await next();
      return;
    }

    // Try to find school by full domain first
    let school = await prisma.school.findUnique({
      where: { domain: hostWithoutPort },
      select: {
        id: true,
        name: true,
        domain: true,
        subscription: true,
      },
    });

    // If not found, try subdomain (e.g., school.example.com -> school)
    if (!school) {
      const hostParts = hostWithoutPort.split('.');
      if (hostParts.length >= 2) {
        // Try subdomain as domain (e.g., "school" from "school.example.com")
        const subdomain = hostParts[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
          school = await prisma.school.findUnique({
            where: { domain: subdomain },
            select: {
              id: true,
              name: true,
              domain: true,
              subscription: true,
            },
          });
        }
      }
    }

    if (school) {
      console.log('[SUBDOMAIN] Found school:', school.name, 'for domain:', school.domain);
      c.set('school', {
        id: school.id,
        name: school.name,
        domain: school.domain,
        subscription: school.subscription,
      });
      c.set('schoolId', school.id);
    } else {
      console.log('[SUBDOMAIN] No school found for host:', hostWithoutPort);
    }

    await next();
  } catch (error: any) {
    console.error('[SUBDOMAIN] Error in subdomain middleware:', error);
    // Don't block request if subdomain detection fails
    await next();
  }
};

/**
 * Get school from domain (for API calls with domain parameter)
 */
export const getSchoolFromDomain = async (domain: string) => {
  try {
    const school = await prisma.school.findUnique({
      where: { domain },
      select: {
        id: true,
        name: true,
        domain: true,
        subscription: true,
      },
    });
    return school;
  } catch (error: any) {
    console.error('[SUBDOMAIN] Error getting school from domain:', error);
    return null;
  }
};

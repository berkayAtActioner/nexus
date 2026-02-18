import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { deals, contacts, activities, pipelineStages } from './data.js';

const server = new McpServer({
  name: 'actioner-crm',
  version: '1.0.0',
});

// Tool 1: List Deals
server.tool(
  'actioner_list_deals',
  'List CRM deals. Filter by stage, owner, or status (active/won/lost/all).',
  {
    status: z.enum(['active', 'won', 'lost', 'all']).optional().describe('Filter by deal status'),
    stage: z.string().optional().describe('Filter by pipeline stage name'),
    owner: z.string().optional().describe('Filter by deal owner name'),
  },
  async ({ status, stage, owner }) => {
    let filtered = [...deals];

    if (status && status !== 'all') {
      if (status === 'active') filtered = filtered.filter(d => !d.stage.startsWith('Closed'));
      else if (status === 'won') filtered = filtered.filter(d => d.stage === 'Closed Won');
      else if (status === 'lost') filtered = filtered.filter(d => d.stage === 'Closed Lost');
    }
    if (stage) filtered = filtered.filter(d => d.stage.toLowerCase() === stage.toLowerCase());
    if (owner) filtered = filtered.filter(d => d.owner.toLowerCase().includes(owner.toLowerCase()));

    const result = {
      deals: filtered.map(d => ({
        id: d.id,
        name: d.name,
        company: d.company,
        value: d.value,
        stage: d.stage,
        owner: d.owner,
        probability: d.probability,
        expectedClose: d.expectedClose,
      })),
      total: filtered.length,
      totalValue: filtered.reduce((sum, d) => sum + d.value, 0),
      _app: { type: 'DataTable', pinnable: true, title: 'Deals' },
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 2: Get Deal
server.tool(
  'actioner_get_deal',
  'Get detailed information about a specific deal including contacts and recent activity.',
  {
    dealId: z.string().describe('The deal ID (e.g., deal-001)'),
  },
  async ({ dealId }) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Deal ${dealId} not found` }) }] };
    }

    const dealContacts = contacts.filter(c => deal.contacts.includes(c.id));
    const dealActivities = activities
      .filter(a => a.dealId === dealId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    const result = {
      ...deal,
      contacts: dealContacts.map(c => ({ id: c.id, name: c.name, email: c.email, title: c.title })),
      recentActivity: dealActivities.map(a => ({
        id: a.id, type: a.type, subject: a.subject, date: a.date, owner: a.owner,
      })),
      _app: { type: 'DetailView', pinnable: true, title: deal.name },
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 3: Update Deal
server.tool(
  'actioner_update_deal',
  'Update a deal\'s stage, value, probability, or expected close date.',
  {
    dealId: z.string().describe('The deal ID'),
    stage: z.string().optional().describe('New pipeline stage'),
    value: z.number().optional().describe('New deal value'),
    probability: z.number().optional().describe('New probability percentage'),
    expectedClose: z.string().optional().describe('New expected close date (YYYY-MM-DD)'),
  },
  async ({ dealId, stage, value, probability, expectedClose }) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Deal ${dealId} not found` }) }] };
    }

    const changes: Record<string, { from: any; to: any }> = {};

    if (stage !== undefined) { changes.stage = { from: deal.stage, to: stage }; deal.stage = stage; }
    if (value !== undefined) { changes.value = { from: deal.value, to: value }; deal.value = value; }
    if (probability !== undefined) { changes.probability = { from: deal.probability, to: probability }; deal.probability = probability; }
    if (expectedClose !== undefined) { changes.expectedClose = { from: deal.expectedClose, to: expectedClose }; deal.expectedClose = expectedClose; }

    const result = {
      success: true,
      dealId,
      changes,
      updatedDeal: { id: deal.id, name: deal.name, stage: deal.stage, value: deal.value, probability: deal.probability },
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 4: List Contacts
server.tool(
  'actioner_list_contacts',
  'List CRM contacts. Filter by company, deal, or search by name/email.',
  {
    company: z.string().optional().describe('Filter by company name'),
    dealId: z.string().optional().describe('Filter by associated deal ID'),
    search: z.string().optional().describe('Search by name or email'),
  },
  async ({ company, dealId, search }) => {
    let filtered = [...contacts];

    if (company) filtered = filtered.filter(c => c.company.toLowerCase().includes(company.toLowerCase()));
    if (dealId) filtered = filtered.filter(c => c.dealIds.includes(dealId));
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }

    const result = {
      contacts: filtered.map(c => ({
        id: c.id, name: c.name, email: c.email, company: c.company, title: c.title, lastContacted: c.lastContacted,
      })),
      total: filtered.length,
      _app: { type: 'DataTable', pinnable: true, title: 'Contacts' },
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 5: Get Contact
server.tool(
  'actioner_get_contact',
  'Get detailed information about a specific contact including communication history.',
  {
    contactId: z.string().describe('The contact ID (e.g., contact-001)'),
  },
  async ({ contactId }) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Contact ${contactId} not found` }) }] };
    }

    const contactActivities = activities
      .filter(a => a.contactId === contactId)
      .sort((a, b) => b.date.localeCompare(a.date));

    const associatedDeals = deals
      .filter(d => contact.dealIds.includes(d.id))
      .map(d => ({ id: d.id, name: d.name, stage: d.stage, value: d.value }));

    const result = {
      ...contact,
      deals: associatedDeals,
      communicationHistory: contactActivities.map(a => ({
        id: a.id, type: a.type, subject: a.subject, description: a.description, date: a.date,
      })),
      _app: { type: 'DetailView', pinnable: true, title: contact.name },
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 6: List Activities
server.tool(
  'actioner_list_activities',
  'List CRM activities. Filter by deal, contact, or activity type.',
  {
    dealId: z.string().optional().describe('Filter by deal ID'),
    contactId: z.string().optional().describe('Filter by contact ID'),
    type: z.enum(['email', 'call', 'meeting', 'note']).optional().describe('Filter by activity type'),
    limit: z.number().optional().describe('Max number of activities to return (default 10)'),
  },
  async ({ dealId, contactId, type, limit }) => {
    let filtered = [...activities].sort((a, b) => b.date.localeCompare(a.date));

    if (dealId) filtered = filtered.filter(a => a.dealId === dealId);
    if (contactId) filtered = filtered.filter(a => a.contactId === contactId);
    if (type) filtered = filtered.filter(a => a.type === type);

    const maxResults = limit || 10;
    filtered = filtered.slice(0, maxResults);

    const result = {
      activities: filtered.map(a => ({
        id: a.id, type: a.type, subject: a.subject, description: a.description,
        dealId: a.dealId, contactId: a.contactId, owner: a.owner, date: a.date,
      })),
      total: filtered.length,
      _app: { type: 'DataTable', pinnable: false, title: 'Activities' },
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 7: Get Pipeline Summary
server.tool(
  'actioner_get_pipeline_summary',
  'Get a summary of the sales pipeline with stage counts, values, and forecast.',
  {},
  async () => {
    const activeDeals = deals.filter(d => !d.stage.startsWith('Closed'));
    const totalPipeline = activeDeals.reduce((sum, d) => sum + d.value, 0);
    const weightedForecast = activeDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
    const closedWonThisMonth = deals
      .filter(d => d.stage === 'Closed Won' && d.expectedClose.startsWith('2026-02'))
      .reduce((sum, d) => sum + d.value, 0);

    const result = {
      stages: pipelineStages,
      summary: {
        totalPipeline,
        activeDeals: activeDeals.length,
        weightedForecast: Math.round(weightedForecast),
        closedWonThisMonth,
        avgDealSize: Math.round(totalPipeline / activeDeals.length),
      },
      _app: { type: 'ChartView', pinnable: true, title: 'Pipeline Summary' },
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[Actioner CRM Mock] Server started on stdio');
}

main().catch(console.error);

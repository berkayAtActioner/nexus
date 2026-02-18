export interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
  owner: string;
  probability: number;
  expectedClose: string;
  createdAt: string;
  lastActivity: string;
  contacts: string[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  dealIds: string[];
  lastContacted: string;
}

export interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  subject: string;
  description: string;
  dealId?: string;
  contactId?: string;
  owner: string;
  date: string;
}

export const deals: Deal[] = [
  {
    id: 'deal-001', name: 'Acme Corp Enterprise License', company: 'Acme Corp',
    value: 125000, stage: 'Negotiation', owner: 'Sarah Chen', probability: 75,
    expectedClose: '2026-03-15', createdAt: '2025-11-20', lastActivity: '2026-02-17',
    contacts: ['contact-001', 'contact-002'],
  },
  {
    id: 'deal-002', name: 'TechFlow Platform Migration', company: 'TechFlow Inc',
    value: 89000, stage: 'Proposal', owner: 'James Wilson', probability: 60,
    expectedClose: '2026-04-01', createdAt: '2026-01-05', lastActivity: '2026-02-16',
    contacts: ['contact-003'],
  },
  {
    id: 'deal-003', name: 'Meridian Analytics Suite', company: 'Meridian Group',
    value: 210000, stage: 'Discovery', owner: 'Sarah Chen', probability: 30,
    expectedClose: '2026-06-30', createdAt: '2026-02-01', lastActivity: '2026-02-15',
    contacts: ['contact-004', 'contact-005'],
  },
  {
    id: 'deal-004', name: 'BrightPath Onboarding', company: 'BrightPath Education',
    value: 45000, stage: 'Closed Won', owner: 'Maria Garcia', probability: 100,
    expectedClose: '2026-02-10', createdAt: '2025-10-15', lastActivity: '2026-02-10',
    contacts: ['contact-006'],
  },
  {
    id: 'deal-005', name: 'Vertex Cloud Integration', company: 'Vertex Systems',
    value: 175000, stage: 'Negotiation', owner: 'James Wilson', probability: 80,
    expectedClose: '2026-03-01', createdAt: '2025-12-01', lastActivity: '2026-02-18',
    contacts: ['contact-007', 'contact-008'],
  },
  {
    id: 'deal-006', name: 'Pinnacle Security Audit', company: 'Pinnacle Finance',
    value: 62000, stage: 'Proposal', owner: 'Sarah Chen', probability: 50,
    expectedClose: '2026-04-15', createdAt: '2026-01-20', lastActivity: '2026-02-14',
    contacts: ['contact-009'],
  },
  {
    id: 'deal-007', name: 'NovaLabs R&D Partnership', company: 'NovaLabs',
    value: 340000, stage: 'Discovery', owner: 'Maria Garcia', probability: 20,
    expectedClose: '2026-08-01', createdAt: '2026-02-10', lastActivity: '2026-02-17',
    contacts: ['contact-010', 'contact-011'],
  },
  {
    id: 'deal-008', name: 'Cascade Media Renewal', company: 'Cascade Media',
    value: 78000, stage: 'Closed Lost', owner: 'James Wilson', probability: 0,
    expectedClose: '2026-01-31', createdAt: '2025-09-01', lastActivity: '2026-01-28',
    contacts: ['contact-012'],
  },
];

export const contacts: Contact[] = [
  { id: 'contact-001', name: 'David Park', email: 'david.park@acme.com', phone: '+1-555-0101', company: 'Acme Corp', title: 'VP Engineering', dealIds: ['deal-001'], lastContacted: '2026-02-17' },
  { id: 'contact-002', name: 'Lisa Wong', email: 'lisa.wong@acme.com', phone: '+1-555-0102', company: 'Acme Corp', title: 'CTO', dealIds: ['deal-001'], lastContacted: '2026-02-14' },
  { id: 'contact-003', name: 'Mike Torres', email: 'mike@techflow.io', phone: '+1-555-0201', company: 'TechFlow Inc', title: 'Director of IT', dealIds: ['deal-002'], lastContacted: '2026-02-16' },
  { id: 'contact-004', name: 'Amanda Foster', email: 'amanda.foster@meridian.com', phone: '+1-555-0301', company: 'Meridian Group', title: 'Head of Analytics', dealIds: ['deal-003'], lastContacted: '2026-02-15' },
  { id: 'contact-005', name: 'Robert Kim', email: 'rkim@meridian.com', phone: '+1-555-0302', company: 'Meridian Group', title: 'CEO', dealIds: ['deal-003'], lastContacted: '2026-02-08' },
  { id: 'contact-006', name: 'Jennifer Lee', email: 'jlee@brightpath.edu', phone: '+1-555-0401', company: 'BrightPath Education', title: 'Operations Manager', dealIds: ['deal-004'], lastContacted: '2026-02-10' },
  { id: 'contact-007', name: 'Thomas Nguyen', email: 'thomas@vertex.io', phone: '+1-555-0501', company: 'Vertex Systems', title: 'CTO', dealIds: ['deal-005'], lastContacted: '2026-02-18' },
  { id: 'contact-008', name: 'Sarah Mitchell', email: 's.mitchell@vertex.io', phone: '+1-555-0502', company: 'Vertex Systems', title: 'VP Engineering', dealIds: ['deal-005'], lastContacted: '2026-02-15' },
  { id: 'contact-009', name: 'Carlos Rivera', email: 'crivera@pinnacle.com', phone: '+1-555-0601', company: 'Pinnacle Finance', title: 'CISO', dealIds: ['deal-006'], lastContacted: '2026-02-14' },
  { id: 'contact-010', name: 'Emily Zhang', email: 'emily@novalabs.com', phone: '+1-555-0701', company: 'NovaLabs', title: 'Director of Research', dealIds: ['deal-007'], lastContacted: '2026-02-17' },
  { id: 'contact-011', name: 'Alex Johnson', email: 'ajohnson@novalabs.com', phone: '+1-555-0702', company: 'NovaLabs', title: 'VP Partnerships', dealIds: ['deal-007'], lastContacted: '2026-02-12' },
  { id: 'contact-012', name: 'Rachel Green', email: 'rgreen@cascade.media', phone: '+1-555-0801', company: 'Cascade Media', title: 'Marketing Director', dealIds: ['deal-008'], lastContacted: '2026-01-28' },
];

export const activities: Activity[] = [
  { id: 'act-001', type: 'email', subject: 'Contract revision sent', description: 'Sent updated contract with revised pricing terms to David Park.', dealId: 'deal-001', contactId: 'contact-001', owner: 'Sarah Chen', date: '2026-02-17' },
  { id: 'act-002', type: 'call', subject: 'Technical requirements call', description: '45-min call reviewing technical requirements and integration timeline with Lisa Wong.', dealId: 'deal-001', contactId: 'contact-002', owner: 'Sarah Chen', date: '2026-02-14' },
  { id: 'act-003', type: 'meeting', subject: 'Demo presentation', description: 'Delivered platform demo to Mike Torres and his team. Positive feedback on migration tools.', dealId: 'deal-002', contactId: 'contact-003', owner: 'James Wilson', date: '2026-02-16' },
  { id: 'act-004', type: 'email', subject: 'Proposal follow-up', description: 'Sent proposal follow-up with case studies and ROI analysis.', dealId: 'deal-002', contactId: 'contact-003', owner: 'James Wilson', date: '2026-02-13' },
  { id: 'act-005', type: 'meeting', subject: 'Discovery meeting', description: 'Initial discovery meeting with Amanda Foster. Discussed analytics pain points and requirements.', dealId: 'deal-003', contactId: 'contact-004', owner: 'Sarah Chen', date: '2026-02-15' },
  { id: 'act-006', type: 'note', subject: 'Budget approval update', description: 'Jennifer confirmed budget has been approved. Onboarding starts next week.', dealId: 'deal-004', contactId: 'contact-006', owner: 'Maria Garcia', date: '2026-02-10' },
  { id: 'act-007', type: 'call', subject: 'Pricing negotiation', description: 'Discussed volume discounts and multi-year pricing with Thomas Nguyen.', dealId: 'deal-005', contactId: 'contact-007', owner: 'James Wilson', date: '2026-02-18' },
  { id: 'act-008', type: 'email', subject: 'Security questionnaire response', description: 'Returned completed security questionnaire to Carlos Rivera.', dealId: 'deal-006', contactId: 'contact-009', owner: 'Sarah Chen', date: '2026-02-14' },
  { id: 'act-009', type: 'meeting', subject: 'Partnership kickoff', description: 'Kickoff meeting with Emily Zhang and Alex Johnson to discuss R&D partnership scope.', dealId: 'deal-007', contactId: 'contact-010', owner: 'Maria Garcia', date: '2026-02-17' },
  { id: 'act-010', type: 'call', subject: 'Contract negotiation call', description: 'Final contract review with Sarah Mitchell. Minor changes to SLA terms.', dealId: 'deal-005', contactId: 'contact-008', owner: 'James Wilson', date: '2026-02-15' },
  { id: 'act-011', type: 'email', subject: 'CEO intro request', description: 'Emailed Robert Kim to schedule executive intro meeting.', dealId: 'deal-003', contactId: 'contact-005', owner: 'Sarah Chen', date: '2026-02-08' },
  { id: 'act-012', type: 'note', subject: 'Deal lost - budget cuts', description: 'Rachel confirmed Cascade Media has cut the budget for this quarter. Deal moved to Closed Lost.', dealId: 'deal-008', contactId: 'contact-012', owner: 'James Wilson', date: '2026-01-28' },
  { id: 'act-013', type: 'meeting', subject: 'Technical deep-dive', description: 'Deep dive session on integration architecture with David Park\'s engineering team.', dealId: 'deal-001', contactId: 'contact-001', owner: 'Sarah Chen', date: '2026-02-12' },
  { id: 'act-014', type: 'email', subject: 'Updated timeline', description: 'Sent revised implementation timeline with phase 2 milestones.', dealId: 'deal-005', contactId: 'contact-007', owner: 'James Wilson', date: '2026-02-11' },
  { id: 'act-015', type: 'call', subject: 'Stakeholder alignment', description: 'Call with Amanda to align on key stakeholders for the analytics project.', dealId: 'deal-003', contactId: 'contact-004', owner: 'Sarah Chen', date: '2026-02-07' },
];

export const pipelineStages = [
  { name: 'Discovery', count: 2, value: 550000 },
  { name: 'Proposal', count: 2, value: 151000 },
  { name: 'Negotiation', count: 2, value: 300000 },
  { name: 'Closed Won', count: 1, value: 45000 },
  { name: 'Closed Lost', count: 1, value: 78000 },
];

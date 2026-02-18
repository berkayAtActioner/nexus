import { Router } from 'express';
import { getAgents, getAgentById } from '../services/agent-config';

const router = Router();

router.get('/', (_req, res) => {
  const agents = getAgents();
  // Don't expose system prompts to the client
  const safeAgents = agents.map(({ systemPrompt, ...rest }) => rest);
  res.json(safeAgents);
});

router.get('/:id', (req, res) => {
  const agent = getAgentById(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  // Include systemPrompt when full=true (for Claude API calls)
  if (req.query.full === 'true') {
    return res.json(agent);
  }
  const { systemPrompt, ...safe } = agent;
  res.json(safe);
});

export default router;

import { useAgentStore } from '../stores/agent-store';

export function useAgent() {
  const agents = useAgentStore(s => s.agents);
  const activeAgentId = useAgentStore(s => s.activeAgentId);
  const activeAgent = useAgentStore(s => s.getActiveAgent());
  const setActiveAgent = useAgentStore(s => s.setActiveAgent);

  const generalAgent = agents.find(a => a.isGeneral);
  const specialistAgents = agents.filter(a => !a.isGeneral);

  return {
    agents,
    activeAgent,
    activeAgentId,
    generalAgent,
    specialistAgents,
    setActiveAgent,
  };
}

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  isGeneral: boolean;
  model: string;
  systemPrompt: string;
  mcpServers: string[];
  temperature: number;
  maxTokens: number;
}

interface AgentsYaml {
  agents: AgentConfig[];
}

let agentsCache: AgentConfig[] | null = null;

function loadAgents(): AgentConfig[] {
  if (agentsCache) return agentsCache;
  
  const filePath = path.join(__dirname, '../../agents.yml');
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(content) as AgentsYaml;
  agentsCache = parsed.agents;
  return agentsCache;
}

export function getAgents(): AgentConfig[] {
  return loadAgents();
}

export function getAgentById(id: string): AgentConfig | undefined {
  return loadAgents().find(a => a.id === id);
}

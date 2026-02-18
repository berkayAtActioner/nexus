import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { McpServerConfig } from '../../shared/types';

interface McpServersYml {
  servers: McpServerConfig[];
}

export function loadRegistry(): McpServerConfig[] {
  const configPath = path.join(process.cwd(), 'config', 'mcp-servers.yml');

  if (!fs.existsSync(configPath)) {
    console.warn('[MCP Registry] No config/mcp-servers.yml found');
    return [];
  }

  const raw = fs.readFileSync(configPath, 'utf-8');

  // Resolve ${ENV_VAR} placeholders
  const resolved = raw.replace(/\$\{(\w+)\}/g, (_match, varName) => {
    return process.env[varName] || '';
  });

  const parsed = yaml.load(resolved) as McpServersYml;
  return parsed?.servers || [];
}

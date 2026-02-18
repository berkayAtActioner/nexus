import { useState, useRef, useEffect } from "react";

// ── Data ──
const DEALS = [
  { id: "d1", name: "Acme Corp — Enterprise", value: "$420,000", stage: "Negotiation", probability: "75%", owner: "You", close: "Mar 15", activity: "Email 2h ago", trend: "up", contacts: 3, stageColor: "#f59e0b" },
  { id: "d2", name: "TechVault — Platform License", value: "$185,000", stage: "Proposal", probability: "60%", owner: "You", close: "Mar 28", activity: "Call yesterday", trend: "up", contacts: 2, stageColor: "#6366f1" },
  { id: "d3", name: "Meridian Health — Pilot", value: "$92,000", stage: "Discovery", probability: "35%", owner: "You", close: "Apr 10", activity: "Meeting tomorrow", trend: "flat", contacts: 4, stageColor: "#8b5cf6" },
  { id: "d4", name: "CloudBase — Renewal", value: "$310,000", stage: "Negotiation", probability: "85%", owner: "Sarah", close: "Feb 28", activity: "Contract sent", trend: "up", stageColor: "#f59e0b", contacts: 2 },
  { id: "d5", name: "Orion Labs — Expansion", value: "$156,000", stage: "Qualification", probability: "25%", owner: "You", close: "Apr 22", activity: "No response 5d", trend: "down", contacts: 1, stageColor: "#ec4899" },
];

const DEAL_DETAIL = {
  d1: {
    name: "Acme Corp — Enterprise", value: "$420,000", stage: "Negotiation", probability: "75%",
    nextStep: "Legal review of MSA — waiting on their counsel",
    contacts: [
      { name: "Rachel Torres", role: "VP Engineering", lastContact: "Email 2h ago" },
      { name: "David Kim", role: "CTO", lastContact: "Call last week" },
      { name: "Lisa Park", role: "Procurement", lastContact: "Email yesterday" },
    ],
    timeline: [
      { date: "Feb 17", event: "Rachel responded to pricing proposal", type: "email" },
      { date: "Feb 14", event: "Sent revised MSA with updated terms", type: "doc" },
      { date: "Feb 12", event: "30-min call with David — technical deep dive", type: "call" },
      { date: "Feb 8", event: "Proposal v2 delivered", type: "doc" },
      { date: "Feb 3", event: "Discovery call with full buying committee", type: "call" },
    ],
  }
};

const MCP_SERVERS = [
  { id: "mcp1", name: "GitHub", icon: "⟐", category: "dev", description: "Repos, PRs, issues, code search" },
  { id: "mcp2", name: "Jira", icon: "◆", category: "pm", description: "Tickets, sprints, backlogs" },
  { id: "mcp3", name: "Actioner CRM", icon: "⬢", category: "crm", color: "#22c55e", description: "Deals, contacts, pipeline" },
  { id: "mcp4", name: "Google Drive", icon: "△", category: "docs", description: "Docs, sheets, slides" },
  { id: "mcp5", name: "Mixpanel", icon: "◉", category: "data", description: "Product analytics, funnels" },
  { id: "mcp6", name: "Web Search", icon: "◎", category: "general", description: "Search the public web" },
  { id: "mcp7", name: "Slack Archive", icon: "▣", category: "comms", description: "Message history, threads" },
  { id: "mcp8", name: "Stripe", icon: "▤", category: "finance", description: "Payments, subscriptions" },
  { id: "mcp9", name: "AWS", icon: "▲", category: "infra", description: "CloudWatch, S3, Lambda" },
  { id: "mcp10", name: "Notion", icon: "▪", category: "docs", description: "Wiki, docs, databases" },
];

const AGENT_MCP_DEFAULTS = {
  a0: ["mcp3", "mcp4", "mcp6", "mcp7"],
  a1: ["mcp3", "mcp5", "mcp6", "mcp4", "mcp7"],
  a2: ["mcp4", "mcp10", "mcp6"],
  a3: ["mcp1", "mcp2", "mcp9"],
};

const AGENT_SESSIONS = {
  a0: [{ id: "s0a", title: "Deal Review", date: "Today", participants: [] }],
  a1: [{ id: "s1", title: "Q3 Market Research", date: "Today", participants: ["h1"] }],
  a2: [{ id: "s4", title: "Blog Post Draft", date: "Today", participants: [] }],
  a3: [{ id: "s6", title: "API Design Review", date: "Today", participants: ["h2"] }],
};

const GENERAL_AGENT = { id: "a0", name: "Nexus", role: "General Assistant", avatar: "✦", color: "#8b5cf6", isGeneral: true };
const AGENTS = [
  { id: "a1", name: "Atlas", role: "Research & Analysis", avatar: "◈", color: "#6366f1" },
  { id: "a2", name: "Muse", role: "Writing & Creative", avatar: "◎", color: "#ec4899" },
  { id: "a3", name: "Forge", role: "Code & Engineering", avatar: "⬡", color: "#f59e0b" },
];
const ALL_AGENTS = [GENERAL_AGENT, ...AGENTS];

const HUMANS = [
  { id: "h1", name: "Sarah Chen", avatar: "SC", status: "online", role: "Sales Lead" },
  { id: "h2", name: "Jake Morrison", avatar: "JM", status: "away", role: "Engineering" },
  { id: "h3", name: "Priya Patel", avatar: "PP", status: "online", role: "Design" },
];

const CHANNELS = [
  { id: "ch1", name: "sales-updates", agents: ["a1"], unread: 3 },
  { id: "ch2", name: "product-design", agents: ["a1", "a3"], unread: 0 },
  { id: "ch3", name: "engineering", agents: ["a3"], unread: 12 },
];

const CHANNEL_MESSAGES = [
  { id: 1, user: "Sarah Chen", avatar: "SC", time: "10:23 AM", text: "I've been thinking about the onboarding flow — we're losing 40% of users before they reach the main dashboard.", isAgent: false },
  { id: 2, user: "Jake Morrison", avatar: "JM", time: "10:25 AM", text: "Yeah, the telemetry confirms that. Biggest drop-off is between account creation and the first meaningful action.", isAgent: false },
  { id: 3, user: "Priya Patel", avatar: "PP", time: "10:28 AM", text: "What if we skip the settings wizard entirely and drop them straight into a guided first task?", isAgent: false },
  { id: 4, user: "Sarah Chen", avatar: "SC", time: "10:30 AM", text: "@Atlas can you pull data on onboarding drop-off patterns from our competitors?", isAgent: false },
  { id: 5, user: "Atlas", avatar: "◈", time: "10:30 AM", text: "Looking at comparable B2B SaaS products:\n\n• Figma reduced drop-off by 35% with \"start with a template\"\n• Linear's progressive disclosure shows 28% better activation\n• Notion saw 42% gains by letting users import existing data\n\nThe pattern: replace configuration with a meaningful first task.", isAgent: true, agentId: "a1" },
  { id: 6, user: "Jake Morrison", avatar: "JM", time: "10:33 AM", text: "That's really useful. The Notion import pattern is interesting — we could let teams import from their existing tools.", isAgent: false },
  { id: 7, user: "Priya Patel", avatar: "PP", time: "10:35 AM", text: "I'll mock up both approaches. Can someone pull the funnel data segmented by team size?", isAgent: false },
];

const PINNED_APPS_DEFAULT = [
  { id: "app1", name: "Deals", icon: "⬢", color: "#22c55e", source: "Actioner CRM" },
];

// ── Small Components ──
const StatusDot = ({ status }) => {
  const c = { online: "#22c55e", away: "#f59e0b", offline: "#6b7280" };
  return <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c[status] || c.offline, border: "1.5px solid #1a1a2e", position: "absolute", bottom: 0, right: 0 }} />;
};

const AgentBadge = ({ size = 12, color }) => (
  <div style={{ width: size, height: size, borderRadius: 3, background: color || "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5, color: "#fff", fontWeight: 700, position: "absolute", bottom: -1, right: -1, border: "1.5px solid #1a1a2e" }}>⚡</div>
);

const TrendIcon = ({ trend }) => {
  if (trend === "up") return <span style={{ color: "#22c55e", fontSize: 14 }}>↗</span>;
  if (trend === "down") return <span style={{ color: "#ef4444", fontSize: 14 }}>↘</span>;
  return <span style={{ color: "#5a5a70", fontSize: 14 }}>→</span>;
};

// ── MCP Config Panel ──
const McpConfigPanel = ({ agent, agentMcps, onToggle, onClose }) => {
  const [search, setSearch] = useState("");
  const filtered = MCP_SERVERS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()));
  const enabled = filtered.filter(s => agentMcps.includes(s.id));
  const disabled = filtered.filter(s => !agentMcps.includes(s.id));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={onClose}>
      <div style={{ width: 520, maxHeight: "80vh", background: "#14141f", border: "1px solid #2a2a44", borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1e1e36" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: agent.isGeneral ? `linear-gradient(135deg, ${agent.color}, #6366f1)` : agent.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: agent.isGeneral ? "#fff" : agent.color }}>{agent.avatar}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 16 }}>{agent.name}</div><div style={{ fontSize: 12, color: "#5a5a70" }}>Capabilities & Connections</div></div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "#1e1e36", color: "#6b6b80", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connections..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #2a2a44", background: "#0f0f1a", color: "#e2e2ee", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px 20px" }}>
          {enabled.length > 0 && (<>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "#22c55e", marginBottom: 8, marginTop: 4 }}>Active · {enabled.length}</div>
            {enabled.map(s => <McpServerRow key={s.id} server={s} active={true} agent={agent} onToggle={() => onToggle(s.id)} />)}
          </>)}
          {disabled.length > 0 && (<>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "#5a5a70", marginBottom: 8, marginTop: 16 }}>Available · {disabled.length}</div>
            {disabled.map(s => <McpServerRow key={s.id} server={s} active={false} agent={agent} onToggle={() => onToggle(s.id)} />)}
          </>)}
        </div>
        <div style={{ padding: "12px 24px", borderTop: "1px solid #1e1e36", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#5a5a70", flex: 1 }}>Workspace connections managed by admins</span>
          <button style={{ padding: "6px 14px", borderRadius: 7, border: "1px dashed #3a3a50", background: "transparent", color: "#6366f1", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>+ Add custom MCP</button>
        </div>
      </div>
    </div>
  );
};

const McpServerRow = ({ server, active, agent, onToggle }) => {
  const [h, setH] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, marginBottom: 4, background: h ? "#1a1a2e" : "transparent" }} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: active ? agent.color + "15" : "#1a1a2e", border: `1px solid ${active ? agent.color + "33" : "#2a2a44"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: active ? agent.color : "#5a5a70" }}>{server.icon}</div>
      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: active ? "#e2e2ee" : "#8888aa" }}>{server.name}</div><div style={{ fontSize: 11, color: "#5a5a70", marginTop: 1 }}>{server.description}</div></div>
      <button onClick={onToggle} style={{ width: 40, height: 22, borderRadius: 11, border: "none", background: active ? agent.color : "#2a2a44", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: active ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
      </button>
    </div>
  );
};

// ── Deals Table (MCP App) ──
const DealsTable = ({ deals, onSelectDeal, compact }) => {
  const [sortBy, setSortBy] = useState("value");
  const [hoverRow, setHoverRow] = useState(null);

  const sorted = [...deals].sort((a, b) => {
    const va = parseInt(a.value.replace(/[$,]/g, "")), vb = parseInt(b.value.replace(/[$,]/g, ""));
    return sortBy === "value" ? vb - va : sortBy === "probability" ? parseInt(b.probability) - parseInt(a.probability) : 0;
  });

  return (
    <div style={{ borderRadius: 12, border: "1px solid #2a2a44", overflow: "hidden", background: "#12121f" }}>
      {/* Table Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #1e1e36", background: "#0f0f1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 14, color: "#22c55e" }}>⬢</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e2ee" }}>Active Deals</span>
          <span style={{ fontSize: 11, color: "#5a5a70", background: "#1e1e36", padding: "1px 8px", borderRadius: 8 }}>{deals.length}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["value", "probability"].map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              padding: "3px 10px", borderRadius: 6, border: "none",
              background: sortBy === s ? "#22c55e18" : "transparent",
              color: sortBy === s ? "#22c55e" : "#5a5a70",
              cursor: "pointer", fontSize: 11, fontWeight: 500, textTransform: "capitalize",
            }}>{s}</button>
          ))}
        </div>
      </div>
      {/* Column Headers */}
      <div style={{ display: "grid", gridTemplateColumns: compact ? "2fr 1fr 1fr 0.5fr" : "2.5fr 1fr 1fr 1fr 1fr 0.5fr", padding: "8px 16px", borderBottom: "1px solid #1a1a2e", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#5a5a70" }}>
        <span>Deal</span><span>Value</span><span>Stage</span>
        {!compact && <><span>Close</span><span>Activity</span></>}
        <span></span>
      </div>
      {/* Rows */}
      {sorted.map(deal => (
        <div key={deal.id}
          onClick={() => onSelectDeal(deal.id)}
          onMouseEnter={() => setHoverRow(deal.id)}
          onMouseLeave={() => setHoverRow(null)}
          style={{
            display: "grid",
            gridTemplateColumns: compact ? "2fr 1fr 1fr 0.5fr" : "2.5fr 1fr 1fr 1fr 1fr 0.5fr",
            padding: "12px 16px", borderBottom: "1px solid #1a1a2e",
            cursor: "pointer", background: hoverRow === deal.id ? "#1a1a2e" : "transparent",
            transition: "background 0.1s",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 24, borderRadius: 2, background: deal.stageColor }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e2ee" }}>{deal.name}</div>
              <div style={{ fontSize: 11, color: "#5a5a70" }}>{deal.probability} probability</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, color: "#e2e2ee" }}>{deal.value}</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: deal.stageColor + "18", color: deal.stageColor, fontWeight: 600 }}>{deal.stage}</span>
          </div>
          {!compact && <>
            <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#9999aa" }}>{deal.close}</div>
            <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#9999aa" }}>{deal.activity}</div>
          </>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendIcon trend={deal.trend} />
          </div>
        </div>
      ))}
      {/* Footer */}
      <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f0f1a" }}>
        <span style={{ fontSize: 11, color: "#5a5a70" }}>Pipeline: <span style={{ color: "#22c55e", fontWeight: 600 }}>$1,163,000</span></span>
        <span style={{ fontSize: 10, color: "#3a3a50" }}>via Actioner CRM</span>
      </div>
    </div>
  );
};

// ── Deal Detail (MCP App) ──
const DealDetailView = ({ dealId, onBack }) => {
  const deal = DEALS.find(d => d.id === dealId);
  const detail = DEAL_DETAIL[dealId];

  if (!deal) return null;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "24px" }}>
      {/* Back + Header */}
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#5a5a70", cursor: "pointer", fontSize: 12, marginBottom: 16, padding: 0 }}>
        ← Back to deals
      </button>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
        <div style={{ width: 3, height: 48, borderRadius: 2, background: deal.stageColor, marginTop: 4 }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e2e2ee" }}>{deal.name}</h2>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#22c55e" }}>{deal.value}</span>
            <span style={{ fontSize: 13, padding: "4px 12px", borderRadius: 8, background: deal.stageColor + "18", color: deal.stageColor, fontWeight: 600, alignSelf: "center" }}>{deal.stage}</span>
            <span style={{ fontSize: 13, color: "#9999aa", alignSelf: "center" }}>{deal.probability} probability</span>
          </div>
        </div>
      </div>

      {detail ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Next Step */}
          <div style={{ gridColumn: "1 / -1", padding: "14px 18px", borderRadius: 10, background: "#1a1a2e", border: "1px solid #2a2a44" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#f59e0b", marginBottom: 6 }}>Next Step</div>
            <div style={{ fontSize: 13, color: "#c4c4d4", lineHeight: 1.5 }}>{detail.nextStep}</div>
          </div>

          {/* Contacts */}
          <div style={{ padding: "14px 18px", borderRadius: 10, background: "#12121f", border: "1px solid #1e1e36" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#5a5a70", marginBottom: 10 }}>Contacts</div>
            {detail.contacts.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < detail.contacts.length - 1 ? "1px solid #1a1a2e" : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#2a2a40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#9999aa" }}>
                  {c.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#e2e2ee" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#5a5a70" }}>{c.role}</div>
                </div>
                <div style={{ fontSize: 10.5, color: "#5a5a70" }}>{c.lastContact}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div style={{ padding: "14px 18px", borderRadius: 10, background: "#12121f", border: "1px solid #1e1e36" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#5a5a70", marginBottom: 10 }}>Activity Timeline</div>
            {detail.timeline.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < detail.timeline.length - 1 ? "1px solid #1a1a2e" : "none" }}>
                <div style={{ width: 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: t.type === "call" ? "#6366f118" : t.type === "email" ? "#22c55e18" : "#f59e0b18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: t.type === "call" ? "#6366f1" : t.type === "email" ? "#22c55e" : "#f59e0b" }}>
                    {t.type === "call" ? "📞" : t.type === "email" ? "✉" : "📄"}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#c4c4d4" }}>{t.event}</div>
                  <div style={{ fontSize: 10.5, color: "#5a5a70", marginTop: 2 }}>{t.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: 24, textAlign: "center", color: "#5a5a70" }}>
          <div style={{ fontSize: 13 }}>Detail view available for Acme Corp deal.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Click on the first deal to see the full detail view.</div>
        </div>
      )}

      <div style={{ marginTop: 16, padding: "8px 0", display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 10, color: "#3a3a50" }}>via Actioner CRM</span>
      </div>
    </div>
  );
};

// ── Side Panel Message with hover toolbar ──
const SidePanelMessage = ({ msg, agent }) => {
  const [h, setH] = useState(false);
  const isA = msg.role === "agent", show = isA && msg.text.length > 40;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", position: "relative" }} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {h && show && (
        <div style={{ position: "absolute", top: -12, right: 4, display: "flex", gap: 1, background: "#1e1e36", border: "1px solid #2a2a44", borderRadius: 7, padding: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.4)", zIndex: 10 }}>
          <button title="Post to channel" style={{ height: 26, borderRadius: 5, border: "none", background: "transparent", cursor: "pointer", fontSize: 11.5, display: "flex", alignItems: "center", justifyContent: "center", color: agent.color, gap: 4, padding: "0 8px", fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.background = agent.color + "18"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>📤 Post</button>
          <div style={{ width: 1, background: "#2a2a44", margin: "4px 1px" }} />
          <button title="Copy" style={{ width: 28, height: 26, borderRadius: 5, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#8888aa" }} onMouseEnter={e => e.currentTarget.style.background = "#2a2a44"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>📋</button>
          <button title="Retry" style={{ width: 28, height: 26, borderRadius: 5, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#8888aa" }} onMouseEnter={e => e.currentTarget.style.background = "#2a2a44"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>↻</button>
        </div>
      )}
      <div style={{ maxWidth: "90%", background: msg.role === "user" ? "#2a2a50" : agent.color + "12", padding: "9px 12px", borderRadius: 10, borderTopRightRadius: msg.role === "user" ? 3 : 10, borderTopLeftRadius: isA ? 3 : 10, border: isA ? `1px solid ${agent.color}18` : "none", ...(h && isA ? { background: agent.color + "18" } : {}) }}>
        <div style={{ color: isA ? "#c4c4d4" : "#d8d8ee", lineHeight: 1.55, fontSize: 12.5, whiteSpace: "pre-wrap" }}>{msg.text}</div>
      </div>
    </div>
  );
};

// ── Channel message with hover toolbar ──
const MessageRow = ({ msg, channelAgents, onAgentClick, allAgents }) => {
  const [hovered, setHovered] = useState(false);
  const agent = msg.isAgent ? allAgents.find(a => a.id === msg.agentId) : null;
  return (
    <div style={{ display: "flex", gap: 12, padding: "8px 8px", borderRadius: 8, background: hovered ? "#161625" : "transparent", position: "relative" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {hovered && (
        <div style={{ position: "absolute", top: -14, right: 8, display: "flex", gap: 1, background: "#1e1e36", border: "1px solid #2a2a44", borderRadius: 8, padding: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.4)", zIndex: 10 }}>
          {["😀","💬","↗","🔖"].map(icon => (
            <button key={icon} style={{ width: 30, height: 28, borderRadius: 5, border: "none", background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#8888aa" }} onMouseEnter={e => e.currentTarget.style.background = "#2a2a44"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{icon}</button>
          ))}
          {channelAgents.length > 0 && (<><div style={{ width: 1, background: "#2a2a44", margin: "4px 2px" }} />{channelAgents.map(a => (<button key={a.id} onClick={() => onAgentClick(a)} style={{ width: 30, height: 28, borderRadius: 5, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: a.color }} onMouseEnter={e => e.currentTarget.style.background = a.color + "18"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{a.avatar}</button>))}</>)}
          <button style={{ width: 30, height: 28, borderRadius: 5, border: "none", background: "transparent", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#8888aa" }} onMouseEnter={e => e.currentTarget.style.background = "#2a2a44"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>⋯</button>
        </div>
      )}
      {msg.isAgent ? (
        <div style={{ width: 34, height: 34, borderRadius: 8, background: agent ? agent.color + "22" : "#2a2a40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: agent?.color, flexShrink: 0, marginTop: 2, position: "relative" }}>{msg.avatar}<AgentBadge size={12} color={agent?.color} /></div>
      ) : (
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#2a2a40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#9999aa", flexShrink: 0, marginTop: 2 }}>{msg.avatar}</div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: 13.5, color: msg.isAgent ? agent?.color : undefined }}>{msg.user}</span>
          {msg.isAgent && <span style={{ fontSize: 9.5, padding: "1px 5px", borderRadius: 4, background: agent?.color + "18", color: agent?.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>AI</span>}
          <span style={{ fontSize: 11, color: "#5a5a70" }}>{msg.time}</span>
        </div>
        <div style={{ color: "#c4c4d4", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{msg.text}</div>
      </div>
    </div>
  );
};

// ── Main App ──
export default function App() {
  const [activeView, setActiveView] = useState({ type: "agent-dm", id: "a0" });
  const [sidebarSection, setSidebarSection] = useState("agents");
  const [pinnedApps, setPinnedApps] = useState(PINNED_APPS_DEFAULT);
  const [appView, setAppView] = useState(null); // null | { app: "deals" } | { app: "deal-detail", dealId }
  const [mainInput, setMainInput] = useState("");
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelAgent, setSidePanelAgent] = useState(AGENTS[0]);
  const [sidePanelMessages, setSidePanelMessages] = useState([]);
  const [sidePanelInput, setSidePanelInput] = useState("");
  const [mcpConfigOpen, setMcpConfigOpen] = useState(false);
  const [agentMcpOverrides, setAgentMcpOverrides] = useState({});
  const [invitePickerOpen, setInvitePickerOpen] = useState(false);
  const [sessionParticipants, setSessionParticipants] = useState(["h2"]);
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);
  const [activeSession, setActiveSession] = useState("s0a");

  // Chat messages for agent DM - starts with a workflow demo
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: "user", sender: "You", text: "What are my active deals?" },
    { id: 2, role: "agent", text: "Here are your active deals from Actioner CRM:", mcpApp: "deals-table" },
    { id: 3, role: "system-hint", text: "💡 Tip: You can pin the Deals app to your sidebar for quick access." },
  ]);

  const [showPinToast, setShowPinToast] = useState(false);
  const [selectedDealInChat, setSelectedDealInChat] = useState(null);
  const messagesEndRef = useRef(null);

  const activeAgent = ALL_AGENTS.find(a => a.id === activeView.id);
  const activeChannel = CHANNELS.find(c => c.id === activeView.id);
  const channelAgents = activeChannel ? ALL_AGENTS.filter(a => activeChannel.agents.includes(a.id)) : [];

  const isAgentDM = activeView.type === "agent-dm";
  const isChannel = activeView.type === "channel";
  const isHumanDM = activeView.type === "human-dm";
  const isApp = activeView.type === "app";

  const handleSend = () => {
    if (!mainInput.trim()) return;
    const text = mainInput;
    setMainInput("");
    setChatMessages(prev => [...prev, { id: Date.now(), role: "user", sender: "You", text }]);

    setTimeout(() => {
      if (text.toLowerCase().includes("deal") && (text.toLowerCase().includes("active") || text.toLowerCase().includes("show") || text.toLowerCase().includes("list") || text.toLowerCase().includes("what"))) {
        setChatMessages(prev => [...prev, { id: Date.now(), role: "agent", text: "Here are your active deals from Actioner CRM:", mcpApp: "deals-table" }]);
      } else if (text.toLowerCase().includes("acme") || text.toLowerCase().includes("detail")) {
        setChatMessages(prev => [...prev, { id: Date.now(), role: "agent", text: "Here's the detail on the Acme Corp deal:", mcpApp: "deal-detail-d1" }]);
      } else if (text.toLowerCase().includes("powerpoint") || text.toLowerCase().includes("presentation") || text.toLowerCase().includes("slide")) {
        setChatMessages(prev => [...prev, {
          id: Date.now(), role: "agent",
          text: "I'll create a deal review presentation. Let me pull the data from Actioner and generate slides:\n\n✅ Fetched 5 active deals from Actioner CRM\n✅ Generated pipeline summary slide\n✅ Generated per-deal status slides\n✅ Created 12-page PPTX\n\nHere's your presentation — ready to share.",
          attachment: { type: "file", name: "Deal_Review_Q1_2026.pptx", size: "2.4 MB" },
          actions: ["📤 Post to #sales-updates", "📋 Copy link", "📎 Attach to Acme deal"],
        }]);
      } else if (text.toLowerCase().includes("post") || text.toLowerCase().includes("share") || text.toLowerCase().includes("channel")) {
        setChatMessages(prev => [...prev, {
          id: Date.now(), role: "agent",
          text: "Done! I've posted the deal review to #sales-updates with a summary message:\n\n\"Q1 pipeline review — 5 active deals worth $1.16M. Acme Corp ($420K) and CloudBase ($310K) are in negotiation. Full deck attached.\"\n\nSarah and the team will see it in the channel.",
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          id: Date.now(), role: "agent",
          text: "I can help with that. I have access to Actioner CRM, Google Drive, and other connected tools. Try asking about your deals, creating presentations, or sharing updates to channels.",
        }]);
      }
    }, 800);
  };

  const handleDealSelectInChat = (dealId) => {
    setSelectedDealInChat(dealId);
    setChatMessages(prev => [...prev,
      { id: Date.now(), role: "user", sender: "You", text: `Tell me more about ${DEALS.find(d => d.id === dealId)?.name}` },
      { id: Date.now() + 1, role: "agent", text: `Here's the detail on ${DEALS.find(d => d.id === dealId)?.name}:`, mcpApp: `deal-detail-${dealId}` },
    ]);
  };

  const handlePinApp = (appId, name, icon, color, source) => {
    if (!pinnedApps.find(a => a.id === appId)) {
      setPinnedApps(prev => [...prev, { id: appId, name, icon, color, source }]);
      setShowPinToast(true);
      setTimeout(() => setShowPinToast(false), 2000);
    }
  };

  const openSidePanel = (agent) => {
    setSidePanelAgent(agent);
    setSidePanelOpen(true);
    setSidePanelMessages([{ id: 1, role: "agent", text: `Watching this conversation with you. Ask me anything or I can help draft a response.` }]);
  };

  const sendSidePanelMessage = () => {
    if (!sidePanelInput.trim()) return;
    setSidePanelMessages(prev => [...prev, { id: Date.now(), role: "user", text: sidePanelInput }]);
    const input = sidePanelInput;
    setSidePanelInput("");
    setTimeout(() => {
      setSidePanelMessages(prev => [...prev, { id: Date.now(), role: "agent", text: "Based on the context, I can help you analyze, draft, or take action. What would you like to do?" }]);
    }, 600);
  };

  const getAgentMcps = (agentId) => agentMcpOverrides[agentId] || AGENT_MCP_DEFAULTS[agentId] || [];

  const toggleMcp = (serverId) => {
    if (!activeAgent) return;
    const current = getAgentMcps(activeAgent.id);
    const next = current.includes(serverId) ? current.filter(id => id !== serverId) : [...current, serverId];
    setAgentMcpOverrides(prev => ({ ...prev, [activeAgent.id]: next }));
  };

  const addParticipant = (humanId) => {
    if (!sessionParticipants.includes(humanId)) {
      setSessionParticipants(prev => [...prev, humanId]);
      const human = HUMANS.find(h => h.id === humanId);
      setChatMessages(prev => [...prev, { id: Date.now(), role: "system-join", text: `${human.name} joined this session` }]);
    }
    setInvitePickerOpen(false);
  };

  const currentParticipants = sessionParticipants.map(id => HUMANS.find(h => h.id === id)).filter(Boolean);
  const availableToInvite = HUMANS.filter(h => !sessionParticipants.includes(h.id));

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", background: "#0f0f1a", color: "#e2e2ee", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", fontSize: 13.5, overflow: "hidden" }}>

      {/* Pin Toast */}
      {showPinToast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#fff", padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 300, boxShadow: "0 8px 32px rgba(34,197,94,0.3)" }}>
          ✓ App pinned to sidebar
        </div>
      )}

      {/* MCP Config Modal */}
      {mcpConfigOpen && activeAgent && (
        <McpConfigPanel agent={activeAgent} agentMcps={getAgentMcps(activeAgent.id)} onToggle={toggleMcp} onClose={() => setMcpConfigOpen(false)} />
      )}

      {/* Activity Bar */}
      <div style={{ width: 56, background: "#0a0a14", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 4, borderRight: "1px solid #1a1a2e", flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 8 }}>N</div>

        {[
          { icon: "💬", section: "channels", label: "Chat", defaultView: { type: "channel", id: "ch1" } },
          { icon: "👤", section: "people", label: "People", defaultView: { type: "human-dm", id: "h1" } },
          { icon: "◈", section: "agents", label: "Agents", defaultView: { type: "agent-dm", id: "a0" } },
        ].map(item => (
          <button key={item.section} onClick={() => { setSidebarSection(item.section); setAppView(null); setInvitePickerOpen(false); setSessionPickerOpen(false); if (isApp) setActiveView(item.defaultView); }} style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: sidebarSection === item.section && !isApp ? "#1e1e36" : "transparent", color: sidebarSection === item.section && !isApp ? "#e2e2ee" : "#6b6b80", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={item.label}>{item.icon}</button>
        ))}

        {/* Pinned Apps Divider */}
        {pinnedApps.length > 0 && (
          <>
            <div style={{ width: 24, height: 1, background: "#1e1e36", margin: "4px 0" }} />
            {pinnedApps.map(app => (
              <button key={app.id} onClick={() => { setActiveView({ type: "app", id: app.id }); setAppView({ app: "deals" }); }} title={app.name} style={{
                width: 40, height: 40, borderRadius: 10, border: "none",
                background: isApp && activeView.id === app.id ? app.color + "22" : "transparent",
                color: isApp && activeView.id === app.id ? app.color : "#6b6b80",
                fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>{app.icon}</button>
            ))}
          </>
        )}
      </div>

      {/* Sidebar */}
      <div style={{ width: 232, background: "#12121f", borderRight: "1px solid #1a1a2e", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 16px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: "#5a5a70" }}>
          {isApp ? "Deals" : sidebarSection === "channels" ? "Channels" : sidebarSection === "people" ? "Direct Messages" : "AI Agents"}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
          {isApp && (
            <>
              {["All Deals", "My Deals", "Closing This Month", "At Risk"].map((view, i) => (
                <button key={view} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "none", background: i === 0 ? "#22c55e12" : "transparent", color: i === 0 ? "#22c55e" : "#9999aa", cursor: "pointer", fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: i === 0 ? "#22c55e" : "#5a5a70" }}>{["📊","👤","📅","⚠"][i]}</span>
                  {view}
                </button>
              ))}
              <div style={{ height: 1, background: "#1e1e36", margin: "8px 4px" }} />
              <div style={{ padding: "4px 10px 6px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#3a3a50" }}>Stages</div>
              {["Discovery", "Qualification", "Proposal", "Negotiation", "Closed Won"].map((stage, i) => (
                <button key={stage} style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "none", background: "transparent", color: "#7777aa", cursor: "pointer", fontSize: 12.5, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: ["#8b5cf6","#ec4899","#6366f1","#f59e0b","#22c55e"][i] }} />
                  {stage}
                </button>
              ))}
            </>
          )}

          {!isApp && sidebarSection === "channels" && CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => { setActiveView({ type: "channel", id: ch.id }); setAppView(null); setSidePanelOpen(false); setInvitePickerOpen(false); setSessionPickerOpen(false); }} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "none", background: activeView.id === ch.id ? "#1e1e36" : "transparent", color: activeView.id === ch.id ? "#fff" : "#9999aa", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, textAlign: "left" }}>
              <span style={{ color: "#5a5a70" }}>#</span><span style={{ flex: 1 }}>{ch.name}</span>
              {ch.unread > 0 && <span style={{ background: "#6366f1", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>{ch.unread}</span>}
            </button>
          ))}

          {!isApp && sidebarSection === "people" && HUMANS.map(h => (
            <button key={h.id} onClick={() => { setActiveView({ type: "human-dm", id: h.id }); setAppView(null); setSidePanelOpen(false); setInvitePickerOpen(false); setSessionPickerOpen(false); }} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "none", background: activeView.id === h.id ? "#1e1e36" : "transparent", color: activeView.id === h.id ? "#fff" : "#9999aa", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, textAlign: "left" }}>
              <div style={{ position: "relative", width: 28, height: 28 }}><div style={{ width: 28, height: 28, borderRadius: 7, background: "#2a2a40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#9999aa" }}>{h.avatar}</div><StatusDot status={h.status} /></div>
              <div><div style={{ fontSize: 13 }}>{h.name}</div><div style={{ fontSize: 10.5, color: "#5a5a70" }}>{h.role}</div></div>
            </button>
          ))}

          {!isApp && sidebarSection === "agents" && (<>
            <button onClick={() => { setActiveView({ type: "agent-dm", id: "a0" }); setAppView(null); setSidePanelOpen(false); setInvitePickerOpen(false); setSessionPickerOpen(false); }} style={{ width: "100%", padding: "10px 10px", borderRadius: 8, border: "none", background: activeView.id === "a0" ? "#1e1e36" : GENERAL_AGENT.color + "08", color: activeView.id === "a0" ? "#fff" : "#c4c4d4", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, textAlign: "left", marginBottom: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${GENERAL_AGENT.color}, #6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>{GENERAL_AGENT.avatar}</div>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{GENERAL_AGENT.name}</div><div style={{ fontSize: 10.5, color: "#5a5a70" }}>{GENERAL_AGENT.role}</div></div>
            </button>
            <div style={{ height: 1, background: "#1e1e30", margin: "0 4px 8px" }} />
            <div style={{ padding: "4px 10px 6px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#3a3a50" }}>Specialists</div>
            {AGENTS.map(a => (
              <button key={a.id} onClick={() => { setActiveView({ type: "agent-dm", id: a.id }); setAppView(null); setSidePanelOpen(false); setInvitePickerOpen(false); setSessionPickerOpen(false); }} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "none", background: activeView.id === a.id ? "#1e1e36" : "transparent", color: activeView.id === a.id ? "#fff" : "#9999aa", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, textAlign: "left" }}>
                <div style={{ position: "relative", width: 28, height: 28 }}><div style={{ width: 28, height: 28, borderRadius: 7, background: a.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: a.color }}>{a.avatar}</div><AgentBadge size={12} color={a.color} /></div>
                <div><div style={{ fontSize: 13 }}>{a.name}</div><div style={{ fontSize: 10.5, color: "#5a5a70" }}>{a.role}</div></div>
              </button>
            ))}
          </>)}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div style={{ minHeight: 52, borderBottom: "1px solid #1a1a2e", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, background: "#0f0f1a" }}>
          {isApp && (
            <>
              <span style={{ fontSize: 18, color: "#22c55e" }}>⬢</span>
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>Deals</span>
              <span style={{ fontSize: 11, color: "#5a5a70", background: "#1e1e36", padding: "2px 8px", borderRadius: 6 }}>Actioner CRM</span>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#5a5a70" }}>Ask AI:</span>
                {[GENERAL_AGENT, AGENTS[0]].map(a => (
                  <button key={a.id} onClick={() => { setActiveView({ type: "agent-dm", id: a.id }); setAppView(null); setSidebarSection("agents"); }} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid " + a.color + "33", background: "transparent", color: a.color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{a.avatar}</button>
                ))}
              </div>
            </>
          )}
          {isAgentDM && activeAgent && (<>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: activeAgent.isGeneral ? `linear-gradient(135deg, ${activeAgent.color}, #6366f1)` : activeAgent.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: activeAgent.isGeneral ? "#fff" : activeAgent.color, position: "relative" }}>
              {activeAgent.avatar}
              {!activeAgent.isGeneral && <AgentBadge size={13} color={activeAgent.color} />}
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>{activeAgent.name}</span>
              <span style={{ color: "#5a5a70", fontSize: 12, marginLeft: 8 }}>{activeAgent.role}</span>
            </div>

            {/* MCP Connection Pills + Config */}
            <div style={{ marginLeft: 8, paddingLeft: 12, borderLeft: "1px solid #1e1e36", display: "flex", gap: 3, alignItems: "center" }}>
              {getAgentMcps(activeAgent.id).slice(0, 4).map(mcpId => {
                const s = MCP_SERVERS.find(m => m.id === mcpId);
                return s ? <div key={s.id} title={s.name} style={{ width: 24, height: 24, borderRadius: 6, background: (s.color || activeAgent.color) + "12", border: `1px solid ${(s.color || activeAgent.color) + "28"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: s.color || activeAgent.color }}>{s.icon}</div> : null;
              })}
              {getAgentMcps(activeAgent.id).length > 4 && <div style={{ fontSize: 11, color: "#5a5a70", marginLeft: 2 }}>+{getAgentMcps(activeAgent.id).length - 4}</div>}
              <button onClick={() => setMcpConfigOpen(true)} title="Manage connections" style={{ width: 24, height: 24, borderRadius: 6, border: "1px dashed #3a3a50", background: "transparent", color: "#5a5a70", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2 }}>⚙</button>
            </div>

            {/* Participants + Invite */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8, paddingLeft: 12, borderLeft: "1px solid #1e1e36" }}>
              {currentParticipants.map((p, i) => (
                <div key={p.id} title={p.name} style={{ width: 24, height: 24, borderRadius: 6, background: "#2a2a40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "#9999aa", border: "2px solid #0f0f1a", marginLeft: i > 0 ? -6 : 0, zIndex: currentParticipants.length - i }}>{p.avatar}</div>
              ))}
              <div style={{ position: "relative" }}>
                <button onClick={() => setInvitePickerOpen(!invitePickerOpen)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px dashed #3a3a50", background: "transparent", color: "#5a5a70", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }} title="Invite to session">+</button>
                {invitePickerOpen && (
                  <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, background: "#1a1a2e", border: "1px solid #2a2a40", borderRadius: 10, padding: 6, minWidth: 200, zIndex: 100, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                    <div style={{ padding: "4px 8px 8px", fontSize: 11, color: "#5a5a70", fontWeight: 600 }}>Invite to session</div>
                    {availableToInvite.map(h => (
                      <button key={h.id} onClick={() => addParticipant(h.id)} style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: "none", background: "transparent", color: "#c4c4d4", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, textAlign: "left" }} onMouseEnter={e => e.currentTarget.style.background = "#2a2a44"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ width: 22, height: 22, borderRadius: 5, background: "#2a2a40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "#9999aa" }}>{h.avatar}</div>
                        <span style={{ flex: 1 }}>{h.name}</span>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.status === "online" ? "#22c55e" : h.status === "away" ? "#f59e0b" : "#6b7280" }} />
                      </button>
                    ))}
                    {availableToInvite.length === 0 && <div style={{ padding: 8, fontSize: 11, color: "#5a5a70", textAlign: "center" }}>Everyone's here</div>}
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1 }} />

            {/* Session Picker */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setSessionPickerOpen(!sessionPickerOpen)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #2a2a40", background: sessionPickerOpen ? "#1e1e36" : "#161625", color: "#9999aa", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: activeAgent.color }}>●</span>
                {AGENT_SESSIONS[activeAgent.id]?.[0]?.title || "Session"}
                <span style={{ fontSize: 10, marginLeft: 4 }}>▾</span>
              </button>
              {sessionPickerOpen && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#1a1a2e", border: "1px solid #2a2a40", borderRadius: 10, padding: 6, minWidth: 240, zIndex: 100, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                  <button style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px dashed #3a3a50", background: "transparent", color: activeAgent.color, cursor: "pointer", fontSize: 12, marginBottom: 4, textAlign: "left" }}>+ New Session</button>
                  {AGENT_SESSIONS[activeAgent.id]?.map(s => (
                    <button key={s.id} onClick={() => setSessionPickerOpen(false)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "none", background: "#2a2a44", color: "#fff", cursor: "pointer", fontSize: 12, textAlign: "left", display: "flex", justifyContent: "space-between" }}>
                      <span>{s.title}</span><span style={{ color: "#5a5a70", fontSize: 11 }}>{s.date}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>)}
          {isChannel && (<>
            <span style={{ color: "#5a5a70", fontSize: 16 }}>#</span>
            <span style={{ fontWeight: 600, fontSize: 14.5 }}>{activeChannel?.name}</span>
            <div style={{ flex: 1 }} />
            {channelAgents.length > 0 && <div style={{ display: "flex", gap: 4 }}>{channelAgents.map(a => (<button key={a.id} onClick={() => openSidePanel(a)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid " + a.color + "44", background: "transparent", color: a.color, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500 }}><span style={{ fontSize: 13 }}>{a.avatar}</span>{a.name}</button>))}</div>}
          </>)}
          {isHumanDM && (<>
            <div style={{ position: "relative", width: 30, height: 30 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: "#2a2a40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#9999aa" }}>{HUMANS.find(h=>h.id===activeView.id)?.avatar}</div></div>
            <span style={{ fontWeight: 600 }}>{HUMANS.find(h=>h.id===activeView.id)?.name}</span>
            <div style={{ flex: 1 }} />
          </>)}
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Main Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* App View */}
            {isApp && (
              <div style={{ flex: 1, overflowY: "auto" }}>
                {appView?.app === "deals" && (
                  <div style={{ padding: 24 }}>
                    <DealsTable deals={DEALS} onSelectDeal={(id) => setAppView({ app: "deal-detail", dealId: id })} compact={false} />
                  </div>
                )}
                {appView?.app === "deal-detail" && (
                  <DealDetailView dealId={appView.dealId} onBack={() => setAppView({ app: "deals" })} />
                )}
              </div>
            )}

            {/* Chat View */}
            {!isApp && (
              <>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
                  {isAgentDM && chatMessages.map(msg => {
                    if (msg.role === "system-hint") {
                      return (
                        <div key={msg.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", margin: "4px 0", borderRadius: 8, background: "#22c55e08", border: "1px solid #22c55e18" }}>
                          <span style={{ fontSize: 12, color: "#22c55e", flex: 1 }}>{msg.text}</span>
                          <button onClick={() => handlePinApp("app1", "Deals", "⬢", "#22c55e", "Actioner CRM")} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Pin Deals</button>
                        </div>
                      );
                    }
                    if (msg.role === "system-join") {
                      return (
                        <div key={msg.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px" }}>
                          <div style={{ flex: 1, height: 1, background: "#1e1e36" }} />
                          <span style={{ padding: "3px 10px", borderRadius: 10, background: "#1a1a2e", border: "1px solid #2a2a40", whiteSpace: "nowrap", fontSize: 11.5, color: "#5a5a70" }}>👤 {msg.text}</span>
                          <div style={{ flex: 1, height: 1, background: "#1e1e36" }} />
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} style={{ display: "flex", gap: 12, padding: "8px 8px", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                        {msg.role === "agent" && activeAgent && (
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: activeAgent.isGeneral ? `linear-gradient(135deg, ${activeAgent.color}, #6366f1)` : activeAgent.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: activeAgent.isGeneral ? "#fff" : activeAgent.color, flexShrink: 0, marginTop: 2 }}>{activeAgent.avatar}</div>
                        )}
                        <div style={{ maxWidth: msg.mcpApp ? "100%" : "70%", display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", flex: msg.mcpApp ? 1 : undefined }}>
                          <div style={{ background: msg.role === "user" ? "#2a2a50" : "#161625", padding: "10px 14px", borderRadius: 12, borderTopRightRadius: msg.role === "user" ? 4 : 12, borderTopLeftRadius: msg.role === "agent" ? 4 : 12, width: msg.mcpApp ? "100%" : undefined }}>
                            <div style={{ color: "#c4c4d4", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: msg.mcpApp ? 12 : 0 }}>{msg.text}</div>

                            {/* MCP App: Deals Table */}
                            {msg.mcpApp === "deals-table" && (
                              <DealsTable deals={DEALS} onSelectDeal={handleDealSelectInChat} compact={true} />
                            )}

                            {/* MCP App: Deal Detail inline */}
                            {msg.mcpApp?.startsWith("deal-detail-") && (
                              <div style={{ marginTop: 4 }}>
                                {(() => {
                                  const did = msg.mcpApp.replace("deal-detail-", "");
                                  const deal = DEALS.find(d => d.id === did);
                                  const detail = DEAL_DETAIL[did];
                                  if (!deal) return <div style={{ color: "#5a5a70", fontSize: 12 }}>Deal detail not available in demo for this deal.</div>;
                                  return (
                                    <div style={{ borderRadius: 10, border: "1px solid #2a2a44", overflow: "hidden", background: "#12121f" }}>
                                      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e1e36" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                          <div style={{ width: 3, height: 32, borderRadius: 2, background: deal.stageColor }} />
                                          <div>
                                            <div style={{ fontSize: 14, fontWeight: 700 }}>{deal.name}</div>
                                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                              <span style={{ fontSize: 16, fontWeight: 700, color: "#22c55e" }}>{deal.value}</span>
                                              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: deal.stageColor + "18", color: deal.stageColor, fontWeight: 600, alignSelf: "center" }}>{deal.stage}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      {detail && (
                                        <>
                                          <div style={{ padding: "10px 16px", borderBottom: "1px solid #1a1a2e" }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#f59e0b", marginBottom: 4 }}>Next Step</div>
                                            <div style={{ fontSize: 12, color: "#c4c4d4" }}>{detail.nextStep}</div>
                                          </div>
                                          <div style={{ padding: "10px 16px" }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#5a5a70", marginBottom: 6 }}>Contacts</div>
                                            <div style={{ display: "flex", gap: 8 }}>
                                              {detail.contacts.map((c, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "#1a1a2e" }}>
                                                  <div style={{ width: 20, height: 20, borderRadius: 5, background: "#2a2a40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#8888aa" }}>{c.name.split(" ").map(n => n[0]).join("")}</div>
                                                  <div><div style={{ fontSize: 11, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 9.5, color: "#5a5a70" }}>{c.role}</div></div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </>
                                      )}
                                      <div style={{ padding: "6px 16px", background: "#0f0f1a", display: "flex", justifyContent: "space-between" }}>
                                        <button onClick={() => { setActiveView({ type: "app", id: "app1" }); setAppView({ app: "deal-detail", dealId: did }); }} style={{ fontSize: 11, color: "#22c55e", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Open full view →</button>
                                        <span style={{ fontSize: 10, color: "#3a3a50" }}>via Actioner CRM</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* File attachment */}
                            {msg.attachment && (
                              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: "#0f0f1a", border: "1px solid #2a2a44", marginTop: 8 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f59e0b18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#f59e0b" }}>📊</div>
                                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{msg.attachment.name}</div><div style={{ fontSize: 11, color: "#5a5a70" }}>{msg.attachment.size}</div></div>
                                <button style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #2a2a40", background: "transparent", color: "#9999aa", cursor: "pointer", fontSize: 11 }}>↓ Download</button>
                              </div>
                            )}

                            {/* Action buttons */}
                            {msg.actions && (
                              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                                {msg.actions.map(action => (
                                  <button key={action} onClick={() => { if (action.includes("Post")) { setMainInput("Post the deck to #sales-updates"); setTimeout(handleSend, 100); }}} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #2a2a40", background: action.includes("Post") ? "#6366f118" : "transparent", color: action.includes("Post") ? "#6366f1" : "#9999aa", cursor: "pointer", fontSize: 11.5, fontWeight: 500 }}>{action}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isChannel && CHANNEL_MESSAGES.map(msg => (
                    <MessageRow key={msg.id} msg={msg} channelAgents={channelAgents} onAgentClick={openSidePanel} allAgents={ALL_AGENTS} />
                  ))}

                  {isHumanDM && (
                    <div style={{ padding: 40, textAlign: "center", color: "#3a3a50" }}>
                      <div style={{ fontSize: 14 }}>Direct messages would appear here</div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Compose */}
                <div style={{ padding: "12px 24px 16px", borderTop: "1px solid #1a1a2e", flexShrink: 0 }}>
                  <div style={{ background: "#161625", borderRadius: 12, border: "1px solid #2a2a40", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <input value={mainInput} onChange={e => setMainInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSend(); }} placeholder={isAgentDM ? `Message ${activeAgent?.name}... Try "create a presentation from my deals"` : isChannel ? `Message #${activeChannel?.name}` : "Message..."} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e2e2ee", fontSize: 13.5, fontFamily: "inherit" }} />
                    {isChannel && channelAgents.length > 0 && <div style={{ display: "flex", gap: 3, borderLeft: "1px solid #2a2a40", paddingLeft: 10 }}>{channelAgents.map(a => (<button key={a.id} onClick={() => openSidePanel(a)} title={`Ask ${a.name}`} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: a.color + "18", color: a.color, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.avatar}</button>))}</div>}
                    <button onClick={handleSend} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: activeAgent?.color || "#6366f1", color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Side Panel */}
          {sidePanelOpen && (
            <div style={{ width: 340, borderLeft: "1px solid #1a1a2e", background: "#0d0d18", display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <div style={{ height: 52, borderBottom: "1px solid #1a1a2e", display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: sidePanelAgent.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: sidePanelAgent.color }}>{sidePanelAgent.avatar}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{sidePanelAgent.name}</div><div style={{ fontSize: 10.5, color: "#5a5a70" }}>Copilot</div></div>
                <button onClick={() => setSidePanelOpen(false)} style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "#1e1e36", color: "#6b6b80", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
                {sidePanelMessages.map(msg => <SidePanelMessage key={msg.id} msg={msg} agent={sidePanelAgent} />)}
              </div>
              <div style={{ padding: "10px 14px 14px", borderTop: "1px solid #1a1a2e" }}>
                <div style={{ background: "#131320", borderRadius: 10, border: "1px solid #2a2a40", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <input value={sidePanelInput} onChange={e => setSidePanelInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendSidePanelMessage()} placeholder={`Ask ${sidePanelAgent.name}...`} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e2e2ee", fontSize: 12.5, fontFamily: "inherit" }} />
                  <button onClick={sendSidePanelMessage} style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: sidePanelAgent.color, color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

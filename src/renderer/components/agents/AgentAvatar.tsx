interface AgentAvatarProps {
  agent: {
    avatar: string;
    color: string;
    isGeneral?: boolean;
    name?: string;
  };
  size?: number;
  showBadge?: boolean;
}

export default function AgentAvatar({ agent, size = 28, showBadge = true }: AgentAvatarProps) {
  const badgeSize = Math.round(size * 0.43);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: size,
          height: size,
          background: agent.isGeneral
            ? `linear-gradient(135deg, ${agent.color}, #6366f1)`
            : `${agent.color}18`,
          fontSize: size * 0.5,
          color: agent.isGeneral ? '#fff' : agent.color,
        }}
      >
        {agent.avatar}
      </div>
      {showBadge && (
        <div
          className="absolute flex items-center justify-center font-bold text-white"
          style={{
            width: badgeSize,
            height: badgeSize,
            borderRadius: 3,
            background: agent.color,
            fontSize: badgeSize * 0.5,
            bottom: -1,
            right: -1,
            border: '1.5px solid var(--color-bg-main)',
          }}
        >
          ⚡
        </div>
      )}
    </div>
  );
}

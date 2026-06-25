import { useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { PixelgramPost } from '../engine/types';

// ─────────────────────────────────────────────
//  Pixelgram — the social network of the Pixels
// ─────────────────────────────────────────────

/** Render post content with highlighted #hashtags and @mentions */
function PostContent({ text }: { text: string }): JSX.Element {
  const parts = text.split(/(\s+)/);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          return <span key={i} style={{ color: '#ffb000' }}>{part}</span>;
        }
        if (part.startsWith('@')) {
          return <span key={i} style={{ color: '#4488ff' }}>{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function PostCard({ post }: { post: PixelgramPost }): JSX.Element {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderBottom: '1px solid #0f1f0f',
        display: 'flex',
        gap: 8,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          backgroundColor: post.authorColor + '22',
          border: `1px solid ${post.authorColor}55`,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: post.authorColor,
          flexShrink: 0,
          fontFamily: 'monospace',
        }}
      >
        {post.authorAvatar}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
          <span
            style={{
              color: post.authorColor,
              fontSize: 11,
              fontWeight: 'bold',
              letterSpacing: 0.3,
            }}
          >
            {post.authorName}
          </span>
          <span style={{ color: '#2a4a2a', fontSize: 10 }}>
            @{post.authorHandle}
          </span>
          <span style={{ color: '#1a2a1a', fontSize: 9, marginLeft: 'auto', flexShrink: 0 }}>
            Año {post.year}, M{String(post.month).padStart(2, '0')}
          </span>
        </div>

        {/* Content */}
        <div
          style={{
            color: '#b0c8b0',
            fontSize: 11,
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}
        >
          <PostContent text={post.content} />
        </div>

        {/* Footer: engagement */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 4,
            color: '#2a4a2a',
            fontSize: 9,
          }}
        >
          <span>♥ {post.likes}</span>
          <span>↺ {post.reposts}</span>
        </div>
      </div>
    </div>
  );
}

export function Pixelgram(): JSX.Element {
  const { state } = useGameStore();
  const topRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);

  // Scroll to top when new posts arrive
  useEffect(() => {
    if (state.pixelgramPosts.length !== prevCount.current) {
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
      prevCount.current = state.pixelgramPosts.length;
    }
  }, [state.pixelgramPosts.length]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#050f05',
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '5px 10px',
          borderBottom: '1px solid #0f2a0f',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          backgroundColor: '#070f07',
        }}
      >
        <span style={{ color: '#00ff41', fontSize: 13, letterSpacing: 1 }}>◆</span>
        <span style={{ color: '#00ff41', fontSize: 11, fontWeight: 'bold', letterSpacing: 2 }}>
          PIXELGRAM
        </span>
        <span style={{ color: '#1a3a1a', fontSize: 9 }}>red social de los pixels</span>
        <span
          style={{
            marginLeft: 'auto',
            color: '#1a4a1a',
            fontSize: 9,
          }}
        >
          {state.pixelgramPosts.length} posts · {state.population} pixels
        </span>
      </div>

      {/* Feed — newest first (already ordered newest-first in state) */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div ref={topRef} />
        {state.pixelgramPosts.length === 0 ? (
          <div
            style={{
              padding: 20,
              color: '#1a3a1a',
              fontSize: 11,
              textAlign: 'center',
              lineHeight: 2,
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>◆</div>
            <div>Pixelgram arranca cuando la simulación comienza.</div>
            <div style={{ color: '#111' }}>Los pixels postearán pronto...</div>
          </div>
        ) : (
          state.pixelgramPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Users, Server, Settings, Cpu } from 'lucide-react';
import UsersManagementTab from './UsersManagementTab';
import EnvironmentsManagementTab from './EnvironmentsManagementTab';
import AiGatewayManagementTab from './AiGatewayManagementTab';

export default function AdminTab({ defaultSubTab = 'users', pendingUsersCount = 0, onEnvironmentChanged }) {
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner / Corporate Admin Header */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(90deg, rgba(0, 102, 255, 0.06) 0%, rgba(7, 10, 18, 0.3) 100%)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 102, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <Settings size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Área Administrativa & Governança
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Gestão de usuários, instâncias de banco MongoDB e Gateway Corporativo de Inteligência Artificial (AXET / Okta).
            </p>
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            padding: '0.3rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border)',
            gap: '0.3rem',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => setActiveSubTab('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeSubTab === 'users' ? 'var(--primary)' : 'transparent',
              color: activeSubTab === 'users' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Users size={15} />
            Gestão de Usuários
            {pendingUsersCount > 0 && (
              <span
                style={{
                  background: activeSubTab === 'users' ? '#ffffff' : 'var(--accent-amber)',
                  color: activeSubTab === 'users' ? 'var(--primary)' : '#000000',
                  borderRadius: '9999px',
                  padding: '0.05rem 0.45rem',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  marginLeft: '0.2rem'
                }}
              >
                {pendingUsersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('environments')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeSubTab === 'environments' ? 'var(--primary)' : 'transparent',
              color: activeSubTab === 'environments' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Server size={15} />
            Ambientes & Conexões MongoDB
          </button>

          <button
            onClick={() => setActiveSubTab('gateway')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeSubTab === 'gateway' ? 'var(--primary)' : 'transparent',
              color: activeSubTab === 'gateway' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Cpu size={15} />
            Gateway de IA & Okta (LLM)
          </button>
        </div>
      </div>

      {/* Sub-Tab Content */}
      <div>
        {activeSubTab === 'users' && <UsersManagementTab />}
        {activeSubTab === 'environments' && (
          <EnvironmentsManagementTab onEnvironmentChanged={onEnvironmentChanged} />
        )}
        {activeSubTab === 'gateway' && <AiGatewayManagementTab />}
      </div>
    </div>
  );
}

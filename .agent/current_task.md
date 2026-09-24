# CURRENT TASK

Task ID: TASK-20260924-0715-REMOVE-DEFAULT-ADMIN-ENFORCE-OKTA-ROOT-ADMIN

Created: 2026-09-24 07:15:00 -03:00

Last Updated: 2026-09-24 07:15:00 -03:00

Status: COMPLETED_AND_VERIFIED

Resume Authorization: NO

---

## User Request

remova esta senha e este login , mantenha como adm quando logado via okta o gcostabe@emeal.nttdata.com

---

## Objective

1. **Remoção de Credenciais e Dicas Padrão**:
   - Remover os blocos de dica e credenciais de teste (`admin@acdc.mapfre / admin123`) em `client/src/components/LoginPage.jsx` e `client/src/components/LoginModal.jsx`.
2. **Limpeza no Backend e Banco de Dados**:
   - Substituir `seedAdminUser()` por `cleanupLegacyAdmin()` em `server/src/routes/auth.js`, expurgando qualquer registro de `admin@acdc.mapfre` de `ACDC_USERS`.
   - Atualizar chamadas em `server/src/index.js` e `server/src/db.js`.
3. **Exclusividade de Administrador via Okta**:
   - Assegurar que estritamente `gcostabe@emeal.nttdata.com` (e `gustavo.costa.berbert@nttdata.com`) tenha a role `ADMIN`.
   - Qualquer outro usuário logado via Okta ou registrado localmente recebe perfil restrito comum (`LEITURA` ou `ATUARIO` pendente) sem acesso a rotas administrativas ou edição.
4. **Verificação e Entrega**:
   - Validar build limpo do frontend (`npm run build --prefix client`).
   - Sincronizar commits nos dois remotes Git (`origin`).
   - Respeitar a regra: **NÃO executar testes automatizados no final**, entregar ao usuário para teste.

---

## Execution Cursor

Phase: VERIFICATION_COMPLETE
Current Step: Limpeza concluída, build validado e repositórios sincronizados.
Last Safe Checkpoint: CHECKPOINT-036 (AFTER_ACTION)

---

## Planned Actions

- [x] Remover dica visual em `client/src/components/LoginPage.jsx`.
- [x] Remover dica visual em `client/src/components/LoginModal.jsx`.
- [x] Substituir `seedAdminUser` por `cleanupLegacyAdmin` em `server/src/routes/auth.js`.
- [x] Atualizar `server/src/index.js` e `server/src/db.js` para chamar `cleanupLegacyAdmin`.
- [x] Executar limpeza direta no MongoDB para remover `admin@acdc.mapfre`.
- [x] Executar build do client (`npm run build --prefix client`).
- [x] Commit e push para os dois repositórios remotos.
- [x] Reportar conclusão ao usuário.

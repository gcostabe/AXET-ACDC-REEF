r"""Refresh AXet token from Okta and persist Okta/AXet identity locally.

Uso:
    py C:\Users\apaffrat\OneDrive - NTT DATA EMEAL\Ondrive\local-ai-gateway\gateway\sync_okta_identity.py

Fluxo:
- Renova access_token via refresh_token no Okta
- Extrai oktaId (claim uid) do novo JWT
- Busca perfil AXet em /api/core/v1/users/{oktaId}
- Salva tokens atualizados em gateway/tokens.json
- Salva identidade em gateway/user_identity.json
- Atualiza providers.axet.claude.user_id no local-ai-gateway.toml
- Atualiza AXET_API_KEY no registry do usuário e em ~/.codex/.env
"""

from __future__ import annotations

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

try:
    import winreg  # type: ignore[attr-defined]
except ImportError:  # macOS/Linux
    winreg = None

PROJECT_DIR = Path(__file__).resolve().parent.parent
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from gateway.config_loader import config_value, expanded_path, load_config

CONFIG_PATH = Path(__file__).with_name("local-ai-gateway.toml")
CONFIG = load_config(CONFIG_PATH)
raw_tokens_path = expanded_path(config_value(CONFIG, "paths", "tokens_file"))
TOKENS_FILE = (PROJECT_DIR / raw_tokens_path).resolve() if not os.path.isabs(raw_tokens_path) else Path(raw_tokens_path)
CODEX_ENV_FILE = Path(expanded_path(config_value(CONFIG, "paths", "codex_env_file")))
IDENTITY_FILE = Path(__file__).with_name("user_identity.json")

OKTA_TOKEN_URL = config_value(CONFIG, "authentication", "okta_token_url")
OKTA_CLIENT_ID = config_value(CONFIG, "authentication", "okta_client_id")
PLUGIN_VERSION = config_value(CONFIG, "providers", "axet", "claude", "plugin_version")
CORE_URL = "https://axet.nttdata.com/api/core"


def ssl_context():
    """Cria um SSLContext. Suporta proxies corporativos (Zscaler/Netskope) com inspeção SSL."""
    import ssl

    if os.getenv("AXET_INSECURE_SSL", "1").strip() == "1":
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    return None


def load_tokens() -> dict:
    with TOKENS_FILE.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json_atomic(path: Path, payload: dict) -> None:
    temp_path = path.with_suffix(path.suffix + ".tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
    temp_path.replace(path)


def refresh_token(refresh_token_value: str) -> dict:
    body = urllib.parse.urlencode(
        {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token_value,
            "client_id": OKTA_CLIENT_ID,
            "scope": "openid offline_access profile",
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        OKTA_TOKEN_URL,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=30, context=ssl_context()) as response:
        return json.loads(response.read().decode("utf-8"))


def decode_jwt_payload(access_token: str) -> dict:
    parts = access_token.split(".")
    if len(parts) < 2:
        raise RuntimeError("access_token inválido: formato JWT não reconhecido")

    payload = parts[1]
    payload += "=" * (-len(payload) % 4)
    decoded = base64.urlsafe_b64decode(payload.encode("utf-8"))
    return json.loads(decoded.decode("utf-8"))


def fetch_axet_user(access_token: str, user_lookup_key: str) -> dict:
    encoded_key = urllib.parse.quote(user_lookup_key, safe="")
    url = f"{CORE_URL}/v1/users/{encoded_key}"
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "axet-plugin-version": PLUGIN_VERSION,
            "Content-Type": "application/json",
        },
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=20, context=ssl_context()) as response:
        return json.loads(response.read().decode("utf-8"))


def set_env_user(name: str, value: str) -> None:
    if winreg is None:
        print(f"Aviso: registry do Windows indisponível; definindo apenas no processo: {name}")
        os.environ[name] = value
        return

    try:
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Environment",
            0,
            winreg.KEY_SET_VALUE,
        ) as key:
            winreg.SetValueEx(key, name, 0, winreg.REG_SZ, value)
    except Exception as error:
        print(f"Aviso: não foi possível gravar {name} no registry: {error}")
    os.environ[name] = value


def write_codex_env(token: str) -> None:
    CODEX_ENV_FILE.parent.mkdir(parents=True, exist_ok=True)

    lines: list[str] = []
    if CODEX_ENV_FILE.exists():
        with CODEX_ENV_FILE.open("r", encoding="utf-8") as handle:
            lines = [line for line in handle if not line.startswith("AXET_API_KEY=")]

    lines.append(f"AXET_API_KEY={token}\n")

    temp_path = CODEX_ENV_FILE.with_suffix(CODEX_ENV_FILE.suffix + ".tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        handle.writelines(lines)
    temp_path.replace(CODEX_ENV_FILE)


def update_gateway_user_id(new_user_id: str) -> bool:
    with CONFIG_PATH.open("r", encoding="utf-8") as handle:
        lines = handle.readlines()

    section_header = "[providers.axet.claude]"
    section_start = None
    section_end = len(lines)

    for index, line in enumerate(lines):
        stripped = line.strip()
        if stripped == section_header:
            section_start = index
            continue
        if section_start is not None and stripped.startswith("[") and stripped.endswith("]"):
            section_end = index
            break

    if section_start is None:
        raise RuntimeError(f"Seção {section_header} não encontrada em {CONFIG_PATH}")

    replaced = False
    for index in range(section_start + 1, section_end):
        stripped = lines[index].strip()
        if stripped.startswith("user_id"):
            line_ending = "\r\n" if lines[index].endswith("\r\n") else "\n"
            lines[index] = f'user_id = "{new_user_id}"{line_ending}'
            replaced = True
            break

    if not replaced:
        line_ending = "\r\n" if any(line.endswith("\r\n") for line in lines) else "\n"
        lines.insert(section_end, f'user_id = "{new_user_id}"{line_ending}')

    updated_content = "".join(lines)
    temp_path = CONFIG_PATH.with_suffix(CONFIG_PATH.suffix + ".tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        handle.write(updated_content)
    temp_path.replace(CONFIG_PATH)
    return replaced


def main() -> int:
    print("Sincronizando token e identidade Okta/AXet...")

    try:
        current_tokens = load_tokens()
        current_refresh = current_tokens.get("refresh_token", "")
        if not current_refresh:
            raise RuntimeError("refresh_token não encontrado em gateway/tokens.json")

        refreshed = refresh_token(current_refresh)
        now = int(time.time())
        expires_in = int(refreshed.get("expires_in", 3600))
        refreshed["expires_at"] = now + expires_in
        if "refresh_token" not in refreshed:
            refreshed["refresh_token"] = current_refresh

        access_token = refreshed.get("access_token", "")
        if not access_token:
            raise RuntimeError("Okta não retornou access_token")

        claims = decode_jwt_payload(access_token)
        okta_id = str(claims.get("uid") or "").strip()
        if not okta_id:
            raise RuntimeError("claim uid (oktaId) não encontrada no access_token")

        profile = fetch_axet_user(access_token, okta_id)
        axet_user_id = str(profile.get("id") or "").strip()
        if not axet_user_id:
            raise RuntimeError("API /api/core/v1/users não retornou id do usuário")

        refreshed["okta_id"] = okta_id
        refreshed["axet_user_id"] = axet_user_id
        refreshed["email"] = profile.get("email")
        refreshed["updated_at"] = now
        write_json_atomic(TOKENS_FILE, refreshed)

        identity = {
            "okta_id": okta_id,
            "axet_user_id": axet_user_id,
            "email": profile.get("email"),
            "display_name": profile.get("displayName"),
            "login": profile.get("login"),
            "projects": profile.get("projects", []),
            "updated_at": now,
        }
        write_json_atomic(IDENTITY_FILE, identity)

        update_gateway_user_id(axet_user_id)
        set_env_user("AXET_API_KEY", access_token)
        write_codex_env(access_token)

        print("Sincronização concluída com sucesso.")
        print(f"okta_id: {okta_id}")
        print(f"axet_user_id: {axet_user_id}")
        print(f"tokens: {TOKENS_FILE}")
        print(f"identidade: {IDENTITY_FILE}")
        print(f"config atualizada: {CONFIG_PATH}")
        return 0

    except urllib.error.HTTPError as error:
        detail = ""
        try:
            detail = error.read().decode("utf-8", errors="replace")
        except Exception:
            detail = ""
        print(f"ERRO HTTP {error.code}: {detail[:500]}")
        return 1
    except Exception as error:
        print(f"ERRO: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

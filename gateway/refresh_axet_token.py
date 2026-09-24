"""Initialize the local AI gateway and refresh its AXet token when needed.

Uso:
    py C:\\Users\\apaffrat\\OneDrive - NTT DATA EMEAL\\Ondrive\\local-ai-gateway\\initialize_proxy.py

O script:
- Verifica se o token atual ainda é válido (>5 min)
- Se expirado/prestes a expirar, renova via Okta refresh_token
- Salva os novos tokens em gateway\\tokens.json
- Atualiza a variável de ambiente AXET_API_KEY (User scope - registry)
- Grava AXET_API_KEY em ~/.codex/.env (para a extensão do Codex no VS Code)
- Inicia o proxy local quando ele nao estiver saudavel
"""
import json
import time
import urllib.request
import urllib.parse
import os
import subprocess
import sys
import platform
from pathlib import Path

try:
    import winreg  # type: ignore
except Exception:  # pragma: no cover
    winreg = None

PROJECT_DIR = Path(__file__).resolve().parent
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from gateway.config_loader import config_value, expanded_path, load_config

CONFIG = load_config(PROJECT_DIR / "gateway" / "local-ai-gateway.toml")
raw_tokens_path = expanded_path(config_value(CONFIG, "paths", "tokens_file"))
TOKENS_FILE = (PROJECT_DIR / raw_tokens_path).resolve() if not os.path.isabs(raw_tokens_path) else Path(raw_tokens_path)
CODEX_ENV_FILE = expanded_path(config_value(CONFIG, "paths", "codex_env_file"))
LOCAL_GATEWAY_FILE = PROJECT_DIR / "gateway" / "local_ai_gateway.py"
GATEWAY_HOST = config_value(CONFIG, "server", "host")
GATEWAY_PORT = config_value(CONFIG, "server", "port")
OKTA_TOKEN_URL = config_value(CONFIG, "authentication", "okta_token_url")
CLIENT_ID = config_value(CONFIG, "authentication", "okta_client_id")


def load_tokens():
    with open(TOKENS_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_tokens(tokens):
    with open(TOKENS_FILE, "w", encoding="utf-8") as f:
        json.dump(tokens, f, indent=2)


def extract_axet_code_refresh_token():
    """Extrai o refreshToken ativo de ~/.local/share/axet-code/auth.enc se disponivel."""
    auth_enc_path = os.path.expanduser("~/.local/share/axet-code/auth.enc")
    if not os.path.exists(auth_enc_path):
        return None
    try:
        import base64
        import hashlib
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM

        hostname = subprocess.check_output(["sysctl", "-n", "kern.hostname"]).decode().strip()
        user = os.environ.get("USER") or os.environ.get("USERNAME")
        for arch in ["arm64", "amd64"]:
            fmt_str = f"{hostname}-darwin-{arch}:{user}"
            key = hashlib.pbkdf2_hmac("sha256", fmt_str.encode(), b"axet-cli-v1", 100000, 32)
            aesgcm = AESGCM(key)

            with open(auth_enc_path, "r", encoding="utf-8") as f:
                parts = f.read().strip().split(":")
            if len(parts) != 3:
                continue

            nonce = base64.b64decode(parts[0])
            tag = base64.b64decode(parts[1])
            ciphertext = base64.b64decode(parts[2])

            try:
                dec = aesgcm.decrypt(nonce, ciphertext + tag, None)
                data = json.loads(dec.decode("utf-8"))
                rf = data.get("tokens", {}).get("refreshToken")
                if rf:
                    return rf
            except Exception:
                continue
    except Exception as e:
        print(f"  [axet-code sync] Falha ao ler auth.enc: {e}")
    return None


def do_refresh(refresh_tk):
    data = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "refresh_token": refresh_tk,
        "client_id": CLIENT_ID,
        "scope": "openid offline_access profile",
    }).encode()

    req = urllib.request.Request(
        OKTA_TOKEN_URL,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read())


def set_env_user(name, value):
    """Define variável de ambiente no processo atual e, no Windows, persiste no registry."""
    os.environ[name] = value

    if platform.system().lower() != "windows" or winreg is None:
        print(f"  {name} definida apenas para este processo (macOS/Linux nao usam registry).")
        return

    try:
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Environment",
            0,
            winreg.KEY_SET_VALUE,
        ) as key:
            winreg.SetValueEx(key, name, 0, winreg.REG_SZ, value)
        print(f"  {name} atualizada no registry (User scope).")
    except Exception as e:
        print(f"  Aviso: nao foi possivel gravar no registry: {e}")


def write_codex_env(token):
    """Grava AXET_API_KEY no ~/.codex/.env para a extensão do Codex no VS Code."""
    try:
        os.makedirs(os.path.dirname(CODEX_ENV_FILE), exist_ok=True)

        # Lê o .env existente e remove linhas antigas de AXET_API_KEY
        lines = []
        if os.path.exists(CODEX_ENV_FILE):
            with open(CODEX_ENV_FILE, encoding="utf-8") as f:
                lines = [l for l in f.readlines() if not l.startswith("AXET_API_KEY=")]

        # Adiciona a nova linha
        lines.append(f"AXET_API_KEY={token}\n")

        with open(CODEX_ENV_FILE, "w", encoding="utf-8") as f:
            f.writelines(lines)

        print(f"  AXET_API_KEY gravada em {CODEX_ENV_FILE}")
    except Exception as e:
        print(f"  Aviso: nao foi possivel gravar em {CODEX_ENV_FILE}: {e}")


def get_gateway_health():
    try:
        url = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/health"
        with urllib.request.urlopen(url, timeout=2) as response:
            health = json.loads(response.read())
            return response.status == 200 and health.get("status") == "ok", health
    except (OSError, ValueError, urllib.error.URLError) as error:
        return False, {"error": str(error)}


def stop_gateway():
    system = platform.system().lower()

    if system == "windows":
        result = subprocess.run(
            ["netstat", "-ano", "-p", "tcp"], capture_output=True, text=True
        )
        target = f"{GATEWAY_HOST}:{GATEWAY_PORT}"
        pids = set()
        for line in result.stdout.splitlines():
            fields = line.split()
            if (
                len(fields) >= 5
                and fields[1].endswith(target)
                and fields[3].upper() == "LISTENING"
            ):
                pids.add(fields[4])

        if not pids:
            print(f"  [Gateway] Nenhum processo ativo encontrado na porta {GATEWAY_PORT}.")
            return

        for pid in pids:
            stopped = subprocess.run(
                ["taskkill", "/F", "/PID", pid], capture_output=True, text=True
            )
            if stopped.returncode == 0:
                print(f"  [Gateway] Processo anterior encerrado (PID {pid}).")
            else:
                print(f"  [Gateway] Aviso: nao foi possivel encerrar o PID {pid}.")
        return

    lsof = subprocess.run(
        ["lsof", "-nP", f"-iTCP:{GATEWAY_PORT}", "-sTCP:LISTEN", "-t"],
        capture_output=True,
        text=True,
    )
    pids = {p.strip() for p in lsof.stdout.splitlines() if p.strip()}

    if not pids:
        print(f"  [Gateway] Nenhum processo ativo encontrado na porta {GATEWAY_PORT}.")
        return

    for pid in sorted(pids):
        stopped = subprocess.run(["kill", "-9", pid], capture_output=True, text=True)
        if stopped.returncode == 0:
            print(f"  [Gateway] Processo anterior encerrado (PID {pid}).")
        else:
            print(f"  [Gateway] Aviso: nao foi possivel encerrar o PID {pid}: {stopped.stderr.strip()}")


def ensure_gateway(force_restart=False):
    healthy, health = get_gateway_health()
    if healthy and not force_restart:
        print(f"  [Gateway] Proxy saudavel (PID {health.get('pid')}, HTTP 200).")
        return

    if force_restart:
        print("  [Gateway] Token atualizado: reiniciando o proxy...")
    else:
        print(f"  [Gateway] Health check falhou: {health.get('error', 'resposta invalida')}.")

    stop_gateway()

    try:
        system = platform.system().lower()
        popen_kwargs = {
            "stdout": subprocess.DEVNULL,
            "stderr": subprocess.DEVNULL,
            "close_fds": True,
        }

        if system == "windows":
            creation_flags = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
            creation_flags |= getattr(subprocess, "DETACHED_PROCESS", 0)
            popen_kwargs["creationflags"] = creation_flags
        else:
            popen_kwargs["start_new_session"] = True

        subprocess.Popen([sys.executable, LOCAL_GATEWAY_FILE], **popen_kwargs)
        print("  [Gateway] Novo processo do proxy iniciado.")
        for _ in range(10):
            time.sleep(0.5)
            healthy, health = get_gateway_health()
            if healthy:
                print(f"  [Gateway] Servico validado (PID {health.get('pid')}, HTTP 200).")
                return
        print("  [Gateway] ERRO: servico iniciou, mas nao passou no health check.")
    except Exception as e:
        print(f"  [Gateway] ERRO ao iniciar o proxy: {e}")


def main():
    try:
        import fcntl
    except ImportError:
        fcntl = None

    lock_fd = None
    if fcntl:
        lock_path = Path(str(TOKENS_FILE) + ".lock")
        lock_fd = open(lock_path, "w")
        fcntl.flock(lock_fd.fileno(), fcntl.LOCK_EX)

    try:
        tokens = load_tokens()
        now = int(time.time())
        expires_at = tokens.get("expires_at", 0)
        remaining = expires_at - now

        print(f"Token expira em: {remaining}s ({remaining // 60} min)")

        fallback_rf = extract_axet_code_refresh_token()
        current_rf = tokens.get("refresh_token")
        has_new_axet_login = bool(fallback_rf and fallback_rf != current_rf)

        if not has_new_axet_login and remaining > 300:
            print("Token ainda valido (>5 min). Nenhuma acao necessaria.")
            print(f"access_token (60 chars): {tokens['access_token'][:60]}...")
            write_codex_env(tokens["access_token"])
            ensure_gateway()
            return

        if has_new_axet_login:
            print("Novo login detectado no axet-code (auth.enc)! Sincronizando com Okta...")
        else:
            print("Renovando token via refresh_token...")
        new_tokens = None
        current_rf = tokens.get("refresh_token")
        try:
            if current_rf:
                new_tokens = do_refresh(current_rf)
        except urllib.error.HTTPError as e:
            print(f"  Aviso: refresh_token em tokens.json rejeitado pelo Okta (HTTP {e.code}).")

        if not new_tokens:
            fallback_rf = extract_axet_code_refresh_token()
            if fallback_rf and fallback_rf != current_rf:
                print("  Sincronizando com refresh_token recente do axet-code...")
                try:
                    new_tokens = do_refresh(fallback_rf)
                    tokens["refresh_token"] = fallback_rf
                except urllib.error.HTTPError as e:
                    err = e.read().decode(errors="replace")
                    print(f"ERRO HTTP {e.code} com token do axet-code: {err[:300]}")
                    sys.exit(1)
                except Exception as e:
                    print(f"ERRO com token do axet-code: {e}")
                    sys.exit(1)
            else:
                print("ERRO: refresh_token invalido e nenhum token alternativo encontrado em axet-code.")
                sys.exit(1)

        expires_in = new_tokens.get("expires_in", 3600)
        new_tokens["expires_at"] = now + expires_in

        if "refresh_token" not in new_tokens:
            new_tokens["refresh_token"] = tokens["refresh_token"]

        save_tokens(new_tokens)
        print(f"Token renovado! expires_in: {expires_in}s ({expires_in // 60} min)")
        print(f"access_token (60 chars): {new_tokens['access_token'][:60]}...")

        set_env_user("AXET_API_KEY", new_tokens["access_token"])
        write_codex_env(new_tokens["access_token"])
        ensure_gateway()
        print("AXET_API_KEY atualizada com sucesso!")
    finally:
        if fcntl and lock_fd:
            try:
                fcntl.flock(lock_fd.fileno(), fcntl.LOCK_UN)
                lock_fd.close()
            except Exception:
                pass


if __name__ == "__main__":
    main()

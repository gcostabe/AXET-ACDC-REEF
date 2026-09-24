"""Local Claude Code adapter for the aXet Bedrock-compatible endpoint."""
import base64
import fcntl
import json
import logging
import os
import queue
import socket
import ssl
import struct
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from logging.handlers import RotatingFileHandler
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[1]
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from gateway.config_loader import config_value, expanded_path, load_config

CONFIG = load_config(Path(__file__).with_name("local-ai-gateway.toml"))
SERVER_CONFIG = config_value(CONFIG, "server")
TIMEOUT_CONFIG = config_value(CONFIG, "timeouts")
LIMIT_CONFIG = config_value(CONFIG, "limits")
AUTH_CONFIG = config_value(CONFIG, "authentication")
CLAUDE_CONFIG = config_value(CONFIG, "providers", "axet", "claude")
CODEX_CONFIG = config_value(CONFIG, "providers", "axet", "codex")

HOST = os.environ.get("GATEWAY_HOST", config_value(SERVER_CONFIG, "host"))
PORT = int(os.environ.get("GATEWAY_PORT", config_value(SERVER_CONFIG, "port")))
UPSTREAM_READ_TIMEOUT_SECONDS = config_value(TIMEOUT_CONFIG, "upstream_read_seconds")
UPSTREAM_NON_STREAMING_READ_TIMEOUT_SECONDS = config_value(
    TIMEOUT_CONFIG, "upstream_non_streaming_read_seconds"
)
UPSTREAM_QUEUE_TIMEOUT_SECONDS = config_value(TIMEOUT_CONFIG, "upstream_queue_seconds")
UPSTREAM_STREAM_MAX_ATTEMPTS = config_value(LIMIT_CONFIG, "stream_max_attempts")
UPSTREAM_STREAM_RETRY_DELAY_SECONDS = config_value(
    TIMEOUT_CONFIG, "stream_retry_delay_seconds"
)
UPSTREAM_MAX_CONCURRENT_REQUESTS = config_value(
    LIMIT_CONFIG, "upstream_max_concurrent_requests"
)
MAIN_REQUEST_MIN_BYTES = config_value(LIMIT_CONFIG, "main_request_min_bytes")
COMPACTION_RECOVERY_MIN_REQUEST_BYTES = MAIN_REQUEST_MIN_BYTES
STREAM_PING_INTERVAL_SECONDS = config_value(LIMIT_CONFIG, "stream_ping_interval_seconds")
raw_tokens_file = expanded_path(config_value(CONFIG, "paths", "tokens_file"))
TOKENS_FILE = (PROJECT_DIR / raw_tokens_file).resolve() if not os.path.isabs(raw_tokens_file) else Path(raw_tokens_file)
CODEX_ENV_FILE = expanded_path(config_value(CONFIG, "paths", "codex_env_file"))
OKTA_TOKEN_URL = config_value(AUTH_CONFIG, "okta_token_url")
OKTA_CLIENT_ID = config_value(AUTH_CONFIG, "okta_client_id")
TOKEN_REFRESH_BUFFER_SECONDS = config_value(
    TIMEOUT_CONFIG, "token_refresh_buffer_seconds"
)
AXET_MODEL_URL = config_value(CLAUDE_CONFIG, "model_url")
PROJECT_ID = config_value(CLAUDE_CONFIG, "project_id")
ASSET_ID = config_value(CLAUDE_CONFIG, "asset_id")
USER_ID = config_value(CLAUDE_CONFIG, "user_id")
CLAUDE_MODEL_ID = config_value(CLAUDE_CONFIG, "model_id")
AXET_PLUGIN_VERSION = config_value(CLAUDE_CONFIG, "plugin_version")
CLAUDE_FALLBACK_PROJECT_IDS = CLAUDE_CONFIG.get("project_ids", [])
CODEX_AXET_BASE_URL = config_value(CODEX_CONFIG, "base_url")
CODEX_PROJECT_ID = config_value(CODEX_CONFIG, "project_id")
CODEX_ASSET_ID = config_value(CODEX_CONFIG, "asset_id")
CODEX_BASE_URL_TEMPLATE = CODEX_CONFIG.get("base_url_template")
CODEX_FALLBACK_PROJECT_IDS = CODEX_CONFIG.get("project_ids", [])
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
LOG_FILE = os.path.join(LOG_DIR, "adapter.log")
BILLING_LIMIT_STATUS_CODE = 402


def normalized_project_ids(provider_name, primary_project_id, fallback_project_ids):
    if fallback_project_ids is None:
        fallback_values = []
    elif isinstance(fallback_project_ids, str):
        fallback_values = [fallback_project_ids]
    elif isinstance(fallback_project_ids, list):
        fallback_values = fallback_project_ids
    else:
        raise RuntimeError(
            f"{provider_name}.project_ids must be a string or list of strings"
        )

    project_ids = [primary_project_id]
    for project_id in fallback_values:
        if not isinstance(project_id, str) or not project_id.strip():
            raise RuntimeError(
                f"{provider_name}.project_ids contains an invalid project id"
            )
        if project_id not in project_ids:
            project_ids.append(project_id)
    return project_ids


class ProjectRoutePool:
    def __init__(self, routes):
        if not routes:
            raise RuntimeError("Project route pool requires at least one route")
        self._routes = tuple(routes)
        self._active_index = 0
        self._lock = threading.Lock()

    def routes(self):
        with self._lock:
            start_index = self._active_index
        size = len(self._routes)
        return [
            self._routes[(start_index + offset) % size]
            for offset in range(size)
        ]

    def active_project_id(self):
        with self._lock:
            return self._routes[self._active_index]["project_id"]

    def configured_project_ids(self):
        return [route["project_id"] for route in self._routes]

    def rotate_from(self, exhausted_project_id):
        with self._lock:
            active_route = self._routes[self._active_index]
            if active_route["project_id"] != exhausted_project_id:
                return active_route
            self._active_index = (self._active_index + 1) % len(self._routes)
            return self._routes[self._active_index]


def codex_base_url_for_project(project_id):
    if CODEX_BASE_URL_TEMPLATE:
        if "{project_id}" not in CODEX_BASE_URL_TEMPLATE:
            raise RuntimeError(
                "providers.axet.codex.base_url_template must contain {project_id}"
            )
        return CODEX_BASE_URL_TEMPLATE.format(project_id=project_id)
    if project_id == CODEX_PROJECT_ID:
        return CODEX_AXET_BASE_URL
    if CODEX_PROJECT_ID not in CODEX_AXET_BASE_URL:
        raise RuntimeError(
            "providers.axet.codex.base_url must contain providers.axet.codex.project_id "
            "when multiple project_ids are configured"
        )
    return CODEX_AXET_BASE_URL.replace(CODEX_PROJECT_ID, project_id, 1)


def is_billing_limit_error(status_code):
    return status_code == BILLING_LIMIT_STATUS_CODE


CLAUDE_PROJECT_IDS = normalized_project_ids(
    "providers.axet.claude", PROJECT_ID, CLAUDE_FALLBACK_PROJECT_IDS
)
CODEX_PROJECT_IDS = normalized_project_ids(
    "providers.axet.codex", CODEX_PROJECT_ID, CODEX_FALLBACK_PROJECT_IDS
)
CLAUDE_PROJECT_POOL = ProjectRoutePool([
    {"project_id": project_id, "asset_id": ASSET_ID}
    for project_id in CLAUDE_PROJECT_IDS
])
CODEX_PROJECT_POOL = ProjectRoutePool([
    {
        "project_id": project_id,
        "asset_id": CODEX_ASSET_ID,
        "base_url": codex_base_url_for_project(project_id),
    }
    for project_id in CODEX_PROJECT_IDS
])


def configure_logging():
    os.makedirs(LOG_DIR, exist_ok=True)
    logger = logging.getLogger("claude_axet_adapter")
    logger.setLevel(logging.INFO)
    handler = RotatingFileHandler(
        LOG_FILE, maxBytes=2_000_000, backupCount=5, encoding="utf-8"
    )
    handler.setFormatter(logging.Formatter(
        "%(asctime)s %(levelname)s pid=%(process)d %(message)s"
    ))
    logger.addHandler(handler)
    return logger


LOGGER = configure_logging()
UPSTREAM_SEMAPHORE = threading.BoundedSemaphore(UPSTREAM_MAX_CONCURRENT_REQUESTS)
CLAUDE_AUX_SEMAPHORE = threading.BoundedSemaphore(UPSTREAM_MAX_CONCURRENT_REQUESTS)
CODEX_UPSTREAM_SEMAPHORE = threading.BoundedSemaphore(UPSTREAM_MAX_CONCURRENT_REQUESTS)
TOKEN_REFRESH_LOCK = threading.Lock()
BEDROCK_STREAM_ERROR_FIELDS = (
    "internalServerException",
    "modelStreamErrorException",
    "modelTimeoutException",
    "serviceUnavailableException",
    "throttlingException",
    "validationException",
)


class BedrockEventStreamError(OSError):
    pass


def extract_axet_code_refresh_token():
    auth_enc_path = os.path.expanduser("~/.local/share/axet-code/auth.enc")
    if not os.path.exists(auth_enc_path):
        return None
    try:
        import hashlib
        import subprocess
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
                return data.get("tokens", {}).get("refreshToken")
            except Exception:
                continue
    except Exception as exc:
        LOGGER.warning("failed_extracting_axet_code_refresh_token: %s", exc)
    return None


def load_tokens():
    if os.path.exists(TOKENS_FILE):
        try:
            with open(TOKENS_FILE, encoding="utf-8") as file:
                return json.load(file)
        except Exception as exc:
            LOGGER.warning("failed_loading_tokens: %s", exc)
    return {}


def save_tokens(tokens):
    temp_file = Path(str(TOKENS_FILE) + ".tmp")
    with open(temp_file, "w", encoding="utf-8") as file:
        json.dump(tokens, file, indent=2)
    temp_file.replace(TOKENS_FILE)


def write_codex_env(token):
    try:
        os.makedirs(os.path.dirname(CODEX_ENV_FILE), exist_ok=True)
        lines = []
        if os.path.exists(CODEX_ENV_FILE):
            with open(CODEX_ENV_FILE, encoding="utf-8") as f:
                lines = [l for l in f.readlines() if not l.startswith("AXET_API_KEY=")]
        lines.append(f"AXET_API_KEY={token}\n")
        with open(CODEX_ENV_FILE, "w", encoding="utf-8") as f:
            f.writelines(lines)
    except Exception as exc:
        LOGGER.warning("failed_writing_codex_env: %s", exc)


def refresh_token(tokens):
    lock_file_path = Path(str(TOKENS_FILE) + ".lock")
    with open(lock_file_path, "w") as lock_file:
        try:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
            current_tokens = load_tokens()
            fallback_rf = extract_axet_code_refresh_token()
            new_axet_login = bool(fallback_rf and fallback_rf != current_tokens.get("refresh_token"))

            remaining = current_tokens.get("expires_at", 0) - int(time.time())
            if not new_axet_login and remaining > TOKEN_REFRESH_BUFFER_SECONDS:
                LOGGER.info("token_already_refreshed_by_peer remaining_seconds=%d", remaining)
                return current_tokens

            target_rf = fallback_rf if new_axet_login else current_tokens.get("refresh_token")
            if not target_rf:
                target_rf = fallback_rf
            if not target_rf:
                raise RuntimeError("no_refresh_token_available")

            scope = current_tokens.get("scope", "openid offline_access profile")

            def _req(rf_val):
                data = urllib.parse.urlencode({
                    "grant_type": "refresh_token",
                    "refresh_token": rf_val,
                    "client_id": OKTA_CLIENT_ID,
                    "scope": scope,
                }).encode()
                request = urllib.request.Request(
                    OKTA_TOKEN_URL,
                    data=data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                with urllib.request.urlopen(request, timeout=20) as response:
                    return json.loads(response.read())

            try:
                refreshed = _req(target_rf)
            except urllib.error.HTTPError as err:
                if err.code in (400, 401) and fallback_rf and fallback_rf != target_rf:
                    LOGGER.info("refresh_failed_trying_fallback_axet_code status=%d", err.code)
                    refreshed = _req(fallback_rf)
                    target_rf = fallback_rf
                else:
                    raise

            refreshed["expires_at"] = int(time.time()) + refreshed.get("expires_in", 3600)
            if "refresh_token" not in refreshed:
                refreshed["refresh_token"] = target_rf
            save_tokens(refreshed)
            write_codex_env(refreshed.get("access_token", ""))
            LOGGER.info("token_refreshed expires_in_seconds=%d", refreshed.get("expires_in", 3600))
            return refreshed
        finally:
            try:
                fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
            except Exception:
                pass


def load_valid_token(force_refresh=False):
    tokens = load_tokens()
    remaining = tokens.get("expires_at", 0) - int(time.time())
    fallback_rf = extract_axet_code_refresh_token()
    new_axet_login = bool(fallback_rf and fallback_rf != tokens.get("refresh_token"))

    if not force_refresh and not new_axet_login and remaining > TOKEN_REFRESH_BUFFER_SECONDS:
        return tokens.get("access_token", "")

    with TOKEN_REFRESH_LOCK:
        tokens = load_tokens()
        remaining = tokens.get("expires_at", 0) - int(time.time())
        if force_refresh or new_axet_login or remaining <= TOKEN_REFRESH_BUFFER_SECONDS or not tokens.get("access_token"):
            LOGGER.info("token_refresh_started remaining_seconds=%d force=%s new_login=%s", remaining, force_refresh, new_axet_login)
            tokens = refresh_token(tokens)
        return tokens.get("access_token", "")


def bedrock_body(request_body):
    allowed = {
        "max_tokens", "messages", "system", "stop_sequences", "temperature",
        "top_p", "top_k", "tools", "tool_choice", "thinking", "output_config",
    }
    body = {key: value for key, value in request_body.items() if key in allowed}

    raw_model = str(request_body.get("model", ""))
    desired_effort = None
    if "-high" in raw_model.lower() or "(high)" in raw_model.lower():
        desired_effort = "high"
    elif "-medium" in raw_model.lower() or "(medium)" in raw_model.lower():
        desired_effort = "medium"

    thinking_input = request_body.get("thinking")
    if desired_effort or (isinstance(thinking_input, dict) and thinking_input.get("type") in ("enabled", "adaptive")):
        effort = desired_effort or "medium"
        if isinstance(thinking_input, dict) and thinking_input.get("budget_tokens", 0) > 4000:
            effort = "high"
        body["thinking"] = {"type": "adaptive"}
        body["output_config"] = {"effort": effort}
        body["temperature"] = 1.0
    elif "thinking" in body:
        del body["thinking"]

    sanitized_messages = []
    removed_thinking_blocks = 0
    for message in body.get("messages", []):
        sanitized_message = dict(message)
        content = message.get("content")
        if isinstance(content, list):
            sanitized_content = []
            for block in content:
                if (
                    isinstance(block, dict)
                    and block.get("type") == "thinking"
                    and not block.get("thinking")
                ):
                    removed_thinking_blocks += 1
                    continue
                sanitized_content.append(block)
            sanitized_message["content"] = sanitized_content
        sanitized_messages.append(sanitized_message)
    body["messages"] = sanitized_messages
    if removed_thinking_blocks:
        LOGGER.warning("payload_sanitized removed_empty_thinking_blocks=%d", removed_thinking_blocks)
    body["anthropic_version"] = "bedrock-2023-05-31"
    body.setdefault("stop_sequences", [])
    return json.dumps(body).encode("utf-8")


def event_payloads(response, on_first_event=None):
    buffer = b""
    received_event = False
    while True:
        chunk = response.read(8192)
        if not chunk:
            break
        buffer += chunk
        while len(buffer) >= 12:
            total_length, headers_length = struct.unpack(">II", buffer[:8])
            if total_length < 16 or len(buffer) < total_length:
                break
            payload_start = 12 + headers_length
            payload_end = total_length - 4
            payload = buffer[payload_start:payload_end]
            buffer = buffer[total_length:]
            try:
                event = json.loads(payload)
                for error_field in BEDROCK_STREAM_ERROR_FIELDS:
                    if error_field in event:
                        details = event[error_field]
                        message = details.get("message", error_field) if isinstance(details, dict) else error_field
                        raise BedrockEventStreamError(f"{error_field}: {message}")
                encoded = event.get("bytes") or event.get("chunk", {}).get("bytes")
                if encoded:
                    decoded = json.loads(base64.b64decode(encoded))
                    if not received_event:
                        received_event = True
                        if on_first_event:
                            on_first_event()
                    yield decoded
            except (ValueError, KeyError):
                continue


def close_upstream_response(response):
    try:
        response.fp.raw._sock.shutdown(socket.SHUT_RDWR)
    except (AttributeError, OSError):
        pass
    try:
        response.fp.raw._sock.close()
    except (AttributeError, OSError):
        pass
    response.close()


def event_payloads_with_heartbeat(response, interval=STREAM_PING_INTERVAL_SECONDS):
    items = queue.Queue()
    finished = object()
    last_progress_at = time.monotonic()

    def read_events():
        try:
            def extend_read_timeout():
                response.fp.raw._sock.settimeout(UPSTREAM_READ_TIMEOUT_SECONDS)
                LOGGER.info(
                    "upstream_first_event_received read_timeout_seconds=%d",
                    UPSTREAM_READ_TIMEOUT_SECONDS,
                )

            for event in event_payloads(response, extend_read_timeout):
                items.put(event)
        except (OSError, urllib.error.URLError) as error:
            items.put(error)
        finally:
            items.put(finished)

    threading.Thread(target=read_events, daemon=True).start()
    while True:
        try:
            item = items.get(timeout=interval)
        except queue.Empty:
            if time.monotonic() - last_progress_at >= UPSTREAM_READ_TIMEOUT_SECONDS:
                close_upstream_response(response)
                raise TimeoutError(
                    f"No upstream event for {UPSTREAM_READ_TIMEOUT_SECONDS} seconds"
                )
            yield None
            continue
        if item is finished:
            return
        if isinstance(item, Exception):
            raise item
        last_progress_at = time.monotonic()
        yield item


def event_payloads_with_retry(response, request, context):
    for attempt in range(1, UPSTREAM_STREAM_MAX_ATTEMPTS + 1):
        if attempt > 1:
            LOGGER.warning(
                "upstream_stream_retry attempt=%d max_attempts=%d",
                attempt, UPSTREAM_STREAM_MAX_ATTEMPTS,
            )
            time.sleep(UPSTREAM_STREAM_RETRY_DELAY_SECONDS)
            response = urllib.request.urlopen(
                request, context=context, timeout=UPSTREAM_READ_TIMEOUT_SECONDS
            )

        received_event = False
        try:
            for event in event_payloads_with_heartbeat(response):
                if event is not None:
                    received_event = True
                yield event
        except (OSError, urllib.error.URLError):
            if received_event or attempt == UPSTREAM_STREAM_MAX_ATTEMPTS:
                raise
        finally:
            close_upstream_response(response)

        if received_event or attempt == UPSTREAM_STREAM_MAX_ATTEMPTS:
            return


def non_streaming_response(events):
    message = None
    content = []
    for event in events:
        event_type = event.get("type")
        if event_type == "message_start":
            message = event.get("message", {})
        elif event_type == "content_block_start":
            block = event.get("content_block")
            if block:
                content.append(block)
        elif event_type == "content_block_delta" and content:
            delta = event.get("delta", {})
            if delta.get("type") == "text_delta":
                content[-1]["text"] = content[-1].get("text", "") + delta.get("text", "")
        elif event_type == "message_delta" and message:
            message.update(event.get("delta", {}))
            message["usage"] = event.get("usage", message.get("usage", {}))

    if not message:
        return None
    message["content"] = content
    return message


def write_retryable_sse_error(handler, message):
    payload = json.dumps({
        "type": "error",
        "error": {
            "type": "overloaded_error",
            "message": message,
        },
    }, separators=(",", ":"))
    handler.wfile.write(f"event: error\ndata: {payload}\n\n".encode())
    handler.wfile.flush()
    handler.__dict__["close_connection"] = True


def should_request_compaction(streaming, request_length):
    return (
        not streaming
        and request_length >= COMPACTION_RECOVERY_MIN_REQUEST_BYTES
    )


def claude_request_semaphore(request_length):
    if request_length >= MAIN_REQUEST_MIN_BYTES:
        return UPSTREAM_SEMAPHORE, "main"
    return CLAUDE_AUX_SEMAPHORE, "aux"


class ClaudeCodeHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _codex_target_url(self, base_url):
        return base_url + self.path[len("/codex/v1"):]

    def _forward_codex(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else None
        started_at = time.monotonic()
        stream = False
        model = "unknown"
        if body:
            try:
                request_body = json.loads(body)
                stream = request_body.get("stream", False)
                raw_model = str(request_body.get("model", "unknown"))

                desired_effort = None
                raw_lower = raw_model.lower()
                if "-high" in raw_lower or "(high)" in raw_lower:
                    desired_effort = "high"
                elif "-medium" in raw_lower or "(medium)" in raw_lower:
                    desired_effort = "medium"

                normalized_model = raw_model
                if "terra" in raw_lower:
                    normalized_model = "gpt-5.6-terra"
                elif "luna" in raw_lower:
                    normalized_model = "gpt-5.6-luna"
                elif "5.4-mini" in raw_lower or "5.4 mini" in raw_lower:
                    normalized_model = "gpt-5.4-mini"
                elif "5.4-nano" in raw_lower or "5.4 nano" in raw_lower:
                    normalized_model = "gpt-5.4-nano"
                else:
                    for base in ["gpt-5.6-terra", "gpt-5.6-luna", "gpt-4o-mini", "gpt-4o"]:
                        if base in raw_lower:
                            normalized_model = base
                            break

                request_body["model"] = normalized_model
                model = normalized_model

                if "max_tokens" in request_body and "max_completion_tokens" not in request_body:
                    if normalized_model.startswith("gpt-5"):
                        request_body["max_completion_tokens"] = request_body.pop("max_tokens")

                has_tools = bool(request_body.get("tools"))
                if has_tools and normalized_model.startswith("gpt-5.6"):
                    request_body["reasoning_effort"] = "none"
                elif desired_effort and normalized_model.startswith("gpt-5.6"):
                    request_body["reasoning_effort"] = desired_effort

                body = json.dumps(request_body).encode("utf-8")
                length = len(body)
            except (TypeError, ValueError):
                pass
        LOGGER.info(
            "codex_request_start client=%s path=%s bytes=%d stream=%s model=%s",
            self.client_address[0], self.path, length, stream, model,
        )

        queue_started_at = time.monotonic()
        if not CODEX_UPSTREAM_SEMAPHORE.acquire(timeout=UPSTREAM_QUEUE_TIMEOUT_SECONDS):
            LOGGER.error("codex_upstream_queue_timeout duration_ms=%d", int(
                (time.monotonic() - queue_started_at) * 1000
            ))
            self.send_error(503, "Axet Codex request queue timeout")
            return

        excluded_headers = {
            "authorization", "connection", "content-length", "host",
            "transfer-encoding", "x-api-key", "axet-asset-id",
            "axet-project-id", "axet-user-id",
        }
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        response = None
        try:
            codex_routes = CODEX_PROJECT_POOL.routes()
            try:
                token = load_valid_token()
            except urllib.error.HTTPError as auth_err:
                err_body = auth_err.read().decode(errors="replace")
                LOGGER.error("load_valid_token_failed status=%d body=%s", auth_err.code, err_body[:300])
                err_json = json.dumps({
                    "error": {
                        "message": "Sessão corporativa no Gateway de IA expirada. Por favor, renove a sessão no aXet / VS Code.",
                        "type": "authentication_error",
                        "code": "token_expired",
                    }
                }).encode("utf-8")
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(err_json)))
                self.end_headers()
                self.wfile.write(err_json)
                return

            token_refreshed_on_401 = False
            for attempt_index, route in enumerate(codex_routes, start=1):
                request = urllib.request.Request(
                    self._codex_target_url(route["base_url"]),
                    data=body,
                    method=self.command,
                )
                for key, value in self.headers.items():
                    if key.lower() not in excluded_headers:
                        request.add_header(key, value)
                request.add_header("Authorization", f"Bearer {token}")
                request.add_header("axet-asset-id", route["asset_id"])
                request.add_header("axet-project-id", route["project_id"])
                request.add_header("axet-user-id", USER_ID)

                try:
                    response = urllib.request.urlopen(
                        request, context=context, timeout=UPSTREAM_READ_TIMEOUT_SECONDS
                    )
                    if attempt_index > 1:
                        LOGGER.warning(
                            "codex_project_failover_success attempts=%d active_project_id=%s",
                            attempt_index,
                            route["project_id"],
                        )
                    self.send_response(response.status)
                    for key, value in response.headers.items():
                        if key.lower() not in {"connection", "content-length", "transfer-encoding"}:
                            self.send_header(key, value)
                    self.send_header("Connection", "close")
                    self.end_headers()
                    self.__dict__["close_connection"] = True
                    response_bytes = 0
                    while True:
                        chunk = response.read(8192)
                        if not chunk:
                            break
                        response_bytes += len(chunk)
                        self.wfile.write(chunk)
                        self.wfile.flush()
                    LOGGER.info(
                        "codex_request_complete status=%d duration_ms=%d response_bytes=%d project_id=%s",
                        response.status,
                        int((time.monotonic() - started_at) * 1000),
                        response_bytes,
                        route["project_id"],
                    )
                    return
                except urllib.error.HTTPError as error:
                    payload = error.read()
                    if error.code == 401 and not token_refreshed_on_401:
                        token_refreshed_on_401 = True
                        LOGGER.warning(
                            "codex_upstream_401: token expirado no AXet. Renovando automaticamente via Okta e retentando..."
                        )
                        try:
                            token = load_valid_token(force_refresh=True)
                            retry_request = urllib.request.Request(
                                self._codex_target_url(route["base_url"]),
                                data=body,
                                method=self.command,
                            )
                            for key, value in self.headers.items():
                                if key.lower() not in excluded_headers:
                                    retry_request.add_header(key, value)
                            retry_request.add_header("Authorization", f"Bearer {token}")
                            retry_request.add_header("axet-asset-id", route["asset_id"])
                            retry_request.add_header("axet-project-id", route["project_id"])
                            retry_request.add_header("axet-user-id", USER_ID)

                            response = urllib.request.urlopen(
                                retry_request, context=context, timeout=UPSTREAM_READ_TIMEOUT_SECONDS
                            )
                            LOGGER.info("codex_retry_after_refresh_success on project_id=%s", route["project_id"])
                            self.send_response(response.status)
                            for key, value in response.headers.items():
                                if key.lower() not in {"connection", "content-length", "transfer-encoding"}:
                                    self.send_header(key, value)
                            self.send_header("Connection", "close")
                            self.end_headers()
                            self.__dict__["close_connection"] = True
                            response_bytes = 0
                            while True:
                                chunk = response.read(8192)
                                if not chunk:
                                    break
                                response_bytes += len(chunk)
                                self.wfile.write(chunk)
                                self.wfile.flush()
                            LOGGER.info(
                                "codex_request_complete status=%d duration_ms=%d response_bytes=%d project_id=%s",
                                response.status,
                                int((time.monotonic() - started_at) * 1000),
                                response_bytes,
                                route["project_id"],
                            )
                            return
                        except Exception as retry_err:
                            LOGGER.error("codex_retry_after_refresh_failed: %s", retry_err)

                    if is_billing_limit_error(error.code) and attempt_index < len(codex_routes):
                        next_route = CODEX_PROJECT_POOL.rotate_from(route["project_id"])
                        LOGGER.warning(
                            "codex_project_budget_exhausted status=%d exhausted_project_id=%s next_project_id=%s duration_ms=%d response=%s",
                            error.code,
                            route["project_id"],
                            next_route["project_id"],
                            int((time.monotonic() - started_at) * 1000),
                            payload.decode(errors="replace")[:300].replace("\n", " "),
                        )
                        continue
                    LOGGER.error(
                        "codex_upstream_http_error status=%d duration_ms=%d project_id=%s response=%s",
                        error.code,
                        int((time.monotonic() - started_at) * 1000),
                        route["project_id"],
                        payload.decode(errors="replace")[:300].replace("\n", " "),
                    )
                    self.send_response(error.code)
                    self.send_header("Content-Type", error.headers.get("Content-Type", "application/json"))
                    self.send_header("Content-Length", str(len(payload)))
                    self.end_headers()
                    self.wfile.write(payload)
                    return
                except (BrokenPipeError, ConnectionResetError) as error:
                    LOGGER.warning(
                        "codex_client_disconnected duration_ms=%d project_id=%s error=%s",
                        int((time.monotonic() - started_at) * 1000),
                        route["project_id"],
                        error,
                    )
                    return
                except (OSError, urllib.error.URLError) as error:
                    LOGGER.error(
                        "codex_upstream_error duration_ms=%d project_id=%s error=%s",
                        int((time.monotonic() - started_at) * 1000),
                        route["project_id"],
                        error,
                    )
                    if response is None:
                        payload = json.dumps({
                            "error": {
                                "type": "server_error",
                                "message": "Axet Codex upstream unavailable",
                            }
                        }).encode()
                        self.send_response(502)
                        self.send_header("Content-Type", "application/json")
                        self.send_header("Content-Length", str(len(payload)))
                        self.end_headers()
                        self.wfile.write(payload)
                    else:
                        self.__dict__["close_connection"] = True
                    return
                finally:
                    if response is not None:
                        response.close()
                        response = None
        finally:
            CODEX_UPSTREAM_SEMAPHORE.release()

    def do_HEAD(self):
        if self.path == "/api/hello":
            self.send_response(200)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_error(404)

    def do_GET(self):
        if self.path in ("/codex/v1/models", "/codex/v1/models/"):
            models = [
                {"id": "gpt-5.6-terra-high", "object": "model", "created": 1789920000, "owned_by": "axet"},
                {"id": "gpt-5.6-terra-medium", "object": "model", "created": 1789920000, "owned_by": "axet"},
                {"id": "gpt-5.6-terra", "object": "model", "created": 1789920000, "owned_by": "axet"},
                {"id": "gpt-5.6-luna-high", "object": "model", "created": 1789920000, "owned_by": "axet"},
                {"id": "gpt-5.6-luna-medium", "object": "model", "created": 1789920000, "owned_by": "axet"},
                {"id": "gpt-5.6-luna", "object": "model", "created": 1789920000, "owned_by": "axet"},
                {"id": "gpt-4o", "object": "model", "created": 1789920000, "owned_by": "axet"},
            ]
            payload = json.dumps({"object": "list", "data": models}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        if self.path.startswith("/codex/v1/models/"):
            model_id = self.path[len("/codex/v1/models/"):]
            model = {"id": model_id, "object": "model", "created": 1789920000, "owned_by": "axet"}
            payload = json.dumps(model).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        if self.path.startswith("/codex/v1/"):
            self._forward_codex()
            return
        if self.path in ("/auth/status", "/auth/status/"):
            try:
                tokens = load_tokens()
                now = int(time.time())
                expires_at = tokens.get("expires_at", 0)
                remaining = max(0, expires_at - now)
                payload = json.dumps({
                    "status": "ok",
                    "authenticated": bool(tokens.get("access_token")),
                    "expires_at": expires_at,
                    "remaining_seconds": remaining,
                    "email": tokens.get("email"),
                }).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except Exception as error:
                payload = json.dumps({"status": "error", "error": str(error)}).encode()
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            return
        if self.path == "/health":
            try:
                token = load_tokens()["access_token"]
                payload = json.dumps({
                    "status": "ok",
                    "pid": os.getpid(),
                    "token_available": bool(token),
                    "upstream_slots_available": UPSTREAM_SEMAPHORE._value,
                    "active_claude_project_id": CLAUDE_PROJECT_POOL.active_project_id(),
                    "active_codex_project_id": CODEX_PROJECT_POOL.active_project_id(),
                    "configured_claude_project_ids": CLAUDE_PROJECT_POOL.configured_project_ids(),
                    "configured_codex_project_ids": CODEX_PROJECT_POOL.configured_project_ids(),
                }).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except (OSError, KeyError, ValueError) as error:
                payload = json.dumps({"status": "error", "error": str(error)}).encode()
                self.send_response(503)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            return
        if not (self.path == "/v1/models" or self.path.startswith("/v1/models/")):
            self.send_error(404, "Only /v1/models is supported")
            return
        model = {
            "id": CLAUDE_MODEL_ID,
            "type": "model",
            "display_name": CLAUDE_MODEL_ID,
            "created_at": "2026-08-28T00:00:00Z",
        }
        payload = json.dumps({"data": [model]} if self.path == "/v1/models" else model).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        if self.path in ("/auth/tokens", "/auth/tokens/"):
            length = int(self.headers.get("Content-Length", "0"))
            try:
                tokens_data = json.loads(self.rfile.read(length))
                if not isinstance(tokens_data, dict) or "access_token" not in tokens_data:
                    self.send_error(400, "Invalid payload: access_token required")
                    return
                now = int(time.time())
                if "expires_at" not in tokens_data:
                    expires_in = int(tokens_data.get("expires_in", 3600))
                    tokens_data["expires_at"] = now + expires_in
                
                try:
                    current_tokens = load_tokens()
                    for k, v in current_tokens.items():
                        if k not in tokens_data:
                            tokens_data[k] = v
                except Exception:
                    pass

                save_tokens(tokens_data)
                write_codex_env(tokens_data["access_token"])
                os.environ["AXET_API_KEY"] = tokens_data["access_token"]
                LOGGER.info("tokens_updated_via_api expires_at=%d", tokens_data["expires_at"])
                payload = json.dumps({
                    "status": "ok",
                    "expires_at": tokens_data["expires_at"],
                    "remaining_seconds": max(0, tokens_data["expires_at"] - now)
                }).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except Exception as error:
                LOGGER.error("tokens_update_failed: %s", error)
                payload = json.dumps({"status": "error", "error": str(error)}).encode()
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            return
        if self.path.split("?", 1)[0].startswith("/codex/v1/"):
            self._forward_codex()
            return
        if self.path.split("?", 1)[0] != "/v1/messages":
            self.send_error(404, "Only /v1/messages is supported")
            return
        length = int(self.headers.get("Content-Length", "0"))
        started_at = time.monotonic()
        try:
            body = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, ConnectionResetError) as error:
            LOGGER.warning("request_invalid path=%s error=%s", self.path, error)
            self.send_error(400, "Invalid JSON request")
            return
        LOGGER.info(
            "request_start client=%s path=%s bytes=%d stream=%s model=%s",
            self.client_address[0], self.path, length, body.get("stream", False),
            body.get("model", "unknown")
        )
        request_semaphore, request_lane = claude_request_semaphore(length)
        queue_started_at = time.monotonic()
        if not request_semaphore.acquire(timeout=UPSTREAM_QUEUE_TIMEOUT_SECONDS):
            LOGGER.error("upstream_queue_timeout lane=%s duration_ms=%d", request_lane, int(
                (time.monotonic() - queue_started_at) * 1000
            ))
            self.send_error(503, "Axet request queue timeout")
            return
        queue_wait_ms = int((time.monotonic() - queue_started_at) * 1000)
        if queue_wait_ms:
            LOGGER.info("upstream_queue_wait lane=%s duration_ms=%d", request_lane, queue_wait_ms)
        bedrock_request_body = bedrock_body(body)
        try:
            auth_token = load_valid_token()
        except urllib.error.HTTPError as auth_err:
            err_body = auth_err.read().decode(errors="replace")
            LOGGER.error("load_valid_token_failed status=%d body=%s", auth_err.code, err_body[:300])
            self.send_error(401, "Sessão corporativa no Gateway de IA expirada. Por favor, renove a sessão no aXet / VS Code.")
            request_semaphore.release()
            return
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        streaming = body.get("stream", False)
        response = None
        request = None
        claude_routes = CLAUDE_PROJECT_POOL.routes()
        token_refreshed_on_401 = False
        for attempt_index, route in enumerate(claude_routes, start=1):
            request = urllib.request.Request(
                AXET_MODEL_URL,
                data=bedrock_request_body,
                headers={
                    "Authorization": f"Bearer {auth_token}",
                    "Content-Type": "application/json",
                    "User-Agent": "node",
                    "axet-project-id": route["project_id"],
                    "axet-user-id": USER_ID,
                    "axet-asset-id": route["asset_id"],
                    "axet-plugin-version": AXET_PLUGIN_VERSION,
                },
                method="POST",
            )
            try:
                response = urllib.request.urlopen(
                    request,
                    context=context,
                    timeout=(
                        UPSTREAM_READ_TIMEOUT_SECONDS
                        if streaming else UPSTREAM_NON_STREAMING_READ_TIMEOUT_SECONDS
                    ),
                )
                if attempt_index > 1:
                    LOGGER.warning(
                        "project_failover_success attempts=%d active_project_id=%s",
                        attempt_index,
                        route["project_id"],
                    )
                break
            except urllib.error.HTTPError as error:
                payload = error.read()
                if error.code == 401 and not token_refreshed_on_401:
                    token_refreshed_on_401 = True
                    LOGGER.warning("claude_upstream_401: token expirado no AXet. Renovando automaticamente via Okta e retentando...")
                    try:
                        auth_token = load_valid_token(force_refresh=True)
                        retry_request = urllib.request.Request(
                            AXET_MODEL_URL,
                            data=bedrock_request_body,
                            headers={
                                "Authorization": f"Bearer {auth_token}",
                                "Content-Type": "application/json",
                                "User-Agent": "node",
                                "axet-project-id": route["project_id"],
                                "axet-user-id": USER_ID,
                                "axet-asset-id": route["asset_id"],
                                "axet-plugin-version": AXET_PLUGIN_VERSION,
                            },
                            method="POST",
                        )
                        response = urllib.request.urlopen(
                            retry_request,
                            context=context,
                            timeout=(
                                UPSTREAM_READ_TIMEOUT_SECONDS
                                if streaming else UPSTREAM_NON_STREAMING_READ_TIMEOUT_SECONDS
                            ),
                        )
                        LOGGER.info("claude_retry_after_refresh_success on project_id=%s", route["project_id"])
                        break
                    except Exception as retry_err:
                        LOGGER.error("claude_retry_after_refresh_failed: %s", retry_err)

                if is_billing_limit_error(error.code) and attempt_index < len(claude_routes):
                    next_route = CLAUDE_PROJECT_POOL.rotate_from(route["project_id"])
                    LOGGER.warning(
                        "project_budget_exhausted status=%d exhausted_project_id=%s next_project_id=%s duration_ms=%d response=%s",
                        error.code,
                        route["project_id"],
                        next_route["project_id"],
                        int((time.monotonic() - started_at) * 1000),
                        payload.decode(errors="replace")[:300].replace("\n", " "),
                    )
                    continue
                LOGGER.error(
                    "upstream_http_error status=%d duration_ms=%d project_id=%s response=%s",
                    error.code,
                    int((time.monotonic() - started_at) * 1000),
                    route["project_id"],
                    payload.decode(errors="replace")[:300].replace("\n", " "),
                )
                self.send_response(error.code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
                request_semaphore.release()
                return
            except (OSError, urllib.error.URLError) as error:
                LOGGER.exception(
                    "upstream_connection_error duration_ms=%d project_id=%s error=%s",
                    int((time.monotonic() - started_at) * 1000),
                    route["project_id"],
                    error,
                )
                self.send_error(502, "Axet upstream unavailable")
                request_semaphore.release()
                return

        if response is None:
            self.send_error(502, "Axet upstream unavailable")
            request_semaphore.release()
            return

        if streaming:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "close")
            self.end_headers()
            self.__dict__["close_connection"] = True
        event_count = 0
        heartbeat_count = 0
        events = []
        saw_message_delta = False
        saw_message_stop = False
        try:
            event_source = (
                event_payloads_with_retry(response, request, context)
                if streaming else event_payloads(response)
            )
            for event in event_source:
                if event is None:
                    heartbeat = 'event: ping\ndata: {"type":"ping"}\n\n'.encode()
                    self.wfile.write(heartbeat)
                    self.wfile.flush()
                    heartbeat_count += 1
                    continue
                if streaming:
                    event_type = event.get("type", "message")
                    payload = json.dumps(event, separators=(",", ":"))
                    self.wfile.write(f"event: {event_type}\ndata: {payload}\n\n".encode())
                    self.wfile.flush()
                    saw_message_delta = saw_message_delta or event_type == "message_delta"
                    saw_message_stop = saw_message_stop or event_type == "message_stop"
                else:
                    events.append(event)
                event_count += 1
            if not streaming:
                payload = non_streaming_response(events)
                if not payload:
                    raise RuntimeError("Axet returned no usable Bedrock events")
                encoded = json.dumps(payload, separators=(",", ":")).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(encoded)))
                self.end_headers()
                self.wfile.write(encoded)
            elif event_count == 0:
                LOGGER.error("upstream_empty_stream duration_ms=%d", int((time.monotonic() - started_at) * 1000))
                write_retryable_sse_error(self, "aXet upstream returned an empty stream")
                LOGGER.warning("upstream_empty_stream_retryable_error_sent")
            elif streaming and not saw_message_stop:
                if saw_message_delta:
                    terminal_event = json.dumps({"type": "message_stop"}, separators=(",", ":"))
                    self.wfile.write(f"event: message_stop\ndata: {terminal_event}\n\n".encode())
                    self.wfile.flush()
                    LOGGER.warning("upstream_stream_missing_message_stop_synthesized")
                else:
                    LOGGER.error("upstream_stream_incomplete events=%d", event_count)
                    write_retryable_sse_error(self, "aXet stream ended before a terminal message event")
                    LOGGER.warning("upstream_stream_retryable_error_sent")
            LOGGER.info(
                "request_complete status=200 stream=%s duration_ms=%d events=%d heartbeats=%d message_delta=%s message_stop=%s",
                streaming, int((time.monotonic() - started_at) * 1000), event_count,
                heartbeat_count, saw_message_delta, saw_message_stop,
            )
        except (BrokenPipeError, ConnectionResetError) as error:
            LOGGER.warning(
                "client_disconnected duration_ms=%d events=%d error=%s",
                int((time.monotonic() - started_at) * 1000), event_count, error
            )
        except (OSError, urllib.error.URLError) as error:
            duration_ms = int((time.monotonic() - started_at) * 1000)
            LOGGER.error(
                "upstream_stream_error duration_ms=%d events=%d error=%s",
                duration_ms, event_count, error
            )
            if streaming:
                try:
                    write_retryable_sse_error(self, "aXet stream timed out or disconnected")
                    LOGGER.warning("upstream_stream_retryable_error_sent")
                except (BrokenPipeError, ConnectionResetError):
                    pass
            elif should_request_compaction(streaming, length):
                payload = json.dumps({
                    "type": "error",
                    "error": {
                        "type": "invalid_request_error",
                        "message": "Prompt is too long (capability_rejected: prompt_too_long)",
                    },
                }, separators=(",", ":")).encode()
                LOGGER.warning(
                    "compaction_requested bytes=%d partial_events=%d after_nonstream_timeout=true",
                    length, event_count,
                )
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            else:
                self.send_error(504, "Axet stream timed out or disconnected")
        except RuntimeError as error:
            LOGGER.error(
                "response_conversion_error duration_ms=%d error=%s",
                int((time.monotonic() - started_at) * 1000), error
            )
            if not streaming:
                self.send_error(502, str(error))
        finally:
            if not streaming:
                response.close()
            request_semaphore.release()

    def log_message(self, format_string, *args):
        print(f"[Claude Code Axet] {format_string % args}")


if __name__ == "__main__":
    LOGGER.info("service_start host=%s port=%d log=%s", HOST, PORT, LOG_FILE)
    print(f"Claude Code Axet adapter listening on http://{HOST}:{PORT}")
    try:
        ThreadingHTTPServer((HOST, PORT), ClaudeCodeHandler).serve_forever()
    except Exception:
        LOGGER.exception("service_stopped_unexpectedly")
        raise

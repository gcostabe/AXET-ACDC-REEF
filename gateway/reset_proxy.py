"""Force a restart of the local AI gateway without refreshing the token."""
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from gateway.initialize_proxy import ensure_gateway


def main():
    print("Reiniciando o proxy local...")
    ensure_gateway(force_restart=True)


if __name__ == "__main__":
    main()

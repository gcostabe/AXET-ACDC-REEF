"""Configuration loading helpers for the local AI gateway."""
from pathlib import Path
import os

try:
    import tomllib  # py>=3.11
except ModuleNotFoundError:  # pragma: no cover
    import tomli as tomllib  # type: ignore


def load_config(config_path):
    with Path(config_path).open("rb") as config_file:
        return tomllib.load(config_file)


def config_value(config, *keys):
    value = config
    for key in keys:
        try:
            value = value[key]
        except KeyError as error:
            dotted_key = ".".join(keys)
            raise RuntimeError(f"Missing required configuration: {dotted_key}") from error
    return value


def expanded_path(value):
    return os.path.expandvars(os.path.expanduser(value))

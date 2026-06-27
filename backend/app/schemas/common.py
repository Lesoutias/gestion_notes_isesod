import re
from typing import Annotated

from pydantic import AfterValidator

_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validate_institutional_email(value: str) -> str:
  if not _EMAIL_PATTERN.match(value):
    raise ValueError("Email invalide")
  return value.lower()


InstitutionalEmail = Annotated[str, AfterValidator(_validate_institutional_email)]

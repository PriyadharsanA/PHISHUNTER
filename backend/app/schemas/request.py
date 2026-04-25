from pydantic import BaseModel
from typing import Optional

class EmailRequest(BaseModel):
    subject: str
    body: str
    url: Optional[str] = None
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class State(BaseModel):
    spiral: int = Field(...)
    level: int = Field(..., ge=0, le=6)


class Capability(BaseModel):
    # Dev mode: value "allow" permits operations. Production will replace with signed tokens.
    token: Optional[str] = None


class CoreRequest(BaseModel):
    state: State
    k: Optional[int] = None
    capability: Optional[str] = None


class CoreResponse(BaseModel):
    state: State
    receipt: dict


class PiRequest(BaseModel):
    start: int = 0
    count: int = 64
    capability: Optional[str] = None


class PiResponse(BaseModel):
    hex_digits: str
    lens_manifest_hash: str
    receipt: dict


class PrimesRequest(BaseModel):
    start: int = 2
    count: int = 100
    rounds: int = 8
    capability: Optional[str] = None


class PrimeResult(BaseModel):
    n: int
    probable_prime: bool
    witnesses: List[int]


class PrimesResponse(BaseModel):
    results: List[PrimeResult]
    lens_manifest_hash: str
    receipt: dict


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    core_hash: str
    kernel_hash: str


# --- Dimensional Doctrine Models ---

class SeedResponse(BaseModel):
    'Result of applying Dimensional Collapse or Expansion doctrine to a state.'
    original_state: State
    seed_state: State
    doctrine: str   # 'collapse' or 'expand'
    receipt: dict


class DoctrineInfo(BaseModel):
    'Metadata about a single active doctrine.'
    name: str
    description: str
    trigger_level: int
    result_level: int


class DoctrineSummary(BaseModel):
    'Summary of all active dimensional doctrines.'
    collapse_doctrine: DoctrineInfo
    expansion_doctrine: DoctrineInfo


# --- Lens / Registry Models ---

class LensInfo(BaseModel):
    'Metadata about a registered lens.'
    name: str
    version: str
    description: str
    manifest_hash: str


class LensManifestResponse(BaseModel):
    'Response listing all registered lenses.'
    lenses: List[LensInfo]
    count: int


class KernelOpInfo(BaseModel):
    'Metadata about a registered kernel operation.'
    name: str
    description: str
    tags: List[str]


class KernelOpsResponse(BaseModel):
    'Response listing all registered kernel operations.'
    operations: List[KernelOpInfo]
    count: int


# --- Enhanced Health ---

class HealthResponseV2(BaseModel):
    status: Literal['ok'] = 'ok'
    core_hash: str
    kernel_hash: str
    lenses: List[str]
    kernel_ops: List[str]
    doctrines: List[str]

from __future__ import annotations
import logging
from typing import Callable, Dict, Optional, Type
from pydantic import BaseModel
from hashlib import sha256

logger = logging.getLogger(__name__)


class LensEntry:
    'Metadata and handler for a single registered lens.'
    def __init__(self, name, handler, input_model, output_model, description='', version='1.0.0'):
        self.name = name
        self.handler = handler
        self.input_model = input_model
        self.output_model = output_model
        self.description = description
        self.version = version
        # stable manifest hash derived from name+version
        self.manifest_hash = sha256(f'lens:{name}:{version}'.encode()).hexdigest()

class LensRegistry:
    'Plugin registry for ButterflyFX lenses.

    A lens is any computation that derives verifiable mathematical artefacts
    (e.g. pi digits, primes, geometric sequences) using the kernel substrate.

    To add a new lens::
        from butterflyfx_core.lenses.registry import LensRegistry
        @LensRegistry.register("my_lens", MyInputModel, MyOutputModel, description="...")
        async def my_lens_handler(req: MyInputModel) -> MyOutputModel:
            ...
    '

    _lenses: Dict[str, LensEntry] = {}

    @classmethod
    def register(cls, name, input_model, output_model, description='', version='1.0.0'):
        def decorator(func: Callable) -> Callable:
            if name in cls._lenses:
                logger.warning('LensRegistry: overwriting lens %s', name)
            cls._lenses[name] = LensEntry(name, func, input_model, output_model, description, version)
            logger.debug('LensRegistry: registered lens %s', name)
            return func
        return decorator

    @classmethod
    def get(cls, name: str) -> Optional[LensEntry]:
        return cls._lenses.get(name)

    @classmethod
    def all(cls) -> Dict[str, LensEntry]:
        return dict(cls._lenses)

    @classmethod
    def names(cls) -> list:
        return list(cls._lenses.keys())

    @classmethod
    def manifest(cls) -> list:
        return [
            {
                'name': e.name, 'version': e.version,
                'description': e.description, 'manifest_hash': e.manifest_hash
            }
            for e in cls._lenses.values()
        ]

from __future__ import annotations
import logging
from typing import Callable, Dict, Optional, Type
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class OperationEntry:
    'Metadata and handler for a single kernel operation.'
    def __init__(self, name, handler, input_model, output_model, description='', tags=None):
        self.name = name
        self.handler = handler
        self.input_model = input_model
        self.output_model = output_model
        self.description = description
        self.tags = tags or ['kernel']

class OperationRegistry:
    'Central plugin registry for kernel operations.

    To add a new operation::
        @OperationRegistry.register("my_op", InputModel, OutputModel, description="...")
        async def my_op_handler(req): ...'

    _ops: Dict[str, OperationEntry] = {}

    @classmethod
    def register(cls, name, input_model, output_model, description='', tags=None):
        def decorator(func: Callable) -> Callable:
            if name in cls._ops:
                logger.warning('OperationRegistry: overwriting %s', name)
            cls._ops[name] = OperationEntry(name, func, input_model, output_model, description, tags)
            logger.debug('OperationRegistry: registered %s', name)
            return func
        return decorator

    @classmethod
    def get(cls, name: str) -> Optional[OperationEntry]:
        return cls._ops.get(name)

    @classmethod
    def all(cls) -> Dict[str, OperationEntry]:
        return dict(cls._ops)

    @classmethod
    def names(cls) -> list:
        return list(cls._ops.keys())

    @classmethod
    def manifest(cls) -> list:
        return [
            {'name': e.name, 'description': e.description, 'tags': e.tags}
            for e in cls._ops.values()
        ]

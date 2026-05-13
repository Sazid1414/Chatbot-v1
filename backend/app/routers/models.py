from fastapi import APIRouter

from app.services.model_router import list_registry

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("")
async def get_model_registry():
    return list_registry()

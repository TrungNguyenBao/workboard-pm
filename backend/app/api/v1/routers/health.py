from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "workboard-api", "version": "1.0.0"}

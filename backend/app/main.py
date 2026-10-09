from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.db import engine
from app.models.base import Base
from app.routers import categorias, favoritos, recetas


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    yield


def crear_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Recetas", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(recetas.router)
    app.include_router(categorias.router)
    app.include_router(favoritos.router)
    return app


app = crear_app()

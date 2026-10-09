from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Identity, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class FavoritoModel(Base):
    __tablename__ = "favorito"
    __table_args__ = (
        UniqueConstraint("proveedor", "id_externo", name="favorito_proveedor_id_externo_key"),
        CheckConstraint(
            "length(btrim(id_externo)) > 0",
            name="favorito_id_externo_no_vacio",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    proveedor: Mapped[str] = mapped_column(Text, nullable=False, server_default="themealdb")
    id_externo: Mapped[str] = mapped_column(Text, nullable=False)
    receta: Mapped[dict] = mapped_column(JSONB, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

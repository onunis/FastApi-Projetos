"""replace complete with status

Revision ID: 410d3354833c
Revises: 8ab87bf425c6
Create Date: 2026-09-23 00:20:09.721251

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '410d3354833c'
down_revision: Union[str, Sequence[str], None] = '8ab87bf425c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Cria a nova coluna status
    op.add_column(
        'todos',
        sa.Column('status', sa.String(), nullable=True)
    )
    # 2. Converte os valores antigos de complete para status
    op.execute("""
        UPDATE todos
        SET status = CASE
            WHEN complete = true THEN 'done'
            ELSE 'todo'
        END
    """)

    # 3. Remove a coluna antiga
    op.drop_column('todos', 'complete')


def downgrade() -> None:
    """Downgrade schema."""

    op.add_column(
        'todos',
        sa.Column('complete', sa.BOOLEAN(), nullable=True)
    )

    op.drop_column('todos', 'status')

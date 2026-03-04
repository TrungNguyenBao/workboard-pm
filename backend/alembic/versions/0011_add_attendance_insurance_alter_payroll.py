"""add_attendance_insurance_alter_payroll

Revision ID: 0011
Revises: 0010
Create Date: 2026-03-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0011'
down_revision: Union[str, Sequence[str], None] = '0010'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create attendance_records and insurance_records tables; alter payroll_records."""
    op.create_table(
        'attendance_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('employee_id', sa.Uuid(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('check_in', sa.Time(), nullable=True),
        sa.Column('check_out', sa.Time(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='present'),
        sa.Column('total_hours', sa.Numeric(precision=4, scale=2), nullable=True),
        sa.Column('overtime_hours', sa.Numeric(precision=4, scale=2), nullable=False, server_default='0'),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('employee_id', 'date', name='uq_attendance_employee_date'),
    )
    op.create_index('ix_attendance_records_employee_id', 'attendance_records', ['employee_id'])
    op.create_index('ix_attendance_records_workspace_id', 'attendance_records', ['workspace_id'])
    op.create_index('ix_attendance_records_date', 'attendance_records', ['date'])

    op.create_table(
        'insurance_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('employee_id', sa.Uuid(), nullable=False),
        sa.Column('insurance_type', sa.String(length=50), nullable=False),
        sa.Column('base_salary', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('employee_rate', sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column('employer_rate', sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column('effective_from', sa.Date(), nullable=False),
        sa.Column('effective_to', sa.Date(), nullable=True),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_insurance_records_employee_id', 'insurance_records', ['employee_id'])
    op.create_index('ix_insurance_records_workspace_id', 'insurance_records', ['workspace_id'])

    # Alter payroll_records: add enhanced C&B columns (all nullable/with defaults)
    op.add_column('payroll_records', sa.Column('base_salary', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('payroll_records', sa.Column('allowances', postgresql.JSONB(), nullable=True))
    op.add_column('payroll_records', sa.Column('bhxh_employee', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    op.add_column('payroll_records', sa.Column('bhxh_employer', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    op.add_column('payroll_records', sa.Column('bhyt_employee', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    op.add_column('payroll_records', sa.Column('bhyt_employer', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    op.add_column('payroll_records', sa.Column('bhtn_employee', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    op.add_column('payroll_records', sa.Column('bhtn_employer', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    op.add_column('payroll_records', sa.Column('taxable_income', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    op.add_column('payroll_records', sa.Column('personal_deduction', sa.Numeric(precision=12, scale=2), nullable=False, server_default='11000000'))
    op.add_column('payroll_records', sa.Column('dependent_deduction', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    op.add_column('payroll_records', sa.Column('pit_amount', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    op.add_column('payroll_records', sa.Column('working_days', sa.Integer(), nullable=True))
    op.add_column('payroll_records', sa.Column('actual_working_days', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove added payroll columns
    for col in [
        'actual_working_days', 'working_days', 'pit_amount', 'dependent_deduction',
        'personal_deduction', 'taxable_income', 'bhtn_employer', 'bhtn_employee',
        'bhyt_employer', 'bhyt_employee', 'bhxh_employer', 'bhxh_employee',
        'allowances', 'base_salary',
    ]:
        op.drop_column('payroll_records', col)

    op.drop_index('ix_insurance_records_workspace_id', table_name='insurance_records')
    op.drop_index('ix_insurance_records_employee_id', table_name='insurance_records')
    op.drop_table('insurance_records')

    op.drop_index('ix_attendance_records_date', table_name='attendance_records')
    op.drop_index('ix_attendance_records_workspace_id', table_name='attendance_records')
    op.drop_index('ix_attendance_records_employee_id', table_name='attendance_records')
    op.drop_table('attendance_records')

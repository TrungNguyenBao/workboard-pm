"""HRM module models — imported for Alembic discovery via app.models.__init__."""

from app.modules.hrm.models.department import Department  # noqa: F401
from app.modules.hrm.models.employee import Employee  # noqa: F401
from app.modules.hrm.models.leave_request import LeaveRequest  # noqa: F401
from app.modules.hrm.models.leave_type import LeaveType  # noqa: F401
from app.modules.hrm.models.payroll_record import PayrollRecord  # noqa: F401

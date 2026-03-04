"""HRM module models — imported for Alembic discovery via app.models.__init__."""

from app.modules.hrm.models.attendance_record import AttendanceRecord  # noqa: F401
from app.modules.hrm.models.candidate import Candidate  # noqa: F401
from app.modules.hrm.models.contract import Contract  # noqa: F401
from app.modules.hrm.models.department import Department  # noqa: F401
from app.modules.hrm.models.employee import Employee  # noqa: F401
from app.modules.hrm.models.insurance_record import InsuranceRecord  # noqa: F401
from app.modules.hrm.models.interview import Interview  # noqa: F401
from app.modules.hrm.models.leave_request import LeaveRequest  # noqa: F401
from app.modules.hrm.models.leave_type import LeaveType  # noqa: F401
from app.modules.hrm.models.offer import Offer  # noqa: F401
from app.modules.hrm.models.onboarding_checklist import OnboardingChecklist  # noqa: F401
from app.modules.hrm.models.payroll_record import PayrollRecord  # noqa: F401
from app.modules.hrm.models.position import Position  # noqa: F401
from app.modules.hrm.models.recruitment_request import RecruitmentRequest  # noqa: F401
from app.modules.hrm.models.salary_history import SalaryHistory  # noqa: F401

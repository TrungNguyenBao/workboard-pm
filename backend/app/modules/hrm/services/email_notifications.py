"""Async email sending for HRM notifications. Gracefully skips if SMTP not configured."""
import asyncio
import html
import logging
import smtplib
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_email_sync(to: str, subject: str, body: str) -> None:
    """Blocking SMTP send — called via asyncio.to_thread to avoid blocking event loop."""
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        if settings.SMTP_USER:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)


async def send_email(to: str, subject: str, body: str) -> None:
    """Send HTML email via SMTP. Silently skips if SMTP_HOST not set."""
    if not settings.SMTP_HOST:
        logger.debug("SMTP not configured — skipping email to %s: %s", to, subject)
        return
    try:
        await asyncio.to_thread(_send_email_sync, to, subject, body)
        logger.info("Email sent to %s: %s", to, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s — %s", to, subject, exc)


def offer_sent_email(candidate_name: str, position_title: str) -> str:
    name = html.escape(candidate_name)
    pos = html.escape(position_title)
    return (
        f"<p>Dear {name},<br>"
        f"You have received a job offer for <strong>{pos}</strong>. "
        f"Please review and respond.</p>"
    )


def leave_approved_email(employee_name: str, leave_type: str, start_date: str, end_date: str) -> str:
    name = html.escape(employee_name)
    lt = html.escape(leave_type)
    return (
        f"<p>Dear {name},<br>"
        f"Your <strong>{lt}</strong> request ({html.escape(start_date)} \u2013 {html.escape(end_date)}) "
        f"has been <strong>approved</strong>.</p>"
    )


def leave_rejected_email(employee_name: str, leave_type: str) -> str:
    name = html.escape(employee_name)
    lt = html.escape(leave_type)
    return (
        f"<p>Dear {name},<br>"
        f"Your <strong>{lt}</strong> request has been <strong>rejected</strong>. "
        f"Please contact HR for details.</p>"
    )


def payroll_published_email(employee_name: str, period: str) -> str:
    name = html.escape(employee_name)
    p = html.escape(period)
    return (
        f"<p>Dear {name},<br>"
        f"Your payslip for <strong>{p}</strong> has been published. "
        f"Please log in to view it.</p>"
    )

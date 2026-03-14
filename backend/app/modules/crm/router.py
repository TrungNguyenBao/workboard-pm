from fastapi import APIRouter

from app.modules.crm.routers import (
    accounts,
    activities,
    analytics,
    campaigns,
    contacts,
    contracts,
    crm_attachments,
    crm_notifications,
    cross_module,
    custom_fields,
    deal_competitors,
    deal_contact_roles,
    deals,
    email_templates,
    emails,
    forecasts,
    import_export,
    leads,
    pipeline_stages,
    products,
    quotations,
    scoring_config,
    tickets,
    workflows,
)

crm_router = APIRouter(prefix="/crm", tags=["crm"])

# Workflows first — literal paths like /leads/stale must match before /leads/{lead_id}
crm_router.include_router(workflows.router)
crm_router.include_router(contacts.router)
crm_router.include_router(deals.router)
crm_router.include_router(deal_contact_roles.router)
crm_router.include_router(leads.router)
crm_router.include_router(accounts.router)
crm_router.include_router(activities.router)
crm_router.include_router(campaigns.router)
crm_router.include_router(tickets.router)
crm_router.include_router(analytics.router)
crm_router.include_router(pipeline_stages.router)
crm_router.include_router(scoring_config.router)
crm_router.include_router(products.router)
crm_router.include_router(contracts.router)
crm_router.include_router(quotations.router)
# Literal path /notifications/unread-count must come before /{notification_id}/read
crm_router.include_router(crm_notifications.router)
crm_router.include_router(crm_attachments.router)
crm_router.include_router(custom_fields.router)
crm_router.include_router(email_templates.router)
crm_router.include_router(emails.router)
crm_router.include_router(deal_competitors.router)
crm_router.include_router(forecasts.router)
crm_router.include_router(import_export.router)
crm_router.include_router(cross_module.router)

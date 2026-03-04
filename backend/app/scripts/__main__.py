"""Entry point: python -m app.scripts"""
import asyncio

from app.scripts.seed_crm import seed_crm
from app.scripts.seed_hrm import seed_hrm
from app.scripts.seed_pms import seed_pms
from app.scripts.seed_shared import AsyncSessionLocal, clear_data, engine, seed_users_and_workspace
from app.scripts.seed_wms import seed_wms


async def main() -> None:
    print("A-ERP seed script")
    print("=" * 40)
    async with AsyncSessionLocal() as session:
        await clear_data(session)
        ctx = await seed_users_and_workspace(session)
        ws = ctx["ws_id"]
        demo, alice, bob = ctx["demo_id"], ctx["alice_id"], ctx["bob_id"]

        await seed_pms(session, ws, demo, alice, bob)
        await seed_crm(session, ws)
        await seed_wms(session, ws)
        await seed_hrm(session, ws, demo, alice, bob)

        await session.commit()

    await engine.dispose()
    print("\nSeed complete. Login: demo@workboard.io / demo1234")


if __name__ == "__main__":
    asyncio.run(main())

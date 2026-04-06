"""Seed database with Little Super Claws characters and formats. Idempotent."""

import asyncio

from sqlalchemy import select

from src.db.models import Character, Format, VoiceProfile
from src.db.session import async_session_factory


CHARACTERS = [
    {
        "name": "super-claws",
        "archetype": "delusional hero",
        "core_flaw": "overconfident, never admits failure, reframes mistakes as success",
        "taboos": ["breaking character", "admitting he's wrong", "being genuinely humble"],
        "catchphrases": [],
        "language_style": "bombastic, self-congratulatory, oblivious to irony",
        "safety_rules": {"no_real_people": True, "no_offensive_stereotypes": True},
    },
    {
        "name": "red",
        "archetype": "reactive antagonist",
        "core_flaw": "emotional, confrontational, escalates everything",
        "taboos": ["being calm", "agreeing with Super Claws", "long explanations"],
        "catchphrases": [],
        "language_style": "short, punchy, explosive",
        "safety_rules": {"no_real_people": True, "no_offensive_stereotypes": True},
    },
    {
        "name": "green",
        "archetype": "pseudo-intellectual observer",
        "core_flaw": "detached, avoids responsibility, overthinks everything",
        "taboos": ["taking action", "showing genuine emotion", "being direct"],
        "catchphrases": [],
        "language_style": "verbose, philosophical, deflecting",
        "safety_rules": {"no_real_people": True, "no_offensive_stereotypes": True},
    },
]

FORMAT = {
    "name": "Super Claws Interrogation",
    "hook_template": "Accusation or impossible question directed at Super Claws",
    "beat_sheet": [
        "hook_accusation",
        "super_claws_denial",
        "evidence_presented",
        "escalation",
        "twist_reframe",
        "loop_setup",
    ],
    "length_min_seconds": 10,
    "length_max_seconds": 20,
    "ending_pattern": "Super Claws reframes disaster as victory",
}


async def seed():
    async with async_session_factory() as session:
        # Seed characters
        for char_data in CHARACTERS:
            existing = await session.execute(
                select(Character).where(Character.name == char_data["name"])
            )
            if existing.scalar_one_or_none() is None:
                character = Character(**char_data)
                session.add(character)
                print(f"  Created character: {char_data['name']}")

                # Add a placeholder voice profile
                vp = VoiceProfile(
                    character_id=character.id,
                    provider="elevenlabs",
                    voice_id="placeholder",
                    settings={"stability": 0.5, "similarity_boost": 0.75, "style": 0.5},
                    emotional_tags=["default"],
                    consent_verified=False,
                )
                session.add(vp)
            else:
                print(f"  Character already exists: {char_data['name']}")

        # Seed format
        existing_fmt = await session.execute(
            select(Format).where(Format.name == FORMAT["name"])
        )
        if existing_fmt.scalar_one_or_none() is None:
            fmt = Format(**FORMAT)
            session.add(fmt)
            print(f"  Created format: {FORMAT['name']}")
        else:
            print(f"  Format already exists: {FORMAT['name']}")

        await session.commit()
        print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())

🎄 GAME DESIGN DOCUMENT
Last Light of Christmas
1. High Concept

Last Light of Christmas is a 3D third-person survival web game set in a snow-covered town trapped in an unnatural Christmas Eve blizzard.
The player must survive freezing temperatures, hostile creatures, and dwindling hope by maintaining warmth, light, and Christmas spirit until Christmas morning.

Theme: Festive survival horror
Tone: Cozy → unsettling → hopeful
Target Platform: Web browsers (desktop)
Target Session Length: 15–30 minutes per run

2. Target Audience

Indie survival fans (The Long Dark, Don’t Starve)

Players who enjoy atmospheric horror-lite games

Casual web players (low barrier to entry)

Seasonal / holiday gamers

3. Core Pillars

Light is Life – Darkness is dangerous

Hope as Health – Christmas Spirit replaces HP

Survival Through Preparation – Day prep, night defense

Festive Horror – Christmas visuals with eerie twists

4. Gameplay Overview
Core Gameplay Loop

Explore town during the day

Scavenge resources

Craft tools and light sources

Prepare defenses

Survive the night

Repeat until Christmas morning

5. Camera & Controls
Camera

Third-person, over-the-shoulder

Fixed zoom distance

Slight camera sway for atmosphere

Controls (Keyboard + Mouse)
Action	Input
Move	WASD
Look	Mouse
Sprint	Shift
Interact	E
Toggle Light	F
Inventory	Tab
Crafting Wheel	Q
6. World Design
Setting

A small abandoned town surrounded by forest and mountains.

Zones

Town Square (central hub, Grand Christmas Tree)

Residential Houses

Toy Store

Church

Forest Edge

Power Station

Environmental Features

Heavy snow and fog (limits view distance)

Flickering lights

Frozen interiors

Ambient sound cues

7. Survival Systems
7.1 Christmas Spirit (Primary Health)

Represents hope, morale, and life force

Game over when Spirit reaches 0

Spirit Decreases When:

Attacked by enemies

Standing in darkness too long

Witnessing unsettling events

Extreme cold exposure

Spirit Increases When:

Lighting decorations

Eating festive food

Standing near Christmas Tree

Helping NPCs

Playing Christmas music

7.2 Warmth

Gradually decreases outdoors and at night

Low warmth drains Spirit

Warmth Sources:

Fires

Lit decorations

Indoor areas

Warm clothing

7.3 Light System

Dynamic light radius around player

Light weakens enemies and restores Spirit

Darkness increases enemy aggression

8. Crafting System
Crafting Locations

Workbenches

Fire pits

Toy store tables

Craftable Items
Item	Effect
Lantern	Portable light
Fire Starter	Create campfires
Ornament Trap	Light-based trap
Wool Scarf	Slows warmth loss
Gingerbread	Restores Spirit

Crafting uses a radial menu for speed.

9. Enemies
☃️ Snowmen

Slow, tanky

Weak to fire

Spawn at night

🎶 Frozen Carolers

Patrol paths

Attracted to sound

Alert other enemies

🎁 Living Presents

Fast and unpredictable

Explode if ignored

🐐 Krampus (Stalker Enemy)

Appears after Day 4

Cannot be killed

Hunts by sound and light

Forces stealth gameplay

10. Day / Night Cycle
Time	Gameplay Focus
Day	Exploration, crafting
Dusk	Preparation
Night	Combat, stealth
Final Night	High enemy density
11. NPCs

Trapped townsfolk

Offer quests or buffs

Saving them increases Spirit permanently

Affect ending outcome

12. Win & Loss Conditions
Win

Survive until Christmas Morning

Fully light the Grand Christmas Tree

Loss

Spirit reaches zero

Freeze to death

Caught by Krampus in darkness

13. Endings
🎅 Santa Ending

High Spirit

Many NPCs saved

Santa arrives to banish the storm

🐐 Krampus Ending

Low Spirit

Few NPCs saved

Town is claimed by darkness

14. Art Direction

Low-poly 3D models

Soft color palette

Heavy fog and snowfall

Minimal UI

15. Audio Design

Ambient wind and bells

Distorted Christmas music at night

Enemy audio cues (singing, crunching snow)

Silence used as tension tool

16. Technical Design (Web)
Engine Options

Three.js (recommended)

Babylon.js

Unity WebGL

Optimization

Baked lighting

Fog culling

Simple collision meshes

Limited enemy AI


17. Scope & MVP
MVP Features

Single map

3 enemy types

Crafting + Spirit system

One ending

If you want next, I can:

Turn this into a PDF

Write a technical design doc

Create enemy AI logic

Build a Three.js prototype

Help scope this for a game jam
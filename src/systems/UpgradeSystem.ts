export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    apply: (game: any) => void;
    condition?: (game: any) => boolean;
    rarity?: Rarity; // Dynamic property
    color?: string;  // Dynamic property
}

const RARITY_WEIGHTS = {
    'Common': 67,
    'Rare': 20,
    'Epic': 10,
    'Legendary': 3
};

const RARITY_MULTIPLIERS = {
    'Common': 1,
    'Rare': 1.5,
    'Epic': 2,
    'Legendary': 2.5
};

const RARITY_COLORS = {
    'Common': '#ffffff',   // White
    'Rare': '#4488ff',     // Blue
    'Epic': '#aa44ff',     // Purple
    'Legendary': '#ffaa00' // Orange/Gold
};

export class UpgradeSystem {
    private upgrades: Upgrade[] = [
        {
            id: 'fire_rate',
            name: 'Rapid Fire',
            description: 'Increase fire rate by ',
            apply: (_game: any) => {/* placeholder, handled dynamically */ }
        },
        {
            id: 'move_speed',
            name: 'Sugar Rush',
            description: 'Increase movement speed',
            apply: (_game: any) => {/* placeholder */ }
        },
        {
            id: 'health_boost',
            name: 'Hot Cocoa',
            description: 'Heal HP immediately',
            apply: (_game: any) => {/* placeholder */ }
        },
        {
            id: 'max_health',
            name: 'Hearty Meal',
            description: 'Increase Max HP by ',
            apply: (_game: any) => {/* placeholder */ }
        },
        {
            id: 'multishot',
            name: 'Split Shot',
            description: 'Shoot additional snowballs',
            apply: (_game: any) => {/* placeholder */ }
        },
        {
            id: 'damage',
            name: 'Packed Snow',
            description: 'Snowballs deal +Damage',
            apply: (_game: any) => {/* placeholder */ }
        },
        {
            id: 'range',
            name: 'Snowball Range',
            description: 'Increase shoot range by ',
            apply: (_game: any) => {/* placeholder */ }
        },
        {
            id: 'magnet',
            name: 'Candy Magnet',
            description: 'Increase XP pickup range by ',
            apply: (_game: any) => {/* placeholder */ }
        },
        {
            id: 'xp_gain',
            name: 'Christmas Spirit',
            description: 'Increase XP Gain by ',
            apply: (_game: any) => {/* placeholder */ }
        },
        {
            id: 'health_regen',
            name: 'Gingerbread Heart',
            description: 'Regenerate HP per second',
            apply: (_game: any) => {/* placeholder */ }
        },

        // --- ICE AURA ---
        {
            id: 'ice_aura_unlock',
            name: 'Ice Aura',
            description: 'Unlock: Freezing circle damages nearby enemies',
            condition: (game: any) => !game.hasIceAura,
            apply: (game: any) => {
                game.hasIceAura = true;
            }
        },
        {
            id: 'ice_aura_radius',
            name: 'Expanding Cold',
            description: 'Increase Aura Radius',
            condition: (game: any) => game.hasIceAura,
            apply: (_game: any) => {/* placeholder */ }
        },
        {
            id: 'ice_aura_damage',
            name: 'Deep Freeze',
            description: 'Increase Aura Damage',
            condition: (game: any) => game.hasIceAura,
            apply: (_game: any) => {/* placeholder */ }
        },
        {
            id: 'ice_aura_speed',
            name: 'Blizzard',
            description: 'Increase Aura Tick Rate',
            condition: (game: any) => game.hasIceAura,
            apply: (_game: any) => {/* placeholder */ }
        },

        // --- SLASH ---
        {
            id: 'auto_slash_unlock',
            name: 'Candy Cane Slash',
            description: 'Unlock: Periodically slash enemies around you',
            condition: (game: any) => !game.hasAutoSlash,
            apply: (game: any) => {
                game.hasAutoSlash = true;
            }
        },
        {
            id: 'auto_slash_upgrade',
            name: 'Sharpened Candy',
            description: 'Slash deals +Damage and Cooldown reduction',
            condition: (game: any) => game.hasAutoSlash,
            apply: (_game: any) => {/* placeholder */ }
        },

        // --- NEW WEAPONS ---
        {
            id: 'ornaments_unlock',
            name: 'Festive Ornaments',
            description: 'Unlock: Sharp ornaments orbit you and damage enemies',
            condition: (game: any) => !game.hasOrnaments,
            apply: (game: any) => {
                game.hasOrnaments = true;
                game.ornamentCount = 1;
            }
        },
        {
            id: 'ornament_upgrade',
            name: 'More Ornaments',
            description: 'Add more orbiting ornaments',
            condition: (game: any) => game.hasOrnaments,
            apply: (_game: any) => { /* placeholder */ }
        },
        {
            id: 'gift_bomb_unlock',
            name: 'Gift Bomb',
            description: 'Unlock: Throw explosive gifts that deal area damage',
            condition: (game: any) => !game.hasGiftBomb,
            apply: (game: any) => {
                game.hasGiftBomb = true;
                game.giftBombLevel = 1;
            }
        },
        {
            id: 'naughty_list_unlock',
            name: 'Naughty List',
            description: 'Unlock: Enemies take 30% more damage from all sources',
            condition: (game: any) => !game.hasNaughtyList,
            apply: (game: any) => {
                game.hasNaughtyList = true;
            }
        }
    ];

    // Alias for compatibility or rename
    public getUpgrades(count: number, game: any): Upgrade[] {
        return this.getRandomUpgrades(count, game);
    }

    public selectUpgrade(upgrade: Upgrade, game: any) {
        upgrade.apply(game);
    }

    public getRandomUpgrades(count: number, game: any): Upgrade[] {
        const available = this.upgrades.filter(u => !u.condition || u.condition(game));
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        const selectedBase = shuffled.slice(0, count);

        return selectedBase.map(base => {
            // Unlocks are always distinct, maybe always legendary or just normal? 
            // Let's keep unlocks as standard unique items without rarity for simplicity, 
            // OR we give them rarity "Legendary" just for flair but no multiplier needed.
            if (base.id.includes('_unlock')) {
                return {
                    ...base,
                    rarity: 'Legendary',
                    color: RARITY_COLORS['Legendary'],
                    apply: base.apply // Use original apply
                };
            }

            // Roll Rarity
            const rand = Math.random() * 100;
            let rarity: Rarity = 'Common';
            if (rand < RARITY_WEIGHTS['Legendary']) rarity = 'Legendary';
            else if (rand < RARITY_WEIGHTS['Epic'] + RARITY_WEIGHTS['Legendary']) rarity = 'Epic';
            else if (rand < RARITY_WEIGHTS['Rare'] + RARITY_WEIGHTS['Epic'] + RARITY_WEIGHTS['Legendary']) rarity = 'Rare';

            const multiplier = RARITY_MULTIPLIERS[rarity];
            const color = RARITY_COLORS[rarity];

            // Create Dynamic Upgrade
            const dynamicUpgrade: Upgrade = {
                id: base.id,
                name: base.name, // We can append rarity name if we want, e.g. "Epic Rapid Fire"
                description: base.description,
                rarity: rarity,
                color: color,
                apply: (_g: any) => { }
            };

            // CUSTOM APPLY LOGIC BASED ON ID
            switch (base.id) {
                case 'fire_rate':
                    const speed = 15 * multiplier;
                    dynamicUpgrade.description = `Increase fire rate by ${speed.toFixed(0)}%`;
                    dynamicUpgrade.apply = (g) => g.fireRate = Math.max(0.05, g.fireRate * (1 - (speed / 100)));
                    break;
                case 'move_speed':
                    const move = 10 * multiplier;
                    dynamicUpgrade.description = `Increase movement speed by ${move.toFixed(0)}%`;
                    dynamicUpgrade.apply = (g) => g.player.speed *= (1 + move / 100);
                    break;
                case 'health_boost':
                    const heal = 50 * multiplier;
                    dynamicUpgrade.description = `Heal ${heal.toFixed(0)} HP immediately`;
                    dynamicUpgrade.apply = (g) => g.statsSystem.health = Math.min(g.statsSystem.maxHealth, g.statsSystem.health + heal);
                    break;
                case 'max_health':
                    const hp = 25 * multiplier;
                    dynamicUpgrade.description = `Increase Max HP by ${hp.toFixed(0)}`;
                    dynamicUpgrade.apply = (g) => {
                        g.statsSystem.maxHealth += hp;
                        g.statsSystem.health += hp;
                    };
                    break;
                case 'multishot':
                    // Adjust multiplier for multishot to be harder? 
                    // Let's say Common=1, Rare=1, Epic=2, Legendary=3
                    // Or maybe fractional chance? Simpler: 
                    const extra = rarity === 'Legendary' ? 3 : (rarity === 'Epic' ? 2 : 1);
                    dynamicUpgrade.description = `Shoot +${extra} additional snowballs`;
                    dynamicUpgrade.apply = (g) => g.projectileCount += extra;
                    break;
                case 'damage':
                    const dmg = 1 * multiplier;
                    dynamicUpgrade.description = `Snowballs deal +${dmg.toFixed(1)} Damage`;
                    dynamicUpgrade.apply = (g) => g.projectileDamage += dmg;
                    break;
                case 'range':
                    const rng = 25 * multiplier;
                    dynamicUpgrade.description = `Increase range by ${rng.toFixed(0)}%`;
                    dynamicUpgrade.apply = (g) => g.projectileRange *= (1 + rng / 100);
                    break;
                case 'magnet':
                    const mag = 50 * multiplier;
                    dynamicUpgrade.description = `Increase XP range by ${mag.toFixed(0)}%`;
                    dynamicUpgrade.apply = (g) => g.xpPickupRange *= (1 + mag / 100);
                    break;
                case 'xp_gain':
                    const xpScale = 25 * multiplier;
                    dynamicUpgrade.description = `Increase XP Gain by ${xpScale.toFixed(0)}%`;
                    dynamicUpgrade.apply = (g) => g.xpMultiplier *= (1 + xpScale / 100);
                    break;
                case 'health_regen':
                    const regenAmount = 2.0 * multiplier;
                    dynamicUpgrade.description = `Regenerate ${regenAmount.toFixed(1)} HP/sec`;
                    dynamicUpgrade.apply = (g) => g.statsSystem.healthRegen += regenAmount;
                    break;
                case 'ice_aura_radius':
                    const rad = 1.5 * multiplier;
                    dynamicUpgrade.description = `Increase Aura Radius by ${rad.toFixed(1)}`;
                    dynamicUpgrade.apply = (g) => {
                        g.iceAuraRadius += rad;
                        if (g.iceAuraMesh) {
                            g.scene.remove(g.iceAuraMesh);
                            g.iceAuraMesh = null;
                        }
                    };
                    break;
                case 'ice_aura_damage':
                    const auraDmg = 2.0 * multiplier;
                    dynamicUpgrade.description = `Increase Aura Damage by ${auraDmg.toFixed(1)}`;
                    dynamicUpgrade.apply = (g) => g.iceAuraDamage += auraDmg;
                    break;
                case 'ice_aura_speed':
                    const auraSpeed = 0.5 * multiplier; // +0.5 ticks/sec for Common
                    dynamicUpgrade.description = `Aura hits +${auraSpeed.toFixed(1)} times/sec`;
                    dynamicUpgrade.apply = (g) => g.iceAuraTickRate += auraSpeed;
                    break;
                case 'auto_slash_upgrade':
                    const slashDmg = 3 * multiplier;
                    const slashCd = 10 * multiplier;
                    dynamicUpgrade.description = `Slash +${slashDmg.toFixed(0)} Dmg, -${slashCd.toFixed(0)}% Cooldown`;
                    dynamicUpgrade.apply = (g) => {
                        g.slashDamage += slashDmg;
                        g.slashCooldown = Math.max(0.2, g.slashCooldown * (1 - slashCd / 100));
                    };
                    break;
                case 'ornament_upgrade':
                    const extraOrnaments = Math.max(1, Math.floor(1 * multiplier));
                    dynamicUpgrade.description = `Add +${extraOrnaments} orbiting ornaments`;
                    dynamicUpgrade.apply = (g) => g.ornamentCount += extraOrnaments;
                    break;
                case 'gift_bomb_level':
                    const bombScale = 1.2 * multiplier;
                    dynamicUpgrade.description = `Increase gift bomb explosion size and damage`;
                    dynamicUpgrade.apply = (g) => {
                        g.giftBombLevel += 1;
                        g.giftBombDamage *= bombScale;
                        g.giftBombRadius *= bombScale;
                    };
                    break;
                default:
                    dynamicUpgrade.apply = base.apply; // Fallback
                    break;
            }

            return dynamicUpgrade;
        });
    }
}

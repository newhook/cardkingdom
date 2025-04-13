# Card Kingdom Auto Battler

An auto battler card game using a standard 52-card deck with jokers.

## Core Concept
Players draft cards to create their "army" which then battles automatically against opponents' armies based on predetermined rules. The familiar card values and suits create natural hierarchies and synergies.

## Setup
- Each player starts with some health points (e.g., 20)
- Players take turns drafting cards using a point-based system
- Battle rounds occur after drafting phases

## Drafting Mechanics
- Each turn is numbered (Turn 1, 2, 3, etc.)
- Players receive drafting points each turn: starting with 10 points on Turn 1, increasing by 2 points each subsequent turn
- Cards have different costs:
  - Number cards 2-9: Cost 2 points
  - 10s: Cost 3 points
  - Jacks (J), Queens (Q): Cost 3 points
  - Kings (K): Cost 4 points
  - Aces (A), Jokers: Cost 5 points
- Players spend their drafting points to acquire cards from the draft pool
- Unused points do not carry over to the next turn

## Card Roles
- **Number Cards (2-10)**: Basic units with strength equal to their number
- **Face Cards**: Special units with unique abilities
  - **Jacks**: Assassins that target opposing high-value cards
  - **Queens**: Support units that buff adjacent cards
  - **Kings**: Tanks that absorb damage
- **Aces**: Commander units that determine battle strategy
- **Jokers**: Wildcard units that can copy abilities or transform

## Suit Synergies
- **Hearts**: Healing/support abilities
- **Diamonds**: Economic abilities (extra cards/resources)
- **Clubs**: AoE (Area of Effect) damage
- **Spades**: Single-target high damage

## Battle Mechanics
1. Cards automatically battle in sequential order
2. Number cards deal damage equal to their value
3. Face cards trigger their special abilities
4. Suit synergies activate when you have multiple cards of the same suit
5. Damage that isn't blocked by opponent's cards goes directly to the player

## Game Loop
1. **Draft Phase**: Players spend drafting points to acquire cards
2. **Arrangement Phase**: Players arrange their cards in battle order
3. **Battle Phase**: Cards fight automatically
4. **Damage Phase**: Calculate damage to players
5. Repeat until one player is eliminated
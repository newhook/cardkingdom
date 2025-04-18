# Card Kingdom Auto Battler

An auto battler card game using a standard 52-card deck with jokers.

## Core Concept
Players draft cards to create their "army" which then battles automatically against opponents' armies based on predetermined rules. The familiar card values and suits create natural hierarchies and synergies.

## Setup
- Each player starts with some health points (e.g., 20)
- Players receive Drafting Points at the start of each Draft Phase (2 points Round 1, +1 each subsequent round).
- Battle rounds occur after drafting phases

## Drafting Mechanics (Accumulating Points)
- At the start of the **first Draft Phase (Round 1)**, each player receives **2** Drafting Points.
- At the start of **subsequent Draft Phases (Round 2, 3, ...)**, each player receives **1 more** Drafting Point than the previous round (i.e., 3 points in Round 2, 4 in Round 3, etc.).
- Players take turns drafting cards. The player with the lowest health goes first (random on the first round).
- Each card costs 2 Drafting Points.
- On their turn, a player can either:
  - **Draft a card:** If they have enough points, they spend points and acquire the card. Their turn continues if they still have points (>= 2).
  - **Pass:** The player chooses to stop drafting for the *entire current Draft Phase*. They cannot draft again until the next round.
- A player's turn automatically ends if they run out of Drafting Points (points < 2).
- The **Draft Phase ends** when *all* players have either passed or have insufficient points to draft any card (points < 2).

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

## Arrangement Phase
Cards on the battlefield are arranged in a sequence by the player during the Arrangement Phase.

## Battle Phase
The battle resolves automatically as follows:
1. Each card in turn from left to right performs an attack which is performed according to the card rules.
2. If an opponent has no cards, the attack damages the opponent player directly.
3. Damage is calculated based on the attacker's strength and any abilities/synergies.
4. Cards have health; if a card's health drops to 0 or below, it is **destroyed and removed** from the battlefield immediately.

After all cards have attacked the battle phase is over.

## Game Loop
1. **Draft Phase**: Players spend drafting points to acquire cards according to the rules above.
2. **Arrangement Phase**:
    - Players arrange their drafted cards onto their battlefield sequence.
    - **Maximum 7 cards** allowed on the battlefield.
    - Players can **sell** cards currently on their battlefield.
        - Selling a card removes it permanently.
        - Selling grants **+1 Drafting Point** to be added to that player's total at the **start of the *next* Draft Phase**.
    - Phase ends when the player confirms their arrangement (e.g., clicks "Ready for Battle").
3. **Battle Phase**: Cards fight automatically based on the Battle Mechanics.
5. Repeat until one player is eliminated.
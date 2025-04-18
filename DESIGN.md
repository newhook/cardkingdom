# Card Kingdom Auto Battler

An auto battler card game using a standard 52-card deck with jokers.

## Core Concept
Players draft cards to create their "army" which then battles automatically against opponents' armies based on predetermined rules. The familiar card values and suits create natural hierarchies and synergies.

## Setup
- Each player starts with some health points (e.g., 20)
- Players receive Drafting Points at the start of each Draft Phase, amount depending on the round.
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
// pages/api/interview.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

// Helper function to calculate true value and statistics
function calculateGameStats(marketContext: any) {
  const { community, playerCard, quotes } = marketContext;
  const revealed = community.slice(0, marketContext.round);
  
  // Calculate true value
  const knownSum = revealed.reduce((sum: number, c: any) => sum + c.value, 0);
  const used = [...revealed, playerCard];
  const remaining = Array.from({ length: 39 }, (_, i) => {
    const rank = Math.floor(i / 3) + 1;
    const suit = ["spades", "clubs", "diamonds"][i % 3];
    const value = (suit === "diamonds" ? -1 : 1) * 10 * rank;
    return { suit, rank, value };
  }).filter(c => !used.some(u => u.suit === c.suit && u.rank === c.rank));
  
  const avgUnknown = remaining.reduce((s: number, c: any) => s + c.value, 0) / remaining.length;
  const leftCount = 9 - (revealed.length + 1);
  const trueValue = knownSum + leftCount * avgUnknown;

  // Calculate arbitrage opportunities
  const arbOpportunities = quotes.reduce((arb: any[], q: any) => {
    const otherQuotes = quotes.filter((oq: any) => oq.playerId !== q.playerId);
    otherQuotes.forEach((oq: any) => {
      if (q.bid > oq.ask) {
        arb.push({
          buyFrom: oq.playerId,
          sellTo: q.playerId,
          profit: q.bid - oq.ask
        });
      }
    });
    return arb;
  }, []);

  // Calculate EV of each quote
  const quoteEVs = quotes.map((q: any) => ({
    playerId: q.playerId,
    bidEV: trueValue - q.bid,
    askEV: q.ask - trueValue
  }));

  return {
    trueValue,
    arbOpportunities,
    quoteEVs,
    remainingCards: remaining,
    knownSum,
    avgUnknown,
    leftCount
  };
}

export async function POST(request: Request) {
  try {
    const { action, round, details, position, cash, marketContext } = await request.json();
    const stats = calculateGameStats(marketContext);

    const gameRules = `
Game Rules:
- 39 cards (all hearts removed)
- Black cards (spades, clubs): +10x points where x is 1-13
- Red cards (diamonds): -10x points where x is 1-13
- 4 community cards revealed one by one
- 5 players (you + 4 computers)
- Each player has one private card
- Market makers create 20-wide markets
- You can only take markets, not make them
- 5 trading rounds: before first card, between each card reveal, and after last card
`;

    const prompt = `
You are an interviewer for a quant trading game. ${gameRules}

Current Game State:
- Round: ${round}
- Position: ${position}
- Cash: ${cash}
- Action: ${action}
- Price: ${details?.price}
- CPU: ${details?.cpu}

Visible Information:
- Community Cards Revealed: ${marketContext.community.length}
- Current Market Quotes: ${JSON.stringify(marketContext.quotes)}
- Order Flow: ${JSON.stringify(marketContext.orderFlow)}
- Player's Card: ${JSON.stringify(marketContext.playerCard)}

Your role is to:
1. Ask insightful questions about their trading decisions
2. Test their understanding of:
   - Expected value calculations
   - Arbitrage opportunities
   - Market making strategies
   - Information inference from quotes
   - Risk management
3. If they ask about EV, test their specific calculations
4. Provide helpful tips for better answers
5. Focus on their reasoning process
6. NEVER reveal information about:
   - True value of the game
   - CPU cards
   - Future community cards
   - Hidden statistics
   - Arbitrage opportunities they haven't discovered

Ask them a follow-up question that tests their reasoning. If they made a trade, ask about their thought process. If they revealed a card, ask about how it affects their strategy.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a quant interviewer testing a candidate's understanding of trading concepts, probability, and market making. Be helpful and provide tips when appropriate. Never reveal information that the player shouldn't know." 
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 250,
    });

    const question = completion.choices[0].message.content?.trim();
    if (!question) {
      throw new Error("No question returned from OpenAI");
    }

    return NextResponse.json({ question });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { question: "Oops, something went wrong." },
      { status: 500 }
    );
  }
}

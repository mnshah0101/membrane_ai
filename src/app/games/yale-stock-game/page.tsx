"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { HowToPlayModal } from "./components/HowToPlayModal";

// Custom PlayingCard as before...
const CARD_WIDTH = 80;
const CARD_HEIGHT = 120;

function getCardName(suit: string | undefined, rank: number | undefined): string {
  // If either suit or rank is undefined, return the back of the card
  if (!suit || !rank) {
    return "back.svg";
  }

  // Validate rank is within valid range
  if (rank < 1 || rank > 13) {
    console.error(`Invalid rank: ${rank} for suit: ${suit}`);
    return "back.svg";
  }
  
  const rankMap: { [key: number]: string } = {
    1: "ace",
    11: "jack",
    12: "queen",
    13: "king"
  };
  
  const rankName = rankMap[rank] || rank.toString();
  return `${rankName}_of_${suit}.svg`;
}

function PlayingCard({
  suit,
  rank,
  faceUp,
}: {
  suit: "spades" | "clubs" | "diamonds" | "hearts";
  rank: number;
  faceUp: boolean;
}) {
  const style: React.CSSProperties = {
    width: `${CARD_WIDTH}px`,
    height: `${CARD_HEIGHT}px`,
  };

  return (
    <div style={style} className="inline-block">
      {faceUp ? (
        <img 
          src={`/cards/${getCardName(suit, rank)}`} 
          alt={`${rank} of ${suit}`}
          className="w-full h-full object-contain"
        />
      ) : (
        <img 
          src="/cards/back.svg" 
          alt="card back"
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}

type CardType = {
  suit: "spades" | "clubs" | "diamonds" | "hearts";
  rank: number;
  value: number;
};

type Player = { id: number; card: CardType };
type Quote = { playerId: number; bid: number; ask: number };

interface MarketMaker {
  id: number;
  hasPrivateInfo: boolean;
  privateInfoNoise: number;  // How much noise in their private information
  privateInfoValue: number;  // Their belief about the true value
  lastQuote: Quote | null;
  orderFlowImpact: number;   // How much they adjust based on order flow
  convergenceRate: number;   // How quickly they converge to true value
}

const SPREAD = 20;
const PRIVATE_INFO_PROBABILITY = 0.4;  // 40% chance a market maker has private info
const MIN_NOISE = 0.5;  // Increased from 0.3 to 0.5 for more initial noise
const MAX_NOISE = 0.8;  // Increased from 0.6 to 0.8 for more initial noise
const ORDER_FLOW_IMPACT = 0.15;  // Reduced order flow impact
const CONVERGENCE_RATE = 0.4;  // Base convergence rate
const INITIAL_SPREAD_MULTIPLIER = 2;  // Wider spreads in early rounds

function generateDeck(): CardType[] {
  const suits: CardType["suit"][] = ["spades", "clubs", "diamonds"];
  const deck: CardType[] = [];
  suits.forEach((suit) => {
    for (let r = 1; r <= 13; r++) {
      const isRed = suit === "diamonds";
      const v = (isRed ? -1 : 1) * 10 * r;
      deck.push({ suit, rank: r, value: v });
    }
  });
  return deck.sort(() => Math.random() - 0.5);
}

function initializeMarketMakers(players: Player[], trueValue: number): MarketMaker[] {
  return players
    .filter(p => p.id !== 0)  // Exclude the human player
    .map(p => ({
      id: p.id,
      hasPrivateInfo: Math.random() < PRIVATE_INFO_PROBABILITY,
      privateInfoNoise: Math.random() * (MAX_NOISE - MIN_NOISE) + MIN_NOISE,
      privateInfoValue: 0,  // Will be set in updateMarketMakers
      lastQuote: null,
      orderFlowImpact: ORDER_FLOW_IMPACT,
      convergenceRate: CONVERGENCE_RATE
    }));
}

function calculateInitialValue(maker: MarketMaker, card: CardType, trueValue: number): number {
  // Base value heavily weighted towards their own card
  // Since each card is worth ±10x where x is 1-13, and there are 39 cards
  // The average absolute value of a card is (10 * (1+2+...+13) / 13) ≈ 23.33
  const AVERAGE_CARD_VALUE = 23.33;
  
  // Start with their own card's value, amplified
  let baseValue = card.value * 4; // Strong initial bias
  
  if (maker.hasPrivateInfo) {
    // Add significant noise to their private information
    const noise = maker.privateInfoNoise * 3; // Increased from 2.5 to 3 for more variation
    baseValue = trueValue * (1 + (Math.random() * 2 - 1) * noise);
  } else {
    // If no private info, use a weighted average between their card and the average
    // This ensures quotes still reflect their card but aren't completely disconnected from reality
    baseValue = baseValue * 0.8 + AVERAGE_CARD_VALUE * 0.2;
  }
  
  return baseValue;
}

function updateMarketMakers(
  marketMakers: MarketMaker[],
  trueValue: number,
  round: number,
  orderFlow: { buys: number; sells: number },
  allQuotes: Quote[],
  players: Player[]
): Quote[] {
  return marketMakers.map(maker => {
    const makerCard = players.find(p => p.id === maker.id)?.card;
    if (!makerCard) return maker.lastQuote!;

    let baseValue: number;
    
    if (round === 0) {
      // In the first round, base value is primarily on their own card
      baseValue = calculateInitialValue(maker, makerCard, trueValue);
    } else {
      // In later rounds, incorporate more information
      baseValue = trueValue;
      
      if (maker.hasPrivateInfo) {
        // Reduce noise over rounds with some randomness
        const noise = maker.privateInfoNoise * (1 - round * maker.convergenceRate) * (0.8 + Math.random() * 0.4);
        baseValue = trueValue * (1 + (Math.random() * 2 - 1) * noise);
      }
      
      // Still consider their card's value, but with less weight
      // Add some randomness to the convergence
      const cardWeight = 0.3 * (0.8 + Math.random() * 0.4); // Random weight between 0.24 and 0.42
      baseValue = baseValue * (1 - cardWeight) + makerCard.value * cardWeight;
    }

    // Adjust for order flow (less impact in early rounds)
    const orderFlowAdjustment = (orderFlow.buys - orderFlow.sells) * 
      maker.orderFlowImpact * (1 + round * 0.2);
    baseValue += orderFlowAdjustment;

    // Adjust based on other market makers' quotes with some randomness
    const otherQuotes = allQuotes.filter(q => q.playerId !== maker.id);
    if (otherQuotes.length > 0) {
      const avgOtherQuote = otherQuotes.reduce((sum, q) => sum + (q.bid + q.ask) / 2, 0) / otherQuotes.length;
      // More convergence in later rounds with some randomness
      const convergenceWeight = maker.convergenceRate * (1 + round * 0.3) * (0.8 + Math.random() * 0.4);
      baseValue = baseValue * (1 - convergenceWeight) + avgOtherQuote * convergenceWeight;
    }

    // Calculate spread (wider in early rounds, but never more than 20)
    const spreadMultiplier = Math.min(1 + (INITIAL_SPREAD_MULTIPLIER - 1) * (1 - round * 0.3), 2);
    const currentSpread = Math.min(SPREAD * spreadMultiplier, 20);

    // Generate new quote
    const newQuote: Quote = {
      playerId: maker.id,
      bid: baseValue - currentSpread / 2,
      ask: baseValue + currentSpread / 2
    };

    // Update maker's state
    maker.lastQuote = newQuote;
    maker.privateInfoValue = baseValue;

    return newQuote;
  });
}

interface ChatMessage {
  role: "interviewer" | "user";
  content: string;
  timestamp: Date;
}

export default function HomePage() {
  const [deck, setDeck] = useState<CardType[]>([]);
  const [community, setCommunity] = useState<CardType[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(0);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [position, setPosition] = useState(0);
  const [cash, setCash] = useState(0);
  const [manualTracking, setManualTracking] = useState(false);
  const [manualPLInput, setManualPLInput] = useState("");
  const [submittedPL, setSubmittedPL] = useState<number | null>(null);
  const [interviewerPrompt, setInterviewerPrompt] = useState("");
  const [selectedCPU, setSelectedCPU] = useState<number>(1);
  const [interactedCPUs, setInteractedCPUs] = useState<Set<number>>(new Set());
  const [marketMakers, setMarketMakers] = useState<MarketMaker[]>([]);
  const [orderFlow, setOrderFlow] = useState({ buys: 0, sells: 0 });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    const d = generateDeck();
    setDeck(d);
    setCommunity(d.slice(0, 4));
    const playerCards = d
      .slice(4)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    setPlayers(playerCards.map((card, i) => ({ id: i, card })));
    
    // Initialize with round -1 to indicate pre-first-card trading
    setRound(-1);
  }, []);

  useEffect(() => {
    if (!deck.length || !players.length) return;

    // Calculate true value
    const revealed = community.slice(0, Math.max(0, round));
    const knownSum = revealed.reduce((sum, c) => sum + c.value, 0);
    const used = [...revealed, ...players.map((p) => p.card)];
    const remaining = deck.filter((c) => !used.includes(c));
    const avgUnknown = remaining.reduce((s, c) => s + c.value, 0) / remaining.length;
    const leftCount = 9 - (revealed.length + 1);
    const trueValue = knownSum + leftCount * avgUnknown;

    // Initialize market makers if not already done
    if (marketMakers.length === 0) {
      const makers = initializeMarketMakers(players, trueValue);
      setMarketMakers(makers);
    }

    // Update quotes based on market maker logic
    const newQuotes = updateMarketMakers(marketMakers, trueValue, round, orderFlow, quotes, players);
    setQuotes(newQuotes);
  }, [round, deck, community, players]);

  const addMessage = (role: "interviewer" | "user", content: string) => {
    setChatMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  const askInterviewer = async (action: string, details: any) => {
    try {
      setIsProcessing(true);
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action, 
          round, 
          details, 
          position, 
          cash,
          marketContext: {
            quotes,
            orderFlow,
            round,
            community: community.slice(0, round),
            playerCard: players[0]?.card
          }
        }),
      });
      const { question } = await res.json();
      addMessage("interviewer", question);
    } catch (e) {
      console.error(e);
      addMessage("interviewer", "I'm having trouble processing that. Could you explain your reasoning?");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserResponse = async () => {
    if (!userInput.trim()) return;
    
    addMessage("user", userInput);
    setUserInput("");
    
    try {
      setIsProcessing(true);
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "response",
          userInput,
          round,
          position,
          cash,
          marketContext: {
            quotes,
            orderFlow,
            round,
            community: community.slice(0, round),
            playerCard: players[0]?.card
          }
        }),
      });
      const { question } = await res.json();
      addMessage("interviewer", question);
    } catch (e) {
      console.error(e);
      addMessage("interviewer", "I'm having trouble processing that. Could you elaborate?");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTrade = async (type: "buy" | "sell") => {
    if (interactedCPUs.has(selectedCPU)) return;
    const q = quotes.find((q) => q.playerId === selectedCPU);
    if (!q) return;

    // Update order flow
    setOrderFlow(prev => ({
      buys: prev.buys + (type === "buy" ? 1 : 0),
      sells: prev.sells + (type === "sell" ? 1 : 0)
    }));

    if (type === "buy") {
      setPosition((p) => p + 1);
      setCash((c) => c - q.ask);
    } else {
      setPosition((p) => p - 1);
      setCash((c) => c + q.bid);
    }
    setInteractedCPUs((set) => new Set(set).add(selectedCPU));
    
    // Add trade summary to chat
    const tradeSummary = `Trade Summary:
- Action: ${type.toUpperCase()}
- Counterparty: CPU ${selectedCPU}
- Price: ${type === "buy" ? q.ask : q.bid}
- Current Position: ${type === "buy" ? position + 1 : position - 1}
- Current Cash: ${type === "buy" ? (cash - q.ask).toFixed(2) : (cash + q.bid).toFixed(2)}

Market Quotes:
${quotes.map(q => `CPU ${q.playerId}: Bid ${q.bid.toFixed(2)} / Ask ${q.ask.toFixed(2)}`).join('\n')}`;
    
    addMessage("user", tradeSummary);
    
    // Open chat panel
    setIsChatOpen(true);
    
    // Ask interviewer about the trade
    await askInterviewer(type, {
      cpu: selectedCPU,
      price: type === "buy" ? q.ask : q.bid,
      quote: q,
      allQuotes: quotes
    });
  };

  const nextRound = async () => {
    if (round < 3) {
      const next = round + 1;
      setRound(next);
      setInteractedCPUs(new Set());
      if (next >= 0) { // Only ask about card reveal if we're revealing a card
        await askInterviewer("reveal", { card: community[next] });
      }
    }
  };

  const finalSum = () => {
    const comm = community;
    const userCards = players.map((p) => p.card);
    return comm.concat(userCards).reduce((s, c) => s + c.value, 0);
  };

  const handleSubmitPL = () => {
    const pl = parseFloat(manualPLInput);
    if (!isNaN(pl)) setSubmittedPL(pl);
  };

  const handleGameEnd = async () => {
    setGameEnded(true);
    const trueValue = finalSum();
    await askInterviewer("game_end", { 
      trueValue,
      position,
      cash,
      finalPL: cash + position * trueValue
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 relative">
        {/* How to Play Button */}
        <HowToPlayModal />

        {/* Chat Toggle Button */}
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed right-8 top-8 z-50 bg-slate-700 hover:bg-slate-600 text-white"
          variant="outline"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {isChatOpen ? "Hide Chat" : "Show Chat"}
        </Button>

        {/* Main Game Content */}
        <div className={cn(
          "transition-all duration-300",
          isChatOpen ? 'mr-96' : ''
        )}>
          {/* Game Header */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700">
            <h1 className="text-3xl font-bold text-white text-center">Yale Stock Trading Game (Simplified)</h1>
            <div className="text-slate-400 text-center mt-2">
              {gameEnded ? "Game Ended" :
               round === -1 ? "Pre-trading round" : 
               round === 3 ? "Final trading round" :
               `Round ${round + 1} of 5`}
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Cards and Community */}
            <div className="col-span-4 space-y-6">
              {/* Your Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Your Card</h2>
                <div className="flex justify-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <PlayingCard
                      suit={players[0]?.card.suit!}
                      rank={players[0]?.card.rank!}
                      faceUp
                    />
                  </motion.div>
                </div>
              </motion.div>

              {/* Community Cards */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Community Cards</h2>
                <div className="grid grid-cols-2 gap-4">
                  {community.map((_, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{ 
                        rotateY: i <= round ? 180 : 0,
                        transition: { duration: 0.6 }
                      }}
                      className="flex justify-center"
                    >
                      <PlayingCard
                        suit={community[i]?.suit!}
                        rank={community[i]?.rank!}
                        faceUp={i <= round}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Middle Column - Market Quotes */}
            <div className="col-span-5">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 h-full"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Market Quotes</h2>
                <div className="grid grid-cols-2 gap-4">
                  {quotes
                    .filter((q) => q.playerId !== 0)
                    .map((q) => (
                      <motion.div
                        key={q.playerId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "p-4 rounded-lg transition-all duration-200",
                          interactedCPUs.has(q.playerId)
                            ? "bg-slate-700/50"
                            : "bg-slate-700 hover:bg-slate-600 cursor-pointer"
                        )}
                        onClick={() => !interactedCPUs.has(q.playerId) && setSelectedCPU(q.playerId)}
                      >
                        <div className="font-medium text-white text-center mb-2">CPU {q.playerId}</div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-red-500/20 rounded p-2">
                            <div className="text-red-400 text-sm">Bid</div>
                            <div className="text-white">{q.bid.toFixed(2)}</div>
                          </div>
                          <div className="bg-green-500/20 rounded p-2">
                            <div className="text-green-400 text-sm">Ask</div>
                            <div className="text-white">{q.ask.toFixed(2)}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Trading and Stats */}
            <div className="col-span-3 space-y-6">
              {/* Trading Controls */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Trading</h2>
                <div className="space-y-4">
                  <Select onValueChange={(val) => setSelectedCPU(parseInt(val))}>
                    <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder={`CPU ${selectedCPU}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {players
                        .filter((p) => p.id !== 0)
                        .map((p) => (
                          <SelectItem key={p.id} value={`${p.id}`}>
                            CPU {p.id}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      disabled={interactedCPUs.has(selectedCPU) || gameEnded}
                      onClick={() => handleTrade("buy")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Buy
                    </Button>
                    <Button
                      disabled={interactedCPUs.has(selectedCPU) || gameEnded}
                      onClick={() => handleTrade("sell")}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Sell
                    </Button>
                  </div>
                  {round < 3 && !gameEnded && (
                    <Button 
                      onClick={nextRound}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {round === -1 ? "Start First Round" : "Reveal Next"}
                    </Button>
                  )}
                  {round === 3 && !gameEnded && (
                    <Button 
                      onClick={handleGameEnd}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      End Game
                    </Button>
                  )}
                </div>
              </motion.div>

              {/* Position & P/L */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Position & P/L</h2>
                {!manualTracking && (
                  <div className="space-y-4">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">Position</div>
                      <div className="text-2xl font-bold text-white">{position}</div>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">Cash</div>
                      <div className="text-2xl font-bold text-white">{cash.toFixed(2)}</div>
                    </div>
                    {gameEnded && (
                      <>
                        <div className="bg-slate-700 rounded-lg p-4">
                          <div className="text-slate-400 text-sm">True Value</div>
                          <div className="text-2xl font-bold text-white">{finalSum().toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-700 rounded-lg p-4">
                          <div className="text-slate-400 text-sm">Final P&L</div>
                          <div className="text-2xl font-bold text-white">
                            {(cash + position * finalSum()).toFixed(2)}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {gameEnded && manualTracking && (
                  <div className="mt-4">
                    {submittedPL === null ? (
                      <div className="space-y-4">
                        <div className="bg-slate-700 rounded-lg p-4">
                          <div className="text-slate-400 text-sm">True Value</div>
                          <div className="text-2xl font-bold text-white">{finalSum().toFixed(2)}</div>
                        </div>
                        <Input
                          placeholder="Enter your P&L"
                          value={manualPLInput}
                          onChange={(e) => setManualPLInput(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <Button 
                          onClick={handleSubmitPL}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Submit P&L
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-slate-700 rounded-lg p-4">
                          <div className="text-slate-400 text-sm">True Value</div>
                          <div className="text-2xl font-bold text-white">{finalSum().toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-700 rounded-lg p-4">
                          <div className="text-slate-400 text-sm">Your Reported P&L</div>
                          <div className="text-2xl font-bold text-white">{submittedPL.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-700 rounded-lg p-4">
                          <div className="text-slate-400 text-sm">Actual P&L</div>
                          <div className="text-2xl font-bold text-white">
                            {(cash + position * finalSum()).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* CPU Cards Reveal - Only shown at game end */}
              {gameEnded && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">CPU Cards</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {players
                      .filter(p => p.id !== 0)
                      .map((player) => (
                        <div key={player.id} className="bg-slate-700 rounded-lg p-4">
                          <div className="text-slate-400 text-sm mb-2">CPU {player.id}</div>
                          <div className="flex justify-center">
                            <PlayingCard
                              suit={player.card.suit}
                              rank={player.card.rank}
                              faceUp={true}
                            />
                          </div>
                          <div className="text-center mt-2">
                            <div className="text-slate-400 text-sm">Card Value</div>
                            <div className="text-lg font-bold text-white">{player.card.value}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: isChatOpen ? 0 : "100%" }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed right-0 top-0 h-screen w-96 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700 flex flex-col"
        >
          <div className="flex-none p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Quant Interview Chat</h2>
          </div>
          
          <ScrollArea className="flex-1 p-4 h-[calc(100vh-8rem)]">
            <div className="space-y-4">
              {chatMessages.map((message, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3 whitespace-pre-wrap break-words",
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-white"
                    )}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex-none border-t border-slate-700 p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Type your response..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleUserResponse();
                  }
                }}
                disabled={isProcessing}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button 
                onClick={handleUserResponse}
                disabled={isProcessing || !userInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Send
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


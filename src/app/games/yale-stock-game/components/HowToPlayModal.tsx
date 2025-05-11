import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export function HowToPlayModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="fixed left-8 top-8 z-50 bg-slate-700 hover:bg-slate-600 text-white"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          How to Play
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-2xl w-[90vw] fixed top-8 left-8 translate-y-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">How to Play</DialogTitle>
          <DialogDescription className="text-slate-400">
            Learn the rules and strategies of the Yale Stock Trading Game
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-slate-300 max-h-[70vh] overflow-y-auto pr-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Game Overview</h3>
            <p>This is a simplified version of the Yale Stock Trading Game, where you trade based on card values and market information.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Card Values</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Black cards (spades, clubs): +10x points where x is 1-13</li>
              <li>Red cards (diamonds): -10x points where x is 1-13</li>
              <li>Hearts are removed from the deck</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Game Structure</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>5 players (you + 4 computers)</li>
              <li>Each player has one private card</li>
              <li>4 community cards revealed one by one</li>
              <li>5 trading rounds: before first card, between each card reveal, and after last card</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Trading Rules</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Market makers create 20-wide markets</li>
              <li>You can only take markets, not make them</li>
              <li>Each CPU can only be traded with once per round</li>
              <li>Final P&L = Cash + Position × True Value</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Strategy Tips</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Consider the expected value of unknown cards</li>
              <li>Look for arbitrage opportunities between different market makers</li>
              <li>Watch for patterns in market maker behavior</li>
              <li>Consider the impact of each new community card</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
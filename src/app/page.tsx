import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, MessageSquare, Trophy } from "lucide-react";
import { Navigation } from "@/components/Navigation";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navigation />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Build Your Trading Intuition
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Master market making and trading strategies through interactive games with AI-powered interview feedback
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="#games">
                Start Learning <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <Brain className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">AI Mentor</h3>
            <p className="text-slate-300">
              Get personalized guidance and feedback as you learn, helping you understand the reasoning behind trading decisions
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <Trophy className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Learn by Doing</h3>
            <p className="text-slate-300">
              Develop your trading intuition through hands-on experience in a risk-free environment
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <MessageSquare className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Real-World Skills</h3>
            <p className="text-slate-300">
              Master fundamental concepts like market making, risk management, and decision-making under uncertainty
            </p>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div id="games" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Learning Modules</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Yale Stock Trading Game</CardTitle>
              <CardDescription className="text-slate-400">
                A beginner-friendly introduction to market making
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-300">
                  Start your journey with this classic game that teaches you to:
                </p>
                <ul className="list-disc pl-5 text-slate-300 space-y-2">
                  <li>Understand market dynamics and price discovery</li>
                  <li>Make decisions with incomplete information</li>
                  <li>Balance risk and reward in trading</li>
                  <li>Think like a market maker</li>
                </ul>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link href="/games/yale-stock-game">
                    Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Coming Soon</CardTitle>
              <CardDescription className="text-slate-400">
                More learning modules in development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-300">
                  We're building more modules to help you develop your trading intuition:
                </p>
                <ul className="list-disc pl-5 text-slate-300 space-y-2">
                  <li>Options trading fundamentals</li>
                  <li>Fixed income concepts</li>
                  <li>Statistical thinking in markets</li>
                  <li>And more...</li>
                </ul>
                <Button disabled className="w-full bg-slate-700 text-slate-400">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-16">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-slate-400">
            © 2024 Membrane. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
